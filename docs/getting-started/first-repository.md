---
sidebar_position: 2
title: Your First Repository
---

# Creating Your First Repository

This guide will walk you through creating your first Atomic repository, adding files, and recording your first changes. By the end, you'll understand the basic workflow of using Atomic VCS.

## Initializing a Repository

To start using Atomic in a new project, navigate to your project directory and run:

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

## Understanding the Working Environment

Atomic manages four key areas:

1. **Working Copy** - Your actual files where you edit code
2. **Tree** - Tracks which files Atomic is monitoring
3. **Pristine** - The recorded state of your repository
4. **Changes** - Individual patches representing edits

When you make edits, Atomic compares your working copy with the pristine to generate changes (patches).

## Adding Files

Before Atomic can track changes to files, you need to explicitly add them:

```bash
# Add a single file
atomic add README.md

# Add multiple files
atomic add src/main.rs src/lib.rs

# Add an entire directory
atomic add src/

# Add everything in current directory
atomic add .
```

:::tip
Unlike Git, adding files in Atomic only marks them for tracking. The actual content is recorded when you run `atomic record`.
:::

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

## Viewing Your History

See the recorded changes:

```bash
atomic log
```

Output:

```
Change 7k2m9n4p5q6r7s8t9u0v1w2x3y4z5a6b
Author: Alice <alice@example.com>
Date: 2024-12-19 10:30:00 UTC

    Initial commit
    
    Add basic project structure with README and main source file.
```

For a more compact view:

```bash
atomic log --short
```

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

### Inspect a Specific Change

```bash
atomic show <change-hash>
```

This displays:
- Change metadata (author, timestamp)
- Dependencies
- The actual patch content

## First-Time Setup

Before recording changes, you should configure your identity. This information is included in every change you record.

Create or edit `~/.config/atomic/config.toml` (Linux), `%AppData%\atomic\config.toml` (Windows), or `~/.atomicconfig` (macOS):

```toml
[author]
name = "alice"
full_name = "Alice Developer"
email = "alice@example.com"
```

Now when you record changes, Atomic will automatically use this information.

:::info
You can also set this per-repository by editing `.atomic/config.toml` in your project directory.
:::

## Ignoring Files

Create a `.ignore` file in your repository root to exclude files from tracking:

```bash
# Create .ignore file
cat > .ignore << EOF
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

The `.ignore` file uses glob patterns similar to `.gitignore`.

## Example Workflow

Here's a complete example of creating and populating a Rust project:

```bash
# Create project
cargo new myapp
cd myapp

# Initialize Atomic repository
atomic init

# Add initial files
atomic add Cargo.toml src/

# Record first change
atomic record -m "Initial Rust project structure"

# Make changes
echo 'println!("Hello from Atomic!");' >> src/main.rs

# Check status
atomic status

# Record changes
atomic record -m "Add hello message"

# View history
atomic log
```

## Understanding Changes vs Commits

If you're coming from Git:

| Git | Atomic | Key Difference |
|-----|--------|----------------|
| `git commit` | `atomic record` | Creates a **patch** (semantic change) not a snapshot |
| Commit hash | Change hash | Cryptographic identifier for the change |
| Staging area | Add to tree | Files marked for tracking |
| Working tree | Working copy | Your editable files |

:::tip Key Insight
Atomic changes are **semantic patches** that represent the *meaning* of your edits, not just file snapshots. This enables mathematical properties like commutativity (changes can be applied in any order).
:::

## Common Operations

### Undo Changes in Working Copy

Reset working copy to pristine state:

```bash
atomic revert --working-copy
```

### Unrecord Last Change

Remove the last recorded change:

```bash
atomic unrecord
```

:::warning
`unrecord` removes the change from your repository but keeps the modifications in your working copy.
:::

### Remove File from Tracking

```bash
atomic remove src/old_file.rs
atomic record -m "Remove old file"
```

## Next Steps

Now that you understand the basics:

1. Learn about collaborating with others (coming soon)
2. Explore tag consolidation for better performance
3. Understand views for managing branches
4. Set up workflows for team development

## Common Questions

### Why do I need to `atomic add`?

Atomic requires explicit tracking so you have fine-grained control over what's in your repository. This prevents accidentally committing build artifacts, credentials, or other files.

### Can I add everything at once?

Yes! Use `atomic add .` to add all files in the current directory recursively. Just make sure your `.ignore` file is set up first.

### What if I forget to add a file?

No problem! You can add it later and record a new change, or add it before recording if you haven't recorded yet.

### How do I see what will be recorded?

Run `atomic diff` to see exactly what changes will be included in your next record.

---

**Ready to collaborate?** Continue learning with the Atomic documentation.