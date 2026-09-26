---
sidebar_position: 21
title: git
---

# atomic git

Git interoperability commands.

## Synopsis

```bash
atomic git <SUBCOMMAND>
atomic git import [--dry-run] [-b <BRANCH>] [--all] [--incremental] [-k <KIND>] [--no-vault] [--with-crdt]
atomic git push [-m <MESSAGE>] [--no-push] [--remote <REMOTE>] [-b <BRANCH>] [--allow-conflict-markers]
atomic git hooks <SUBCOMMAND>
```

## Description

`atomic git` bridges Atomic and Git repositories in two directions:

- **`git import`** — bring an existing Git repository **into** Atomic: each Git commit becomes an Atomic change, preserving history. Run it inside a Git checkout to create the Atomic repository alongside.
- **`git push`** — push Atomic's state **out** to Git as a regular commit, enabling **Git shadow sync**: your Atomic work appears on the Git remote (e.g. GitHub) without Git ever being the system of record.
- **`git hooks`** — install or remove Git hooks that keep the two in sync automatically.

## Subcommands

### `git import` — Import a Git Repository

#### Synopsis

```bash
atomic git import [OPTIONS]
```

Run inside a Git checkout. Each commit on the imported branch becomes an Atomic change on a view.

#### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview what would be imported without creating an Atomic repository |
| `-b, --branch <BRANCH>` | Import a specific branch instead of the default branch |
| `--all` (alias `--all-branches`) | Import all local branches as separate views |
| `--incremental` | Only import commits not already in Atomic |
| `-k, --kind <KIND>` | Project kind for the `.atomicignore` template |
| `--no-vault` | Skip vault initialization |
| `--with-crdt` | Eagerly build the semantic (Trunk → Branch → Leaf) layer during import |

#### Examples

```bash
# Preview the import first
atomic git import --dry-run

# Import the default branch (creates Atomic repo + vault)
atomic git import

# Import everything, each branch becoming a view
atomic git import --all

# Re-run later to pick up new commits
atomic git import --incremental
```

### `git push` — Push Atomic State to Git

#### Synopsis

```bash
atomic git push [OPTIONS]
```

Synthesizes a Git commit from the current Atomic view's state (message synthesized from change messages unless `-m` is given), commits it on the current branch, and pushes to the remote.

#### Options

| Option | Description |
|--------|-------------|
| `-m, --message <MESSAGE>` | Custom commit message. If not provided, synthesizes from Atomic change messages |
| `--no-push` | Don't push to remote after committing |
| `--remote <REMOTE>` | Remote name to push to (default: `origin`) |
| `-b, --branch <BRANCH>` | Target branch to push to on the remote. Defaults to the current branch. The commit is still created on the current branch; this only changes the remote destination (useful for pushing the current view's state to a PR branch) |
| `--allow-conflict-markers` | Commit even if the working copy still contains unresolved conflict markers. Off by default, mirroring `atomic record`; the shadow-sync turn-end hook must never pass this |

#### Examples

```bash
# Commit + push the current view's state to origin
atomic git push

# Push the current view's state to a PR branch
atomic git push -b feature/token-refresh

# Commit locally only
atomic git push --no-push -m "sync checkpoint"
```

### `git hooks` — Manage Sync Hooks

#### Synopsis

```bash
atomic git hooks <SUBCOMMAND>
```

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `install` | Install Git hooks for automatic sync |
| `uninstall` | Remove Atomic's Git hooks |
| `status` | Show the current hook status |

```bash
atomic git hooks install
atomic git hooks status
atomic git hooks uninstall
```

## See Also

- [pull](pull.md) / [push](push.md) — Atomic-native remote sync
- [clone](clone.md) — Clone a remote Atomic repository
- [Git Shadow Sync guide](/getting-started/git-shadow-sync) — Full shadow-sync walkthrough
- [migrating-from-git guide](/getting-started/migrating-from-git) — Import walkthrough
