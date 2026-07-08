---
sidebar_position: 20
title: remote
---

# atomic remote

Manage named remote repositories.

## Synopsis

```bash
atomic remote [OPTIONS]
atomic remote <SUBCOMMAND>
```

## Description

Remotes are named references to remote repository URLs. They allow you to use short names like `origin` instead of full URLs when pushing, pulling, or cloning.

When invoked with no subcommand, `atomic remote` lists all configured remotes.

## Subcommands

### `remote` (no subcommand)

List all configured remotes.

```bash
# List remotes (short)
atomic remote

# List remotes with full URLs
atomic remote -v
```

**Example output:**

```
origin    https://api.atomic.dev/acme/platform/core/code
upstream  https://api.atomic.dev/community/oss/atomic/code
```

**Options:**

| Option | Description |
|--------|-------------|
| `-v`, `--verbose` | Show full URLs alongside remote names |

### `add`

Add a new remote.

```bash
atomic remote add <NAME> <URL>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Short name for the remote (e.g., `origin`, `upstream`) |
| `<URL>` | Full URL of the remote repository |

**Examples:**

```bash
# Add an origin remote
atomic remote add origin https://api.atomic.dev/acme/platform/core/code

# Add an upstream remote
atomic remote add upstream https://api.atomic.dev/community/oss/atomic/code
```

### `remove`

Remove a remote. Alias: `rm`.

```bash
atomic remote remove <NAME>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Name of the remote to remove |

**Examples:**

```bash
atomic remote remove upstream
atomic remote rm upstream
```

### `set-url`

Change the URL of an existing remote.

```bash
atomic remote set-url <NAME> <URL>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Name of the remote to update |
| `<URL>` | New URL for the remote |

**Examples:**

```bash
atomic remote set-url origin https://new-api.atomic.dev/acme/platform/core/code
```

### `rename`

Rename an existing remote.

```bash
atomic remote rename <OLD> <NEW>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<OLD>` | Current name of the remote |
| `<NEW>` | New name for the remote |

**Examples:**

```bash
atomic remote rename origin primary
```

### `default`

Set the default remote used by `push` and `pull` when no remote is specified.

```bash
atomic remote default <NAME>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Name of the remote to use as default |

**Examples:**

```bash
# Set origin as the default
atomic remote default origin

# Now push/pull use origin automatically
atomic push
atomic pull
```

## Configuration

Remotes are stored in `.atomic/config.toml` under the `[remotes]` section:

```toml
[remotes]
default = "origin"

[remotes.origin]
url = "https://api.atomic.dev/acme/platform/core/code"

[remotes.upstream]
url = "https://api.atomic.dev/community/oss/atomic/code"
```

## Examples

### Set up a new project with a remote

```bash
atomic init myproject
cd myproject
atomic remote add origin https://api.atomic.dev/acme/platform/myproject/code
atomic remote default origin
```

### Work with multiple remotes

```bash
# Add both origin and upstream
atomic remote add origin https://api.atomic.dev/acme/platform/core/code
atomic remote add upstream https://api.atomic.dev/community/oss/atomic/code

# Push to origin (default)
atomic push

# Pull from upstream explicitly
atomic pull --remote upstream
```

### Migrate a remote URL

```bash
# Check current remotes
atomic remote -v

# Update the URL
atomic remote set-url origin https://new-endpoint.atomic.dev/acme/platform/core/code

# Verify
atomic remote -v
```

## Differences from Git

| Aspect | Git | Atomic |
|--------|-----|--------|
| Storage | `.git/config` | `.atomic/config.toml` |
| Default remote | Convention (`origin`) | Explicit via `atomic remote default` |
| Fetch vs Push URLs | Separate | Single URL per remote |
| Refspecs | Complex fetch/push refspecs | Views sync directly |

## See Also

- [push](push.md) — Push changes to a remote
- [pull](pull.md) — Pull changes from a remote
- [clone](clone.md) — Clone a remote repository
- [init](init.md) — Initialize a new repository