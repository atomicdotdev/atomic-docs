---
sidebar_position: 1
title: Repository Management
---

# Repository Management

Repository management commands handle the creation, initialization, and structure of Atomic repositories. These are the foundational commands you'll use to start working with Atomic VCS.

## Commands in this Category

### [`atomic init`](./init.md)

Initialize a new Atomic repository in the current or specified directory.

**Use when:**
- Starting a new project with Atomic
- Converting a directory into an Atomic repository
- Creating a repository with specific project type templates

**Quick example:**
```bash
atomic init --kind rust
```

### [`atomic clone`](./clone.md)

Clone an existing Atomic repository from a remote location.

**Use when:**
- Getting a copy of a remote repository
- Starting work on an existing project
- Creating local copies for development

**Quick example:**
```bash
atomic clone ssh://user@example.com/repo
```

### [`atomic split`](./split.md)

Create a split of a stack with advanced options.

**Use when:**
- Creating experimental branches with specific settings
- Splitting from a particular state
- Advanced stack management scenarios

**Quick example:**
```bash
atomic split experimental --stack main
```

## Common Workflows

### Starting a New Project

```bash
# Initialize repository
atomic init myproject --kind rust

# Add files
cd myproject
atomic add .

# Record first change
atomic record -m "Initial project structure"
```

### Cloning an Existing Project

```bash
# Clone from remote
atomic clone ssh://user@host/repo

# Navigate into repository
cd repo

# Start working
atomic record -m "My changes"
```

### Creating a Repository Split

```bash
# Split a stack for experiments
atomic split experiment --stack main

# Work on the split
atomic stack switch experiment
atomic record -m "Experimental changes"
```

## Key Concepts

### Repository Structure

When you initialize an Atomic repository, it creates:

- `.atomic/` - Repository metadata and database
- `.atomic/pristine/` - The pristine database
- `.atomic/changes/` - Change storage
- `.atomic/config.toml` - Repository configuration
- `.ignore` - File patterns to ignore

### Distributed Nature

Every Atomic repository is **complete and independent**:
- No central server required
- Full history in every clone
- Can work completely offline
- Push/pull for synchronization when needed

### Repository vs Working Copy

- **Repository**: The `.atomic` directory containing all history and metadata
- **Working Copy**: Your actual files that you edit
- **Pristine**: The database representation of recorded state

## Configuration

After creating a repository, configure it in `.atomic/config.toml`:

```toml
[author]
username = "yourname"
display_name = "Your Name"

[remote "origin"]
ssh = "ssh://user@example.com/path/to/repo"
```

## Best Practices

### Initialization

- ✅ Use `--kind` for automatic ignore patterns
- ✅ Initialize in an empty or new directory
- ✅ Configure your identity before recording changes
- ✅ Create a `.ignore` file for your project type

### Cloning

- ✅ Verify remote URL before cloning
- ✅ Use SSH for authentication
- ✅ Clone into appropriate directory structure
- ✅ Check repository state after cloning

### Splitting

- ✅ Use descriptive split names
- ✅ Document why you're creating a split
- ✅ Clean up experimental splits when done
- ✅ Consider using regular stacks instead for simpler cases

## Next Steps

After setting up your repository:

1. [Add files to track](./add.md)
2. [Record your first change](./record.md)
3. [View the log](./log.md)
4. [Set up remotes for collaboration](./push.md)

## See Also

- [Working with Changes](./working-with-changes.md) - Record and manage changes
- [Remote Operations](./remote-operations.md) - Collaborate with others
- [File Operations](./file-operations.md) - Manage tracked files