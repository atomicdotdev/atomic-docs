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

The `remove` command stops tracking files in the repository. Files can either be deleted from disk or kept as untracked files.

## Arguments

### `<PATHS>...`

One or more file or directory paths to remove from tracking.

## Options

### `--keep`

Keep the files on disk but stop tracking them. Without this flag, files are deleted from the working copy.

```bash
# Stop tracking but keep files
atomic remove --keep secrets.txt

# Remove from tracking and delete from disk
atomic remove old-file.txt
```

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic remove --repository /path/to/repo file.txt
```

## Examples

### Remove and Delete File

```bash
# Remove from tracking and delete from disk
atomic remove obsolete.txt
atomic record -m "Remove obsolete file"
```

### Remove but Keep File

```bash
# Stop tracking but keep on disk
atomic remove --keep .env
echo ".env" >> .ignore
atomic record -m "Stop tracking .env"
```

### Remove Directory

```bash
# Remove all files in directory
atomic remove old-code/
atomic record -m "Remove old code"
```

## Notes

- **Working Copy**: Files are removed from the working copy unless `--keep` is used
- **Record Required**: Changes must be recorded to persist the removal
- **Reversible**: Can re-add removed files with `atomic add`

## See Also

- [`atomic add`](./add.md) - Add files to tracking
- [`atomic move`](./move.md) - Move or rename files
- [`atomic record`](./record.md) - Record changes

## Documentation Status

⚠️ **This command documentation needs expansion with more details from the source code.**