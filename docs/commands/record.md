---
sidebar_position: 3
title: record
---

# atomic record

Record changes from the working copy as a new change in the repository.

## Synopsis

```bash
atomic record [OPTIONS] [PATHS]...
```

## Description

The `record` command is the primary way to save your work in Atomic. It examines the differences between your working copy and the current state of the view, then creates a new change containing those modifications.

Unlike traditional VCS systems that record snapshots, Atomic records **semantic patches** - the actual operations performed on files (additions, deletions, modifications). This enables Atomic's powerful conflict-free merging and mathematical correctness guarantees.

When you record a change, Atomic:

1. Computes the differences between the working copy and the pristine state
2. Generates patch operations representing those differences
3. Creates a change file with metadata (author, timestamp, message)
4. Applies the change to the current view
5. Updates the pristine database

## Options

### `-m, --message <MESSAGE>`

Set the commit message for the change. This is a short, one-line summary of what the change does.

```bash
atomic record -m "Add user authentication"
```

If not provided, Atomic will open your default editor to compose a message.

### `--description <DESCRIPTION>`

Set a longer, detailed description for the change. This appears in addition to the message.

```bash
atomic record -m "Add authentication" --description "Implements JWT-based authentication with refresh tokens"
```

### `-e, --edit`

Open an editor to interactively edit the change message and description, even if `--message` was provided.

```bash
atomic record -m "Initial message" --edit
```

### `--author <AUTHOR>`

Override the default author for this change. Useful when recording changes on behalf of someone else.

```bash
atomic record -m "Fix bug" --author "John Doe <john@example.com>"
```

### `--stack <STACK>`

Record the change to a specific view instead of the current view.

```bash
atomic record -m "Feature work" --stack feature-branch
```

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic record --repository /path/to/repo -m "Remote change"
```

### `--timestamp <TIMESTAMP>`

Set a custom timestamp for the change (RFC 2822 format). Rarely needed.

```bash
atomic record -m "Backdated change" --timestamp "Wed, 15 Jan 2025 12:00:00 +0000"
```

### `--ignore-missing`

Continue recording even if tracked files have been deleted without using `atomic remove`.

```bash
atomic record -m "Remove old files" --ignore-missing
```

### `--amend [HASH]`

Amend an existing change instead of creating a new one. If no hash is provided, amends the last change.

```bash
# Amend the most recent change
atomic record --amend -m "Updated message"

# Amend a specific change
atomic record --amend ABCD1234... -m "Fix earlier change"
```

### `--identity <NAME>`

Use a specific identity to sign the change (requires identity configuration).

```bash
atomic record -m "Signed change" --identity work-key
```

### `--patience`

Use the Patience diff algorithm instead of the default Myers algorithm. Can produce better diffs for certain types of changes.

```bash
atomic record -m "Refactor code" --patience
```

### AI Attribution Options

Atomic includes first-class support for tracking AI-assisted contributions:

#### `--ai-assisted`

Mark this change as AI-assisted, enabling cryptographic attribution tracking.

```bash
atomic record -m "AI generated feature" --ai-assisted
```

#### `--ai-provider <PROVIDER>`

Specify the AI provider (e.g., "openai", "anthropic", "github", "cursor").

```bash
atomic record -m "Feature" --ai-assisted --ai-provider openai
```

#### `--ai-model <MODEL>`

Specify the AI model used (e.g., "gpt-4", "claude-3-opus", "copilot").

```bash
atomic record -m "Feature" --ai-assisted --ai-provider openai --ai-model gpt-4
```

#### `--ai-suggestion-type <TYPE>`

Specify how the AI was involved. Options:
- `complete` - AI generated the entire patch
- `partial` - AI suggested, human modified
- `collaborative` - Human started, AI completed
- `inspired` - Human wrote based on AI suggestion
- `review` - AI reviewed human code
- `refactor` - AI refactored existing code

```bash
atomic record -m "Feature" --ai-assisted --ai-suggestion-type collaborative
```

#### `--ai-confidence <SCORE>`

Provide a confidence score between 0.0 and 1.0 for the AI contribution.

```bash
atomic record -m "Feature" --ai-assisted --ai-confidence 0.95
```

### `[PATHS]...`

Optional paths to record. If provided, only changes within these paths will be recorded. Paths are relative to the repository root.

```bash
# Record only changes in src/
atomic record -m "Update source" src/

# Record multiple specific paths
atomic record -m "Update configs" config.toml .ignore
```

## Examples

### Basic Recording

```bash
# Record all changes with a message
atomic record -m "Add new feature"

# Record with message and description
atomic record -m "Add authentication" --description "Implements JWT-based auth system with refresh tokens and role-based access control"
```

### Selective Recording

```bash
# Record only changes in the src/ directory
atomic record -m "Update source files" src/

# Record changes in multiple paths
atomic record -m "Config updates" config/ docs/
```

### AI-Assisted Changes

```bash
# Simple AI attribution
atomic record -m "Generate API client" --ai-assisted

# Detailed AI attribution
atomic record -m "Implement feature" \
  --ai-assisted \
  --ai-provider cursor \
  --ai-model gpt-4 \
  --ai-suggestion-type collaborative \
  --ai-confidence 0.90
```

### Amending Changes

```bash
# Amend the last change with new content
atomic record --amend -m "Updated commit message"

# Amend a specific change
atomic record --amend MNYNGT2V... -m "Fixed earlier commit"
```

### Working with Views

```bash
# Record to a different view
atomic record -m "Feature work" --stack feature-branch

# Record with custom author
atomic record -m "Pair programming changes" --author "Alice & Bob <team@example.com>"
```

## Interactive Editing

If you don't provide a message with `-m`, Atomic will open your default editor (configured via `$EDITOR` or `$VISUAL`) to compose the change message:

```
# Please enter the change message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the recording.
#
# Changes to be recorded:
#   modified: src/main.rs
#   added: src/new_module.rs
#   deleted: src/old_file.rs
```

## Working Copy vs. Pristine

Atomic maintains two key concepts:

- **Working Copy**: Your actual files on disk that you edit
- **Pristine**: The database representation of the repository state

When you run `record`, Atomic:
1. Compares the working copy against the pristine state
2. Generates patches for the differences
3. Updates the pristine state with the new change

## Change Files

Recorded changes are stored in `.atomic/changes/` with filenames derived from their cryptographic hash:

```
.atomic/changes/
├── MN/
│   └── YNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC.change.gz
└── AB/
    └── CDE12345...
```

Each change file contains:
- **Header**: Author, timestamp, message, description, dependencies
- **Attribution**: AI provider, model, confidence (if applicable)
- **Operations**: The actual patch operations
- **Contents**: File contents for additions

## Dependencies

Atomic automatically computes change dependencies based on the patch theory. A change depends on another if:

- It modifies lines introduced by the earlier change
- It operates on files created by the earlier change
- It has a semantic dependency on the earlier change's operations

These dependencies form a directed acyclic graph (DAG) that enables:
- Conflict-free merging
- Selective application of changes
- Automatic dependency tracking

## Notes

- **Atomicity**: Each `record` creates one indivisible change. All modifications are recorded together or not at all.
- **Immutability**: Once recorded, changes are immutable and cryptographically identified by their hash.
- **No Staging**: Atomic doesn't have a staging area. Changes are recorded directly from the working copy.
- **Partial Recording**: Use path arguments to record only specific files or directories.
- **Empty Changes**: Atomic will refuse to record if there are no changes in the working copy.

## Performance

Recording is typically fast, even for large repositories:

- **Small changes**: &lt; 100ms
- **Medium changes** (10-100 files): &lt; 1 second  
- **Large changes** (1000+ files): &lt; 10 seconds

Performance depends on:
- Number of files changed
- Size of the changes
- Diff algorithm used (Myers vs. Patience)
- Number of concurrent operations

## Configuration

Relevant configuration options in `.atomic/config.toml` or `~/.config/atomic/config.toml`:

```toml
[author]
username = "yourusername"
display_name = "Your Name"

# Default identity for signing changes
[identity]
default = "default"

# AI attribution settings
[ai]
enabled = true
default_provider = "cursor"
```

## Environment Variables

- `EDITOR` or `VISUAL` - Editor for composing messages
- `ATOMIC_AI_ENABLED` - Enable AI attribution (set to "true")
- `ATOMIC_AI_PROVIDER` - Default AI provider
- `ATOMIC_AI_MODEL` - Default AI model

## Exit Codes

- `0` - Success
- `1` - Error (no changes to record, missing files, etc.)
- `2` - User aborted (empty message)

## See Also

- [`atomic diff`](./diff.md) - Preview changes before recording
- [`atomic insert`](./insert.md) - Insert changes from other sources
- [`atomic log`](./log.md) - View recorded changes
- [`atomic add`](./add.md) - Start tracking new files

## Related Concepts

- **Changes** - Immutable patches representing operations
- **Pristine** - Database representation of repository state
- **Working Copy** - Your editable files
- **Dependencies** - DAG of change relationships
- **AI Attribution** - Cryptographic tracking of AI contributions