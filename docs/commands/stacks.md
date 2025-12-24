---
sidebar_position: 4
---

# Stacks

Stacks are one of Atomic's most powerful features, enabling parallel development lines that can be managed independently and merged without traditional branch headaches. Unlike Git branches, stacks are **first-class citizens** in Atomic's data model.

## What are Stacks?

A **stack** represents a named sequence of changes that evolves independently. Think of stacks as parallel timelines of development that can diverge and converge while maintaining mathematical consistency.

### Key Characteristics

- **Independent Evolution**: Each stack maintains its own sequence of changes
- **Selective Merging**: Pull specific changes between stacks without complex rebasing
- **Conflict-Free by Design**: Atomic's patch theory handles most conflicts automatically
- **Named and Discoverable**: Stacks have human-readable names and can be listed/queried
- **Remote-Ready**: Stacks can be pushed to and pulled from remote repositories
- **Cascade Propagation** *(Coming Soon)*: Push changes from parent to all child stacks automatically - impossible in Git!

## ⚠️ Critical Difference: Stacks are NOT Git Branches

**Stacks share the same working copy** - they are NOT isolated filesystems like Git branches.

### The Key Insight

When you switch between stacks:
- ✅ **Recorded changes** are applied/unapplied (patch history is isolated)
- ✅ **Unrecorded changes** remain in your working copy (files persist)
- ❌ **Untracked files** do NOT disappear (unlike `git checkout`)

### Concrete Example

```bash
# Start on main stack
atomic stack switch main
ls
# Output: test.txt

# Create new stack and switch to it
atomic stack new new-feature
atomic stack switch new-feature
ls
# Output: test.txt (same files)

# Create and record a new file
vi new-file.txt
atomic record new-file.txt -m "Add new feature"

# Switch back to main
atomic stack switch main
ls
# Output: new-file.txt test.txt
#         ^^^^^^^^^^^^
#         Still here! It's untracked from main's perspective
```

**Why does `new-file.txt` still exist on main?**

- The change is **recorded on the new-feature stack** (in patch history)
- But it's an **untracked file from main's perspective** (not recorded on main)
- Atomic doesn't delete untracked files when switching stacks
- To verify isolation, check the logs:

```bash
# On main stack
atomic log
# Does NOT show "Add new feature" change

# On new-feature stack
atomic stack switch new-feature
atomic log
# DOES show "Add new feature" change
```

### What IS Isolated?

**Patch/change history** is isolated between stacks:

```bash
atomic stack switch main
atomic log              # Shows main's changes only

atomic stack switch new-feature
atomic log              # Shows new-feature's changes only
```

### To Get Git-Like File Isolation

If you want files to disappear when switching stacks, manually clean up:

```bash
atomic stack switch main
rm new-file.txt         # Manual cleanup of untracked files

# Or unrecord it on main if you want to track its absence
atomic unrecord new-file.txt
```

### Mental Model

```
Git Branches:
  branch-a → separate working directory state
  branch-b → separate working directory state

Atomic Stacks:
  stack-a → separate patch history } → shared working copy
  stack-b → separate patch history }
```

Think of stacks as **different views of patch history** operating on the **same workspace**, not as separate workspaces like Git branches.

---

## Why Stacks Matter

Traditional version control systems treat branches as pointers to commits, leading to complex merge scenarios. Atomic's stacks are fundamentally different:

```
Git Model:                  Atomic Model:
┌─────────┐                ┌─────────────┐
│ Branch  │───────────────▶│   Commit    │
│ (Ref)   │                │   Graph     │
└─────────┘                └─────────────┘

Atomic Model:
┌─────────┐                ┌─────────────┐
│ Stack │◀──────────────▶│   Changes   │
│ (State) │                │   (Patches) │
└─────────┘                └─────────────┘
```

### Benefits

1. **True Independence**: Changes on one stack don't affect others until explicitly merged
2. **Granular Control**: Cherry-pick individual changes between stacks with precision
3. **Mathematical Correctness**: Patch theory ensures consistency across stack operations
4. **Simplified Workflows**: No need for complex rebase or merge strategies
5. **Concurrent Development**: Multiple teams can work on separate stacks simultaneously

## Common Stack Patterns

### Feature Development

```bash
# Create a feature stack
atomic stack new feature-auth

# Switch to the feature stack
atomic stack switch feature-auth

# Work on your feature
atomic record -m "Add authentication module"
atomic record -m "Add login endpoint"

# Switch back to main
atomic stack switch main

# Selectively apply changes
atomic apply <change-hash>
```

### Release Stacks

```bash
# Create a release stack
atomic stack new release-1.0

# Apply only stable changes to release
atomic stack switch release-1.0
atomic apply <stable-change-1>
atomic apply <stable-change-2>

# Tag the release
atomic tag release-1.0 "v1.0.0"
```

### Experimental Stacks

```bash
# Create an experimental stack
atomic stack new experiment-new-api

# Try out ideas without affecting main development
atomic record -m "Experimental API design"

# If it works, merge back to main
atomic stack switch main
atomic pull . experiment-new-api

# If it doesn't work, just delete the stack
atomic stack delete experiment-new-api
```

### Team Stacks

```bash
# Each team maintains their own stack
atomic stack new team-frontend
atomic stack new team-backend
atomic stack new team-devops

# Teams work independently
atomic stack switch team-frontend
atomic record -m "Update UI components"

# Integration happens through selective merges
atomic stack switch main
atomic pull . team-frontend <specific-changes>
```

## Stack Lifecycle

### Creation

Stacks can be created from scratch or split from existing stacks:

```bash
# Create a new stack
atomic stack new <stack-name>

# Create a stack from a specific state
atomic stack new <stack-name> --from <change-hash>
```

### Switching

Move your working copy between stacks:

```bash
# Switch to a different stack
atomic stack switch <stack-name>

# List available stacks
atomic stack list
```

### Merging

Integrate changes between stacks:

```bash
# Pull all changes from another stack
atomic pull . <source-stack>

# Apply specific changes
atomic apply <change-hash>

# Push changes to a remote stack
atomic push <remote> <stack-name>
```

### Deletion

Remove stacks that are no longer needed:

```bash
# Delete a local stack
atomic stack delete <stack-name>

# Delete a remote stack
atomic push --delete <remote> <stack-name>
```

## Stack vs. Git Branch Comparison

| Feature | Git Branches | Atomic Stacks |
|---------|-------------|-----------------|
| **Data Model** | Pointer to commit | First-class sequence of changes |
| **Merging** | Three-way merge with conflicts | Patch-based automatic merging |
| **History** | Linear or graph-based | Change-oriented with dependencies |
| **Cherry-picking** | Can cause duplicate commits | Mathematically consistent |
| **Remote Sync** | Push/pull entire branch | Selective change synchronization |
| **Conflict Resolution** | Manual merge required | Automatic in most cases |

## Best Practices

### 1. Naming Conventions

Use clear, descriptive stack names that indicate purpose:

```bash
# Good names
atomic stack new feature-user-authentication
atomic stack new bugfix-memory-leak
atomic stack new experiment-new-parser
atomic stack new release-2.1

# Avoid generic names
atomic stack new temp
atomic stack new test
atomic stack new my-branch
```

### 2. Keep Stacks Focused

Each stack should have a clear purpose:

- **Feature Stacks**: One feature or related group of features
- **Bugfix Stacks**: Specific bug fixes
- **Release Stacks**: Stable release preparation
- **Experimental Stacks**: Exploratory work

### 3. Regular Integration

Integrate changes frequently to avoid divergence:

```bash
# Periodically sync with main
atomic stack switch feature-xyz
atomic pull . main

# Keep your feature stack up to date
atomic stack switch main
atomic pull origin main
atomic stack switch feature-xyz
atomic pull . main
```

### 4. Clean Up Old Stacks

Delete stacks that are no longer active:

```bash
# List all stacks
atomic stack list

# Delete merged feature stacks
atomic stack delete feature-completed-work

# Archive important stacks before deletion
atomic tag archive-feature-xyz "Archived feature work"
atomic stack delete feature-xyz
```

### 5. Use Descriptive Changes

When working on stacks, write clear change messages:

```bash
atomic record -m "[feature-auth] Add JWT token validation"
atomic record -m "[bugfix-123] Fix memory leak in parser"
```

## Stack Operations Reference

### Creating Stacks

```bash
# Basic creation
atomic stack new <name>

# Create from specific change
atomic stack new <name> --from <change-hash>

# Create and switch
atomic stack new <name> && atomic stack switch <name>
```

### Listing Stacks

```bash
# List local stacks
atomic stack list

# Show current stack
atomic stack current

# List remote stacks
atomic stack list --remote <remote>
```

### Switching Stacks

```bash
# Switch to existing stack
atomic stack switch <name>

# Switch and update working copy
atomic stack switch <name> && atomic reset
```

### Renaming Stacks

```bash
# Rename a stack
atomic stack rename <old-name> <new-name>
```

### Deleting Stacks

```bash
# Delete local stack
atomic stack delete <name>

# Force delete with unrecorded changes
atomic stack delete <name> --force
```

## Working with Remote Stacks

### Pushing Stacks

```bash
# Push stack to remote
atomic push <remote> <stack-name>

# Push all local stacks
atomic push <remote> --all

# Push and set upstream
atomic push -u <remote> <stack-name>
```

### Pulling Stacks

```bash
# Pull changes from remote stack
atomic pull <remote> <stack-name>

# Pull and create local stack
atomic pull <remote> <stack-name> --create-local
```

### Tracking Remote Stacks

```bash
# Set upstream for current stack
atomic stack set-upstream <remote>/<stack-name>

# Show upstream configuration
atomic stack show-upstream
```

## Advanced Stack Techniques

### Stack Splitting

Create a new stack based on a specific point in history:

```bash
# Split from a specific change
atomic stack new hotfix-production --from <production-change>

# Make emergency fixes
atomic record -m "Emergency security patch"

# Apply to multiple stacks
atomic stack switch main
atomic apply <hotfix-change>
atomic stack switch release-1.0
atomic apply <hotfix-change>
```

### Stack Comparison

Compare the state of different stacks:

```bash
# See differences between stacks
atomic diff --stack main --stack feature-xyz

# List changes unique to a stack
atomic log --stack feature-xyz --not-in main
```

### Stack Merging Strategies

Different approaches for integrating stack work:

**Fast-Forward Merge** (all changes):
```bash
atomic stack switch main
atomic pull . feature-complete
```

**Selective Merge** (specific changes):
```bash
atomic stack switch main
atomic apply <change-1>
atomic apply <change-3>
atomic apply <change-5>
```

**Squash Merge** (combine changes):
```bash
# Record a new change that incorporates all feature work
atomic stack switch main
atomic pull . feature-xyz
atomic unrecord <last-n-changes>
atomic record -m "Implement feature XYZ"
```

## Troubleshooting

### Stack Switch Issues

**Problem**: Cannot switch stacks due to unrecorded changes

```bash
# Solution 1: Record changes first
atomic record -m "WIP: Work in progress"
atomic stack switch <target>

# Solution 2: Reset working copy
atomic reset --hard
atomic stack switch <target>
```

**Problem**: Working copy out of sync after switch

```bash
# Solution: Update working copy
atomic reset
```

### Stack Conflicts

**Problem**: Conflicting changes between stacks

```bash
# Solution: Use Atomic's conflict resolution
atomic pull . <source-stack>
# Atomic will highlight conflicts in files
# Resolve conflicts and record
atomic record -m "Resolve conflicts from <source-stack>"
```

### Files Persist Across Stack Switches

**Problem**: Created a file on one stack, but it appears on other stacks when switching

```bash
# Example scenario:
atomic stack new feature
atomic record new-file.txt -m "Add feature"
atomic stack switch main
ls  # new-file.txt still exists!
```

**Why This Happens**: Stacks share the same working copy. Only **patch history** is isolated, not the filesystem.

**Solution**: This is expected behavior! The file is:
- ✅ Recorded on `feature` stack (in patch history)
- ❌ Untracked on `main` stack (not recorded there)

To verify isolation, check the logs:
```bash
atomic stack switch main
atomic log              # Does NOT show "Add feature" change

atomic stack switch feature
atomic log              # DOES show "Add feature" change
```

If you want to clean up untracked files:
```bash
atomic stack switch main
rm new-file.txt         # Manual cleanup
# Or add to .atomicignore to ignore it
```

See [Stacks are NOT Git Branches](#️-critical-difference-stacks-are-not-git-branches) for detailed explanation.

### Stack Not Found

**Problem**: Stack doesn't exist locally

```bash
# Solution: Pull from remote
atomic pull <remote> <stack-name> --create-local

# Or create new stack
atomic stack new <stack-name>
```

## Integration with Other Commands

Stacks work seamlessly with other Atomic commands:

- **`atomic record`**: Records changes to the current stack
- **`atomic apply`**: Applies changes from any stack to current stack
- **`atomic unrecord`**: Removes changes from current stack
- **`atomic push`**: Pushes current stack to remote
- **`atomic pull`**: Pulls changes into current stack
- **`atomic log`**: Shows history of current stack
- **`atomic diff`**: Compares changes in current stack
- **`atomic tag`**: Tags current stack state

## Stack Command Reference

For detailed information about the stack command, see:

- [**`atomic stack`**](./stack.md) - Complete stack management reference

## Native Stacked Diffs: Compositional Patch Workflow

Atomic provides **the only truly native stacked diffs solution** because patches with dependency tracking ARE stacking. Unlike Git-based platforms that require complex tooling (Graphite, Gerrit) to paper over snapshot-based commits, Atomic's patch-based model makes stacked workflows natural and requires zero additional infrastructure.

### The Core Insight

**In Atomic, stacking happens automatically.** Every time you `atomic record`, you create a patch that depends on the current state. Three consecutive records = a stack of three changes. No "stack create" command needed, no metadata files, no rebasing ever.

```bash
# This creates a stack naturally:
atomic record -m "Add database schema"    # Change 1
atomic record -m "Add API endpoint"       # Change 2 (depends on 1)
atomic record -m "Add UI component"       # Change 3 (depends on 2)

# You now have a stack: 1 → 2 → 3
# Dependencies tracked automatically in the graph
```

### Why This is Revolutionary

**The Stacked Diffs Problem (from Git):**
- Finish Feature A, submit for review → wait for approval
- Can't start Feature B (depends on A) → context switch, productivity loss
- Tools like Graphite try to fix this with complex rebasing and metadata

**The Atomic Solution:**
- Finish Feature A → `atomic record` → immediately start Feature B
- Feature B automatically depends on A (tracked in graph)
- No waiting, no rebasing, no context switching
- Changes maintain identity (hash never changes)

### The Basic Workflow

#### 1. Creating a Stack (Keep Working Continuously)

```bash
# Start a feature stack (optional - helps organize work)
atomic stack new feature-auth
atomic stack switch feature-auth

# Build continuously without waiting for reviews
atomic record schema.sql -m "Add user schema"       # ABC123
atomic record api.js -m "Add API endpoint"          # DEF456 (depends on ABC123)
atomic record ui.jsx -m "Add frontend UI"           # GHI789 (depends on DEF456)
atomic record tests.js -m "Add integration tests"   # JKL012 (depends on GHI789)

# Push for review (all changes submitted immediately)
atomic push origin feature-auth

# You've created a stack! Dependencies are automatic:
# JKL012 → GHI789 → DEF456 → ABC123 → main

#### 2. Viewing Your Stack

```bash
# See your stack with dependencies
atomic log

# See what depends on a specific change
atomic dependents ABC123
# Output: DEF456, GHI789, JKL012 (everything that depends on ABC123)

#### 3. Updating a Change (Forward-Only Progression!)

**Scenario:** Reviewer requests changes to ABC123 (the database schema).

**Git workflow** would require:
1. Checkout the commit
2. Amend it (changes hash!)
3. Rebase all dependent commits (changes all hashes!)
4. Resolve conflicts
5. Force push

**Atomic workflow** (forward-only):
```bash
# IMPORTANT: Atomic is forward-only - you can only amend the TIP of the stack!
# You cannot amend changes that have dependents.

# If ABC123 has dependents, you have two options:

# Option 1: Unrecord dependents, amend, then re-record
atomic unrecord GHI789  # Unrecord in reverse dependency order
atomic unrecord DEF456
atomic unrecord ABC123  # Now you can unrecord ABC123

# Make your changes
vi schema.sql
atomic record schema.sql -m "Better schema"  # Creates new change with new hash

# Rebuild the stack forward
atomic record api.js -m "Add API endpoint"      # Re-create DEF456
atomic record ui.jsx -m "Add frontend UI"       # Re-create GHI789

# Option 2: Create a new change that supersedes the old one
# Keep building forward on the stack
atomic record schema-fixes.sql -m "Schema improvements"  # XYZ123 (new change)
# Stack is now: ABC123 → DEF456 → GHI789 → XYZ123
# When landing, you can choose which changes to apply

# Push updates
atomic push origin feature-auth
```

**What's happening:**
- Atomic is **forward-only** - history always grows forward
- You can't rewrite history that other changes depend on
- `--amend` only works on the tip of the stack (latest change with no dependents)
- When you amend, you create a NEW change with a NEW hash (content-addressed)
- This ensures mathematical consistency in the dependency graph

#### 4. Landing Changes Individually

**As changes are approved, land them individually:**

```bash
```bash
# ABC123 approved - land it
atomic stack switch main
atomic apply ABC123

# Atomic automatically updates remaining changes:
# - DEF456, GHI789, JKL012 now depend on main (which includes ABC123)
# - Hashes stay the same!

# DEF456 approved - land it
atomic apply DEF456
# Remaining changes (GHI789, JKL012) update to depend on new main

# Continue until stack is complete
atomic apply GHI789
atomic apply JKL012
```

**The power:**
- Forward-only progression means no history rewriting
- Each change lands independently when ready
- Dependencies are forward pointers that naturally update
- No "merge the whole PR or nothing"

## Advanced: Nested Stacks (Multi-Dimensional Patching)

This is where Atomic becomes revolutionary: **stacks of stacks with compositional merging**.

### Use Case 1: Experimental Stacks

```bash
# Building a feature
atomic stack new feature-payments
atomic record db.sql -m "Payment schema"        # ABC
atomic record api.js -m "Payment API"           # DEF

# Try a different approach without losing current work
atomic split payments-refactor                   # Split from current state
atomic stack switch payments-refactor

# Build alternative implementation
atomic record api-v2.js -m "Rewrite API"        # GHI (completely different)
atomic record tests.js -m "New test suite"      # JKL

# Test shows refactor is better! Bring it back to parent
atomic stack switch feature-payments
atomic apply GHI   # Cherry-pick the rewrite
atomic apply JKL   # Get the tests

# DEF is now semantically replaced by GHI
# Atomic's semantic merge understands the relationship
```

### Use Case 2: Parallel Review with Major Revisions

```bash
# Build initial stack
atomic stack new user-management
atomic record schema.sql -m "User schema"       # ABC (in review)
atomic record api.js -m "User API"              # DEF (not ready yet)
atomic record ui.jsx -m "User UI"               # GHI (not ready yet)

# Reviewer: "ABC needs major rewrite, but don't block DEF/GHI"
# Solution: Rework in isolation

atomic split schema-rework                       # New stack for experimentation
atomic stack switch schema-rework

# Completely rewrite the schema
atomic record schema-v2.sql -m "Better schema"  # XYZ

# Test with API (bring it to experiment stack)
atomic apply DEF   # Now testing XYZ + DEF together
# Works!

# Test with UI too
atomic apply GHI   # Now testing XYZ + DEF + GHI
# All good!

# Bring the rewrite back to parent
atomic stack switch user-management
atomic apply XYZ   # Land the new schema

# Atomic semantically updates DEF and GHI:
# - They now depend on XYZ instead of ABC
# - Hashes stay the same
# - Dependencies are forward pointers
```

### Use Case 3: Multi-Team Collaboration

```bash
# Backend team starts
atomic stack new feature-backend
atomic record schema.sql -m "Schema"            # ABC
atomic record api.js -m "API"                   # DEF

# Frontend team splits to work in parallel
atomic split feature-frontend
atomic stack switch feature-frontend
atomic record ui.jsx -m "UI"                    # GHI
atomic record styles.css -m "Styles"            # JKL

# Backend team improves API
atomic stack switch feature-backend
atomic record api-v2.js -m "API improvements"   # MNO

# Frontend pulls backend's improvements
atomic stack switch feature-frontend
atomic apply MNO   # Get the API improvements
# GHI and JKL automatically update to work with MNO!

# Frontend finishes first - contribute back
atomic stack switch feature-backend
atomic apply GHI   # Pull UI to backend stack
atomic apply JKL   # Pull styles

# Now backend stack has everything: ABC, MNO, GHI, JKL
# Land to main as each piece is approved
```

## Why Atomic is the ONLY Native Solution

### Git + Graphite/Gerrit Limitations

**Problem 1: Rebasing Required**
- Change an earlier commit → rewrite all dependent commits
- All commit hashes change
- Complex tooling to manage
- Frequent conflicts

**Problem 2: Metadata Files**
- Need `.graphite` or `Change-Id` tracking
- Metadata can get out of sync
- Doesn't work offline
- Requires external tool

**Problem 3: No Semantic Merge**
- Can't move changes between branches without duplicates
- Can't cherry-pick without creating new commits
- Can't compose patches from different branches

### Atomic's Native Advantages

**1. No Rebasing - Forward-Only Progression**
```bash
# Amend only works on tip of stack (no dependents)
atomic record --amend ABC123  # Only if nothing depends on ABC123

# For changes with dependents, evolve forward:
atomic record -m "Improved version"  # Creates new change
# History grows forward, never rewrites backward
```

**2. No Metadata - Graph IS the Truth**
```bash
# Dependencies tracked in database graph
atomic dependents ABC123  # Query the graph directly
# No external files, no sync issues
```

**3. Semantic Merge - Compositional Patching**
```bash
# Same change = same hash everywhere
# Can move patches between stacks
atomic apply <hash>  # Works across any stack
# Semantic merge understands relationships
```

**4. Multi-Dimensional Stacking**
```bash
# Stacks can split and merge
atomic split experiment     # Branch for experiments
atomic apply <hash>         # Compose patches back
# Patches maintain identity across all stacks
```

## The Mathematical Foundation

Atomic's patch theory provides guarantees that make this possible:

1. **Commutativity**: If patches A and B don't conflict, they can be applied in any order
2. **Associativity**: (A + B) + C = A + (B + C)
3. **Content-Addressed**: Same content = same hash, always
4. **Forward Dependencies**: Changes reference what they depend on, not what depends on them

This means:
- No hidden state (unlike Git's implicit parent pointers)
- Predictable merge behavior
- Change identity is immutable
- Patches compose naturally

## CLI Commands Reference

### Essential Commands

```bash
# Create and manage stacks
atomic stack new <name>           # Create new stack
atomic split <name>               # Split current stack (create child)
atomic stack switch <name>        # Switch between stacks
atomic stack list                 # List all stacks

# Build your stack (core workflow)
atomic record -m "message"        # Add change to current stack
atomic record --amend <hash>      # Update existing change (no rebasing!)

# View dependencies
atomic log                        # See changes in current stack
atomic dependents <hash>          # See what depends on a change

# Move patches between stacks
atomic apply <hash>               # Apply change from any stack to current

# Land to main
atomic stack switch main
atomic apply <hash>               # Land individual changes as approved
```

### Advanced Commands (Planned)

```bash
# Stack visualization
atomic log --deps                 # Show dependency graph
atomic stack show --tree          # Show stack hierarchy

# Dependency management
atomic dependents <hash> --all    # Show deps across all stacks
atomic stack merge <child>        # Merge child stack into parent

# Change management
atomic stack split-change <hash>  # Split large change into smaller ones
atomic stack squash <hash1> <hash2>  # Combine changes
```



## Comparison: Atomic vs Everything Else

| Feature | Git + Graphite | Gerrit | Phabricator | **Atomic** |
|---------|----------------|--------|-------------|------------|
| **Rebasing Required** | Constant | Frequent | Frequent | ✅ **Never** |
| **Change Identity** | Changes on rebase | Stable Change-Id | Stable | ✅ **Immutable hash** |
| **Nested Stacks** | ❌ Complex | ❌ No | ❌ No | ✅ **Native** |
| **Dependency Tracking** | Metadata files | Server-side | Server-side | ✅ **In graph DB** |
| **Semantic Merge** | ❌ | ❌ | ❌ | ✅ **Patch theory** |
| **Offline Stacking** | Limited | ❌ | ❌ | ✅ **Full** |
| **Multi-dimensional** | ❌ | ❌ | ❌ | ✅ **Compositional** |
| **External Tool** | Required | Optional | Required | ✅ **None** |

## Real-World Workflow Example

```bash
# Day 1: Start feature, build continuously
atomic stack new user-management
atomic stack switch user-management

atomic record schema.sql -m "Add users table"       # ABC
atomic record api.js -m "User CRUD API"             # DEF
atomic record ui.jsx -m "User list UI"              # GHI
atomic record tests.js -m "Integration tests"       # JKL

# Push entire stack for review
atomic push origin user-management

# Day 2: Reviewer wants schema changes
# ABC has dependents, so we evolve forward
atomic unrecord JKL  # Remove dependent changes in reverse order
atomic unrecord GHI
atomic unrecord DEF
atomic unrecord ABC

# Make improvements
vi schema.sql
atomic record schema.sql -m "Improved user schema"  # New ABC (new hash!)
atomic record api.js -m "User CRUD API"             # Re-create DEF
atomic record ui.jsx -m "User list UI"              # Re-create GHI
atomic record tests.js -m "Integration tests"       # Re-create JKL

# Forward-only: history never rewrites, only grows
atomic push origin user-management

# Day 2 (later): Try different UI approach
atomic split ui-experiment
atomic stack switch ui-experiment
atomic record ui-v2.jsx -m "Alternative UI"        # MNO

# Day 3: Like the new UI, bring it back
atomic stack switch user-management
atomic apply MNO  # Replace GHI with MNO
atomic push origin user-management

# Day 4: Main moves forward with security patch
atomic stack update
# All changes update to new main (no rebase!)
atomic push origin user-management

# Day 5-7: Land as approved
atomic stack switch main
atomic apply ABC  # Schema approved
atomic apply DEF  # API approved
atomic apply MNO  # New UI approved
atomic apply JKL  # Tests approved

# Stack complete! No rebasing ever happened.
```

## Implementation Status

**Current (v1.3.0):**
- ✅ Stack working copy isolation fixed
- ✅ `atomic stack new/switch/list` - Stack management
- ✅ `atomic split` - Create child stacks
- ✅ `atomic record` - Natural stacking
- ✅ `atomic apply` - Move patches between stacks
- ✅ `atomic dependents` - Query dependency graph

**Phase 1 (Q1 2025):**
- [ ] `atomic stack cascade` - Push changes from parent to all child stacks *(KILLER FEATURE)*
- [ ] `atomic stack status` - Show if stack is behind parent
- [ ] `atomic record --amend` - Update tip of stack (forward-only)
- [ ] `atomic log --deps` - Visualize dependency graph
- [ ] Better CLI output showing dependencies
- [ ] `atomic stack merge` - Merge child stack to parent

**Phase 2 (Q2 2025):**
- [ ] Web UI stack visualization
- [ ] Per-change code review interface
- [ ] Real-time collaboration features
- [ ] CI integration per change

**Phase 3 (Q3 2025):**
- [ ] Automated landing workflows
- [ ] Smart conflict detection
- [ ] Multi-stack dependency visualization
- [ ] Performance optimizations

---

## See Also

- [Remote Operations](./remote-operations.md) - Working with remote stacks
- [Working with Changes](./working-with-changes.md) - Recording and managing changes
- [Tags](./tags.md) - Tagging stack states for releases
- [Repository Management](./repository-management.md) - Setting up repositories with stacks

---

**Next Steps:**
- Explore [stack command](./stack.md) for detailed usage
- Learn about [remote operations](./remote-operations.md) for distributed workflows
- Understand [change management](./working-with-changes.md) within stacks
