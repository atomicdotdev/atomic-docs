---
sidebar_position: 5
title: Git Import and Push
---

# Git Import and Push

`atomic git import` and `atomic git push` are the manual Git interoperability commands: they pull Git history into Atomic and push Atomic state out to Git, on your schedule, with no ongoing background integration. Use them for one-time migrations, occasional syncing, or as building blocks in scripts.

Looking for the always-verified, colocated workflow with hooks, signed bindings, and a watcher? See the [Git Shim](./git-shim).

## `atomic git import`

Converts Git commit history into Atomic changes, preserving:

- Author name and email
- Commit message (subject and body)
- Commit timestamp
- File additions, modifications, deletions, and renames
- The Git commit SHA (stored in change metadata)

A first import into a **fresh** repository runs the [rolling stream](#the-rolling-stream-default-for-fresh-imports); every other import uses the ordinary importer.

```bash
cd /path/to/your/git/repo

# Import the currently checked-out branch's mainline history
atomic git import

# Or a specific branch
atomic git import --branch main

# Or every local branch, each as its own view
atomic git import --all

# Preview without creating anything
atomic git import --dry-run
```

After import, your repo has both `.git/` and `.atomic/` — it's dual-tracked. The working copy is shared; both systems see the same files on disk.

### Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what would be imported; creates no files |
| `-b, --branch <branch>` | Import a specific branch instead of the checked-out one |
| `--all` | Import all local branches as separate views |
| `--incremental` | Only import commits not already in Atomic (SHA-indexed) |
| `-k, --kind <kind>` | Project kind for the `.atomicignore` template (auto-detected if omitted) |
| `--no-vault` | Skip `.vault/` initialization (skills, prompts, memory) |
| `--with-crdt` | Eagerly build the semantic (line/token) layer for imported history instead of deriving it on demand; selects the ordinary importer |
| `--stream` | Force the rolling first-parent graph stream. Conflicts with `--no-stream`, `--with-crdt`, `--incremental`, and `--all` |
| `--no-stream` | Use the ordinary importer instead of the default rolling stream |
| `--stream-window-mib <mib>` | MiB budget for queued Git blob reservations and prepared stream batches (default 32, range 1–256). Not a total process-memory limit; requires a streaming import |
| `--agent-mode` | A special mode for agents doing the importing |

### The rolling stream (default for fresh imports)

The first import into a repository that has no `.atomic/` yet runs the **rolling stream**. It walks first-parent history and writes graph-only changes — no historical CRDT FileOps — while a live dashboard shows progress, staging throughput and ETA, CPU and memory history, and the rolling window. The ETA excludes final verification.

Two consequences to know before you rely on it:

- **No historical CRDT identities.** Git stores no token-level data, so the stream does not synthesize the semantic layer for imported history, and it verifies the final Git tree rather than every historical state. Unsupported history is refused rather than silently falling back. Reach for the ordinary importer when you need its semantic lifecycle support.
- **First-parent only.** Inner commits from merged PRs are not in the streamed history; `--all` brings every local branch in as a view.

Read-ahead is capped at 500 commits, and publication batches at 100 commits or the byte budget, whichever comes first. `--stream-window-mib` raises the 32 MiB default (1–256 MiB) on queued Git blob reservations and prepared batches — it is not a limit on total process memory.

Explicit `--stream` keeps that strict fresh-import route and refuses anything else; `--no-stream` forces the ordinary importer. A repository carrying Atomic binding refs selects the ordinary importer up front, and the stream is Unix-only — on other platforms a fresh import refuses and you want `--no-stream`.

### Verify the import

```bash
# Check Atomic history
atomic log -n 10

# List views (one per imported branch)
atomic view list

# Confirm Git is still intact
git log --oneline -5
```

### What import refuses

`atomic git import` never writes over work Git has not recorded. Importing a branch that is not checked out (a detached HEAD, or `-b <other>`) materializes that branch into the worktree, so it refuses when there are tracked edits or untracked files the branch tree would overwrite; commit, stash or move them first, or check the branch out.

### File names

Git tree names are opaque bytes, and both importers carry them through a reversible `%XX` encoding that decodes back to the exact original bytes. Spaces, Unicode (NFC and NFD spellings), case variants, raw non-UTF-8 bytes, control characters, backslashes and literal percent-escape lookalikes all import, and `atomic status` is clean straight afterward. Case and normalization collisions are surfaced explicitly rather than silently folded.

Names are tracked under their on-disk spelling; a name containing a literal `%` keeps its escaped identity, so `a%41.txt`, `aA.txt` and `a%2541.txt` stay three distinct files. Regular files, executables, symlinks and gitlinks (submodule entries) are supported — a submodule's own history is not imported.

### Incremental imports

After new commits land in Git, `--incremental` brings Atomic up to date:

```bash
atomic git import --incremental
```

`--incremental` always uses the ordinary importer — the rolling stream is a fresh-import route only. It compares Git SHAs against the `GIT_SHA_INDEX` (an index inside `.atomic/atomic.redb`) and skips commits that were already imported, so it's O(1) per commit and idempotent — running it twice is harmless. The index is backfilled automatically on first use for repositories imported before it existed. You never interact with it directly.

## `atomic git push`

Materializes your current view's Atomic state into a Git commit and pushes it.

**What it does:**

1. Materializes the current view's working copy
2. Stages all adds, modifications, and deletions
3. Creates a commit with Atomic provenance trailers in the message
4. Pushes to the Git remote

**Example commit message:**

```
feat: OAuth2 authentication

Atomic-Changes: ABC123 DEF456 GHI789
Atomic-View: dev
Atomic-State: 7f3a9b2e...
```

The trailers link the Git commit back to the specific Atomic changes, view, and Merkle state that produced it — which also makes squash-merge detection exact on the way back in.

### Flags

| Flag | Description |
|------|-------------|
| `-m, --message <msg>` | Set the Git commit message |
| `--no-push` | Create the commit but don't push to the remote |
| `--remote <name>` | Which Git remote to push to (default: `origin`) |
| `-b, --branch <branch>` | Push to a specific branch |
| `--allow-conflict-markers` | Permit materializing files that contain conflict markers |
| `--allow-conflicts` | Permit publishing a view with unresolved conflicts |

### Examples

```bash
# Push with a custom message
atomic git push -m "feat: add user dashboard"

# Create a commit without pushing (for inspection)
atomic git push --no-push
git log -1  # inspect the commit

# Push to a specific remote and branch
atomic git push --remote upstream --branch pr-42
```

## Squash merge detection

When a PR is squash-merged on GitHub/GitLab, the original commits are collapsed into one. `atomic git import --incremental` handles this automatically:

1. **Imports** the squash commit as a regular Atomic change
2. **Detects** the squash by parsing the commit message for forge-specific patterns or `Atomic-Changes` trailers
3. **Creates a ReviewGate tag** linking the squash commit back to the original Atomic changes

### Supported forge formats

| Forge | Commit message pattern | Example |
|-------|----------------------|---------|
| GitHub | `title (#42)\n\n* commit 1\n* commit 2` | `feat: auth (#42)` |
| GitLab | `title\n\nSee merge request group/project!55` | `See merge request acme/api!55` |
| Azure DevOps | `Merged PR 42: title` | `Merged PR 42: feat: auth` |
| Bitbucket | `Merged in branch (pull request #42)` | `Merged in feature-auth (pull request #42)` |

:::tip
If your commit message includes `Atomic-Changes` trailers (from `atomic git push`), detection is exact — no pattern matching needed.
:::

## ReviewGate tags

A ReviewGate is a semantic tag that records "this set of changes was reviewed and approved." It's created automatically when a squash merge is detected during import.

### What they contain

```json
{
  "type": "review-gate",
  "changes": ["ABC123", "DEF456", "GHI789"],
  "git": {
    "sha": "abc123def456...",
    "merge_strategy": "squash",
    "pr_number": 42
  }
}
```

### Viewing ReviewGate tags

```bash
# List all tags including ReviewGates
atomic tag list

# Show details for a specific ReviewGate
atomic tag show pr-42
```

ReviewGates serve as audit checkpoints — you can trace any Atomic change back to the PR where it was reviewed, and from any PR back to the original fine-grained changes that composed it.

ReviewGate tags and other Atomic tags sync with your Atomic remote:

```bash
atomic push   # uploads tags as content-addressed blobs
atomic pull   # downloads tags listed for the remote view
```

Tags are content-addressed, so duplicates are automatically deduplicated.

## The DEV update problem (solved)

In pure Git, squash merges create a well-known pain point:

```
# Git: after squash-merging feature into main...
git checkout dev
git merge main
# CONFLICT! The squash commit and dev's history diverged permanently.
# dev has the original commits; main has the squash. They'll never reconcile.
```

Long-lived branches like `dev` accumulate permanent divergence from `main` after every squash merge. Teams resort to periodic "reset dev from main" operations that destroy in-flight work.

**This problem doesn't exist in Atomic.** Both views share the same underlying change objects in the graph. The squash commit is imported as a new change, but the original changes are still present and visible through their views. There's no divergence because views are filters on a single canonical graph, not independent histories.

```bash
# Atomic: after squash merge is imported
atomic view switch dev
atomic status
# Clean. The original changes are already here.
# The imported squash commit is linked via ReviewGate.
```

## `atomic git hooks`

The hooks subcommands manage the Atomic-owned advisory Git hook dispatchers — the same integration `atomic git shim enable` installs:

```bash
atomic git hooks install     # install/refresh the advisory dispatchers
atomic git hooks status      # show which hooks are installed and owned
atomic git hooks uninstall   # remove every Atomic-owned dispatcher (foreign hooks are kept)
```

What the dispatchers do has changed from earlier releases: they no longer run `atomic git import --incremental` automatically. They now journal advisory evidence for the Git shim (checkout, commit-time captures, rewrites, ref movements) and perform local advisory verification — they never block a Git operation and never change your history. See [the shim documentation](./git-shim#hooks-are-advisory) for the full list and semantics.

Atomic only writes a hook file when it is missing or already an exact Atomic-owned dispatcher; foreign hooks and custom `core.hooksPath` setups are reported and left untouched. Legacy import-sync hooks from earlier releases are migrated automatically when the integration is installed.

:::note
`atomic git hooks uninstall` removes every Atomic-owned dispatcher (post-checkout, pre-commit, pre-push, post-rewrite, reference-transaction) and any Atomic-only legacy import hook, reporting each one removed or kept. `atomic git shim disable` runs the same removal after recording the opt-out, so disabling the shim is the full inverse of enabling it.
:::

## Troubleshooting

### "Incremental import finds nothing new"

This is correct behavior — it means all Git commits are already imported. The `GIT_SHA_INDEX` confirmed every SHA is present. No action needed.

### "Squash merge not detected"

The commit message doesn't match any known forge format, and no `Atomic-Changes` trailer was found. The commit is still imported as a regular Atomic change — it just won't get a ReviewGate tag.

**Fix:** Use `atomic git push` to create your Git commits. It adds `Atomic-Changes` trailers automatically, which makes detection exact.

### "Force-push on a branch"

Existing Atomic changes are preserved — nothing is lost. Force-pushes only affect Git's ref pointers. On the next `atomic git import --incremental`, the new commits at the force-pushed ref are imported fresh. Old commits that were replaced in Git still exist as Atomic changes.

### "Git and Atomic are out of sync"

If you've enabled the shim, prefer `atomic git shim reconcile` — it also verifies both sides and records a checkpoint:

```bash
atomic git shim status    # see which view diverged and how
atomic git shim reconcile
atomic git shim verify
```

Without the shim:

```bash
atomic git import --incremental

git log --oneline -10
atomic log -n 10
```

:::warning
Never delete `.atomic/` and re-import as a "fix." This destroys all Atomic-native changes, ReviewGate tags, and view structure that don't exist in Git. Run `atomic git import --incremental` instead.
:::

## Next Steps

- [Git Shim](./git-shim) — the verified, colocated workflow
- [Migrating from Git](./migrating-from-git.md) — full migration guide if you want to go Atomic-only
- [AI Agent Workflows](./ai-agent-workflows.md) — using agents with Atomic's provenance tracking
