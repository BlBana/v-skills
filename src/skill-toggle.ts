import * as p from '@clack/prompts';
import pc from 'picocolors';
import { listInstalledSkills, sanitizeName } from './installer.ts';
import { agents, detectInstalledAgents, getUniversalAgents, isUniversalAgent } from './agents.ts';
import { getCanonicalPath, getAgentBaseDir } from './installer.ts';
import { installSkillForAgent, type InstallMode } from './installer.ts';
import type { AgentType } from './types.ts';
import type { InstalledSkill } from './installer.ts';

export interface ToggleOptions {
  global?: boolean;
  yes?: boolean;
}

/**
 * Parse command line options for toggle commands (enable/disable/status).
 * Separates skill names from options flags.
 */
export function parseToggleOptions(args: string[]): {
  skills: string[];
  options: ToggleOptions;
} {
  const options: ToggleOptions = {};
  const skills: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-g' || arg === '--global') {
      options.global = true;
    } else if (arg === '-y' || arg === '--yes') {
      options.yes = true;
    } else if (arg && !arg.startsWith('-')) {
      skills.push(arg);
    }
  }

  return { skills, options };
}

/**
 * Helper to get the canonical skill path and skill directory name
 */
function getSkillInfo(skillName: string, global: boolean, cwd?: string): {
  skillPath: string;
  skillDirName: string;
} {
  const skillPath = getCanonicalPath(skillName, { global, cwd });
  // Use sanitizeName to match how installSkillForAgent creates directories
  const skillDirName = sanitizeName(skillName);
  return { skillPath, skillDirName };
}

/**
 * Ensures universal agents are always included in the target agents list.
 * Used when auto-selecting agents during enable.
 */
function ensureUniversalAgents(targetAgents: AgentType[]): AgentType[] {
  const universalAgents = getUniversalAgents();
  const result = [...targetAgents];

  for (const ua of universalAgents) {
    if (!result.includes(ua)) {
      result.push(ua);
    }
  }

  return result;
}

/**
 * Check if a skill is installed in a specific agent's skills directory
 */
async function isSkillInAgentDir(
  skillName: string,
  agentType: AgentType,
  isGlobal: boolean,
  cwd?: string
): Promise<boolean> {
  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
  const { skillDirName } = getSkillInfo(skillName, isGlobal, cwd);
  const skillDir = `${agentBase}/${skillDirName}`;

  try {
    const { stat } = await import('fs/promises');
    await stat(skillDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a skill from an agent's skills directory
 */
async function removeSkillFromAgent(
  skillName: string,
  agentType: AgentType,
  isGlobal: boolean,
  cwd?: string
): Promise<boolean> {
  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
  const { skillDirName } = getSkillInfo(skillName, isGlobal, cwd);
  const skillDir = `${agentBase}/${skillDirName}`;

  try {
    const { rm } = await import('fs/promises');
    await rm(skillDir, { recursive: true, force: true });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Get agents that have a specific skill installed
 */
async function getAgentsWithSkill(skillName: string, isGlobal: boolean, cwd?: string): Promise<AgentType[]> {
  const detectedAgents = await detectInstalledAgents();
  const agentsWithSkill: AgentType[] = [];

  for (const agentType of detectedAgents) {
    const isInstalled = await isSkillInAgentDir(skillName, agentType, isGlobal, cwd);
    if (isInstalled) {
      agentsWithSkill.push(agentType);
    }
  }

  return agentsWithSkill;
}

/**
 * Run the disable command.
 * Removes skill from agent directories (keeps source code).
 */
export async function disableCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');
  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  spinner.stop(`Found ${installedSkills.length} installed skill(s)`);

  if (installedSkills.length === 0) {
    p.outro(pc.yellow('No skills found to disable.'));
    return;
  }

  // Filter to only show enabled skills (installed in agent directories)
  const availableSkills = [];
  for (const skill of installedSkills) {
    const agentsWithSkill = await getAgentsWithSkill(skill.name, isGlobal, cwd);
    if (agentsWithSkill.length > 0) {
      availableSkills.push(skill);
    }
  }

  if (availableSkills.length === 0) {
    p.outro(pc.yellow('All skills are already disabled.'));
    return;
  }

  let selectedSkills: string[] = [];

  if (skillNames.length > 0) {
    // Match provided skill names against available skills
    selectedSkills = availableSkills
      .filter((s) =>
        skillNames.some((name) => name.toLowerCase() === s.name.toLowerCase())
      )
      .map((s) => s.name);

    if (selectedSkills.length === 0) {
      p.log.error(
        `No enabled skills found matching: ${skillNames.join(', ')}. Use 'skills status' to see skill status.`
      );
      return;
    }

    // Warn about skills that are already disabled or not found
    const notFound = skillNames.filter(
      (name) => !selectedSkills.some((s) => s.toLowerCase() === name.toLowerCase())
    );
    if (notFound.length > 0) {
      p.log.warn(
        `The following skill(s) are already disabled or not installed: ${notFound.join(', ')}`
      );
    }
  } else {
    // Interactive selection - only show enabled skills
    const choices = availableSkills.map((s) => ({
      value: s.name,
      label: s.name,
      hint: s.description,
    }));

    const selected = await p.multiselect({
      message: `Select skills to disable ${pc.dim('(space to toggle)')}`,
      options: choices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Disable cancelled');
      process.exit(0);
    }

    selectedSkills = selected as string[];
  }

  if (!options.yes) {
    console.log();
    p.log.info('Skills to disable:');
    for (const skillName of selectedSkills) {
      p.log.message(`  ${pc.red('•')} ${skillName}`);
    }
    console.log();
    const confirmed = await p.confirm({
      message: `Are you sure you want to disable ${selectedSkills.length} skill(s)?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Disable cancelled');
      process.exit(0);
    }
  }

  spinner.start('Disabling skills...');

  const results: { skill: string; agent: string; success: boolean; error?: string }[] = [];

  // Remove skill from all agent directories
  const detectedAgents = await detectInstalledAgents();
  for (const skillName of selectedSkills) {
    for (const agentType of detectedAgents) {
      const isInstalled = await isSkillInAgentDir(skillName, agentType, isGlobal, cwd);
      if (isInstalled) {
        const removed = await removeSkillFromAgent(skillName, agentType, isGlobal, cwd);
        if (removed) {
          results.push({ skill: skillName, agent: agents[agentType].displayName, success: true });
        } else {
          results.push({
            skill: skillName,
            agent: agents[agentType].displayName,
            success: false,
            error: 'Failed to remove from agent directory',
          });
        }
      }
    }
  }

  spinner.stop('Disable process complete');

  // Count unique skills, not agent operations
  const disabledSkills = new Set(results.filter((r) => r.success).map((r) => r.skill));
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (disabledSkills.size > 0) {
    p.log.success(pc.green(`Successfully disabled ${disabledSkills.size} skill(s)`));
  }

  if (failed.length > 0) {
    p.log.error(pc.red(`Failed to disable ${failed.length} skill(s)`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${r.skill} → ${r.agent}: ${pc.dim(r.error || 'Unknown error')}`);
    }
  }

  console.log();
  p.outro(pc.green('Done!'));
}

/**
 * Run the enable command.
 * Installs skill to selected agents (like add flow).
 */
export async function enableCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');
  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  spinner.stop(`Found ${installedSkills.length} installed skill(s)`);

  if (installedSkills.length === 0) {
    p.outro(pc.yellow('No skills found to enable.'));
    return;
  }

  // Find skills that are available (source code exists but not linked to agents)
  const disabledSkills: Array<{ name: string; skill: InstalledSkill }> = [];

  for (const skill of installedSkills) {
    const agentsWithSkill = await getAgentsWithSkill(skill.name, isGlobal, cwd);
    if (agentsWithSkill.length === 0) {
      // Skill source exists but no agent has it linked - it's disabled
      disabledSkills.push({ name: skill.name, skill });
    }
  }

  if (disabledSkills.length === 0) {
    p.outro(pc.yellow('All skills are already enabled.'));
    return;
  }

  let selectedSkills: Array<{ name: string; skill: InstalledSkill }> = [];

  if (skillNames.length > 0) {
    // Match provided skill names against disabled skills
    selectedSkills = disabledSkills
      .filter((s) =>
        skillNames.some((name) => name.toLowerCase() === s.name.toLowerCase())
      );

    if (selectedSkills.length === 0) {
      p.log.error(
        `No disabled skills found matching: ${skillNames.join(', ')}. Use 'skills status' to see skill status.`
      );
      return;
    }

    // Warn about skills that are already enabled or not found
    const notFound = skillNames.filter(
      (name) => !selectedSkills.some((s) => s.name.toLowerCase() === name.toLowerCase())
    );
    if (notFound.length > 0) {
      p.log.warn(
        `The following skill(s) are already enabled or not found: ${notFound.join(', ')}`
      );
    }
  } else {
    // Interactive selection - only show disabled skills
    const choices = disabledSkills.map((s) => ({
      value: s.name,
      label: s.name,
      hint: s.skill.description,
    }));

    const selected = await p.multiselect({
      message: `Select skills to enable ${pc.dim('(space to toggle)')}`,
      options: choices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Enable cancelled');
      process.exit(0);
    }

    // Map selected skill names back to full skill objects
    selectedSkills = disabledSkills.filter((s) =>
      (selected as string[]).includes(s.name)
    );
  }

  if (!options.yes) {
    console.log();
    p.log.info('Skills to enable:');
    for (const { name } of selectedSkills) {
      p.log.message(`  ${pc.green('•')} ${name}`);
    }
    console.log();
    const confirmed = await p.confirm({
      message: `Are you sure you want to enable ${selectedSkills.length} skill(s)?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Enable cancelled');
      process.exit(0);
    }
  }

  // Prompt for agent selection (same as add command)
  spinner.start('Loading agents...');
  const detectedAgents = await detectInstalledAgents();
  const validAgents = Object.keys(agents);
  spinner.stop(`${detectedAgents.length} agents`);

  let targetAgents: AgentType[] = [];

  if (detectedAgents.length === 0) {
    // No agents detected, prompt to select from all agents
    const agentChoices = Object.entries(agents).map(([key, config]) => ({
      value: key as AgentType,
      label: config.displayName,
    }));

    const selected = await p.multiselect({
      message: 'Which agents do you want to enable the skill to?',
      options: agentChoices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Enable cancelled');
      process.exit(0);
    }

    targetAgents = selected as AgentType[];
  } else {
    // Agents detected, prompt to select which ones to use
    // Group agents: detected agents first, then universal agents
    const agentChoices = [
      ...detectedAgents.map((agentType) => ({
        value: agentType,
        label: `${agents[agentType].displayName} ${pc.dim('(detected)')}`,
      })),
      ...Object.entries(agents)
        .filter(([key]) => !detectedAgents.includes(key as AgentType))
        .map(([key, config]) => ({
          value: key as AgentType,
          label: config.displayName,
        })),
    ];

    const selected = await p.multiselect({
      message: 'Which agents do you want to enable to skill to?',
      options: agentChoices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Enable cancelled');
      process.exit(0);
    }

    targetAgents = selected as AgentType[];
  }

  spinner.start('Enabling skills...');

  const results: { skill: string; agent: string; success: boolean; error?: string }[] = [];

  // Install skill to selected agents (symlink mode)
  const installMode: InstallMode = 'symlink';
  const cwdForInstall = isGlobal ? undefined : cwd;

  for (const { name: skillName, skill } of selectedSkills) {
    // Read the skill SKILL.md from source
    const { parseSkillMd } = await import('./skills.ts');
    const parsedSkill = await parseSkillMd(`${skill.path}/SKILL.md`);
    if (!parsedSkill) continue;

    // Install to each selected agent
    for (const agentType of targetAgents) {
      try {
        const result = await installSkillForAgent(
          parsedSkill,
          agentType,
          { global: isGlobal, cwd: cwdForInstall, mode: installMode }
        );

        if (result.success) {
          results.push({
            skill: skillName,
            agent: agents[agentType].displayName,
            success: true,
          });
        } else {
          results.push({
            skill: skillName,
            agent: agents[agentType].displayName,
            success: false,
            error: result.error,
          });
        }
      } catch (err) {
        results.push({
          skill: skillName,
          agent: agents[agentType].displayName,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  spinner.stop('Enable process complete');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    p.log.success(pc.green(`Successfully enabled ${successful.length} skill(s)`));
  }

  if (failed.length > 0) {
    p.log.error(pc.red(`Failed to enable ${failed.length} skill(s)`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${r.skill} → ${r.agent}: ${pc.dim(r.error || 'Unknown error')}`);
    }
  }

  console.log();
  p.outro(pc.green('Done!'));
}

/**
 * Run the status command.
 * Shows which agents have each skill installed.
 */
export async function statusCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');
  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  spinner.stop(`Found ${installedSkills.length} installed skill(s)`);

  if (installedSkills.length === 0) {
    p.outro(pc.yellow('No skills found.'));
    return;
  }

  const skillsToCheck: InstalledSkill[] =
    skillNames.length > 0
      ? installedSkills.filter((s) =>
          skillNames.some((name) => name.toLowerCase() === s.name.toLowerCase())
        )
      : installedSkills;

  if (skillNames.length > 0 && skillsToCheck.length === 0) {
    p.log.error(`No skills found matching: ${skillNames.join(', ')}`);
    return;
  }

  console.log();
  p.log.info('Skill Status:');
  console.log();

  // For each skill, check which agents have it installed
  const detectedAgents = await detectInstalledAgents();

  for (const skill of skillsToCheck) {
    const agentsWithSkill: string[] = [];
    const agentsWithoutSkill: string[] = [];

    for (const agentType of detectedAgents) {
      const isInstalled = await isSkillInAgentDir(skill.name, agentType, isGlobal, cwd);
      if (isInstalled) {
        agentsWithSkill.push(agents[agentType].displayName);
      } else {
        agentsWithoutSkill.push(agents[agentType].displayName);
      }
    }

    const isEnabled = agentsWithSkill.length > 0;
    const status = isEnabled ? pc.dim('[enabled]') : pc.dim('[disabled]');
    const nameColor = isEnabled ? pc.cyan : pc.gray;

    console.log(`  ${status} ${nameColor(skill.name)}`);
    console.log(`    ${pc.dim(skill.description)}`);

    // Show agents
    if (agentsWithSkill.length > 0) {
      console.log(`    ${pc.dim('Installed in:')} ${agentsWithSkill.join(', ')}`);
    }

    if (!isEnabled && agentsWithoutSkill.length > 0) {
      console.log(
        `    ${pc.dim('Available in:')} ${agentsWithoutSkill.join(', ')} ${pc.dim('(not installed)')}`
      );
    }

    console.log();
  }

  // Show summary
  let enabledCount = 0;
  let disabledCount = 0;

  for (const skill of skillsToCheck) {
    const hasInAnyAgent = await (async () => {
      for (const agentType of detectedAgents) {
        if (await isSkillInAgentDir(skill.name, agentType, isGlobal, cwd)) {
          return true;
        }
      }
      return false;
    })();

    if (hasInAnyAgent) {
      enabledCount++;
    } else {
      disabledCount++;
    }
  }

  console.log();
  p.log.info(
    `Summary: ${pc.green(`${enabledCount} enabled`)}, ${pc.dim(`${disabledCount} disabled`)}`
  );
  console.log();

  if (!skillNames.length) {
    // Suggest commands
    if (disabledCount > 0) {
      console.log(
        `${pc.dim('To enable disabled skills:')} ${pc.cyan('skills enable <skill>')}`
      );
    }
    if (enabledCount > 0) {
      console.log(
        `${pc.dim('To disable skills:')} ${pc.cyan('skills disable <skill>')}`
      );
    }
    console.log();
  }
}
