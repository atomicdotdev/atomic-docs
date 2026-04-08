---
sidebar_position: 3
title: Stacked Diffs
---

# Stacked Diffs with Atomic

Stacked diffs (also called "stacked changes" or "patch stacks") are a powerful workflow pattern where you build multiple logical changes on top of each other, each representing a reviewable unit of work.

## What are Stacked Diffs?

A **stacked diff** is a series of changes where each change builds on the previous one, creating a dependency chain. Instead of one massive change with 50 files, you create 5 focused changes with 10 files each.

### Example Stack

```
Feature Implementation Stack:
┌─────────────────────────────────┐
│ Change 5: Integration tests     │ ← Top of stack
├─────────────────────────────────┤
│ Change 4: API routes            │
├─────────────────────────────────┤
│ Change 3: Business logic        │
├─────────────────────────────────┤
│ Change 2: Database schema       │
├─────────────────────────────────┤
│ Change 1: Type definitions      │ ← Base
└─────────────────────────────────┘
```

## Why Use Stacked Diffs?

### 1. Better Code Review
- **Focused Reviews**: Each change is small and reviewable in minutes
- **Clear Context**: Reviewers understand the progression
- **Faster Approval**: Small changes get approved quickly
- **Better Feedback**: Easier to spot issues in focused changes

### 2. Parallel Development
- **Don't Wait**: Continue building while earlier changes are under review
- **Stay Productive**: Keep moving forward without blocking
- **Easy Iteration**: Update individual changes without rebuilding everything

### 3. Easier Debugging
- **Bisect Changes**: Find which change introduced a bug
- **Selective Testing**: Test each layer independently
- **Rollback Precision**: Remove problematic changes without affecting others

## Atomic vs Git: Key Differences

### Git's Problem

In Git, stacked changes require rebasing when the base changes:

```bash
# Git stacked branches
git checkout -b feature-1
git commit -m "Step 1"

git checkout -b feature-2
git commit -m "Step 2"

# If feature-1 gets updated after review:
git checkout feature-1
git commit --amend  # Change the commit

git checkout feature-2
git rebase feature-1  # REQUIRED: Rebase to get updates
# Conflict potential! Commit hashes change!
```

**Problems**:
- Rebase required for every update to base changes
- Commit hashes change (breaks references, discussions)
- Conflicts happen during rebase
- Linear history assumption breaks parallel work

### Atomic's Solution

Atomic's change identity and commutative merges eliminate rebasing:

```bash
# Atomic stacked changes
atomic view create feature-work
atomic record src/types.rs -m "Step 1"  # Change ABC

atomic record src/logic.rs -m "Step 2"  # Change DEF
# DEF depends on ABC automatically

# If ABC gets updated after review:
atomic unrecord ABC  # Remove old version
atomic record src/types.rs -m "Step 1 (updated)"  # Change ABC' (new hash)

# Step 2 still works! No rebase needed!
atomic insert DEF  # Atomic handles dependency automatically
```

**Benefits**:
- No rebasing required
- Changes maintain identity even when base changes
- Conflicts detected at application time (more flexible)
- True parallel development

## Building Your First Stack

### Step 1: Create a View

```bash
# Create a new view for your feature
atomic view create feature/user-auth
atomic view switch feature/user-auth
```

### Step 2: Build Changes Incrementally

```bash
# Change 1: Add types
vi src/types/user.rs
atomic record src/types/user.rs -m "Add User type definition"
# Output: Change ABC123 recorded

# Change 2: Add database schema (depends on types)
vi migrations/001_users.sql
atomic record migrations/001_users.sql -m "Add users table schema"
# Output: Change DEF456 recorded (depends on ABC123)

# Change 3: Add authentication logic
vi src/auth/login.rs
atomic record src/auth/login.rs -m "Implement login logic"
# Output: Change GHI789 recorded (depends on DEF456)

# Change 4: Add API routes
vi src/api/auth.rs
atomic record src/api/auth.rs -m "Add auth API endpoints"
# Output: Change JKL012 recorded (depends on GHI789)
```

### Step 3: View Your Stack

```bash
# See the dependency chain
atomic log --deps

# Output:
# JKL012 - Add auth API endpoints
#   └─ GHI789 - Implement login logic
#      └─ DEF456 - Add users table schema
#         └─ ABC123 - Add User type definition
```

### Step 4: Push for Review

```bash
# Push entire view to remote
atomic push --stack feature/user-auth

# Or push individual changes
atomic push ABC123 DEF456  # Just types and schema
```

## Working with Stack Changes

### Updating a Change in the Middle

Unlike Git, updating changes is straightforward:

```bash
# Current stack: ABC → DEF → GHI → JKL
atomic log --graph

# Update the middle change (DEF)
atomic unrecord DEF
vi migrations/001_users.sql  # Make improvements
atomic record migrations/001_users.sql -m "Add users table (v2)"
# New change: DEF' (different hash)

# Dependent changes (GHI, JKL) still work!
atomic insert GHI  # Automatically uses DEF'
atomic insert JKL  # Still applies correctly
```

### Reordering Changes

If changes are independent, reorder freely:

```bash
# Current: ABC → DEF → GHI
# Want: ABC → GHI → DEF

atomic unrecord DEF GHI  # Remove both
atomic insert GHI         # Insert in new order
atomic insert DEF
```

### Splitting a Large Change

```bash
# You have a large change XYZ
atomic show XYZ
# Output: 20 files modified

# Split into logical pieces
atomic split-change XYZ \
  --files src/types/*.rs \
  -m "Part 1: Type definitions"

atomic split-change XYZ \
  --files src/logic/*.rs \
  -m "Part 2: Business logic"

# Now you have XYZ-1 and XYZ-2 that reviewers can handle separately
```

### Squashing Changes

```bash
# Combine two related changes
atomic squash ABC DEF -m "Combined type and schema changes"
# Output: New change with combined hunks
```

## Review Workflow

### Push Changes Individually

```bash
# Push just the base change for initial review
atomic push ABC

# Continue working on dependent changes locally
atomic record more-work.rs -m "Building on ABC"

# When ABC is approved, push next layer
atomic push DEF
```

### Update After Review Feedback

```bash
# Reviewer comments on ABC
atomic show ABC  # Review the change

# Update it
atomic unrecord ABC
vi src/types/user.rs  # Address feedback
atomic record src/types/user.rs -m "Add User type (v2)"

# Push updated version
atomic push ABC

# Dependent changes still work without modification!
```

## Advanced Patterns

### Parallel Views from Same Base

```bash
# Create two independent views from main
atomic view create feature/frontend
atomic view create feature/backend

# Both can pull the same base changes
atomic view switch feature/frontend
atomic pull ABC DEF  # Pull backend types

atomic view switch feature/backend
atomic pull ABC DEF  # Same changes, same hashes!
```

### Cascading Updates

When a base change is updated, all views using it can pull the update:

```bash
# View A updates shared change ABC
atomic unrecord ABC
atomic record src/shared.rs -m "Shared types (v2)"
atomic push ABC

# View B can pull the update
atomic view switch feature-b
atomic pull ABC  # Gets the updated version

# Atomic handles dependency updates automatically
```

### Cherry-Picking Changes

Pull specific changes from other views without the full history:

```bash
# You want just change DEF from another view
atomic pull DEF

# Atomic automatically pulls dependencies (ABC) if needed
# But NOT unrelated changes (GHI, JKL)
```

## Best Practices

### 1. Keep Changes Focused

Each change should:
- ✅ Do one logical thing
- ✅ Be independently reviewable
- ✅ Pass tests on its own (if possible)
- ❌ Mix unrelated concerns

### 2. Write Clear Messages

```bash
# Good messages
atomic record -m "Add User authentication type"
atomic record -m "Implement JWT token validation"
atomic record -m "Add /login API endpoint"

# Bad messages
atomic record -m "Updates"
atomic record -m "Fix stuff"
atomic record -m "Work in progress"
```

### 3. Test Each Layer

```bash
# After each change, verify it works
atomic record src/feature.rs -m "Add feature"
cargo test  # Make sure tests pass

atomic record src/api.rs -m "Add API"
cargo test  # Verify again
```

### 4. Push Early, Push Often

```bash
# Don't wait to push entire stack
atomic record types.rs -m "Add types"
atomic push  # Push immediately for early feedback

# Continue building while under review
atomic record logic.rs -m "Add logic"
```

### 5. Use Descriptive View Names

```bash
# Good view names
atomic view create feature/user-authentication
atomic view create bugfix/memory-leak-in-parser
atomic view create refactor/extract-database-layer

# Bad view names
atomic view create my-work
atomic view create temp
atomic view create asdf
```

## Common Workflows

### Building a Complex Feature

```bash
# Day 1: Foundation
atomic view create feature/payment-system
atomic record types.rs -m "Payment types"
atomic record schema.sql -m "Payment tables"
atomic push

# Day 2: Core logic (while Day 1 under review)
atomic record processor.rs -m "Payment processor"
atomic record validation.rs -m "Payment validation"
atomic push

# Day 3: Integration
atomic record api.rs -m "Payment API endpoints"
atomic record webhooks.rs -m "Payment webhooks"
atomic push

# Day 4: Address review feedback on Day 1
atomic unrecord <types-hash>
vi types.rs  # Fix issues
atomic record types.rs -m "Payment types (v2)"
atomic push

# Days 2-3 changes still work! No rebase needed!
```

### Experimental View Pattern

```bash
# Start experiment on separate view
atomic view create experiment/new-algorithm
atomic record algorithm.rs -m "Try new approach"

# If successful, merge back
atomic view switch main
atomic pull <algorithm-hash>

# If failed, just delete view
atomic view delete experiment/new-algorithm
# Change stays in global store, can recover if needed
```

## Comparison with Git Workflows

| Workflow | Git | Atomic |
|----------|-----|--------|
| **Create view** | `git checkout -b` | `atomic view create` |
| **Add change** | `git commit` | `atomic record` |
| **Update base** | `git rebase` (required) | Automatic |
| **Reorder changes** | `git rebase -i` | `atomic unrecord` + `atomic insert` |
| **Split change** | Manual history rewrite | `atomic split-change` |
| **Push for review** | `git push` | `atomic push` |
| **Handle conflicts** | During rebase | During insert (more flexible) |
| **Change identity** | Hash changes on rebase | Hash stays same |

## Troubleshooting

### Change Won't Insert

```bash
# If a change conflicts:
atomic insert ABC
# Error: Conflict in src/file.rs

# Option 1: Fix conflicts and amend
atomic insert ABC --interactive
# Resolve conflicts, then:
atomic record src/file.rs -m "Resolved version"

# Option 2: Skip the change
atomic unrecord ABC
# Continue without it
```

### Dependency Issues

```bash
# If dependencies are wrong:
atomic show ABC --deps
# See what ABC depends on

# If you need to change dependencies:
atomic unrecord ABC
atomic insert <new-deps>
atomic record files -m "ABC with updated deps"
```

### View Got Messy

```bash
# View current state
atomic log --graph

# Option 1: Reorder cleanly
atomic unrecord --all  # Remove all from view
atomic insert ABC DEF GHI  # Reinsert in order

# Option 2: Create fresh view
atomic view create feature-clean
atomic pull ABC DEF GHI  # Pull changes to new view
atomic view switch feature-clean
```

## Next Steps

- Read [AI Agent Workflows](ai-agent-workflows.md) for agent-based stacked changes
- See [Views Command Reference](../commands/view.md) for all view operations
- Learn about [Change Identity](../concepts/change-identity) for deeper understanding

## Summary

Stacked diffs in Atomic provide:

- ✅ **Better reviews**: Small, focused changes
- ✅ **Parallel work**: Build while reviewing
- ✅ **No rebasing**: Changes maintain identity
- ✅ **Flexible iteration**: Update any layer easily
- ✅ **True independence**: Commutative merge semantics

Unlike Git's branch-based stacks that require constant rebasing, Atomic's change-based model makes stacked workflows natural and friction-free.