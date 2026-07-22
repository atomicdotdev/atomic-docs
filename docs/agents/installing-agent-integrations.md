---
sidebar_position: 2
title: Installing Agent Integrations
---

# Installing Agent Integrations

Atomic agent integrations now live in small, agent-specific packages. Each package adapts one AI coding tool to Atomic's shared provenance and attestation pipeline:

- Start or resume an agent session
- Create an isolated draft view for the session or task
- Capture prompts, tool calls, edits, commands, and model metadata
- Record changes automatically with AI provenance
- Create session attestations that summarize model usage, cost, timing, and covered changes

This guide shows how to introduce those integrations into an existing project.

## Before You Start

You need:

1. The Atomic CLI installed and available on your `PATH`.
2. An Atomic repository in the project you want the agent to work on.
3. The agent or editor you want to integrate.

```bash
atomic --version
cd my-project
atomic init
```

If the project already has `.atomic/`, do not initialize it again.

:::tip
The integrations handle recording for you. During an agent session, do not run `atomic add` or `atomic record` manually unless you intentionally want to step outside the automated workflow.
:::

## Standard Rollout for an Existing Project

Most integrations follow the same pattern:

1. **Install the global adapter** from the integration package. This adds hooks, plugins, extensions, or skills to the agent's user-level configuration.
2. **Add project instructions** when the agent needs a repo-local prompt, rule file, or hook manifest.
3. **Open the project with the agent**. The integration activates only when the workspace is an Atomic repository.
4. **Review the recorded work** with `atomic log`, `atomic change`, and `atomic agent attest`.

```bash
cd my-project
atomic init
# install the adapter for your agent
# copy the project-specific instruction files for that agent
# start the agent normally
```

## Integration Matrix

| Integration | Agent | Repository | Global install | Project files for existing repos |
|-------------|-------|------------|----------------|----------------------------------|
| `atomic-agy` | Antigravity CLI (`agy`) | https://github.com/atomicdotdev/atomic-agy | `atomic agent enable --agent agy` | None required — a managed section is written into `AGENTS.md` automatically |
| `atomic-claude` | Claude Code | https://github.com/atomicdotdev/atomic-claude | `atomic agent enable --agent claude-code` (add `--global` for user-level) | Optional: copy `CLAUDE.md` to the project root |
| `atomic-codex` | Codex | https://github.com/atomicdotdev/atomic-codex | `atomic agent enable --agent codex` (add `--global` for user-level) | Optional: copy `AGENTS.md` to the project root |
| `atomic-cline` | Cline | https://github.com/atomicdotdev/atomic-cline | `./install.sh` or `npx atomic-cline` once published | Copy `rules/atomic.md` to `.clinerules/atomic.md` |
| `atomic-pi` | Pi | https://github.com/atomicdotdev/atomic-pi | `pi install /path/to/atomic-pi` or `pi install npm:atomic-pi` once published | No repo-local file is required by default |
| `atomic-copilot` | GitHub Copilot cloud agent and CLI | https://github.com/atomicdotdev/atomic-copilot | `./install.sh` for local helper setup | Copy `.github/hooks/atomic-hooks.json`, `.github/copilot-instructions.md`, and `AGENTS.md` into the repository |
| `atomic-cursor` | Cursor | https://github.com/atomicdotdev/atomic-cursor | `./install.sh` or `npx atomic-cursor` once published | Copy `rules/atomic.md` to `.cursor/rules/atomic.md` |
| `atomic-opencode` | OpenCode | https://github.com/atomicdotdev/atomic-opencode | Add `atomic-opencode` to `~/.config/opencode/opencode.json`, then run `npx atomic-opencode`; or use `./install.sh` from source | No repo-local file is required by default; select the Atomic agent in OpenCode |

## Antigravity CLI

Use `atomic agent enable --agent agy` for Google's Antigravity CLI (`agy`), the successor to the deprecated Gemini CLI.

```bash
cd /path/to/my-project
atomic init
atomic agent enable --agent agy
agy
```

The enable command installs the Atomic plugin (hooks plus the `atomic-vault`, `atomic-vcs`, and `code-intelligence` skills) into `~/.gemini/config/plugins/atomic/` via agy's plugin mechanism, and writes a managed instruction section into the project's `AGENTS.md` — no file copying needed, and `atomic agent disable --agent agy` removes it cleanly. agy fires hooks on `PreInvocation`, `Stop`, and `PostToolUse`; turns record with provenance when the agent goes idle, and session attestations are created at that point. agy hook payloads do not include the user prompt, model name, or token usage, so attestations start sparse and can be enriched from the transcript later.

The [atomic-agy](https://github.com/atomicdotdev/atomic-agy) repository holds the canonical instruction file, skills, and hook manifest if you want to review or contribute to the integration, or prefer the script-based install (`./install.sh`).

## Claude Code

Use `atomic agent enable --agent claude-code` for Claude Code.

```bash
cd /path/to/my-project
atomic init
atomic agent enable --agent claude-code
claude
```

The enable command merges Atomic's hooks (plus a `permissions.deny` rule for `.atomic/metadata`) into the project's `.claude/settings.json`. Add `--global` to install into `~/.claude/settings.json` instead, covering every project. In a repo that already has a `.claude/` directory, plain `atomic agent enable` auto-detects Claude Code and needs no `--agent` flag.

For the full prompt setup, the [atomic-claude](https://github.com/atomicdotdev/atomic-claude) repository additionally provides the `CLAUDE.md` instruction file (copy it to the project root), the `@intent` agent, and skills symlinked into `~/.claude/` via its `./install.sh` (or `npx atomic-claude` once published).

## Codex

Use `atomic agent enable --agent codex` for Codex.

```bash
cd /path/to/my-project
atomic init
atomic agent enable --agent codex
codex
```

The enable command writes hooks into the project's `.codex/hooks.json` and enables Codex's `[features] hooks = true` flag in the sibling `config.toml` (migrating the deprecated `codex_hooks` name if present). Add `--global` to install into `~/.codex/` instead.

Codex hook support is currently experimental, so shell-command provenance may be richer than edit-tool provenance until Codex publishes complete hook events.

For the instruction file and skills, the [atomic-codex](https://github.com/atomicdotdev/atomic-codex) repository provides `AGENTS.md` (copy it to the project root) and skills symlinked into `~/.codex/` via its `./install.sh` (or `npx atomic-codex` once published).

## Cline

Use `atomic-cline` for Cline in VS Code.

```bash
git clone https://github.com/atomicdotdev/atomic-cline
cd atomic-cline
./install.sh

cd /path/to/my-project
atomic init
mkdir -p .clinerules
cp /path/to/atomic-cline/rules/atomic.md .clinerules/atomic.md
```

Then open Cline's Hooks tab in VS Code and enable the installed Atomic hooks. Cline hooks are executable scripts under `~/Documents/Cline/Hooks/` and require `jq` to parse hook JSON.

Cline records at task boundaries: one task creates one draft view, and the task completion records the task's changes with provenance.

## Pi

Use `atomic-pi` for Pi.

```bash
git clone https://github.com/atomicdotdev/atomic-pi
cd atomic-pi
pi install /path/to/atomic-pi

cd /path/to/my-project
atomic init
pi
```

The Pi package registers an Atomic extension, an Atomic agent prompt, and skills. Once installed, the Atomic agent activates in Atomic repositories and follows the intent-per-turn workflow.

## GitHub Copilot

Use `atomic-copilot` for GitHub Copilot cloud agent and CLI.

```bash
git clone https://github.com/atomicdotdev/atomic-copilot
cd atomic-copilot
./install.sh

cd /path/to/my-project
atomic init
mkdir -p .github/hooks
cp /path/to/atomic-copilot/hooks/atomic-hooks.json .github/hooks/
cp /path/to/atomic-copilot/copilot-instructions.md .github/
cp /path/to/atomic-copilot/AGENTS.md .
```

For the Copilot cloud agent, the hook manifest must be present on the repository's default branch before the cloud agent starts. Add the copied files using your normal repository workflow.

Copilot currently records one change per session because its hook lifecycle does not expose a turn-level stop event.

## Cursor

Use `atomic-cursor` for Cursor.

```bash
git clone https://github.com/atomicdotdev/atomic-cursor
cd atomic-cursor
./install.sh

cd /path/to/my-project
atomic init
mkdir -p .cursor/rules
cp /path/to/atomic-cursor/rules/atomic.md .cursor/rules/atomic.md
# Open the project in Cursor
```

Cursor hooks call into Atomic on session lifecycle events, tool usage, and reasoning blocks. The repo-local rule file tells Cursor to use the Atomic intent workflow inside the project.

## OpenCode

Use `atomic-opencode` for OpenCode.

Add the package to your global OpenCode config at `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["atomic-opencode"]
}
```

Then run the setup helper:

```bash
npx atomic-opencode

cd /path/to/my-project
atomic init
opencode
```

In OpenCode, switch to the Atomic agent. The package installs the plugin, Atomic agent prompt, and skills into `~/.config/opencode/`.

For development installs, clone the repository and run `./install.sh` instead.

## Verify the Integration

After the agent makes changes, use Atomic to inspect what happened:

```bash
atomic agent status --verbose
atomic log
atomic agent attest
```

For a specific change:

```bash
atomic change -p <hash>
atomic change -a <hash>
```

`atomic change -p` shows the causal provenance graph. `atomic change -a` shows inline AI attestation data such as model, provider, tokens, and cost when the agent reports usage metrics.

## What Gets Introduced into the Project

Atomic integrations generally introduce two kinds of files:

| File type | Scope | Purpose |
|-----------|-------|---------|
| Hooks, plugins, or extensions | User-level agent config, except Copilot cloud hooks | Invoke `atomic agent hooks <agent> <verb>` on agent lifecycle events |
| Instructions, rules, or prompts | Project-level when the agent discovers repo-local guidance | Tell the agent to create intents, define success criteria, use Atomic code intelligence, and avoid manual recording |

The actual provenance artifacts live in `.atomic/` after the agent works. They are not static setup files; they are content-addressed records created by Atomic.

## Removing an Integration

Each package provides an uninstall path:

| Integration | Uninstall |
|-------------|-----------|
| `atomic-agy` | `atomic agent disable --agent agy` |
| `atomic-claude` | `atomic agent disable --agent claude-code` (or `npx atomic-claude --uninstall`), then remove project `CLAUDE.md` files manually |
| `atomic-codex` | `atomic agent disable --agent codex` (or `npx atomic-codex --uninstall`), then remove project `AGENTS.md` files manually |
| `atomic-cline` | `npx atomic-cline --uninstall`, or remove `atomic-*` files from `~/Documents/Cline/Hooks/` |
| `atomic-pi` | `pi remove /path/to/atomic-pi` or `pi remove npm:atomic-pi` |
| `atomic-copilot` | Remove `.github/hooks/atomic-hooks.json`, `.github/copilot-instructions.md`, and `AGENTS.md` if they were added only for Copilot |
| `atomic-cursor` | `npx atomic-cursor --uninstall`, then remove project `.cursor/rules/atomic.md` files manually |
| `atomic-opencode` | `npx atomic-opencode --uninstall` |

Removing hooks stops future automatic recording. Existing Atomic changes, provenance graphs, and attestations remain in the repository history.

## See Also

- [Querying the Graph](/getting-started/querying-the-graph) — Learn the `atomic vault query` commands that the code-intelligence skill teaches agents to use
- [Agent Integration Overview](overview.md)
- [Provenance Graphs](provenance.md)
- [Attestations](attestations.md)
- [`atomic agent` command reference](/commands/agent)
