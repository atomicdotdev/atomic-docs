---
sidebar_position: 5
title: Migrating from Git
---

# Migrating from Git to Atomic

Welcome, Git users. This guide walks you through moving from Git to Atomic. Git tracks snapshots; Atomic is a semantic change graph that records patches together with memories, intents, provenance, and attestations. That changes how you work with code, and this page shows you how.

This page is the single getting-started path: pick an adoption mode, do the one-time import, learn the daily coexistence rules, then use the command translation, scenarios, checklist, and troubleshooting sections as reference.

## Which path is right for you?

You do not have to choose between "all Git" and "all Atomic" on day one. Three paths cover every team:

| Your situation | Recommended path |
|----------------|------------------|
| AI changes are small, a human stays in the loop for every edit, and commit/PR prose is an acceptable record | **Git alone is fine**: keep using Git as-is |
| Agents make multi-turn or multi-file changes; you need provenance, model attribution, review evidence, and dependency-aware promotion | **Add Atomic**: import your Git history and go Atomic-native |
| GitHub or GitLab must remain the collaboration surface, but Atomic should record the development and audit trail | **Use both**: Git Shadow sync for a sidecar mirror, or the colocated shim for tighter integration |

The full analysis (what Git does not record, what Atomic adds, and the detailed decision guide) lives in [Is Git Good Enough for AI Coding Agents?](./comparison-with-git.md). Read it if you are still evaluating; come back here when you are ready to move.

## Key differences to understand first

### Terminology Mapping

| Git Term | Atomic Term | Notes |
|----------|-------------|-------|
| Commit | Change | Immutable semantic patches |
| Branch | View | Independent lines of development |
| Merge | Pull/Insert | Change references compose; genuine conflicts are surfaced, not hidden |
| Tag | Tag | Consolidating boundaries (more efficient) |
| Remote | Remote | Same concept |
| Staging Area | _(none)_ | No staging - direct recording |
| HEAD | Current View | Explicit view selection |
| Working Directory | Working Copy | Your editable files |

### Views Share Working Copy (NOT Like Git Branches!)

**Critical Understanding**: Atomic views are fundamentally different from Git branches.

**Git branches**: Each branch switch changes your working directory to match that branch's state.

**Atomic views**: All views share the same working copy. Only the **patch history** is isolated.

##### Concrete Example

```bash
# Start on main view
atomic view switch main
ls
# Output: test.txt

# Create and switch to new view
atomic view create new-feature --switch

# Create and record a new file
vi new-file.txt
atomic record new-file.txt -m "Add new feature"

# Switch back to main
atomic view switch main
ls
# Output: new-file.txt test.txt
#         ^^^^^^^^^^^^
#         STILL HERE! (untracked from main's perspective)
```

**Why does `new-file.txt` appear on main?**

- It's **recorded on new-feature view** (in patch history) ✅
- But it's **untracked from main's perspective** (not recorded on main)
- Atomic doesn't delete untracked files when switching views
- The **patch history** is isolated, but the **working copy** is shared

##### What IS Isolated Between Views?

```bash
# Patch history is isolated
atomic view switch main
atomic log              # Does NOT show "Add new feature"

atomic view switch new-feature
atomic log              # DOES show "Add new feature"
```

##### Mental Model

```
Git:
  main branch    → working dir state A
  feature branch → working dir state B

Atomic:
  main view    → patch history A  }
  feature view → patch history B  } → SAME working copy
```

**Think of views as different perspectives on patch history, NOT different workspaces.**

### No Merge Conflicts

**Git**: Merge conflicts require manual resolution
```bash
git merge feature
# CONFLICT (content): Merge conflict in file.txt
# Automatic merge failed; fix conflicts and then commit the result.
```

**Atomic**: Pull the changes; independent edits compose cleanly
```bash
atomic pull . --from-view feature
# Changes applied successfully
```

Why? Atomic uses **patch theory** - changes are semantic operations, not text diffs. When two changes edit the same content, Atomic materializes honest conflict markers instead of guessing (see [Merging and Conflicts](../concepts/merging-and-conflicts.md)).

### No Staging Area

**Git**: Requires staging before commit
```bash
git add file1.txt file2.txt
git commit -m "Update files"
```

**Atomic**: Direct recording from working copy
```bash
atomic record -m "Update files"
# All tracked changes are recorded
```

To record specific files:
```bash
atomic record -m "Update config" config.toml
```

### Consolidating Tags

**Git**: Tags are just pointers to commits
```bash
git tag v1.0.0
```

**Atomic**: Tags consolidate dependencies, keeping history compact
```bash
atomic tag create v1.0.0 -m "First release"
# Reduces O(n²) to O(n) complexity
# Dramatically improves performance at scale
```

Atomic tags are **first-class nodes** in the dependency graph, enabling:
- 96% reduction in dependency complexity
- Efficient hotfix workflows
- Mathematical semantic guarantees

### Changes vs Commits

**Git commits** are snapshots of the entire repository at a point in time.

**Atomic changes** are semantic patch operations:
- Represent the actual operations performed
- Can be applied in any order (commutative)
- Compose cleanly when independent; conflicts surface only on genuine overlap
- Cryptographically identified by content

## One-time import

### Import Your Git Repository

The fastest way to get started is to import your existing Git repository:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repo

# Import into Atomic (creates .atomic directory)
atomic git import

# Start using Atomic!
atomic log
```

That's all. Atomic will:
- Import your entire Git history
- Convert commits to Atomic changes
- Preserve author information and timestamps
- Create equivalent branches as views
- Maintain your working copy

### Full Repository Import

```bash
# Import entire Git history (run inside the Git checkout)
cd your-git-repo
atomic git import

# Verify import
atomic log -n 10
atomic view list
```

`atomic git import` takes no path arguments: it always operates on the Git checkout you run it inside. To import a different repository, `cd` into it first. `--all` imports every local branch as its own view; `-b <branch>` imports a single non-default branch.

### Import Options

```bash
# Preview what would be imported without creating an Atomic repository
atomic git import --dry-run

# Import a specific branch
atomic git import --branch main

# Import all local branches, each as its own view
atomic git import --all

# Only import commits not already in Atomic
atomic git import --incremental

# Project kind for the .atomicignore template
atomic git import --kind rust

# Skip vault initialization
atomic git import --no-vault

# Eagerly build the semantic layer for token-level blame on imported history
atomic git import --with-crdt
```

:::warning `--all` can produce materialization conflicts
`--all` imports every local branch, including commits from **both sides of merge commits**. If those branches had overlapping edits, Atomic's graph will contain conflicting changes, and materialization writes conflict markers into the affected files. The default first-parent import avoids this entirely. Use `--all` only when you need per-branch views or individual attribution through squash merges. See [Git Shadow](./git-shadow-sync.md) for the full recovery procedure.
:::

### What Gets Imported

✅ **Imported:**
- All commits as Atomic changes (first-parent traversal by default)
- Commit messages and descriptions
- Author information and timestamps
- File history

❌ **Not Imported:**
- Git-specific metadata
- Merge commit structure (converted to changes)
- Submodules (requires manual handling)
- Git hooks (reimplement in Atomic)
- Other branches' tags (use `atomic tag create` for the equivalents you want)

### Post-Import Steps

After importing:

```bash
# 1. Verify the import
atomic log -n 20
atomic view list

# 2. Create a consolidating tag for better performance
atomic tag create v1.0.0 -m "Initial import from Git"

# 3. Set up your remotes with the remote CLI (no config editing)
atomic remote add origin https://acme.atomic.storage/workspaces/platform/projects/api/code

# 4. Continue with Atomic
atomic record -m "First Atomic change"
atomic push
```

:::warning Never hand-edit `config.toml`
Remotes are managed exclusively with `atomic remote add|remove|list|set-url|default`. Hand-editing a `[remote]` section in `.atomic/config.toml` is not a supported configuration path and will be ignored or rejected by the CLI.
:::

To keep the original Git checkout synchronized going forward, prefer the colocated shim (`atomic git shim cutover`); see [git shim](../commands/git-shim.md).

### Setting Up Your Identity

```bash
atomic identity new default \
  --email you@example.com \
  -d "Your Name" \
  --set-default

atomic identity default default
atomic identity list
```

If you created the identity without `--set-default`, switch to it with `atomic identity default default`. Verify with `atomic identity whoami`.

### Remotes Configuration

Remotes are managed with the `atomic remote` command (like `git remote`):

```bash
# Multiple remotes (like Git)
atomic remote add origin https://acme.atomic.storage/workspaces/platform/projects/api/code
atomic remote add upstream https://upstream.atomic.storage/workspaces/acme/fork/code
atomic remote add backup https://backup.atomic.storage/workspaces/acme/archive/code
atomic remote -v
```

## Daily coexistence

If you keep Git alongside Atomic, remember the essentials:

- **Git shadows Atomic**: Atomic is the source of truth for content and provenance; the Git repo is a downstream mirror you publish with `atomic git push`.
- **`atomic git hooks install`** enables the advisory shim dispatcher: Git-side events are noticed and reconciled, never rewritten silently.
- **`atomic git push`** publishes the current Atomic state to Git with provenance trailers (`Atomic-View`, `Atomic-State`, `Atomic-Changes`).
- Since 0.20.0, exporting a view with **unresolved Atomic conflicts** to a remote is refused by default. `atomic git push --allow-conflicts` exists as an explicit escape hatch (never for automation); the other gates (conflict-object pack, signing, trust, lease, publication policy) still apply.

:::info Going deeper
The full shadow-sync walkthrough (hooks, squash-merge detection, ReviewGate tags, troubleshooting) is in [Git Shadow](./git-shadow-sync.md). The colocated shim (reconcile, verify, switch, publish, bindings, cutover) is documented in [git shim](../commands/git-shim.md).
:::

## Command Translation Guide

### Repository Setup

```bash
# Git
git init
git clone https://github.com/user/repo.git

# Atomic
atomic init
atomic clone ssh://github.com/user/repo.git
```

### Basic Workflow

```bash
# Git
git add .
git commit -m "Add feature"
git push origin main

# Atomic
atomic add .
atomic record -m "Add feature"
atomic push origin
```

### Viewing History

```bash
# Git
git log
git log --oneline
git log --graph --all

# Atomic
atomic log
atomic log -n 10
atomic log --full-hash
```

### Branching

```bash
# Git
git branch feature-branch
git checkout feature-branch
git checkout -b new-feature

# Atomic
atomic view create feature-branch
atomic view switch feature-branch
# Or combine: atomic view create feature-branch --switch
```

> **⚠️ Important**: Unlike `git checkout`, `atomic view switch` does NOT change untracked files in your working copy. Views share the same workspace - only the patch history is isolated. See [Views Share Working Copy](#views-share-working-copy-not-like-git-branches) above for details.

### Merging

```bash
# Git
git checkout main
git merge feature-branch

# Atomic
atomic view switch main
atomic pull . --from-view feature-branch
# No merge conflicts - mathematically guaranteed!
```

### Viewing Changes

```bash
# Git
git diff
git diff --staged
git show commit-hash

# Atomic
atomic diff
# (No staging area needed)
atomic change CHANGE-HASH --show-hunks
```

### Undoing Changes

```bash
# Git
git reset --hard HEAD
git reset HEAD~1
git revert commit-hash

# Atomic
atomic restore                 # Discard working copy changes
atomic unrecord                # Remove recorded changes
atomic unrecord CHANGE-HASH    # Remove specific change
```

### Remote Operations

```bash
# Git
git remote add origin url
git fetch origin
git pull origin main
git push origin main

# Atomic
atomic remote add origin https://acme.atomic.storage/workspaces/platform/projects/api/code
atomic pull origin
atomic pull origin --from-view main
atomic push origin
```

Remotes are managed with `atomic remote`; you do not need to edit configuration files by hand.

### Tagging

```bash
# Git
git tag v1.0.0
git tag -a v1.0.0 -m "Release 1.0"

# Atomic
atomic tag create v1.0.0 -m "Release 1.0"
# This also consolidates dependencies!
```

### Stashing (Atomic Equivalent)

```bash
# Git
git stash
git stash pop

# Atomic (record as WIP)
atomic record -m "WIP: save work"
# ... do other work ...
atomic unrecord  # Remove WIP change, keeps working copy
```

## Workflow Comparison

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/auth
# ... make changes ...
git add .
git commit -m "Add authentication"
git push origin feature/auth

# Create PR, get review, merge
git checkout main
git pull origin main
git merge feature/auth
# Resolve conflicts if any
git push origin main

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

### Atomic Workflow

```bash
# Feature view workflow
atomic view create feature-auth --draft --switch
# ... make changes ...
atomic record -m "Add authentication"
atomic push --from-view feature-auth

# Review, then merge (no conflicts!)
atomic view switch main
atomic pull . --from-view feature-auth
atomic push

# Tag release (with consolidation!)
atomic tag create v1.0.0 -m "First release"
atomic push
```

## Advanced Features for Git Users

### AI Attribution (Not Available in Git)

Track AI contributions cryptographically:

```bash
# Record AI-assisted change
atomic record -m "AI generated feature" \
  --ai-assisted \
  --ai-provider cursor \
  --ai-model gpt-4

# View AI contributions in the change itself
atomic change <HASH>
```

:::note
Manual AI attribution flags are a fallback. With an agent integration enabled (`atomic agent enable`), turn-level recording fills the `--ai-*` provenance fields automatically, so you don't need the flags at all. See [AI Agent Workflows](./ai-agent-workflows.md).
:::

### Consolidating Tags

Unlike Git tags, Atomic tags reduce dependency complexity:

```bash
# Create consolidating tag
atomic tag create v1.0.0 -m "Major release"

# Now future changes depend on the tag, not all prior changes
# Result: 96% reduction in dependencies!
```

### Concurrent Distributed Collaboration

Multiple developers can work simultaneously; independent edits merge without conflicts, and genuine conflicts are surfaced honestly rather than silently auto-resolved:

```bash
# Alice and Bob both work on main
# Alice: atomic record -m "Add feature A"
# Bob:   atomic record -m "Add feature B"

# Both push
# Alice: atomic push
# Bob:   atomic push

# Bob pulls Alice's work
# Bob:   atomic pull
# Result: Independent changes apply cleanly; any true conflict is reported
# and resolved explicitly (see Concepts: Merging and Conflicts)
```

### View Independence

Views are truly independent (unlike Git branches):

```bash
# Work on multiple features simultaneously
atomic view create feature-1
atomic record -m "Work on feature 1"

atomic view create feature-2
atomic record -m "Work on feature 2"

# Insert changes between views
atomic view switch main
atomic pull . --from-view feature-1
atomic pull . --from-view feature-2
# No merge conflicts!
```

## Common Git Scenarios in Atomic

### Scenario 1: Feature Branch Workflow

**Git:**
```bash
git checkout -b feature
# work...
git add .
git commit -m "Feature"
git checkout main
git merge feature
# resolve conflicts
git branch -d feature
```

**Atomic:**
```bash
atomic view create feature
# work...
atomic record -m "Feature"
atomic view switch main
atomic pull . --from-view feature
# no conflicts!
atomic view delete feature
```

### Scenario 2: Hotfix Workflow

**Git:**
```bash
git checkout -b hotfix v1.0.0
# fix bug...
git commit -m "Hotfix"
git tag v1.0.1
git checkout main
git merge hotfix
```

**Atomic:**
```bash
# Create a view at the tagged state, then fix and record
atomic view create hotfix --draft
atomic insert tag v1.0.0 --to-view hotfix --from-view main
atomic view switch hotfix
# fix bug...
atomic record -m "Hotfix"

# Tag the hotfix state
atomic tag create v1.0.1 -m "Hotfix"

# Merge back to main
atomic view switch main
atomic pull . --from-view hotfix
```

### Scenario 3: Rebasing (Not Needed!)

**Git:**
```bash
git checkout feature
git rebase main  # Can cause conflicts
```

**Atomic:**
```bash
# Just pull changes - no rebasing needed!
atomic view switch feature
atomic pull . --from-view main
```

:::note
Independent changes compose without manual intervention. When two changes genuinely edit the same content, Atomic materializes honest conflict markers instead of auto-resolving. Resolve them, then record. See [Merging and Conflicts](../concepts/merging-and-conflicts.md).
:::

## Performance at Scale

### Git Performance Issues

- O(n²) history growth with merges
- Merge conflicts increase with project size
- Large repositories become slow

### Atomic Performance Benefits

- O(n) history growth with tags
- Honest conflict handling (see [Merging and Conflicts](../concepts/merging-and-conflicts.md))
- Consolidating tags keep repos fast

Example with 100 changes:
- **Git**: ~5,050 potential merge points
- **Atomic with tags**: ~200 dependencies (a 96% reduction)

## Migration Checklist

- [ ] Install Atomic: `curl -sSf https://atomic.storage/install.sh | sh`
- [ ] Import Git repo: `atomic git import`
- [ ] Verify import: `atomic log -n 20` and `atomic view list`
- [ ] Configure identity: `atomic identity new default --email you@example.com -d "Your Name" --set-default`
- [ ] Set up remotes: `atomic remote add`
- [ ] Create consolidating tag: `atomic tag create v1.0.0 -m "Initial import from Git"`
- [ ] Update team documentation
- [ ] Train team on Atomic workflow
- [ ] Set up CI/CD with Atomic
- [ ] Adopt the review-and-promote workflow for agent work

## Troubleshooting

### Import Issues

**Problem**: Import fails with "uncommitted changes"
```bash
# Solution: Commit or stash in Git first
git status
git commit -am "Pending changes"
atomic git import
```

**Problem**: Not sure what an import would do
```bash
# Solution: Preview first (creates nothing)
atomic git import --dry-run
```

### Working Copy Differences

**Problem**: Files look different after import
```bash
# Solution: Restore working copy
atomic restore
```

### Remote Push Issues

**Problem**: Can't push to Git remotes
```bash
# Atomic uses its own protocol
# Set up Atomic-compatible remotes with: atomic remote add <name> <url>
# Or keep Git as a bridge via Git Shadow (atomic git push)
```

**Problem**: Push refused because of unresolved Atomic conflicts
```bash
# Resolve the conflicts, then record and push
atomic conflicts --short
# ... resolve ...
atomic push
# Only if you truly must export a conflicted view (never in automation):
atomic git push --allow-conflicts
```

## Getting Help

- **Documentation**: [docs.atomic.dev](https://docs.atomic.dev)
- **Discord**: [discord.gg/atomic-vcs](https://discord.gg/atomic-vcs)
- **GitHub Issues**: [github.com/atomic-vcs/atomic/issues](https://github.com/atomic-vcs/atomic/issues)
- **Community Forum**: [community.atomic.dev](https://community.atomic.dev)

## Next Steps

1. **Import your Git repository**: `atomic git import`
2. **Create your first change**: `atomic record -m "First Atomic change"`
3. **Explore AI attribution**: `atomic record --ai-assisted`
4. **Create consolidating tags**: `atomic tag create v1.0.0`
5. **Try concurrent development**: work in parallel views and pull changes together

## Why Switch from Git?

### Key Advantages

- **Honest conflict handling** - independent changes compose cleanly; genuine conflicts are surfaced, not hidden
- **AI attribution** - cryptographic tracking of AI contributions
- **Consolidating tags** - O(n) instead of O(n²) dependency growth
- **Semantic patches** - operations, not text diffs
- **True distribution** - every repo is complete and independent

You lose nothing you rely on in Git, and you gain provenance that Git cannot record.

---

**Ready to make the switch?** Import your first Git repository:

```bash
cd your-git-repo
atomic git import
atomic log
```
