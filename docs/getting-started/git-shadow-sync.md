---
sidebar_position: 4
title: Git Shadow Sync
---

# Git Shadow Sync

Git Shadow Sync lets you use Atomic as your primary VCS while keeping Git and GitHub/GitLab as your code review platform and backup. The two systems stay in sync through two commands:

- **`atomic git import --incremental`** — pulls new Git commits into Atomic
- **`atomic git push`** — pushes Atomic changes out to Git

You get Atomic's patch theory, AI provenance, and conflict-free views for daily development, while your team continues reviewing PRs on GitHub or GitLab exactly as before.

## Initial Setup

### From an existing Git repo

```bash
cd /path/to/your/git/repo

# Import the current branch
atomic git import

# Or import a specific branch
atomic git import --branch main

# Or import all branches
atomic git import --all
```

After import, your repo has both `.git/` and `.atomic/` — it's dual-tracked. The working copy is shared; both systems see the same files on disk.

:::info
`atomic git import` converts each Git commit into an Atomic change, preserving author, timestamp, and message. Branch names become Atomic views.
:::

### Verify the import

```bash
# Check Atomic history
atomic log --limit 10

# List views (one per imported branch)
atomic view list

# Confirm Git is still intact
git log --oneline -5
```

## The Development Workflow

Here's a typical week using Git Shadow Sync. Atomic handles your local development; Git handles code review.

### Day 1–2: Build the feature

```bash
# Create a draft view for your work
atomic view create feature-auth --draft --parent dev

# Write code, record changes in Atomic
atomic add src/auth.rs
atomic record -m "feat: add OAuth2 provider"

# More work...
atomic record -m "feat: add token refresh logic"
atomic record -m "test: add auth integration tests"
```

### Day 3: Push to Git for review

```bash
# Insert your changes into the dev view
atomic view switch dev
atomic insert from-view feature-auth

# Push to Git and open a PR
atomic git push -m "feat: OAuth2 authentication"
```

This creates a single Git commit on your current branch with all the Atomic changes materialized, then pushes to the remote. Open a PR on GitHub/GitLab as usual.

### Day 4: After the PR merges

```bash
# Pull the squash-merged commit back into Atomic
atomic git import --incremental

# The squash commit is imported and linked to your original changes
# via a ReviewGate tag (see below)
```

### The full cycle

```
┌─────────────────────────────────────────────────────────┐
│                    Atomic (primary)                      │
│                                                         │
│  feature-auth ──insert──▶ dev ──import──▶ dev           │
│  (3 changes)              │               (squash       │
│                           │                + ReviewGate)│
│                           ▼                             │
│                      atomic git push                    │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────┐
│                    Git / GitHub                          │
│                           ▼                             │
│                   PR #42 (review)                       │
│                           │                             │
│                     squash merge                        │
│                           │                             │
│                    atomic git import                    │
│                      --incremental                     │
└─────────────────────────────────────────────────────────┘
```

## `atomic git push`

This command materializes your Atomic state into a Git commit and pushes it.

**What it does:**

1. Materializes the current view's working copy
2. Runs `git add -A` (stages all adds, modifications, and deletions)
3. Creates a commit with Atomic trailers in the message
4. Pushes to the Git remote

**Example commit message:**

```
feat: OAuth2 authentication

Atomic-Changes: ABC123 DEF456 GHI789
Atomic-View: dev
Atomic-State: 7f3a9b2e...
```

The trailers link the Git commit back to the specific Atomic changes, view, and Merkle state that produced it.

### Flags

| Flag | Description |
|------|-------------|
| `-m "message"` | Set the Git commit message |
| `--no-push` | Create the commit but don't push to the remote |
| `--remote origin` | Specify which Git remote to push to (default: `origin`) |

### Examples

```bash
# Push with a custom message
atomic git push -m "feat: add user dashboard"

# Create a commit without pushing (for inspection)
atomic git push --no-push
git log -1  # inspect the commit

# Push to a specific remote
atomic git push --remote upstream
```

## Squash Merge Detection

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

## ReviewGate Tags

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

## The DEV Update Problem (Solved)

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

## Git Hooks (Optional)

For fully automatic sync, install Git hooks that run `atomic git import --incremental` after every Git operation:

```bash
# Install hooks
atomic git hooks install

# Check what's installed
atomic git hooks status

# Remove hooks
atomic git hooks uninstall
```

### What the hooks do

| Git event | Hook | Action |
|-----------|------|--------|
| `git commit` | `post-commit` | `atomic git import --incremental` |
| `git merge` | `post-merge` | `atomic git import --incremental` |
| `git rebase` | `post-rewrite` | `atomic git import --incremental` |
| `git pull` | `post-merge` | `atomic git import --incremental` |

:::info
Import is idempotent — running it twice on the same commits is harmless. Already-imported commits are skipped via the `GIT_SHA_INDEX`.
:::

## Syncing Tags to atomic.storage

ReviewGate tags and other Atomic tags sync automatically with your Atomic remote:

```bash
# Push uploads tags as content-addressed blobs
atomic push

# Pull downloads tags listed for the remote view
atomic pull
```

Tags are content-addressed, so duplicates are automatically deduplicated. A tag pushed from one machine is available on every other machine after `atomic pull`.

## GIT_SHA_INDEX

Under the hood, `atomic git import` maintains a redb table called `GIT_SHA_INDEX` that maps Git SHA → Atomic `entity_id`. This index:

- Makes `--incremental` **O(1) per commit** instead of O(n) — it checks the index to skip already-imported SHAs
- Is **backfilled automatically** on the first `--incremental` run for repos that were imported before the index existed
- Lives inside `.atomic/pristine/` alongside the rest of the Atomic database

You never need to interact with this index directly. It's an implementation detail that makes incremental import fast.

## Troubleshooting

### "Incremental import finds nothing new"

This is correct behavior — it means all Git commits are already imported. The `GIT_SHA_INDEX` confirmed every SHA is present. No action needed.

### "Squash merge not detected"

The commit message doesn't match any known forge format, and no `Atomic-Changes` trailer was found. The commit is still imported as a regular Atomic change — it just won't get a ReviewGate tag.

**Fix:** Use `atomic git push` to create your Git commits. It adds `Atomic-Changes` trailers automatically, which makes detection exact.

### "Force-push on a branch"

Existing Atomic changes are preserved — nothing is lost. Force-pushes only affect Git's ref pointers. On the next `atomic git import --incremental`, the new commits at the force-pushed ref are imported fresh. Old commits that were replaced in Git still exist as Atomic changes.

### "Git and Atomic are out of sync"

```bash
# Re-sync by running a full incremental import
atomic git import --incremental

# If that doesn't help, verify both sides
git log --oneline -10
atomic log --limit 10
```

:::warning
Never delete `.atomic/` and re-import as a "fix." This destroys all Atomic-native changes, ReviewGate tags, and view structure that don't exist in Git. Run `atomic git import --incremental` instead.
:::

## Next Steps

- [Migrating from Git](./migrating-from-git.md) — full migration guide if you want to go Atomic-only
- [AI Agent Workflows](./ai-agent-workflows.md) — using agents with Atomic's provenance tracking
- [Stacked Diffs](./stacked-diffs.md) — building reviewable change stacks in Atomic
