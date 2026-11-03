---
sidebar_position: 21
title: git
---

# atomic git

Git interoperability commands.

## Synopsis

```bash
atomic git <SUBCOMMAND>
atomic git import [--dry-run] [-b <BRANCH>] [--all] [--incremental] [-k <KIND>] [--no-vault] [--with-crdt] [--stream | --no-stream] [--stream-window-mib <MIB>] [--agent-mode]
atomic git push [-m <MESSAGE>] [--no-push] [--remote <REMOTE>] [-b <BRANCH>] [--allow-conflict-markers]
atomic git hooks <SUBCOMMAND>
atomic git shim <SUBCOMMAND>
```

## Description

`atomic git` bridges Atomic and Git repositories in two directions:

- **`git import`** — bring an existing Git repository **into** Atomic: each Git commit becomes an Atomic change, preserving history. Run it inside a Git checkout to create the Atomic repository alongside.
- **`git push`** — push Atomic's state **out** to Git as a regular commit, enabling **Git shadow sync**: your Atomic work appears on the Git remote (e.g. GitHub) without Git ever being the system of record.
- **`git hooks`** — manage the advisory shim `post-checkout` dispatcher: the Git-side entry point that notices checkouts so the shim can reconcile.
- **`git shim`** — the colocated Git shim (Atomic 0.20.0+): reconcile, verify, switch, publish, and bind Git HEAD ↔ Atomic view state. See [git shim](git-shim.md).

## Subcommands

### `git import` — Import a Git Repository

#### Synopsis

```bash
atomic git import [OPTIONS]
```

Run inside a Git checkout. Each commit on the imported branch becomes an Atomic change on a view.

A **fresh** repository imports through the rolling stream by default: first-parent history as graph-only changes, with a live dashboard when stdout is a terminal. It verifies the final Git tree rather than every historical state and does not synthesize historical CRDT identities. `--no-stream` selects the ordinary importer — the path with full semantic lifecycle support, and the one `--with-crdt`, `--incremental`, `--all`, and imports into an existing Atomic repository already take.

#### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview what would be imported without creating an Atomic repository |
| `-b, --branch <BRANCH>` | Import a specific branch instead of the default branch |
| `--all` (alias `--all-branches`) | Import all local branches as separate views |
| `--incremental` | Only import commits not already in Atomic |
| `-k, --kind <KIND>` | Project kind for the `.atomicignore` template |
| `--no-vault` | Skip vault initialization |
| `--with-crdt` | Eagerly build the semantic (Trunk → Branch → Leaf) layer during import; selects the ordinary importer |
| `--stream` | Force the rolling first-parent graph stream. Conflicts with `--no-stream`, `--with-crdt`, `--incremental`, and `--all` |
| `--no-stream` | Use the ordinary importer instead of the default rolling stream. Conflicts with `--stream` |
| `--stream-window-mib <MIB>` | MiB budget for queued Git blob reservations and prepared stream batches (default 32, range 1–256). Not a total process-memory limit. Requires a streaming import |
| `--agent-mode` | A special mode for agents doing the importing |

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

# Force the ordinary importer on a fresh repository
atomic git import --no-stream

# Raise the stream's memory window for a blob-heavy history
atomic git import --stream-window-mib 128
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
| `--allow-conflicts` | Explicitly allow exporting a view with unresolved Atomic conflicts to a remote (RFC §8.3, CB-8B). **Refused by default for every remote export.** The flag does NOT bypass any other gate: the complete conflict-object pack must already be published and verify against the current conflict set, and signing, trust, lease, and publication policy all still apply. Never passed by automation |
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

### `git hooks` — Manage the Advisory Shim Dispatcher

#### Synopsis

```bash
atomic git hooks <SUBCOMMAND>
```

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `install` | Enable the advisory shim `post-checkout` dispatcher |
| `uninstall` | Remove an Atomic-owned shim dispatcher |
| `status` | Show advisory shim hook status |

```bash
atomic git hooks install
atomic git hooks status
atomic git hooks uninstall
```

The dispatcher is advisory: it notices Git checkout events so the shim can reconcile on demand; it does not silently rewrite either side. See [git shim](git-shim.md) for the reconciliation commands it feeds.

## See Also

- [git shim](git-shim.md) — colocated shim: reconcile, verify, publish, bindings
- [op](op.md) — the immutable operation journal shim metadata is recorded into
- [pull](pull.md) / [push](push.md) — Atomic-native remote sync
- [clone](clone.md) — Clone a remote Atomic repository
- [Git Shim guide](/getting-started/git-shim) — Verified Git interop walkthrough
- [migrating-from-git guide](/getting-started/migrating-from-git) — Import walkthrough
