---
sidebar_position: 1
title: Commands Overview
---

# Command Reference Overview

Atomic provides a comprehensive set of commands for managing repositories, recording changes, collaborating with remotes, and leveraging advanced features like AI attribution and cryptographic tagging.

## Command Categories

### Repository Management

Commands for creating and managing Atomic repositories:

- **`init`** - Initialize a new Atomic repository
- **`clone`** - Clone an existing repository from a remote
- **`split`** - Create a split of a stack

### Working with Changes

Core commands for recording and managing changes:

- **`record`** - Record changes from the working copy
- **`apply`** - Apply a change to a stack
- **`unrecord`** - Remove changes from a stack
- **`diff`** - Show differences between versions
- **`log`** - Display the history of changes

### Stacks

Commands for managing stacks (branches):

- **`stack`** - Create, list, switch, and manage stacks

### Remote Operations

Commands for synchronizing with remote repositories:

- **`push`** - Push changes to a remote repository
- **`pull`** - Pull changes from a remote repository
- **`clone`** - Clone a repository (also listed under Repository Management)

### Tags

Commands for creating and managing consolidating tags:

- **`tag`** - Create, list, and manage tags

### File Operations

Commands for tracking files in the repository:

- **`add`** - Add files to be tracked
- **`remove`** - Remove files from tracking
- **`move`** - Move or rename tracked files

### Identity & Attribution

Commands for managing identity and tracking contributions:

- **`identity`** - Manage user identities and cryptographic keys
- **`credit`** - Show contribution credits
- **`attribution`** - Display AI attribution information

### Utilities

Additional utility commands:

- **`archive`** - Create an archive of the repository
- **`reset`** - Reset the working copy to a specific state
- **`change`** - Inspect and manipulate change files
- **`dependents`** - Show changes that depend on a given change
- **`completions`** - Generate shell completions

## Common Patterns

### Basic Workflow

```bash
# Initialize a repository
atomic init myproject

# Add files
atomic add .

# Record changes
atomic record -m "Initial commit"

# Create a tag
atomic tag create v1.0.0
```

### Working with Remotes

```bash
# Clone a repository
atomic clone ssh://user@host/path/to/repo

# Pull changes
atomic pull

# Push changes
atomic push
```

### AI Attribution

```bash
# Record an AI-assisted change
atomic record -m "Add feature" --ai-assisted --ai-provider openai --ai-model gpt-4

# View AI attribution in logs
atomic log --attribution --ai-only
```

### Stack Management

```bash
# Create a new stack
atomic stack new feature-branch

# Switch stacks
atomic stack switch feature-branch

# List stacks
atomic stack list
```

## Global Options

Most commands support these common options:

- `--repository <PATH>` - Specify the repository path
- `--stack <NAME>` - Operate on a specific stack
- `--help` - Display help for a command

## Getting Help

To get detailed help for any command:

```bash
atomic <command> --help
```

For example:

```bash
atomic record --help
atomic tag --help
atomic push --help
```

## Next Steps

Explore the detailed documentation for each command in the sections below. Each command page includes:

- **Purpose** - What the command does
- **Syntax** - Command syntax and options
- **Examples** - Practical usage examples
- **Notes** - Important considerations and tips