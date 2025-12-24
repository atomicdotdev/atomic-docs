---
sidebar_position: 15
title: git
---

# atomic git

Import a Git repository into Atomic, converting commits to changes.

## Synopsis

```bash
atomic git [GIT_PATH] [ATOMIC_PATH]
```

## Description

The `git` command imports an existing Git repository into Atomic, converting the entire Git history into Atomic changes. This is the primary way to migrate from Git to Atomic VCS.

When you run `atomic git`, Atomic:

1. Reads the Git repository history
2. Converts each Git commit into an Atomic change
3. Preserves commit messages, authors, and timestamps
4. Creates Atomic stacks from Git branches
5. Converts Git tags to Atomic tags
6. Maintains your working copy
7. Detects and preserves AI attribution information (if present in commit messages)

The import process is **non-destructive** - your original Git repository remains unchanged.

## Arguments

### `[GIT_PATH]`

Optional path to the Git repository to import. If not specified, uses the current directory.

```bash
# Import Git repo from current directory
atomic git

# Import from specific path
atomic git /path/to/git/repo

# Import from different location
atomic git ~/projects/my-git-repo
```

### `[ATOMIC_PATH]`

Optional path where the Atomic repository should be created. If not specified, creates `.atomic` directory in the Git repository location.

```bash
# Import to same directory
atomic git /path/to/git/repo

# Import to different location
atomic git /path/to/git/repo /path/to/atomic/repo
```

## Options

### `--stats <FILE>`

Time the import and output statistics to a file. Hidden option for debugging and performance analysis.

```bash
atomic git --stats import-stats.txt
```

## Examples

### Basic Import

```bash
# Navigate to your Git repository
cd ~/projects/my-project

# Import the Git history
atomic git

# Verify the import
atomic log --limit 10
atomic stack list
```

### Import from Different Location

```bash
# Import Git repo from elsewhere
atomic git ~/old-projects/legacy-app ~/new-projects/atomic-app

# Navigate to the new location
cd ~/new-projects/atomic-app

# Verify
atomic log
```

### Import and Continue Working

```bash
# Import existing Git project
cd my-git-project
atomic git

# Continue with Atomic
atomic stack list
atomic record -m "First change with Atomic"
atomic push
```

## Import Process

### Phase 1: Validation

Atomic first checks the Git repository:

```
Checking Git repository...
✓ Git repository found
✓ No uncommitted changes
✓ Reading Git history...
```

**Important**: The Git working directory must be clean (no uncommitted changes) before importing.

### Phase 2: History Import

Atomic reads the Git history and converts it:

```
Importing Git commits...
  ✓ Commit 1/150: Initial commit
  ✓ Commit 2/150: Add feature X
  ✓ Commit 3/150: Fix bug Y
  ...
  ✓ Commit 150/150: Latest work

Imported 150 commits as Atomic changes
```

### Phase 3: Branch Conversion

Git branches are converted to Atomic stacks:

```
Converting branches...
  ✓ main → stack "main"
  ✓ develop → stack "develop"
  ✓ feature/auth → stack "feature/auth"

Created 3 stacks
```

### Phase 4: Tag Conversion

Git tags are converted to Atomic tags:

```
Converting tags...
  ✓ v1.0.0 → tag "v1.0.0"
  ✓ v1.1.0 → tag "v1.1.0"

Created 2 tags
```

### Phase 5: Completion

```
✓ Import complete!
Repository ready at: .atomic/
Use 'atomic log' to view history
```

## What Gets Imported

### ✅ Preserved

- **Commit history** - All commits as Atomic changes
- **Commit messages** - Preserved verbatim
- **Author information** - Name, email, and timestamp
- **Branch structure** - Converted to stacks
- **Tags** - Converted to Atomic tags
- **File history** - Complete lineage maintained
- **Merge structure** - Converted to semantic patches
- **Working copy** - Files remain unchanged

### ❌ Not Imported

- **Git-specific metadata** - `.git` directory contents
- **Submodules** - Must be handled manually
- **Git hooks** - Reimplement as Atomic workflows
- **Git LFS objects** - Large files need manual handling
- **Merge commit structure** - Converted to changes (no merge artifacts)
- **Reflog** - Git-specific history

### 🔄 Converted

- **Merge commits** - Become semantic patches
- **Cherry-picks** - Become regular changes
- **Rebases** - Flattened into linear history
- **Git tags** - Become Atomic consolidating tags

## Pre-Import Checklist

Before running `atomic git`:

```bash
# 1. Ensure working directory is clean
git status
# Should show "nothing to commit, working tree clean"

# 2. Commit or stash any pending work
git add .
git commit -m "Pending work before Atomic import"

# 3. Optional: Create a backup
cd ..
cp -r my-project my-project-backup

# 4. Return to project and import
cd my-project
atomic git
```

## Post-Import Steps

After successful import:

### 1. Verify the Import

```bash
# Check the history
atomic log --limit 20

# Verify stacks
atomic stack list

# Check current state
atomic diff  # Should show no changes
```

### 2. Create a Consolidating Tag

For better performance with large histories:

```bash
# Create a tag to consolidate dependencies
atomic tag create import-base -m "Git import baseline"
```

This dramatically improves performance by reducing O(n²) to O(n) complexity.

### 3. Configure Remotes

Edit `.atomic/config.toml` to set up remotes:

```toml
[remote "origin"]
ssh = "ssh://git@github.com/user/repo.git"

[remote "upstream"]
ssh = "ssh://git@github.com/original/repo.git"
```

### 4. Set Up Identity

Configure your Atomic identity:

```bash
atomic identity new default \
  --username yourname \
  --display-name "Your Name" \
  --email your.email@example.com
```

### 5. Continue Development

Start using Atomic:

```bash
# Make changes
vim src/file.rs

# Record with Atomic
atomic record -m "First change after Git import"

# Push to Atomic-compatible remote
atomic push
```

## Common Scenarios

### Scenario 1: Clean Import

```bash
cd my-git-project
git status  # Ensure clean
atomic git
atomic log
```

### Scenario 2: Import with Uncommitted Changes

```bash
cd my-git-project
git status  # Shows uncommitted changes

# Option 1: Commit them first
git add .
git commit -m "Work in progress"
atomic git

# Option 2: Stash them
git stash
atomic git
git stash pop  # Restore after import
```

### Scenario 3: Import Multiple Branches

```bash
# Git branches are automatically converted
atomic git

# Verify all stacks
atomic stack list
# Output:
# * main
#   develop
#   feature/auth
#   bugfix/issue-123
```

### Scenario 4: Large Repository Import

```bash
# Import large repo
atomic git

# Create consolidating tag immediately
atomic tag create import-v1 -m "Git import consolidation"

# This reduces dependency complexity for future operations
```

## AI Attribution Detection

If your Git commits contain AI attribution information in specific formats, Atomic will detect and preserve it:

### Recognized Formats

```
# In Git commit messages:

Co-authored-by: GitHub Copilot <copilot@github.com>

AI-Generated: cursor/gpt-4 (confidence: 0.95)

[AI] Suggested by ChatGPT

AI-assisted: claude-3-opus
```

Atomic automatically:
- Detects these patterns
- Converts to Atomic's AI attribution format
- Preserves provider, model, and confidence information
- Maintains cryptographic integrity

## Performance Considerations

Import performance depends on:

- **Repository size** - Number of commits
- **File count** - More files = longer import
- **History complexity** - Branches and merges
- **Hardware** - CPU and disk speed

Typical import times:

- **Small repo** (&lt; 100 commits): &lt; 1 minute
- **Medium repo** (100-1000 commits): 1-10 minutes
- **Large repo** (1000-10000 commits): 10-60 minutes
- **Very large repo** (10000+ commits): 1+ hours

### Optimization Tips

```bash
# For large repos, create tags periodically
atomic git
atomic tag create import-base -m "Import baseline"

# Monitor progress
atomic git --stats import-stats.txt
```

## Troubleshooting

### Uncommitted Changes Error

```
Error: There were uncommitted files
```

**Solution**:
```bash
git status
git add .
git commit -m "Pending changes"
atomic git
```

### Import Hangs or Fails

```
Error during import at commit XYZ
```

**Solution**:
```bash
# Check Git repository integrity
git fsck

# Try repair
git gc --aggressive

# Retry import
atomic git
```

### Branch Not Imported

**Solution**:
```bash
# Ensure branch exists in Git
git branch -a

# Import imports all branches
atomic git

# Verify stacks
atomic stack list
```

### Large Files Cause Issues

**Solution**:
```bash
# Remove large files from Git first
git filter-branch --tree-filter 'rm -rf path/to/large/files' HEAD

# Or use Git LFS, then import
atomic git
```

## Hybrid Git/Atomic Workflow

You can temporarily maintain both Git and Atomic:

```bash
# Keep Git repository
atomic git  # Creates .atomic alongside .git

# Use Atomic for new work
atomic record -m "New feature"

# Still push to Git (for transition period)
git add .
git commit -m "New feature"
git push

# Eventually, fully migrate to Atomic
rm -rf .git
```

**Note**: This is for transition only. Long-term, use Atomic exclusively for full benefits.

## Notes

- **Non-Destructive**: Original Git repository is unchanged
- **Full History**: Complete Git history is preserved
- **One-Way**: Import is from Git to Atomic (not bidirectional)
- **Clean State Required**: Git working directory must be clean
- **Branch Conversion**: All Git branches become Atomic stacks
- **Tag Consolidation**: Create Atomic tags after import for performance
- **Submodules**: Not automatically handled - require manual migration

## Configuration

No specific configuration needed, but after import you should configure:

```toml
# In .atomic/config.toml

[author]
username = "yourname"
display_name = "Your Name"

[remote "origin"]
ssh = "ssh://atomic@server.com/repos/project.git"
```

## Exit Codes

- `0` - Success
- `1` - Error (uncommitted changes, Git error, etc.)
- `2` - Invalid arguments

## See Also

- [Migration Guide](../getting-started/migrating-from-git) - Complete Git to Atomic migration guide
- [`atomic init`](./init.md) - Initialize new Atomic repository
- [`atomic clone`](./clone.md) - Clone existing Atomic repository
- [`atomic log`](./log.md) - View imported history
- [`atomic stack`](./stack.md) - Manage converted branches
- [`atomic tag`](./tag.md) - Create consolidating tags

## Related Concepts

- **Git Import** - Converting Git history to Atomic
- **History Conversion** - Commits become changes
- **Branch Mapping** - Branches become stacks
- **Semantic Patches** - Git diffs become operations
- **Consolidating Tags** - Reduce complexity after import

---

**Ready to migrate from Git?** Import your repository and experience conflict-free version control:

```bash
cd your-git-repo
atomic git
atomic log
```
