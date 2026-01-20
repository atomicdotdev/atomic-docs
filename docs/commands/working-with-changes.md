---
sidebar_position: 2
title: Working with Changes
---

# Working with Changes

Commands for recording, viewing, and managing changes in your Atomic repository. These are the core commands you'll use daily to track your work and understand repository history.

## Commands in this Category

### [`atomic record`](./record.md)

Record changes from the working copy as a new change in the repository.

**Use when:**
- Saving your work to the repository
- Creating checkpoints in development
- Recording AI-assisted contributions with attribution

**Quick example:**
```bash
atomic record -m "Add user authentication"
```

### [`atomic apply`](./apply.md)

Apply a change to a stack from a change file.

**Use when:**
- Applying changes from other repositories
- Cherry-picking specific changes
- Integrating patches received via other means

**Quick example:**
```bash
atomic apply ABCD1234...
```

### [`atomic unrecord`](./unrecord.md)

Remove changes from a stack's history.

**Use when:**
- Correcting mistakes before pushing
- Removing unwanted changes
- Cleaning up experimental work

**Quick example:**
```bash
atomic unrecord --reset
```

### [`atomic diff`](./diff.md)

Show differences between the working copy and recorded state.

**Use when:**
- Reviewing changes before recording
- Understanding what you've modified
- Checking specific file changes

**Quick example:**
```bash
atomic diff src/
```

### [`atomic status`](./status.md)

Show a summary of working copy status.

**Use when:**
- Getting a quick overview of what's changed
- Checking which files are modified, added, or deleted
- Finding untracked files
- Scripting and CI/CD integration

**Quick example:**
```bash
atomic status
atomic status -s -u  # Short format with untracked files
```

### [`atomic log`](./log.md)

Display the history of changes in a stack.

**Use when:**
- Viewing repository history
- Finding specific changes
- Generating reports or audits
- Tracking AI contributions

**Quick example:**
```bash
atomic log --limit 10 --attribution
```

## Common Workflows

### Basic Recording Workflow

```bash
# Make changes to your files
vim src/main.rs

# Quick status check
atomic status

# Review what changed in detail
atomic diff

# Record the changes
atomic record -m "Add new feature"

# View history
atomic log --limit 5
```

### Recording AI-Assisted Changes

```bash
# Record with AI attribution
atomic record -m "AI generated feature" \
  --ai-assisted \
  --ai-provider cursor \
  --ai-model gpt-4 \
  --ai-confidence 0.95

# View AI contributions
atomic log --ai-only --attribution
```

### Selective Recording

```bash
# Record only specific files
atomic record src/auth.rs src/middleware.rs -m "Update auth"

# Record specific directory
atomic record docs/ -m "Update documentation"
```

### Reviewing and Undoing Changes

```bash
# Quick status overview
atomic status

# Review current changes in detail
atomic diff --files

# Record if satisfied
atomic record -m "Implement feature"

# Or unrecord if you change your mind
atomic unrecord
```

### Applying Changes from Others

```bash
# Apply a specific change
atomic apply MNYNGT2V...

# Apply with dependencies
atomic apply --deps-only ABCD1234...
```

## Key Concepts

### Changes vs Commits

**Atomic changes** are semantic patches that represent operations:
- Represent the *meaning* of your edits
- Can be applied in any order (commutative)
- Cryptographically identified by content hash
- Enable conflict-free merging

Unlike Git commits (snapshots), Atomic changes are **operations**.

### Working Copy vs Pristine

- **Working Copy**: Your actual files that you edit
- **Pristine**: The database representation of recorded state
- **Recording**: Computes diff and creates a change patch

### Change Dependencies

Atomic automatically computes dependencies:
- Changes that modify the same code
- Operations on files created by earlier changes
- Semantic dependencies in the patch theory

These form a **directed acyclic graph (DAG)** ensuring consistency.

### Change Hashes

Each change has a unique 53-character Base32 hash:
```
MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
```

These hashes are:
- Content-addressable (derived from change content)
- Cryptographically secure
- Globally unique across all repositories

## Recording Best Practices

### Change Messages

✅ **Good change messages:**
```bash
atomic record -m "Add JWT authentication middleware"
atomic record -m "Fix memory leak in connection pool"
atomic record -m "Update API documentation for v2 endpoints"
```

❌ **Poor change messages:**
```bash
atomic record -m "fix"
atomic record -m "updates"
atomic record -m "wip"
```

### When to Record

**Good times to record:**
- After completing a logical unit of work
- Before switching tasks
- After passing tests
- Before taking a break
- When AI completes a suggestion

**Avoid:**
- Recording broken code (unless explicitly marked WIP)
- Mixing unrelated changes
- Recording without reviewing with `diff`

### Atomic Changes

Keep changes **atomic** (focused on one thing):

✅ **Good:**
```bash
# One change per feature
atomic record -m "Add user authentication"
atomic record -m "Add user profile page"
```

❌ **Bad:**
```bash
# Too many unrelated things
atomic record -m "Add auth, fix bugs, update docs, refactor DB"
```

## AI Attribution Best Practices

### When to Mark AI-Assisted

Mark changes as AI-assisted when:
- AI generated the entire change
- AI suggested code you modified
- You collaborated with AI on the implementation
- AI refactored your code

### Tracking Different AI Contributions

```bash
# AI generated everything
atomic record -m "Generate API client" \
  --ai-assisted \
  --ai-suggestion-type complete \
  --ai-confidence 0.95

# You modified AI suggestions
atomic record -m "Add caching layer" \
  --ai-assisted \
  --ai-suggestion-type partial \
  --ai-confidence 0.75

# Collaborative development
atomic record -m "Implement algorithm" \
  --ai-assisted \
  --ai-suggestion-type collaborative \
  --ai-confidence 0.85
```

## Performance Tips

### Recording
- Small changes (&lt; 10 files): &lt; 100ms
- Medium changes (10-100 files): &lt; 1 second
- Large changes (1000+ files): &lt; 10 seconds

### Viewing History
- Use `--limit` for large repositories
- Filter with `--path` for specific files
- Use `--hash-only` for scripting

### Diffing
- Specify paths to diff specific files
- Use `--patience` for better refactoring diffs
- Consider `--unified` for more/less context

## Troubleshooting

### Nothing to Record

```bash
atomic diff  # Shows no changes
```

**Solution**: Make sure files are tracked with `atomic add`

### Unrecorded Changes Warning

```
Warning: Unrecorded changes in working copy
```

**Solution**: Record or reset changes before switching operations

### Large Diff Performance

If `diff` is slow on large changes:

```bash
# Diff specific paths
atomic diff src/specific-module/

# Use hash-only for quick check
atomic log --hash-only --limit 1
```

## Next Steps

After mastering change management:

1. [Learn about stacks](./stack.md) - Branch management
2. [Explore tagging](./tag.md) - Consolidating dependencies
3. [Share your work](./push.md) - Collaborate with remotes
4. [Track AI contributions](./attribution.md) - Detailed attribution

## See Also

- [Repository Management](./repository-management.md) - Setting up repositories
- [Remote Operations](./remote-operations.md) - Push and pull changes
- [Identity & Attribution](./identity-attribution.md) - Track contributions