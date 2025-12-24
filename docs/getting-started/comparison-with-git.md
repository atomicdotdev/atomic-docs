---
sidebar_position: 2
title: Comparison with Git
---

# Atomic vs Git: Key Differences

This guide explains the fundamental differences between Atomic and Git, helping Git users understand Atomic's unique approach to version control.

## Core Philosophy

### Git: Content-Addressed Snapshots
Git stores complete repository snapshots and computes diffs on-demand for display purposes.

```
Git Model:
Commit A (tree snapshot) → Commit B (tree snapshot) → Commit C (tree snapshot)
                 ↓                     ↓                     ↓
            (compute diff)        (compute diff)        (compute diff)
```

### Atomic: Change-Based Version Control
Atomic stores transformations (changes/patches) and computes repository state when needed.

```
Atomic Model:
Change ABC (patch) + Change DEF (patch) + Change GHI (patch) = Repository State
        ↓                  ↓                    ↓
   (apply hunks)      (apply hunks)       (apply hunks)
```

**Key Insight**: Git stores states and computes diffs. Atomic stores diffs and computes states.

## Major Differences

### 1. Change Identity

| Aspect | Git | Atomic |
|--------|-----|--------|
| **What's identified** | Commit (snapshot + metadata) | Change (patch content only) |
| **Hash includes** | Tree, parent, author, date, message | Patch hunks only |
| **Stability** | Changes with rebase/amend | Stays same across repositories |
| **Same change, different commit?** | Yes (different hashes) | No (same hash) |

**Example:**

```bash
# Git: Same patch, different hashes
Repository A: abc123 (commit hash)
Repository B: def456 (different hash for SAME patch after rebase)

# Atomic: Same patch, same hash
Repository A: XYZ789 (change hash)
Repository B: XYZ789 (same hash, it's the SAME change)
```

**Why this matters**: 
- ✅ No lost work when independently creating same fix
- ✅ Automatic deduplication across repositories
- ✅ Change references never break

### 2. Merge Semantics

| Aspect | Git | Atomic |
|--------|-----|--------|
| **Merge model** | Three-way merge (find common ancestor) | Commutative merge (order-independent) |
| **Result depends on order?** | Yes | No |
| **Cherry-pick changes order?** | Yes | No |
| **Conflict potential** | High (order matters) | Lower (order doesn't matter) |

**Example:**

```bash
# Git: Order matters
git cherry-pick A  # Result: state₁
git cherry-pick B  # Result: state₂
# vs
git cherry-pick B  # Result: state₁'
git cherry-pick A  # Result: state₂' (potentially different!)

# Atomic: Order doesn't matter
atomic apply ABC
atomic apply DEF
# Same result as:
atomic apply DEF
atomic apply ABC
```

**Why this matters**:
- ✅ Parallel development without coordination
- ✅ No "merge commits" needed
- ✅ Same changes = same result everywhere

### 3. Branches vs Stacks

| Feature | Git Branches | Atomic Stacks |
|---------|-------------|---------------|
| **Model** | Pointers to commits | Named sequences of changes |
| **Working copy** | Separate per branch | Shared across stacks |
| **Switching** | Changes entire filesystem | Applies/unapplies changes |
| **Untracked files** | Removed when switching | Persist across stacks |
| **Rebasing** | Required for updates | Not needed |
| **Independence** | Must choose merge or rebase | Commutative by design |

**Example:**

```bash
# Git: Switching branches changes filesystem
git checkout feature-a
ls  # Output: Files from feature-a

git checkout feature-b
ls  # Output: Different files (feature-b)

# Atomic: Switching stacks keeps working copy
atomic stack switch feature-a
ls  # Output: Current files

atomic stack switch feature-b
ls  # Output: Same files + changes applied/unapplied
```

**Why this matters**:
- ✅ Faster stack switching (no filesystem churn)
- ✅ Unrecorded work persists across stacks
- ⚠️ Must be aware of working copy state

### 4. Rebasing

| Aspect | Git | Atomic |
|--------|-----|--------|
| **Purpose** | Update commit history | Not needed |
| **Changes commit hashes?** | Yes | N/A |
| **Required for stacked changes?** | Yes | No |
| **Conflict resolution** | During rebase | During apply |
| **Interactive mode** | `git rebase -i` | `atomic unrecord` + `atomic apply` |

**Example:**

```bash
# Git: Must rebase to update base
git checkout feature-branch
git rebase main  # Required to get main's updates
# Commit hashes change, conflicts possible

# Atomic: Updates happen automatically
atomic stack switch feature-stack
atomic pull  # Gets updates from main
# Change hashes stay same, dependencies handled automatically
```

**Why this matters**:
- ✅ No rebasing required for stacked workflows
- ✅ Change identity preserved
- ✅ Simpler mental model

### 5. History Model

| Aspect | Git | Atomic |
|--------|-----|--------|
| **Structure** | Directed Acyclic Graph (DAG) of commits | Dependency graph of changes |
| **Immutability** | History can be rewritten | Changes are immutable |
| **Rewrite operations** | `commit --amend`, `rebase`, `filter-branch` | Create new change, old stays in store |
| **Linear history** | Enforced via rebase | Not a goal |
| **Merge commits** | Required for non-linear history | Not needed |

**Example:**

```bash
# Git: Rewrite history
git commit --amend  # Changes commit hash
git rebase -i HEAD~3  # Rewrites 3 commits

# Atomic: Create new versions
atomic unrecord ABC  # Remove from stack
atomic record -m "Updated version"  # New change ABC'
# Old change ABC still exists in store
```

**Why this matters**:
- ✅ Can always recover old versions
- ✅ Audit trail preserved
- ✅ No "force push" dangers

### 6. Remote Repositories

| Feature | Git | Atomic |
|---------|-----|--------|
| **Push/Pull model** | Branch-based | Change-based |
| **Force push** | Sometimes required | Rarely needed |
| **Conflict detection** | During push | During apply |
| **Selective sync** | Branch or commit range | Individual changes |
| **Deduplication** | Local only | Global (same hash = same change) |

**Example:**

```bash
# Git: Push branches
git push origin feature-branch

# Atomic: Push changes
atomic push ABC DEF GHI  # Push specific changes
atomic push --stack feature-work  # Or push entire stack
```

**Why this matters**:
- ✅ Fine-grained control over what to share
- ✅ No lost work from force pushes
- ✅ Better collaboration patterns

## Workflow Comparisons

### Basic Development Cycle

```bash
# Git
git checkout -b feature
# Edit files
git add .
git commit -m "Message"
git push origin feature
# Code review
git checkout main
git merge feature

# Atomic
atomic stack new feature
# Edit files
atomic record . -m "Message"
atomic push
# Code review
atomic stack switch main
atomic apply <change-hash>
```

### Stacked Changes Workflow

```bash
# Git (requires rebasing)
git checkout -b feature-1
git commit -m "Step 1"
git checkout -b feature-2
git commit -m "Step 2"

# Update step 1 after review:
git checkout feature-1
git commit --amend
git checkout feature-2
git rebase feature-1  # Required!

# Atomic (no rebasing)
atomic stack new feature
atomic record -m "Step 1"  # Change ABC
atomic record -m "Step 2"  # Change DEF (depends on ABC)

# Update step 1 after review:
atomic unrecord ABC
atomic record -m "Step 1 (updated)"  # New change ABC'
# Step 2 (DEF) still works, no action needed!
```

### Cherry-Picking

```bash
# Git
git cherry-pick abc123
# May need conflict resolution
# Creates new commit with different hash

# Atomic
atomic pull ABC123
# Automatically handles dependencies
# Same change, same hash
```

### Undoing Changes

```bash
# Git
git revert abc123      # Creates new commit
git reset --hard HEAD~1  # Removes from history

# Atomic
atomic unrecord ABC    # Removes from stack
atomic apply ABC       # Reapply later if needed
# Original change always in store
```

## What Atomic Does Better

### ✅ Stacked Workflows
- No rebasing required
- Changes maintain identity
- Parallel development without conflicts

### ✅ Change Identity
- Same change = same hash everywhere
- No lost work from duplicate fixes
- Better collaboration across teams

### ✅ Commutative Merges
- Order-independent results
- Fewer merge conflicts
- Parallel development scales better

### ✅ Mathematical Correctness
- Patch theory foundations
- Provably correct merge semantics
- Conflict detection is precise

### ✅ AI Agent Workflows
- Virtual working copies for headless agents
- Massive parallelism (1000+ agents)
- Native change construction without filesystem

## What Git Does Better

### ✅ Ecosystem
- 15+ years of tools, integrations, documentation
- Native support in all major platforms (GitHub, GitLab, Bitbucket)
- Massive community knowledge base

### ✅ Performance (for now)
- Highly optimized C implementation
- Pack files for efficient storage
- Shallow clones for large repositories

### ✅ Flexibility
- Rewrite history when needed
- Submodules for monorepo management
- Extensive configuration options

### ✅ Adoption
- Industry standard
- Universal knowledge among developers
- Lower onboarding friction

## When to Use Atomic vs Git

### Use Atomic When:
- ✅ Building stacked changes for review
- ✅ Working with AI agents (especially headless/swarms)
- ✅ Need mathematical correctness guarantees
- ✅ Parallel development with many contributors
- ✅ Change identity matters (cross-repo collaboration)
- ✅ Want to avoid rebasing

### Use Git When:
- ✅ Need GitHub/GitLab integration (for now)
- ✅ Working with existing Git-based workflows
- ✅ Team is Git-expert and resistant to change
- ✅ Need specific Git tools/integrations
- ✅ Large binary assets (Git LFS is mature)

### Use Both:
Many teams use Atomic for development and Git for integration:
```bash
# Develop with Atomic
atomic record -m "Feature work"
atomic push

# Export to Git for GitHub PR
atomic export --git
git push origin feature-branch
```

## Migration Path

### From Git to Atomic

```bash
# Initialize Atomic in Git repository
cd my-git-repo
atomic init

# Atomic and Git coexist
git log  # Git history
atomic log  # Atomic changes

# Gradually adopt Atomic workflows
atomic record -m "New work"
atomic stack new feature
```

### Key Differences to Remember

1. **Stacks share working copy** (not like Git branches)
2. **Changes are immutable** (unrecord removes from stack, not from store)
3. **No rebasing needed** (dependency handling is automatic)
4. **Hashes mean different things** (content only, not metadata)
5. **Conflict resolution is different** (during apply, not merge)

## Learning Curve

### Familiar Concepts
- Recording changes (`atomic record` ≈ `git commit`)
- Viewing history (`atomic log` ≈ `git log`)
- Remote repositories (`atomic push/pull` ≈ `git push/pull`)
- Branching (`atomic stack` ≈ `git branch`)

### New Concepts to Learn
- **Change identity** vs commit identity
- **Commutative merges** vs three-way merges
- **Stacks vs branches** (shared working copy)
- **Dependency graphs** vs commit DAGs
- **Unrecord vs revert/reset** (different semantics)

## Performance Considerations

### Git Advantages
- ✅ Mature pack file optimization
- ✅ Optimized C implementation
- ✅ Shallow clones for large repos

### Atomic Advantages
- ✅ Change-based model reduces duplicates
- ✅ Virtual working copies (memory vs disk)
- ✅ Lazy loading of pristine state
- ✅ Better for AI agent parallelism

**Benchmark Example** (100 AI agents):
- Git: 50GB disk space (100 working copies)
- Atomic: 500MB RAM (virtual working copies)

## Common Misconceptions

### ❌ "Atomic is just Git with a different UI"
**False**. Atomic uses fundamentally different data structures (patches vs trees) and merge semantics (commutative vs three-way).

### ❌ "Atomic stacks are like Git branches"
**False**. Stacks share the same working copy and changes maintain identity across stacks.

### ❌ "You can't rewrite history in Atomic"
**Partially true**. You can't rewrite changes (they're immutable), but you can create new versions and remove old ones from stacks.

### ❌ "Atomic requires learning everything from scratch"
**False**. Many concepts map directly from Git. Core differences are around merge semantics and change identity.

### ❌ "Atomic makes Git obsolete"
**Not yet**. Git has massive ecosystem advantage. Atomic excels in specific workflows (stacked changes, AI agents) but isn't a complete replacement today.

## Summary

| Aspect | Git | Atomic |
|--------|-----|--------|
| **Data Model** | Content-addressed snapshots | Change-based patches |
| **Identity** | Commit (snapshot + metadata) | Change (patch content) |
| **Merge** | Three-way (order-dependent) | Commutative (order-independent) |
| **Branching** | Separate working copies | Shared working copy |
| **Rebasing** | Required for stacks | Not needed |
| **History** | Rewritable DAG | Immutable dependency graph |
| **Best For** | Traditional workflows | Stacked changes, AI agents |

**The Bottom Line**: Atomic isn't "better Git" - it's a different approach based on patch theory that excels in modern workflows (stacked changes, AI code generation, parallel development).

## Next Steps

- [Installation](installation.md) - Get started with Atomic
- [First Repository](first-repository.md) - Create your first Atomic repository  
- [Stacked Diffs Guide](stacked-diffs.md) - Learn stacked workflows
- [Migrating from Git](migrating-from-git.md) - Transition from Git to Atomic

## References

- [Pijul's Patch Theory](https://pijul.org/posts/2020-11-07-rethinking-patch-theory/) - Mathematical foundations
- [Change Identity Blog Post](https://nest.pijul.com/pijul/pijul/changes/hash) - Why content-based hashing matters
- [Commutative Merge Semantics](https://pijul.org/manual/theory.html) - Deep dive into merge theory