---
sidebar_position: 2
title: Your First Repository
---

# Creating Your First Repository

This guide walks you through the everyday Atomic workflow (identity, tracking
files, recording changes, reviewing, and promoting) in the order you'll
actually use it. By the end, you'll understand the basic local workflow. If you
want a hosted project, first complete the optional
[Atomic Storage setup](./installation#connect-to-atomic-storage-optional).

Command reference: every section links to the full reference page for the
commands it introduces, starting at the [command overview](../commands/overview).

## First-Time Setup: Your Identity

Before recording changes, configure your identity. This information is included
in every change you record, and it is what your signature attestations are made
with.

```bash
atomic identity new alice --email alice@example.com --set-default
```

You can also set it per-repository in `.atomic/config.toml`:

```toml
[author]
name = "alice"
full_name = "Alice Developer"
email = "alice@example.com"
```

Now when you record changes, Atomic will automatically use this information.

→ Full reference: [`atomic identity`](../commands/identity.md)

## Create or Clone a Repository

### Create a local repository

Initialize a repository in a new or existing project directory:

```bash
atomic init
```

This creates a `.atomic` directory containing:
- **pristine** - The database storing your recorded changes
- **tree** - Information about tracked files
- **config.toml** - Repository configuration
- **changes/** - Storage for change patches

Example:

```bash
mkdir myproject
cd myproject
atomic init
```

You should see output like:

```
✓ Initialized empty Atomic repository in /path/to/myproject/.atomic
```

### Clone a hosted repository

If you created a project on Atomic Storage during installation, clone it and
initialize Vault for AI-agent context:

```bash
atomic clone https://acme.atomic.storage/workspaces/platform/projects/api/code
cd api
atomic vault init
```

The clone configures `origin` automatically and authenticates as the identity
matching the URL's subdomain. Continue with the tracking and recording steps
below, then publish your first change with:

```bash
atomic push
```

Use the organization, workspace, and project names you chose in place of the
example values.

→ Full reference: [`atomic init`](../commands/init.md), [`atomic clone`](../commands/clone.md)

## Understanding the Working Environment

Atomic manages four key areas:

1. **Working Copy** - Your actual files where you edit code
2. **Tree** - Tracks which files Atomic is monitoring
3. **Pristine** - The recorded state of your repository
4. **Changes** - Individual patches representing edits

When you make edits, Atomic compares your working copy with the pristine to generate changes (patches).

## Ignoring Files

Create an `.atomicignore` file in your repository root to exclude files from
tracking. Set this up *before* adding files so you never track artifacts:

```bash
# Create .atomicignore file
cat > .atomicignore << EOF
# Build artifacts
target/
*.o
*.so

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp

# Dependencies
node_modules/
vendor/
EOF
```

The `.atomicignore` file uses glob patterns similar to `.gitignore`. When the Git shim is enabled, `.atomicignore` can be mirrored into Git's `.git/info/exclude` with `atomic git shim mirror-ignores`.

## Adding Files

Before Atomic can track changes to files, you need to explicitly add them.
The easiest way is to add a directory or everything at once:

```bash
# Add everything in current directory (respects .atomicignore)
atomic add .

# Add an entire directory
atomic add src/

# Add multiple files
atomic add src/main.rs src/lib.rs

# Add a single file
atomic add README.md
```

:::tip
Unlike Git, adding files in Atomic only marks them for tracking. The actual content is recorded when you run `atomic record`.
:::

### Removing Files from Tracking

`atomic remove` is the inverse of `atomic add`; it stops tracking a file:

```bash
atomic remove src/old_file.rs
atomic record -m "Remove old file"
```

:::note `remove` vs `unrecord`
`remove` stops tracking a *file* going forward. It does not erase history.
`atomic unrecord` is different: it removes a recorded *change* from the view.
See [Unrecord a Change](#unrecord-a-change) below.
:::

→ Full reference: [`atomic add`](../commands/add.md), [`atomic remove`](../commands/remove.md)

## Checking Status

Before recording, check what will be included:

```bash
atomic status
```

This shows:
- **Untracked files** - Files not yet added
- **Modified files** - Tracked files with changes
- **Deleted files** - Tracked files that were removed

Example output:

```
On view main

Changes to be recorded:
  New file:   README.md
  New file:   src/main.rs
  
Untracked files:
  target/
  .DS_Store
```

:::tip
Run `atomic diff` to see exactly what changes will be included in your next record.
:::

→ Full reference: [`atomic status`](../commands/status.md)

## Recording Your First Change

Now record your changes as a patch:

```bash
atomic record
```

This opens your default editor where you can write a change message. Enter a descriptive message:

```
Initial commit

Add basic project structure with README and main source file.
```

Or use the `-m` flag to provide the message inline:

```bash
atomic record -m "Initial commit"
```

### What Happens During Record?

1. Atomic compares the working copy with the pristine
2. Generates a semantic patch encoding your changes
3. Prompts for a message describing the change
4. Applies the patch to the pristine
5. Creates a change hash (cryptographic identifier)

If you forgot to add a file, no problem: add it now and record again. Each
record creates a new change, and nothing is lost.

→ Full reference: [`atomic record`](../commands/record.md)

## Viewing Your History

See the recorded changes:

```bash
atomic log
```

Output:

```
Change XMJZ3IPF
Author: Alice <alice@example.com>
Date: 2026-10-27 10:30:00 UTC

    Initial commit
    
    Add basic project structure with README and main source file.
```

For a more compact view:

```bash
atomic log --short
```

### Locating and Inspecting a Change

The **hash** shown by `atomic log` (or `atomic status`) is how you refer to a
change everywhere else: inspection, insertion, provenance.

```bash
atomic change <change-hash>
```

This displays:
- Change metadata (author, timestamp)
- Dependencies
- The actual patch content

→ Full reference: [`atomic log`](../commands/log.md), [`atomic change`](../commands/change.md)

## Making More Changes

Let's add more content:

```bash
# Edit some files
echo "# My Project" >> README.md
echo "println!(\"Hello, Atomic!\");" >> src/main.rs

# Check what changed
atomic diff

# Record the changes
atomic record -m "Add project title and hello world"
```

## Recording in One Step

You can add and record files in a single command:

```bash
# Create a new file
echo "pub fn greet() {}" > src/lib.rs

# Add and record in one step
atomic record src/lib.rs -m "Add greet function"
```

This is equivalent to:

```bash
atomic add src/lib.rs
atomic record -m "Add greet function"
```

## Viewing Changes

### See What's Modified

```bash
# Show detailed diff
atomic diff

# Show only changed files
atomic diff --short

# Include untracked files
atomic diff --short --untracked
```

→ Full reference: [`atomic diff`](../commands/diff.md)

## Unrecord a Change

`atomic unrecord` removes a recorded change from the current view:

```bash
atomic unrecord          # remove the last recorded change
atomic unrecord <HASH>   # remove a specific change
```

:::warning
`unrecord` removes the change from your view but keeps the modifications in your working copy.
:::

### `unrecord` vs `remove` vs `restore`

| Command | What it affects | Effect |
|---------|-----------------|--------|
| `atomic unrecord` | A recorded **change** | Removes the change from the view; edits stay in your working copy |
| `atomic remove` | A tracked **file** | Stops tracking the file going forward; history is untouched |
| `atomic restore` | The **working copy** | Discards unrecorded working-copy edits, back to the last recorded state |

→ Full reference: [`atomic unrecord`](../commands/unrecord.md), [`atomic restore`](../commands/restore.md)

## Example Workflow: Intent → Work → Review → Promote

Here's a complete example of creating and populating a Rust project using the
genuine Atomic loop: state the *why*, do the work, review, then promote.

```bash
# Create project
cargo new myapp
cd myapp

# Initialize Atomic repository
atomic init

# 1. State the why as an intent
atomic intent new "Add hello message"
#    → edit the generated directive file in .vault/intents/, then persist it:
atomic vault sync

# 2. Track and record the initial state
atomic add Cargo.toml src/
atomic record -m "Initial Rust project structure"

# 3. Do the work on a draft view
atomic view create feature-hello --draft --switch
echo 'println!("Hello from Atomic!");' >> src/main.rs
atomic status
atomic record -m "Add hello message"

# 4. Review before promoting
atomic triage candidates feature-hello --into main
atomic triage review feature-hello --into main --walkthrough

# 5. Promote the reviewed work
atomic view switch main
atomic insert view feature-hello --to main

# 6. View history
atomic log
```

:::tip
The full intent lifecycle (criteria, verification, attestation, and durable
memories) is covered in [Atomic Vault](./atomic-vault). Triage and review are
covered in depth there too; this is the short version.
:::

## Understanding Changes vs Commits

If you're coming from Git:

| Git | Atomic | Key Difference |
|-----|--------|----------------|
| `git commit` | `atomic record` | Creates a **patch** (semantic change) not a snapshot |
| Commit hash | Change hash | Cryptographic identifier for the change |
| Staging area | Add to tree | Files marked for tracking |
| Working tree | Working copy | Your editable files |

:::tip Key Insight
Atomic changes are **semantic patches** that represent the *meaning* of your edits, not just file snapshots. This enables mathematical properties like commutativity (changes can be applied in any order). See [Comparison with Git](./comparison-with-git) for the full picture.
:::

## Next Steps

Now that you understand the local workflow:

1. Set up [AI Agent Workflows](./ai-agent-workflows) to automatically capture agent work.
2. Learn how [Atomic Vault](./atomic-vault) records work intent and durable knowledge.
3. Coming from Git? See [Migrating from Git](./migrating-from-git).
4. Explore the [command reference](../commands/overview) for everyday operations.
