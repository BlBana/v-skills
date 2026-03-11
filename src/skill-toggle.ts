import * as p from '@clack/prompts';
import pc from 'picocolors';
import { listInstalledSkills } from './installer.ts';
import {
  disableSkill as disableSkillFromLock,
  enableSkill as enableSkillFromLock,
  isSkillDisabled as isSkillDisabledFromLock,
  getDisabledSkills as getDisabledSkillsFromLock,
} from './skill-lock.ts';
import {
  disableLocalSkill as disableSkillFromLocalLock,
  enableLocalSkill as enableSkillFromLocalLock,
  isLocalSkillDisabled as isSkillDisabledFromLocalLock,
  getLocalDisabledSkills as getDisabledSkillsFromLocalLock,
} from './local-lock.ts';
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
 * Check if a skill is disabled (checks both global and local lock files).
 */
async function isSkillDisabled(skillName: string, global: boolean): Promise<boolean> {
  if (global) {
    return isSkillDisabledFromLock(skillName);
  }
  return isSkillDisabledFromLocalLock(skillName);
}

/**
 * Enable a skill.
 */
async function enableSkill(skillName: string, global: boolean): Promise<void> {
  if (global) {
    await enableSkillFromLock(skillName);
  } else {
    await enableSkillFromLocalLock(skillName);
  }
}

/**
 * Disable a skill.
 */
async function disableSkill(skillName: string, global: boolean): Promise<void> {
  if (global) {
    await disableSkillFromLock(skillName);
  } else {
    await disableSkillFromLocalLock(skillName);
  }
}

/**
 * Get disabled skills.
 */
async function getDisabledSkills(global: boolean): Promise<string[]> {
  if (global) {
    return getDisabledSkillsFromLock();
  }
  return getDisabledSkillsFromLocalLock();
}

/**
 * Format status message for a skill.
 */
function formatSkillStatus(skill: InstalledSkill, disabled: boolean): string {
  const status = disabled ? pc.dim('[disabled]') : pc.dim('[enabled]');
  return `${status} ${pc.cyan(skill.name)}`;
}

/**
 * Run the enable command.
 */
export async function enableCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');

  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  const disabledSkillsSet = new Set(await getDisabledSkills(isGlobal));

  spinner.stop(`Found ${installedSkills.length} installed skill(s)`);

  if (installedSkills.length === 0) {
    p.outro(pc.yellow('No skills found to enable.'));
    return;
  }

  // Filter to only show disabled skills for enable command
  const disabledInstalledSkills = installedSkills.filter((s) => disabledSkillsSet.has(s.name));

  if (disabledInstalledSkills.length === 0) {
    p.outro(pc.green('All skills are already enabled.'));
    return;
  }

  let selectedSkills: string[] = [];

  if (skillNames.length > 0) {
    // Match provided skill names against disabled skills
    selectedSkills = disabledInstalledSkills
      .filter((s) => skillNames.some((name) => name.toLowerCase() === s.name.toLowerCase()))
      .map((s) => s.name);

    if (selectedSkills.length === 0) {
      p.log.error(
        `No disabled skills found matching: ${skillNames.join(', ')}. Use 'skills status' to see disabled skills.`
      );
      return;
    }

    // Warn about skills that are already enabled or not found
    const notFound = skillNames.filter(
      (name) => !selectedSkills.some((s) => s.toLowerCase() === name.toLowerCase())
    );
    if (notFound.length > 0) {
      p.log.warn(
        `The following skill(s) are already enabled or not installed: ${notFound.join(', ')}`
      );
    }
  } else {
    // Interactive selection - only show disabled skills
    const choices = disabledInstalledSkills.map((s) => ({
      value: s.name,
      label: s.name,
      hint: s.description,
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

    selectedSkills = selected as string[];
  }

  if (!options.yes) {
    console.log();
    p.log.info('Skills to enable:');
    for (const skillName of selectedSkills) {
      p.log.message(`  ${pc.green('•')} ${skillName}`);
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

  spinner.start('Enabling skills...');

  const results: { skill: string; success: boolean; error?: string }[] = [];

  for (const skillName of selectedSkills) {
    try {
      await enableSkill(skillName, isGlobal);
      results.push({ skill: skillName, success: true });
    } catch (err) {
      results.push({
        skill: skillName,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
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
      p.log.message(`  ${pc.red('✗')} ${r.skill}: ${r.error}`);
    }
  }

  console.log();
  p.outro(pc.green('Done!'));
}

/**
 * Run the disable command.
 */
export async function disableCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');

  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  const disabledSkillsSet = new Set(await getDisabledSkills(isGlobal));

  spinner.stop(`Found ${installedSkills.length} installed skill(s)`);

  if (installedSkills.length === 0) {
    p.outro(pc.yellow('No skills found to disable.'));
    return;
  }

  // Filter to only show enabled skills for disable command
  const enabledInstalledSkills = installedSkills.filter((s) => !disabledSkillsSet.has(s.name));

  if (enabledInstalledSkills.length === 0) {
    p.outro(pc.yellow('All skills are already disabled.'));
    return;
  }

  let selectedSkills: string[] = [];

  if (skillNames.length > 0) {
    // Match provided skill names against enabled skills
    selectedSkills = enabledInstalledSkills
      .filter((s) => skillNames.some((name) => name.toLowerCase() === s.name.toLowerCase()))
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
      p.log.warn(`The following skill(s) are already disabled or not installed: ${notFound.join(', ')}`);
    }
  } else {
    // Interactive selection - only show enabled skills
    const choices = enabledInstalledSkills.map((s) => ({
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

  const results: { skill: string; success: boolean; error?: string }[] = [];

  for (const skillName of selectedSkills) {
    try {
      await disableSkill(skillName, isGlobal);
      results.push({ skill: skillName, success: true });
    } catch (err) {
      results.push({
        skill: skillName,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  spinner.stop('Disable process complete');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    p.log.success(pc.green(`Successfully disabled ${successful.length} skill(s)`));
  }

  if (failed.length > 0) {
    p.log.error(pc.red(`Failed to disable ${failed.length} skill(s)`));
    for (const r of failed) {
      p.log.message(`  ${pc.red('✗')} ${r.skill}: ${r.error}`);
    }
  }

  console.log();
  p.outro(pc.green('Done!'));
}

/**
 * Run the status command.
 */
export async function statusCommand(skillNames: string[], options: ToggleOptions): Promise<void> {
  const isGlobal = options.global ?? false;
  const cwd = process.cwd();
  const spinner = p.spinner();

  spinner.start('Scanning for installed skills...');

  const installedSkills = await listInstalledSkills({ global: isGlobal, cwd });
  const disabledSkillsSet = new Set(await getDisabledSkills(isGlobal));

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

  for (const skill of skillsToCheck) {
    const disabled = disabledSkillsSet.has(skill.name);
    const status = disabled ? pc.dim('[disabled]') : pc.dim('[enabled]');
    const nameColor = disabled ? pc.gray : pc.cyan;
    console.log(`  ${status} ${nameColor(skill.name)}`);
    console.log(`    ${pc.dim(skill.description)}`);

    // Show agents
    if (skill.agents.length > 0) {
      const agentsStr = skill.agents.join(', ');
      console.log(`    ${pc.dim('Agents:')} ${agentsStr}`);
    }

    console.log();
  }

  // Show summary
  const enabledCount = skillsToCheck.filter((s) => !disabledSkillsSet.has(s.name)).length;
  const disabledCount = skillsToCheck.filter((s) => disabledSkillsSet.has(s.name)).length;

  console.log();
  p.log.info(
    `Summary: ${pc.green(`${enabledCount} enabled`)}, ${pc.dim(`${disabledCount} disabled`)}`
  );
  console.log();

  if (!skillNames.length) {
    // Suggest commands
    const disabledSkills = skillsToCheck.filter((s) => disabledSkillsSet.has(s.name));
    const enabledSkills = skillsToCheck.filter((s) => !disabledSkillsSet.has(s.name));

    if (disabledSkills.length > 0) {
      console.log(
        `${pc.dim('To enable disabled skills:')} ${pc.cyan('skills enable <skill>')}`
      );
    }
    if (enabledSkills.length > 0) {
      console.log(
        `${pc.dim('To disable skills:')} ${pc.cyan('skills disable <skill>')}`
      );
    }
    console.log();
  }
}
