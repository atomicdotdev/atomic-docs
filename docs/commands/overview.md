---
sidebar_position: 1
title: Commands Overview
---

# Command Reference

Atomic provides a focused set of commands for managing repositories, recording changes, collaborating with remotes, and integrating with AI coding agents.

Every command listed here corresponds to a real subcommand in the `atomic` CLI binary. Run `atomic <command> --help` for full usage details.

## Quick Reference

| Command | Description |
|---------|-------------|
| [`init`](init.md) | Initialize a new Atomic repository |
| [`status`](status.md) | Show working copy status |
| [`add`](add.md) | Add files to be tracked |
| [`remove`](remove.md) | Remove files from tracking |
| [`move`](move.md) | Move or rename tracked files |
| [`record`](record.md) | Record changes from the working copy |
| [`revise`](revise.md) | Revise a change in-place |
| [`diff`](diff.md) | Show differences in the working copy |
| [`log`](log.md) | Show change history |
| [`change`](change.md) | Inspect a specific change |
| [`apply`](apply.md) | Apply changes to a stack |
| [`reset`](reset.md) | Reset working copy to last recorded state |
| [`split`](split.md) | Create a new stack from an existing one |
| [`stack`](stack.md) | Manage stacks (new, switch, list, delete) |
| [`stash`](stash.md) | Temporarily save uncommitted changes |
| [`tag`](tag.md) | Manage tags (create, list, show, delete) |
| [`push`](push.md) | Push changes to a remote |
| [`pull`](pull.md) | Pull changes from a remote |
| [`clone`](clone.md) | Clone a remote repository |
| [`remote`](remote.md) | Manage named remote repositories |
| [`identity`](identity.md) | Manage user identities and signing keys |
| [`agent`](agent.md) | Manage AI agent integration |

## Command Categories

### Working with Changes

The core workflow — track files, record changes, review diffs:

```bash
atomic add src/main.rs           # Track a file
atomic status                     # See what changed
atomic diff                       # Review the diff
atomic record -m "Add main"       # Record a change
atomic log                        # View history
```

- **[`add`](add.md)** — Add files to be tracked
- **[`remove`](remove.md)** / `rm` — Remove files from tracking
- **[`move`](move.md)** / `mv` — Move or rename tracked files
- **[`status`](status.md)** — Show modified, added, deleted, and untracked files
- **[`diff`](diff.md)** — Show differences between working copy and last recorded state
- **[`record`](record.md)** — Create a new change from tracked file modifications
- **[`revise`](revise.md)** — Modify a previously recorded change in-place
- **[`log`](log.md)** — Display the history of changes on the current stack
- **[`change`](change.md)** — Inspect details of a specific change by hash or sequence number

### Repository Management

Create, clone, and reset repositories:

```bash
atomic init myproject             # Create a new repo
atomic clone https://...          # Clone from remote
atomic reset --force              # Discard uncommitted changes
```

- **[`init`](init.md)** — Initialize a new Atomic repository
- **[`clone`](clone.md)** — Clone an existing repository from a remote
- **[`reset`](reset.md)** — Reset the working copy to the last recorded state
- **[`split`](split.md)** — Create a new stack from an existing one

### Stacks

Stacks are Atomic's equivalent of branches — but they're views of the same graph, not forks:

```bash
atomic stack new feature-auth     # Create a stack
atomic stack switch feature-auth  # Switch to it
atomic stack list                 # List all stacks
atomic stack delete old-feature   # Delete a stack
```

- **[`stack`](stack.md)** — Create, switch, list, and delete stacks
- **[`stash`](stash.md)** — Temporarily save uncommitted changes to an orphan stack

### Remote Operations

Synchronize with remote repositories:

```bash
atomic remote add origin https://api.atomic.dev/acme/project/code
atomic push                       # Push changes to default remote
atomic pull                       # Pull changes from default remote
```

- **[`push`](push.md)** — Upload local changes to a remote
- **[`pull`](pull.md)** — Download and apply changes from a remote
- **[`clone`](clone.md)** — Create a new local repository from a remote
- **[`remote`](remote.md)** — Add, remove, list, and configure named remotes

### Tags

Named state snapshots for marking releases and sync points:

```bash
atomic tag create v1.0.0 -m "Release 1.0"
atomic tag list
atomic tag show v1.0.0
```

- **[`tag`](tag.md)** — Create, list, show, and delete tags

### Identity

Manage user identities for signing changes:

```bash
atomic identity new alice --email alice@example.com
atomic identity list
atomic identity whoami
```

- **[`identity`](identity.md)** — Create, list, show, and delete identities

### AI Agent Integration

Turn-level recording for AI coding agents with full provenance:

```bash
atomic agent enable --agent claude-code
atomic agent status --verbose
atomic agent explain <session-id> --all --save
```

- **[`agent`](agent.md)** — Enable, disable, and manage AI agent hooks for Claude Code, Gemini CLI, and OpenCode

## Global Options

These flags are available on every command:

| Flag | Description |
|------|-------------|
| `-v`, `--verbose` | Enable verbose output for debugging |
| `--no-color` | Disable colored output (useful for piping) |
| `--version` | Print version information |
| `--help` | Display help for a command |

## Basic Workflow

```bash
# 1. Initialize
atomic init myproject
cd myproject

# 2. Create and track files
echo 'fn main() {}' > src/main.rs
atomic add src/main.rs

# 3. Record
atomic record -m "Initial commit"

# 4. Create a stack for a feature
atomic stack new feature-auth --switch

# 5. Make changes, record, review
atomic status
atomic diff
atomic record -m "Add authentication module"

# 6. Push to remote
atomic remote add origin https://api.atomic.dev/acme/project/code
atomic push
```

## AI-Assisted Workflow

```bash
# 1. Enable agent hooks
atomic agent enable --agent claude-code

# 2. Work with your AI agent — turns are recorded automatically

# 3. Review what happened
atomic log
atomic agent status --verbose

# 4. Generate reasoning summaries
atomic agent explain <session-id> --all --save

# 5. Push everything (changes + provenance + session data)
atomic push
```

## Getting Help

```bash
# Top-level help
atomic --help

# Help for a specific command
atomic record --help
atomic stack --help
atomic agent enable --help
```
