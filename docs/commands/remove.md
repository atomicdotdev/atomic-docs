---
title: remove
---

# atomic remove

Remove files from tracking.

## Synopsis

```bash
atomic remove [OPTIONS] <PATHS>...
```

## Description

The `remove` command stops tracking files in the repository. By default the files are left on disk as untracked files; pass `--delete` to also delete them from the working copy.

## Arguments

### `<PATHS>...`

Files or directories to remove from tracking.

```bash
atomic remove obsolete.txt
```

## Options

### `--delete`

Also delete files from disk. Without this flag, files are only removed from tracking and remain on disk as untracked files.

```bash
# Stop tracking and delete from disk
atomic remove --delete old-file.txt

# Stop tracking but keep the file on disk
atomic remove old-file.txt
```

### `-r, --recursive`

Recursively remove directory contents.

```bash
atomic remove --recursive old-code/
```

### `--no-recursive`

Don't recursively remove directory contents.

```bash
atomic remove --no-recursive old-code/
```

### `-n, --dry-run`

Dry run - show what would be removed without doing it.

```bash
atomic remove --dry-run old-code/
```

### `-f, --force`

Force remove even if the file is not tracked.

```bash
atomic remove --force stray-file.txt
```

### Global Options

These options are available on all commands:

- `-v, --verbose` - Emit extra diagnostic output
- `--no-color` - Disable ANSI color in output
- `-h, --help` - Print help
- `-V, --version` - Print version

## Examples

### Remove but Keep File

```bash
# Stop tracking but keep the file on disk
atomic remove .env
echo ".env" >> .ignore
atomic record -m "Stop tracking .env"
```

### Remove and Delete File

```bash
# Stop tracking and delete from disk
atomic remove --delete obsolete.txt
atomic record -m "Remove obsolete file"
```

### Remove a Directory

```bash
# Remove all tracked files in a directory
atomic remove --recursive old-code/
atomic record -m "Remove old code"
```

### Preview a Removal

```bash
# See what would be removed without making changes
atomic remove --dry-run old-code/
```

## See Also

- [`atomic add`](./add.md) - Add files to tracking
- [`atomic move`](./move.md) - Move or rename files
- [`atomic record`](./record.md) - Record changes
- [`atomic status`](./status.md) - Show the status of the working copy
