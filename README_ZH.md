# skills

开源 Agent 技能生态系统 CLI 工具

[English](./README.md) | 简体中文

<!-- agent-list:start -->
支持 **OpenCode**、**Claude Code**、**Codex**、**Cursor** 等[37+种代理](#available-agents)
<!-- agent-list:end -->

## 安装技能

```bash
npx skills add vercel-labs/agent-skills
```

### 支持的源格式

```bash
# GitHub 简写格式 (owner/repo)
npx skills add vercel-labs/agent-skills

# 完整的 GitHub URL
npx skills add https://github.com/vercel-labs/agent-skills

# 直接指定仓库中的技能路径
npx skills add https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

# GitLab URL
npx skills add https://gitlab.com/org/repo

# 任意 git URL
npx skills add git@github.com:vercel-labs/agent-skills.git

# 本地路径
npx skills add ./my-local-skills
```

### 选项

| 选项                    | 说明                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-g, --global`            | 安装到用户目录而不是项目目录                                                                                                       |
| `-a, --agent <agents...>` | <!-- agent-names:start -->指定目标代理（如 `claude-code`、`codex`）。见[可用代理](#available-agents)<!-- agent-names:end -->                  |
| `-s, --skill <skills...>` | 按名称安装指定技能（使用 `'*'` 表示所有技能）                                                                                         |
| `-l, --list`              | 列出可用技能而不安装                                                                                                           |
| `--copy`                  | 复制文件到代理目录而不是创建符号链接                                                                                              |
| `-y, --yes`               | 跳过所有确认提示                                                                                                                      |
| `--all`                   | 无需确认，将所有技能安装到所有代理                                                                                                   |

### 示例

```bash
# 列出仓库中的技能
npx skills add vercel-labs/agent-skills --list

# 安装指定技能
npx skills add vercel-labs/agent-skills --skill frontend-design --skill skill-creator

# 安装名称中包含空格的技能（必须用引号包裹）
npx skills add owner/repo --skill "Convex Best Practices"

# 安装到指定代理
npx skills add vercel-labs/agent-skills -a claude-code -a opencode

# 非交互式安装（适合 CI/CD）
npx skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y

# 将仓库中的所有技能安装到所有代理
npx skills add vercel-labs/agent-skills --all

# 将所有技能安装到指定代理
npx skills add vercel-labs/agent-skills --skill '*' -a claude-code

# 将指定技能安装到所有代理
npx skills add vercel-labs/agent-skills --agent '*' --skill frontend-design
```

### 安装范围

| 范围       | 标志      | 位置            | 用途                                      |
| ----------- | --------- | ------------------- | --------------------------------------------- |
| **项目** | (默认) | `./<agent>/skills/` | 随项目提交，与团队共享 |
| **全局** | `-g`      | `~/<agent>/skills/` | 跨所有项目可用                 |

### 安装方式

交互式安装时，您可以选择：

| 方式                    | 说明                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| **符号链接**（推荐） | 为每个代理创建指向统一副本的符号链接。单一真相源，易于更新。 |
| **复制**                  | 为每个代理创建独立副本。符号链接不支持时使用。              |

## 其他命令

| 命令                      | 说明                                    |
| ---------------------------- | ---------------------------------------------- |
| `npx skills list`            | 列出已安装的技能（别名：`ls`）            |
| `npx skills enable [skills]` | 启用已禁用的技能（别名：`e`）         |
| `npx skills disable [skills]` | 禁用技能（别名：`d`）                |
| `npx skills status [skills]` | 检查技能是否已启用或已禁用（别名：`s`） |
| `npx skills find [query]`    | 交互式搜索或按关键词搜索技能  |
| `npx skills remove [skills]` | 从代理中移除已安装的技能            |
| `npx skills check`           | 检查可用的技能更新              |
| `npx skills update`          | 将所有已安装的技能更新到最新版本 |
| `npx skills init [name]`     | 创建新的 SKILL.md 模板                 |

### `skills list`

列出所有已安装的技能。类似于 `npm ls`。

```bash
# 列出所有已安装的技能（项目和全局）
npx skills list

# 仅列出全局技能
npx skills ls -g

# 按特定代理筛选
npx skills ls -a claude-code -a cursor
```

### `skills enable`

启用已禁用的技能。禁用的技能在启用之前不会被代理加载。

```bash
# 交互式启用（从已禁用的技能中选择）
npx skills enable

# 按名称启用特定技能
npx skills enable web-design-guidelines

# 启用多个技能
npx skills enable frontend-design web-design-guidelines -y

# 启用全局技能
npx skills enable --global web-design-guidelines

# 使用 'e' 别名
npx skills e web-design-guidelines
```

| 选项         | 说明                                      |
| -------------- | ------------------------------------------------ |
| `-g, --global` | 启用全局技能（~/）而不是项目技能 |
| `-y, --yes`    | 跳过确认提示                        |

### `skills disable`

禁用已安装的技能。禁用的技能不会被代理加载。

```bash
# 交互式禁用（从已启用的技能中选择）
npx skills disable

# 按名称禁用特定技能
npx skills disable web-design-guidelines

# 禁用多个技能
npx skills disable frontend-design web-design-guidelines -y

# 禁用全局技能
npx skills disable --global web-design-guidelines

# 使用 'd' 别名
npx skills d web-design-guidelines
```

| 选项         | 说明                                      |
| -------------- | ------------------------------------------------ |
| `-g, --global` | 禁用全局技能（~/）而不是项目技能 |
| `-y, --yes`    | 跳过确认提示                        |

### `skills status`

检查技能是否已启用或已禁用。

```bash
# 检查所有已安装技能的状态
npx skills status

# 检查特定技能的状态
npx skills status web-design-guidelines

# 检查多个技能
npx skills status web-design-guidelines frontend-design

# 检查全局技能
npx skills status --global

# 使用 's' 别名
npx skills s web-design-guidelines
```

| 选项         | 说明                                      |
| -------------- | ------------------------------------------------ |
| `-g, --global` | 检查全局技能（~/）而不是项目技能 |

**输出：**
- `[enabled]` - 技能处于活动状态，会被代理加载
- `[disabled]` - 技能已被禁用，不会被代理加载

### `skills find`

交互式搜索或按关键词搜索技能。

```bash
# 交互式搜索（类似 fzf 风格）
npx skills find

# 按关键词搜索
npx skills find typescript
```

### `skills check` / `skills update`

```bash
# 检查是否有已安装技能的更新
npx skills check

# 将所有已安装的技能更新到最新版本
npx skills update
```

### `skills init`

```bash
# 在当前目录创建 SKILL.md
npx skills init

# 在子目录中创建新技能
npx skills init my-skill
```

### `skills remove`

从代理中移除已安装的技能。

```bash
# 交互式移除（从已安装的技能中选择）
npx skills remove

# 按名称移除特定技能
npx skills remove web-design-guidelines

# 移除多个技能
npx skills remove frontend-design web-design-guidelines

# 从全局范围移除
npx skills remove --global web-design-guidelines

# 仅从特定代理移除
npx skills remove --agent claude-code cursor my-skill

# 无需确认移除所有已安装的技能
npx skills remove --all

# 从特定代理移除所有技能
npx skills remove --skill '*' -a cursor

# 从所有代理移除特定技能
npx skills remove my-skill --agent '*'

# 使用 'rm' 别名
npx skills rm my-skill
```

| 选项         | 说明                                      |
| -------------- | ------------------------------------------------ |
| `-g, --global` | 从全局范围（~/）而不是项目移除 |
| `-a, --agent`  | 从特定代理移除（使用 `'*'` 表示全部）  |
| `-s, --skill`  | 指定要移除的技能（使用 `'*'` 表示全部）     |
| `-y, --yes`    | 跳过确认提示                        |
| `--all`        | `--skill '*' --agent '*' -y` 的简写       |

## 什么是 Agent 技能？

Agent 技能是可重用的指令集，用于扩展您的编程代理的功能。它们在包含 `name` 和 `description` 的 YAML 前置元数据的 `SKILL.md` 文件中定义。

技能让代理能够执行专门的任务，例如：

- 从 git 历史记录生成发布说明
- 按照团队的约定创建 PR
- 与外部工具集成（Linear、Notion 等）

在 **[skills.sh](https://skills.sh)** 发现更多技能

## 支持的代理

技能可以安装到以下任何代理：

<!-- supported-agents:start -->
| 代理 | `--agent` 标志 | 项目路径 | 全局路径 |
|-------|-----------|--------------|-------------|
| Amp, Kimi Code CLI, Replit, Universal | `amp`、`kimi-cli`、`replit`、`universal` | `.agents/skills/` | `~/.config/agents/skills/` |
| Antigravity | `antigravity` | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| Augment | `augment` | `.augment/skills/` | `~/.augment/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| OpenClaw | `openclaw` | `skills/` | `~/.openclaw/skills/` |
| Cline | `cline` | `.agents/skills/` | `~/.agents/skills/` |
| CodeBuddy | `codebuddy` | `.codebuddy/skills/` | `~/.codebuddy/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Command Code | `command-code` | `.commandcode/skills/` | `~/.commandcode/skills/` |
| Continue | `continue` | `.continue/skills/` | `~/.continue/skills/` |
| Cortex Code | `cortex` | `.cortex/skills/` | `~/.snowflake/cortex/skills/` |
| Crush | `crush` | `.crush/skills/` | `~/.config/crush/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Droid | `droid` | `.factory/skills/` | `~/.factory/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| Goose | `goose` | `.goose/skills/` | `~/.config/goose/skills/` |
| Junie | `junie` | `.junie/skills/` | `~/.junie/skills/` |
| iFlow CLI | `iflow-cli` | `.iflow/skills/` | `~/.iflow/skills/` |
| Kilo Code | `kilo` | `.kilocode/skills/` | `~/.kilocode/skills/` |
| Kiro CLI | `kiro-cli` | `.kiro/skills/` | `~/.kiro/skills/` |
| Kode | `kode` | `.kode/skills/` | `~/.kode/skills/` |
| MCPJam | `mcpjam` | `.mcpjam/skills/` | `~/.mcpjam/skills/` |
| Mistral Vibe | `mistral-vibe` | `.vibe/skills/` | `~/.vibe/skills/` |
| Mux | `mux` | `.mux/skills/` | `~/.mux/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| OpenHands | `openhands` | `.openhands/skills/` | `~/.openhands/skills/` |
| Pi | `pi` | `.pi/skills/` | `~/.pi/agent/skills/` |
| Qoder | `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |
| Qwen Code | `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| Roo Code | `roo` | `.roo/skills/` | `~/.roo/skills/` |
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Trae CN | `trae-cn` | `.trae/skills/` | `~/.trae-cn/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Zencoder | `zencoder` | `.zencoder/skills/` | `~/.zencoder/skills/` |
| Neovate | `neovate` | `.neovate/skills/` | `~/.neovate/skills/` |
| Pochi | `pochi` | `.pochi/skills/` | `~/.pochi/skills/` |
| AdaL | `adal` | `.adal/skills/` | `~/.adal/skills/` |
<!-- supported-agents:end -->

> [!注意]
> **Kiro CLI 用户：** 安装技能后，请手动将其添加到自定义代理的 `resources` 文件
> `.kiro/agents/<agent>.json`：
>
> ```json
> {
>   "resources": ["skill://.kiro/skills/**/SKILL.md"]
> }
> ```
>
此 CLI 会自动检测您安装了哪些编程代理。如果未检测到任何代理，您将收到提示以选择要安装到的代理。

## 创建技能

技能是包含带有 YAML 前置元数据的 `SKILL.md` 文件的目录：

```markdown
---
name: my-skill
description: 此技能的功能以及何时使用它
---
# 我的技能

代理激活此技能时应遵循的说明。
```

## 何时使用

描述此技能应该使用的场景。

## 步骤

1. 首先，执行此操作
2. 然后，执行该操作
```

### 必需字段

- `name`：唯一标识符（小写，允许连字符）
- `description`：技能功能的简要说明

### 可选字段

- `metadata.internal`：设置为 `true` 以从常规发现中隐藏该技能。内部技能仅在设置
  `INSTALL_INTERNAL_SKILLS=1` 时可见和可安装。适用于进行中的技能或仅用于
  内部工具化的技能。

```markdown
---
name: my-internal-skill
description: 默认不显示的内部技能
metadata:
  internal: true
---
```

### 技能发现

CLI 在仓库中的以下位置搜索技能：

<!-- skill-discovery:start -->
- 根目录（如果包含 `SKILL.md`）
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`
- `.agents/skills/`
- `.agent/skills/`
- `.augment/skills/`
- `.claude/skills/`
- `./skills/`
- `.codebuddy/skills/`
- `.commandcode/skills/`
- `.continue/skills/`
- `.cortex/skills/`
- `.crush/skills/`
- `.factory/skills/`
- `.goose/skills/`
- `.junie/skills/`
- `.iflow/skills/`
- `.kilocode/skills/`
- `.kiro/skills/`
- `.kode/skills/`
- `.mcpjam/skills/`
- `.vibe/skills/`
- `.mux/skills/`
- `.openhands/skills/`
- `.pi/skills/`
- `.qoder/skills/`
- `.qwen/skills/`
- `.roo/skills/`
- `.trae/skills/`
- `.windsurf/skills/`
- `.zencoder/skills/`
- `.neovate/skills/`
- `.pochi/skills/`
- `.adal/skills/`
<!-- skill-discovery:end -->

### 插件清单发现

如果存在 `.claude-plugin/marketplace.json` 或 `.claude-plugin/plugin.json`，在这些文件中声明的技能也会被发现：

```json
// .claude-plugin/marketplace.json
{
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "my-plugin",
      "skills": ["./skills/review", "./skills/test"]
    }
  ]
}
```

这可以与 [Claude Code 插件市场](https://code.claude.com/docs/en/plugin-marketplaces) 生态系统兼容。

如果在标准位置未找到技能，将执行递归搜索。

## 兼容性

技能通常在各代理之间兼容，因为它们遵循共享的 [Agent 技能规范](https://agentskills.io)。然而，某些功能可能特定于代理：

| 特性         | OpenCode | OpenHands | Claude Code | Cline | CodeBuddy | Codex | Command Code | Kiro CLI | Cursor | Antigravity | Roo Code | Github Copilot | Amp | OpenClaw | Neovate | Pi  | Qoder | Zencoder |
| --------------- | -------- | --------- | ----------- | ----- | --------- | ----- | ------------ | -------- | ------ | ----------- | -------- | -------------- | --- | -------- | ------- | --- | ----- | -------- |
| 基础技能    | 是      | 是       | 是         | 是   | 是       | 是   | 是          | 是      | 是    | 是         | 是      | 是            | 是 | 是      | 是     | 是   | 是      |
| `allowed-tools` | 是      | 是       | 是         | 是   | 是       | 是   | 是          | 否       | 是    | 是         | 是      | 是            | 是 | 是      | 是     | 是   | 否       |
| `context: fork` | 否       | 否        | 是         | 否    | 否        | 否    | 否           | 否       | 否     | 否          | 否       | 否             | 否  | 否       | 否      | 否  | 否    | 否       |

## 故障排除

### "未找到技能"

确保仓库中包含有效的 `SKILL.md` 文件，且前置元数据中同时包含 `name` 和 `description`。

### 技能未在代理中加载

- 验证技能是否安装到正确路径
- 检查代理的文档以了解技能加载要求
- 确保 `SKILL.md` 前置元数据是有效的 YAML

### 权限错误

确保您对目标目录具有写入权限。

## 环境变量

| 变量                  | 说明                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `INSTALL_INTERNAL_SKILLS` | 设置为 `1` 或 `true` 以显示和安装标记为 `internal: true` 的技能 |
| `DISABLE_TELEMETRY`       | 设置为以禁用匿名使用遥测                                   |
| `DO_NOT_TRACK`            | 禁用遥测的替代方法                                       |

```bash
# 安装内部技能
INSTALL_INTERNAL_SKILLS=1 npx skills add vercel-labs/agent-skills --list
```

## 遥测

此 CLI 收集匿名使用数据以帮助改进工具。不会收集任何个人信息。

遥测在 CI 环境中会自动禁用。

## 相关链接

- [Agent 技能规范](https://agentskills.io)
- [技能目录](https://skills.sh)
- [Amp 技能文档](https://ampcode.com/manual#agent-skills)
- [Antigravity 技能文档](https://antigravity.google/docs/skills)
- [Factory AI / Droid 技能文档](https://docs.factory.ai/cli/configuration/skills)
- [Claude Code 技能文档](https://code.claude.com/docs/en/skills)
- [OpenClaw 技能文档](https://docs.openclaw.ai/tools/skills)
- [Cline 技能文档](https://docs.cline.bot/features/skills)
- [CodeBuddy 技能文档](https://www.codebuddy.ai/docs/ide/Features/Skills)
- [Codex 技能文档](https://developers.openai.com/codex/skills)
- [Command Code 技能文档](https://commandcode.ai/docs/skills)
- [Crush 技能文档](https://github.com/charmbracelet/crush?tab=readme-ov-file#agent-skills)
- [Cursor 技能文档](https://cursor.com/docs/context/skills)
- [Gemini CLI 技能文档](https://geminicli.com/docs/cli/skills/)
- [GitHub Copilot 代理技能](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [iFlow CLI 技能文档](https://platform.iflow.cn/en/cli/examples/skill)
- [Kimi Code CLI 技能文档](https://moonshotai.github.io/kimi-cli/en/customization/skills.html)
- [Kiro CLI 技能文档](https://kiro.dev/docs/cli/custom-agents/configuration-reference/#skill-resources)
- [Kode 技能文档](https://github.com/shareAI-lab/kode/blob/main/docs/skills.md)
- [OpenCode 技能文档](https://opencode.ai/docs/skills)
- [Qwen Code 技能文档](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/)
- [OpenHands 技能文档](https://docs.openhands.ai/modules/usage/how-to/using-skills)
- [Pi 技能文档](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)
- [Qoder 技能文档](https://docs.qoder.com/cli/skills)
- [Replit 技能文档](https://docs.replit.com/replitai/skills)
- [Roo Code 技能文档](https://docs.roocode.com/features/skills)
- [Trae 技能文档](https://docs.trae.ai/ide/skills)
- [Vercel 代理技能仓库](https://github.com/vercel-labs/agent-skills)

## 许可证

MIT
