---
sidebar_position: 2
title: init
---

# atomic init

Initialize a new Atomic repository in the current or specified directory.

## Synopsis

```bash
atomic init [OPTIONS] [PATH]
```

## Description

The `init` command creates a new Atomic repository by setting up the necessary directory structure and database files. This includes:

- Creating a `.atomic` directory with the pristine database
- Initializing a default view (usually named "main")
- Creating an `.ignore` file based on the project kind (if specified)
- Setting up the repository configuration

Unlike some version control systems, `atomic init` creates a fully functional distributed repository with no dependency on a central server.

## Options

### `--view <NAME>`

Set the name of the initial view. If not specified, defaults to `"main"`.

```bash
atomic init --view develop
```

### `-k, --kind <KIND>`

Specify the project kind to automatically configure the `.ignore` file with appropriate patterns. Atomic supports various project types:

- `rust` - Rust projects (ignores `target/`, `Cargo.lock` for libraries, etc.)
- `node` - Node.js projects (ignores `node_modules/`, etc.)
- `python` - Python projects (ignores `__pycache__/`, `*.pyc`, etc.)

```bash
atomic init --kind rust
```

### `[PATH]`

The directory path where the repository should be initialized. If not specified, initializes in the current directory.

```bash
atomic init /path/to/project
atomic init .
atomic init myproject
```

## Examples

### Initialize in Current Directory

```bash
atomic init
```

Creates a new repository in the current directory with default settings (view named "main").

### Initialize with Custom View Name

```bash
atomic init --view develop
```

Creates a repository with the initial view named "develop" instead of "main".

### Initialize a Rust Project

```bash
atomic init --kind rust myproject
```

Creates a new repository in the `myproject` directory with Rust-specific ignore patterns.

### Initialize with All Options

```bash
atomic init --view main --kind rust ~/projects/new-app
```

Creates a Rust project repository at `~/projects/new-app` with the "main" view.

## Repository Structure

After running `atomic init`, your directory will contain:

```
.atomic/
├── pristine/          # redb database for repository state
├── config.toml        # Repository-specific configuration
└── changes/           # Directory for change files (created on first record)

.ignore                # Ignore patterns (if --kind was specified)
```

## Notes

- **Idempotency**: Running `init` in a directory that already contains a `.atomic` folder will result in an error.
- **Working Copy**: The working copy (your actual files) remains unchanged by `init`. Use `atomic add` to start tracking files.
- **Distributed**: Every Atomic repository is complete and independent. There's no concept of a "central" repository.
- **View**: The initial view represents your main line of development. You can create additional views later with `atomic view create`.

## Configuration

After initialization, you can configure the repository by editing `.atomic/config.toml`:

```toml
[author]
username = "username"
display_name = "Your Name"

[remote "origin"]
ssh = "ssh://user@host/path/to/repo"
```

Or use the global configuration at `~/.config/atomic/config.toml`.

## See Also

- [`atomic clone`](./clone.md) - Clone an existing repository
- [`atomic add`](./add.md) - Start tracking files
- [`atomic record`](./record.md) - Record your first change
- [`atomic view`](./view.md) - Manage views

## Related Concepts

- **Views** - Independent lines of development (similar to branches)
- **Pristine** - The database that stores repository state
- **Working Copy** - Your actual files on disk