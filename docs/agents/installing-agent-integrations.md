---
sidebar_position: 2
title: Installing Agent Integrations
---

# Installing Agent Integrations

Atomic agent integrations live in small, agent-specific packages. Each package adapts one AI coding tool to Atomic's shared provenance and attestation pipeline:

- Start or resume an agent session
- Create an isolated draft view for the session or task
- Capture prompts, tool calls, edits, commands, and model metadata
- Record changes automatically with AI provenance
- Create session attestations that summarize model usage, cost, timing, and covered changes

You install any of them with a single command:

```bash
atomic agent enable --agent <name>
```

`enable` fetches the integration package from Atomic storage, installs its files, hooks, and skills into the right places, and records a receipt so it can be cleanly removed later. There is nothing to clone, no `npm`/`npx`, and no shell script to run.

:::note
The storage-based install flow described here is available as of Atomic **0.12.0**. On earlier releases, `atomic agent enable` only wired up built-in adapter hooks; integration packages were installed by cloning the repo and running `./install.sh`. Run `atomic --version` to check.
:::

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

## Quick Start

```bash
cd my-project
atomic init

# Install the integration for your agent
atomic agent enable --agent opencode

# Or let Atomic detect the agent from directories like .claude/ or .cursor/
atomic agent enable

# Start the agent normally — recording is automatic in any Atomic repo
opencode
```

Re-running `enable` is safe: files you have not modified are refreshed, and files you edited are left untouched. Use `--force` to overwrite everything with the latest package contents.

## How Installation Works

`atomic agent enable --agent <name>` runs entirely in Rust and never executes anything from the package — no postinstall, no shell scripts:

```text
atomic agent enable --agent opencode
  1. registry (embedded, curated)   →  opencode = Atomic storage URL + view
  2. atomic clone                    →  ~/.atomic/integrations/opencode/repo
  3. read atomic-integration.toml    →  check the package's required CLI version
  4. copy files (never symlinks)     →  merge settings via the manifest engine
  5. write receipt.json              →  clean uninstall + user-file protection
```

- **Curated registry.** The Atomic CLI ships an embedded list mapping each agent to the public Atomic storage project that hosts its package. The packages are ordinary Atomic repositories — Atomic dogfoods its own sync protocol to pull them.
- **First run clones, later runs reuse the cache.** After the first `enable`, the package is cached under `~/.atomic/integrations/<agent>/repo`, so re-running works offline. `--force` refreshes the cache.
- **Version gate.** Each package declares the CLI version it needs (`requires.atomic`). If your CLI is too old, `enable` stops with a clear message instead of installing something incompatible.
- **User-file protection.** The receipt records every file Atomic installed (by hash). On reinstall, a destination you modified — or one Atomic did not install — is skipped unless you pass `--force`. On `disable`, only files that still match the receipt are removed; anything you edited is kept.
- **Nothing is executed.** Files are copied and JSON settings are merged with Atomic's manifest engine. This is Windows-safe and needs no `git`, `bash`, `node`, or `bun` at install time.

## Integration Matrix

Every integration installs the same way — `atomic agent enable --agent <name>`. The source column links to the package's GitHub mirror (the canonical copy lives on Atomic storage).

| Integration | Agent | Enable | Source |
|-------------|-------|--------|--------|
| `atomic-agy` | Antigravity CLI (`agy`) | `atomic agent enable --agent agy` | https://github.com/atomicdotdev/atomic-agy |
| `atomic-claude` | Claude Code | `atomic agent enable --agent claude-code` | https://github.com/atomicdotdev/atomic-claude |
| `atomic-cline` | Cline | `atomic agent enable --agent cline` | https://github.com/atomicdotdev/atomic-cline |
| `atomic-codex` | Codex | `atomic agent enable --agent codex` | https://github.com/atomicdotdev/atomic-codex |
| `atomic-copilot` | GitHub Copilot | `atomic agent enable --agent copilot` | https://github.com/atomicdotdev/atomic-copilot |
| `atomic-cursor` | Cursor | `atomic agent enable --agent cursor` | https://github.com/atomicdotdev/atomic-cursor |
| `atomic-devin` | Devin | `atomic agent enable --agent devin` | https://github.com/atomicdotdev/atomic-devin |
| `atomic-grok` | Grok Build | `atomic agent enable --agent grok` | https://github.com/atomicdotdev/atomic-grok |
| `atomic-kilo` | Kilo Code | `atomic agent enable --agent kilo` | https://github.com/atomicdotdev/atomic-kilo |
| `atomic-kiro` | Kiro | `atomic agent enable --agent kiro` | https://github.com/atomicdotdev/atomic-kiro |
| `atomic-opencode` | OpenCode | `atomic agent enable --agent opencode` | https://github.com/atomicdotdev/atomic-opencode |
| `atomic-pi` | Pi | `atomic agent enable --agent pi` | https://github.com/atomicdotdev/atomic-pi |

## Per-Agent Notes

The install command is identical for every agent. The notes below cover only the agent-specific behavior worth knowing.

### Antigravity CLI

```bash
atomic agent enable --agent agy
agy
```

Installs the Atomic plugin (hooks plus the `atomic-vault`, `atomic-vcs`, and `code-intelligence` skills) via agy's plugin mechanism, and writes the standard instruction content into the project's `AGENTS.md` as a managed section (refreshed on rerun, removed by `disable`). agy fires hooks on `PreInvocation`, `Stop`, and `PostToolUse`; turns record when the agent goes idle. agy hook payloads do not include the user prompt, model name, or token usage, so attestations start sparse and can be enriched from the transcript later.

### Claude Code

```bash
atomic agent enable --agent claude-code
claude
```

In a repo that already has a `.claude/` directory, plain `atomic agent enable` auto-detects Claude Code, so the `--agent` flag is optional. The integration installs Atomic's hooks and skills; `atomic agent explain --save` appends learnings to `CLAUDE.md`.

### Codex

```bash
atomic agent enable --agent codex
codex
```

Codex hook support is currently experimental, so shell-command provenance may be richer than edit-tool provenance until Codex publishes complete hook events.

### Cline

```bash
atomic agent enable --agent cline
```

After installing, open Cline's **Hooks** tab in VS Code and enable the Atomic hooks — this is an IDE action Atomic cannot perform for you. Cline records at task boundaries: one task creates one draft view, and task completion records the task's changes with provenance.

### GitHub Copilot

```bash
atomic agent enable --agent copilot
```

For the Copilot **cloud** agent, the hook manifest must be present on the repository's default branch before the cloud agent starts. Record and push the installed files using your normal repository workflow. Copilot currently records one change per session because its hook lifecycle does not expose a turn-level stop event.

### Cursor

```bash
atomic agent enable --agent cursor
# then open the project in Cursor
```

Cursor hooks call into Atomic on session lifecycle events, tool usage, and reasoning blocks. The installed rule file tells Cursor to follow the Atomic intent workflow inside the project.

### Devin

```bash
atomic agent enable --agent devin
```

Installs Devin's instruction and hook wiring so sessions record with provenance.

### Grok Build

```bash
atomic agent enable --agent grok
grok
```

Installs global hooks under `~/.grok/hooks/`, home rules at `~/.grok/rules/atomic.md`, and the three core skills into `~/.grok/skills/`. Global hooks are always trusted by Grok, so no project `/hooks-trust` step is required. Grok fires SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, and SessionEnd — the full six-event lifecycle. Requires Atomic CLI **>= 0.12.0**.

### Kilo Code

```bash
atomic agent enable --agent kilo
```

Installs Kilo's rules and agent files. Kilo Code reads its configuration from the project's `.kilo/` directory.

### Kiro

```bash
atomic agent enable --agent kiro
```

Installs the Kiro integration (skills, steering, and hook scripts). Then configure hooks in the Kiro IDE, under **Agent Steering & Skills** — the hook wiring itself is done from the IDE panel.

### OpenCode

```bash
atomic agent enable --agent opencode
opencode
```

Installs the OpenCode plugin, the Atomic agent prompt, and skills, and registers the plugin in your OpenCode config without clobbering existing settings. In OpenCode, switch to the Atomic agent. OpenCode records on session idle / turn end.

### Pi

```bash
atomic agent enable --agent pi
pi
```

Registers the Atomic extension, an Atomic agent prompt, and skills. The Atomic agent activates in Atomic repositories and follows the intent-per-turn workflow.

## Installing from a Local Checkout

For developing an integration package, or for air-gapped installs, point `enable` at a local package directory with `--from`. This installs exactly what the storage path would, per the package's `atomic-integration.toml`, with no network access:

```bash
# Working on a local clone of atomic-opencode
atomic agent enable --agent opencode --from /path/to/atomic-opencode
```

`--from` replaces the old `./install.sh` development loop.

## Verify the Integration

After the agent makes changes, use Atomic to inspect what happened:

```bash
atomic agent status --verbose
atomic log
atomic agent attest
```

For a specific change, including its inline AI metadata and Change Ledger:

```bash
atomic change <hash>
```

The default output shows the file and graph summary, provider/model/tool attribution, available tokens and cost, session metadata, and the observed goals, tool activity, edits, decisions, and verification associated with the change. Use `atomic provenance trace <hash>` only when you need a separate standards-oriented provenance projection. Use `atomic agent attest` for separate session-level attestations that can cover multiple changes.

## What Gets Introduced into the Project

Atomic integrations generally introduce two kinds of files:

| File type | Scope | Purpose |
|-----------|-------|---------|
| Hooks, plugins, or extensions | User-level agent config (except Copilot cloud hooks, which live in the repo) | Invoke `atomic agent hooks <agent> <verb>` on agent lifecycle events |
| Instructions, rules, or prompts | Where the agent discovers guidance (project root, agent config, or a managed `AGENTS.md` section) | Tell the agent to create intents, define success criteria, use Atomic code intelligence, and avoid manual recording |

Everything Atomic installs is listed in the receipt at `~/.atomic/integrations/<agent>/receipt.json`. The actual provenance artifacts live in `.atomic/` after the agent works — they are content-addressed records created by Atomic, not static setup files.

## Removing an Integration

`disable` removes what `enable` installed, guided by the receipt. Files you modified after install are kept and reported; hook commands are stripped from shared settings files while your own hooks are preserved.

```bash
atomic agent disable --agent opencode

# Remove every integration that has a receipt
atomic agent disable --all
```

| Integration | Uninstall |
|-------------|-----------|
| `atomic-agy` | `atomic agent disable --agent agy` |
| `atomic-claude` | `atomic agent disable --agent claude-code` |
| `atomic-cline` | `atomic agent disable --agent cline`, then disable the hooks in Cline's VS Code Hooks tab |
| `atomic-codex` | `atomic agent disable --agent codex` |
| `atomic-copilot` | `atomic agent disable --agent copilot`, then remove the repo-local files from your default branch if they were added only for Copilot |
| `atomic-cursor` | `atomic agent disable --agent cursor` |
| `atomic-devin` | `atomic agent disable --agent devin` |
| `atomic-grok` | `atomic agent disable --agent grok` |
| `atomic-kilo` | `atomic agent disable --agent kilo` |
| `atomic-kiro` | `atomic agent disable --agent kiro`, then remove hooks from the Kiro IDE panel |
| `atomic-opencode` | `atomic agent disable --agent opencode` |
| `atomic-pi` | `atomic agent disable --agent pi` |

Removing hooks stops future automatic recording. Existing Atomic changes, provenance graphs, and attestations remain in the repository history.

## See Also

- [Querying the Graph](/getting-started/querying-the-graph) — Learn the `atomic vault query` commands that the code-intelligence skill teaches agents to use
- [Agent Integration Overview](overview.md)
- [Provenance Graphs](provenance.md)
- [Attestations](attestations.md)
- [`atomic agent` command reference](/commands/agent)
