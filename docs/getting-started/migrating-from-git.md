---
sidebar_position: 3
title: Migrating from Git
---

# Migrating from Git to Atomic

Welcome, Git users! This guide will help you transition from Git to Atomic. While Git is a version control system that tracks snapshots, Atomic is a semantic change graph that tracks memories, intents, provenance, attestations, and patches as a single unit of change — fundamentally changing how you work with code.

## Quick Start: Import Your Git Repository

The fastest way to get started is to import your existing Git repository:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repo

# Import into Atomic (creates .atomic directory)
atomic git import

# Start using Atomic!
atomic log
```

That's it! Atomic will:
- Import your entire Git history
- Convert commits to Atomic changes
- Preserve author information and timestamps
- Create equivalent branches as views
- Maintain your working copy

## Understanding the Differences

### Terminology Mapping

| Git Term | Atomic Term | Notes |
|----------|-------------|-------|
| Commit | Change | Immutable semantic patches |
| Branch | View | Independent lines of development |
| Merge | Pull/Insert | Conflict-free by design |
| Tag | Tag | Consolidating boundaries (more powerful!) |
| Remote | Remote | Same concept |
| Staging Area | _(none)_ | No staging - direct recording |
| HEAD | Current View | Explicit view selection |
| Working Directory | Working Copy | Your editable files |

### Key Conceptual Differences

#### 1. Views Share Working Copy (NOT Like Git Branches!)

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
atomic view create new-feature
atomic view switch new-feature

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

#### 2. No Merge Conflicts

**Git**: Merge conflicts require manual resolution
```bash
git merge feature
# CONFLICT (content): Merge conflict in file.txt
# Automatic merge failed; fix conflicts and then commit the result.
```

**Atomic**: Mathematically guaranteed conflict-free merging
```bash
atomic pull . --from-view feature
# Changes applied successfully (no conflicts ever!)
```

Why? Atomic uses **patch theory** - changes are semantic operations, not text diffs.

#### 3. No Staging Area

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

#### 4. Consolidating Tags

**Git**: Tags are just pointers to commits
```bash
git tag v1.0.0
```

**Atomic**: Tags consolidate dependencies (revolutionary!)
```bash
atomic tag create v1.0.0 -m "First release"
# Reduces O(n²) to O(n) complexity
# Dramatically improves performance at scale
```

Atomic tags are **first-class nodes** in the dependency graph, enabling:
- 96% reduction in dependency complexity
- Efficient hotfix workflows
- Mathematical semantic guarantees

#### 5. Changes vs Commits

**Git commits** are snapshots of the entire repository at a point in time.

**Atomic changes** are semantic patch operations:
- Represent the actual operations performed
- Can be applied in any order (commutative)
- Enable conflict-free merging
- Cryptographically identified by content

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
atomic log --limit 10
atomic log --state  # Shows state hashes (Merkle trees)
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
# Or combine: atomic view create feature-branch && atomic view switch feature-branch
```

> **⚠️ Important**: Unlike `git checkout`, `atomic view switch` does NOT change untracked files in your working copy. Views share the same workspace - only the patch history is isolated. See [Views Share Working Copy](#1-views-share-working-copy-not-like-git-branches) above for details.

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
atomic change CHANGE-HASH --diff
```

### Undoing Changes

```bash
# Git
git reset --hard HEAD
git reset HEAD~1
git revert commit-hash

# Atomic
atomic restore --force              # Discard working copy changes
atomic unrecord                   # Remove recorded changes
atomic unrecord CHANGE-HASH       # Remove specific change
```

### Remote Operations

```bash
# Git
git remote add origin url
git fetch origin
git pull origin main
git push origin main

# Atomic
# Edit .atomic/config.toml to add remote
atomic pull origin
atomic pull origin --from-view main
atomic push origin
```

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

## Importing Git History

### Full Repository Import

```bash
# Import entire Git history
cd your-git-repo
atomic git import

# Verify import
atomic log --limit 10
atomic view list
```

### Import Specific Paths

```bash
# Import Git repo from different location
atomic git import /path/to/git/repo /path/to/atomic/repo
```

### What Gets Imported

✅ **Imported:**
- All commits as Atomic changes
- Commit messages and descriptions
- Author information and timestamps
- Branch structure (as views)
- Tags (as Atomic tags)
- File history

❌ **Not Imported:**
- Git-specific metadata
- Merge commit structure (converted to changes)
- Submodules (requires manual handling)
- Git hooks (reimplement in Atomic)

### Post-Import Steps

After importing:

```bash
# 1. Verify the import
atomic log --limit 20
atomic view list

# 2. Create a consolidating tag for better performance
atomic tag create v1.0.0 -m "Initial import from Git"

# 3. Set up your remotes
# Edit .atomic/config.toml:
# [remote "origin"]
# ssh = "ssh://git@github.com/user/repo.git"

# 4. Continue with Atomic
atomic record -m "First Atomic change"
atomic push
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
atomic view create feature-auth
atomic view switch feature-auth
# ... make changes ...
atomic record -m "Add authentication"
atomic push --from-view feature-auth

# Review, then merge (no conflicts!)
atomic view switch main
atomic pull . --from-view feature-auth
atomic push

# Tag release (with consolidation!)
atomic tag create v1.0.0 -m "First release"
atomic push --with-tags
```

## Advanced Features for Git Users

### 1. AI Attribution (Not Available in Git)

Track AI contributions cryptographically:

```bash
# Record AI-assisted change
atomic record -m "AI generated feature" \
  --ai-assisted \
  --ai-provider cursor \
  --ai-model gpt-4 \
  --ai-confidence 0.95

# View AI contributions
atomic log --attribution --ai-only
```

### 2. Consolidating Tags (Revolutionary)

Unlike Git tags, Atomic tags reduce dependency complexity:

```bash
# Create consolidating tag
atomic tag create v1.0.0 -m "Major release"

# Now future changes depend on the tag, not all prior changes
# Result: 96% reduction in dependencies!
```

### 3. Conflict-Free Distributed Collaboration

Multiple developers can work simultaneously without conflicts:

```bash
# Alice and Bob both work on main
# Alice: atomic record -m "Add feature A"
# Bob:   atomic record -m "Add feature B"

# Both push
# Alice: atomic push
# Bob:   atomic push

# Bob pulls Alice's work - no conflicts!
# Bob:   atomic pull
# Result: Both changes applied correctly (mathematical guarantee)
```

### 4. View Independence

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

## Configuration for Git Users

### Setting Up Your Identity

```bash
# Similar to git config
atomic identity new default \
  --username yourname \
  --display-name "Your Name" \
  --email your.email@example.com

# Or use existing Git config
# Atomic reads from .atomic/config.toml:
```

Example `.atomic/config.toml`:

```toml
[author]
username = "yourname"
display_name = "Your Name"

[remote "origin"]
ssh = "ssh://git@github.com/user/repo.git"

[identity]
default = "default"
```

### Remotes Configuration

```toml
# Multiple remotes (like Git)
[remote "origin"]
ssh = "ssh://git@github.com/user/repo.git"

[remote "upstream"]
ssh = "ssh://git@github.com/original/repo.git"

[remote "backup"]
ssh = "ssh://backup@server.com/repos/project.git"
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

**Atomic (Revolutionary!):**
```bash
# Checkout tag to new view
atomic tag checkout v1.0.0 --to-view hotfix
atomic view switch hotfix
# fix bug...
atomic record -m "Hotfix"

# Create incremental tag (only depends on v1.0.0!)
atomic tag create v1.0.1 --since v1.0.0 -m "Hotfix"

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
# Conflict-free!
```

## Performance at Scale

### Git Performance Issues

- O(n²) history growth with merges
- Merge conflicts increase with project size
- Large repositories become slow

### Atomic Performance Benefits

- O(n) history growth with tags
- No merge conflicts (mathematical guarantee)
- Consolidating tags keep repos fast

Example with 100 changes:
- **Git**: ~5,050 potential merge points
- **Atomic with tags**: ~200 dependencies (96% reduction!)

## Migration Checklist

- [ ] Install Atomic: `curl -sSf https://atomic.storage/install.sh | sh`
- [ ] Import Git repo: `atomic git import`
- [ ] Verify import: `atomic log`
- [ ] Configure identity: `atomic identity new`
- [ ] Set up remotes in `.atomic/config.toml`
- [ ] Create consolidating tag: `atomic tag create initial`
- [ ] Update team documentation
- [ ] Train team on Atomic workflow
- [ ] Set up CI/CD with Atomic
- [ ] Celebrate conflict-free development! 🎉

## Troubleshooting

### Import Issues

**Problem**: Import fails with "uncommitted changes"
```bash
# Solution: Commit or stash in Git first
git status
git commit -am "Pending changes"
atomic git import
```

### Working Copy Differences

**Problem**: Files look different after import
```bash
# Solution: Restore working copy
atomic restore --force
```

### Remote Push Issues

**Problem**: Can't push to Git remotes
```bash
# Atomic uses its own protocol
# Set up Atomic-compatible remotes
# Or use Git as a bridge (advanced)
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
5. **Experience conflict-free merging**: Try parallel development!

## Why Switch from Git?

### Key Advantages

✅ **No Merge Conflicts** - Mathematical guarantees  
✅ **AI Attribution** - Cryptographic tracking of AI contributions  
✅ **Consolidating Tags** - O(n) instead of O(n²) complexity  
✅ **Semantic Patches** - Operations, not text diffs  
✅ **True Distribution** - Every repo is complete and independent  
✅ **Production Ready** - Enterprise workflow integration  

Welcome to the future of software development! 🚀

---

**Ready to make the switch?** Import your first Git repository and experience conflict-free development:

```bash
cd your-git-repo
atomic git import
atomic log
```
