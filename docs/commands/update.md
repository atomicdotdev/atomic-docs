---
sidebar_position: 22
---

# atomic update

Updates an existing change with the current state of the working copy.

## Synopsis

```bash
atomic update [OPTIONS] <CHANGE> [PREFIXES...]
```

## Description

The `atomic update` command creates a new change that supersedes an existing change. Unlike Git's `git commit --amend` which rewrites history, `atomic update` creates a forward-progressing new change with a new content-addressed hash.

The old change is unrecorded from the current stack, and the new change is recorded at the tip. This preserves Atomic's immutable change model while allowing you to iterate on changes before they're shared.

**Key features:**
- Creates a new change with a new hash (no history rewriting)
- Unrecords the old change from the stack
- Records the new change at the stack tip
- Preserves or updates change metadata (message, description, author)
- Safe to use even after pushing (doesn't break collaborators)

## Arguments

### `<CHANGE>`

Hash (or unique prefix) of the change to update. Can also use `@` or `!` for interactive selection.

- **Full hash**: All 53 characters (Base32 encoded)
- **Hash prefix**: Minimum 6 characters, must be unique
- **Interactive**: `@` or `!` to show a selector with recent changes

**Examples:**
```bash
# Full hash
atomic update MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Hash prefix (6+ characters)
atomic update MNYNGT

# Interactive selector
atomic update @
```

### `[PREFIXES...]`

Optional paths to include in the update. If not specified, all changed files in the working copy are included.

**Examples:**
```bash
# Update only specific files
atomic update ABC123 src/main.rs

# Update multiple files
atomic update ABC123 src/ tests/
```

## Options

### `-m, --message <MESSAGE>`

Set a new change message. If not provided, the original message is preserved.

```bash
atomic update ABC123 -m "Add input validation"
```

### `-e, --edit`

Open an editor to edit the change message interactively.

```bash
atomic update ABC123 --edit
```

### `--description <DESCRIPTION>`

Set a new description. If not provided, the original description is preserved.

```bash
atomic update ABC123 --description "This change adds comprehensive input validation for all user inputs."
```

### `--author <AUTHOR>`

Set a new author. If not provided, the original author is preserved.

```bash
atomic update ABC123 --author "Jane Doe <jane@example.com>"
```

### `--stack <STACK>`

Update the change in a specific stack instead of the current stack.

```bash
atomic update ABC123 --stack feature/auth
```

### `--repository <PATH>`

Specify the repository path. Defaults to the first ancestor directory containing `.atomic`.

```bash
atomic update ABC123 --repository /path/to/repo
```

### `--timestamp <TIMESTAMP>`

Set a custom timestamp (RFC 2822 format or Unix timestamp).

```bash
atomic update ABC123 --timestamp "Mon, 15 Jan 2025 12:00:00 +0000"
```

### `--working-copy <PATH>`

Record from a different working copy than the repository root.

```bash
atomic update ABC123 --working-copy /path/to/working/copy
```

### `--identity <IDENTITY>`

Sign the change with a specific identity.

```bash
atomic update ABC123 --identity work-key
```

### `--patience`

Use the Patience diff algorithm instead of the default Myers algorithm.

```bash
atomic update ABC123 --patience
```

## Interactive Selector

When you use `@` or `!` as the change identifier, Atomic presents an interactive fuzzy selector showing your recent changes:

```bash
$ atomic update @

Select change to update:
┌────────────────────────────────────────────────────┐
│ ABC123 → Add user authentication                   │
│ DEF456 → Fix parser bug                            │
│ GHI789 → Refactor database layer                   │
│ JKL012 → Update documentation                      │
└────────────────────────────────────────────────────┘
  ↑/↓: Navigate  Enter: Select  /: Search  Esc: Cancel
```

**Features:**
- Shows up to 20 most recent changes
- Displays short hash (6 chars) → message
- Type to search/filter changes
- Arrow keys to navigate
- Enter to select, Esc to cancel

## Examples

### Basic Update

Update a change with current working copy state:

```bash
# Make changes to files
echo "Updated content" > file.txt

# Update the change
atomic update ABC123
```

### Update with New Message

```bash
atomic update ABC123 -m "Address review feedback: add error handling"
```

### Interactive Update

```bash
# Shows selector with recent changes
atomic update @

# Type to filter
atomic update @
> auth
# Shows only changes matching "auth"
```

### Update Specific Files

```bash
# Modify multiple files
echo "Updated" > file1.txt
echo "Updated" > file2.txt

# Update only file1.txt
atomic update ABC123 file1.txt
```

### Update in Different Stack

```bash
# Update change in feature branch
atomic update ABC123 --stack feature/new-api
```

### Update with Full Options

```bash
atomic update ABC123 \
  -m "Complete implementation of authentication" \
  --description "Adds JWT-based authentication with refresh tokens" \
  --author "Alice Developer <alice@example.com>" \
  --patience
```

## Workflow Examples

### Iterative Development Workflow

```bash
# 1. Record initial change
atomic record -m "Add feature X"

# 2. Get feedback from code review
# ... make improvements ...

# 3. Update the change
atomic update @ -m "Add feature X (v2)"

# 4. More feedback
# ... make more improvements ...

# 5. Update again
atomic update @ -m "Add feature X (v3)"

# 6. Finally push when ready
atomic push
```

### Stacked Changes Workflow

```bash
# Build a stack of changes
atomic record -m "Add types"       # ABC123
atomic record -m "Add endpoint"    # DEF456
atomic record -m "Add tests"       # GHI789

# Update the middle change
atomic update DEF456 -m "Add endpoint (improved)"

# Dependent changes (GHI789) remain valid!
```

### Trunk-Based Development

```bash
# Working in feature stack
atomic stack switch feature/auth
atomic record -m "Add authentication"

# Apply to staging for review
atomic stack switch staging
atomic apply ABC123

# Get feedback, make changes
atomic stack switch feature/auth
# ... make improvements ...
atomic update ABC123

# Apply updated version to staging
atomic stack switch staging
atomic unrecord ABC123  # Remove old version
atomic apply XYZ789     # Apply new version
```

## Comparison with Git

| Operation | Git | Atomic |
|-----------|-----|--------|
| **Command** | `git commit --amend` | `atomic update <hash>` |
| **History** | Rewrites (changes SHA) | Forward progression (new hash) |
| **After push** | Requires force push | Safe to update |
| **Collaborators** | Breaks their branches | No impact |
| **Selection** | HEAD only | Any change, interactive selector |
| **Change identity** | Mutable | Immutable (new change = new hash) |

### Why `atomic update` is Better

1. **No history rewriting** - Changes are immutable, new updates create new changes
2. **Safe to share** - Updating doesn't break collaborators' work
3. **Interactive selection** - Visual picker instead of cryptic `HEAD~1` syntax
4. **Content-addressed** - Same content = same hash across all repositories
5. **Designed for code review** - Changes are meant to evolve through iterations

## Common Use Cases

### 1. Address Review Feedback

```bash
# Reviewer: "Please add input validation"
# Make changes
atomic update @ -m "Add feature (v2): added input validation"
```

### 2. Fix Typos in Recent Change

```bash
# Oops, typo in the code
# Fix it
atomic update @ -m "Fix typo in function name"
```

### 3. Improve Change Before Pushing

```bash
# Made a change but want to improve it before sharing
# Make improvements
atomic update @
atomic push  # Now push the improved version
```

### 4. Split Changes Differently

```bash
# Recorded too much in one change
atomic unrecord @
# Record smaller, focused changes
atomic record -m "Part 1: Add types"
atomic record -m "Part 2: Add logic"
```

## Error Handling

### Change Not Found

```bash
$ atomic update NONEXISTENT
Error: Hash not found
```

**Solution**: Verify the hash with `atomic log`

### Change Not in Current Stack

```bash
$ atomic update ABC123
Error: Change ABC123... is not in stack 'main'
```

**Solution**: Either switch to the correct stack or use `--stack` flag

### No Changes to Record

```bash
$ atomic update ABC123
Nothing to update
```

**Meaning**: Working copy has no modifications

### Ambiguous Hash

```bash
$ atomic update AB
Error: Ambiguous hash, need at least two characters
```

**Solution**: Use a longer prefix (minimum 6 characters recommended)

## Tips and Best Practices

1. **Use Interactive Selector** - `@` is faster than typing hashes
2. **Update Before Pushing** - Iterate locally, push when ready
3. **Descriptive Messages** - Use `-m` to explain what changed
4. **Small, Focused Changes** - Easier to review and update
5. **Test After Updating** - Verify your changes still work

## See Also

- [`atomic record`](record.md) - Create a new change
- [`atomic unrecord`](unrecord.md) - Remove changes from stack
- [`atomic log`](log.md) - View change history
- [`atomic stack`](stack.md) - Manage stacks
- [Stacked Diffs Guide](../getting-started/stacked-diffs.md)
- [Comparison with Git](../getting-started/comparison-with-git.md)

## Technical Details

### How It Works

1. **Unrecord**: Removes old change from current stack (but keeps in change store)
2. **Record**: Creates new change with current working copy state
3. **Sign**: Signs new change with user identity
4. **Apply**: Applies new change to stack
5. **Output**: Updates working copy to reflect new change

### Change Identity

Each update creates a new change with a new content-addressed hash. This means:
- Old change hash: `ABC123...` (53 chars)
- New change hash: `XYZ789...` (53 chars, different)
- Same content in different stacks = same hash

### Stack Behavior

When you update a change:
- Old change is removed from stack log
- New change appears at tip of stack
- Dependencies are preserved
- Other changes in stack remain unaffected (unless they conflict)

## Future Enhancements

Planned features for `atomic update`:

- `--cascade` - Automatically update dependent changes
- `--keep-both` - Keep both old and new changes in stack
- `--interactive` - Choose hunks to include (like `git add -p`)
- Web UI integration - Update changes from browser
- Review preservation - Maintain review state across updates