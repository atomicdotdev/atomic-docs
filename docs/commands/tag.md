---
sidebar_position: 6
title: tag
---

# atomic tag

Manage tags (named state snapshots).

## Synopsis

```bash
atomic tag [OPTIONS] <COMMAND>
atomic tag create [OPTIONS] [NAME]
atomic tag delete [OPTIONS] [NAME]
atomic tag list [OPTIONS]
atomic tag show [OPTIONS] [NAME]
```

## Description

`atomic tag` manages tags, which are named snapshots of a view's state. Tags
are organized as subcommands for creating, deleting, listing, and inspecting
tags.

### Global Options

These options are available on `atomic tag` and its subcommands:

- **`-v, --verbose`** — Emit extra diagnostic output.
- **`--no-color`** — Disable ANSI color in output.
- **`-h, --help`** — Print help.
- **`-V, --version`** — Print version.

## Subcommands

### `tag create` — Create a new tag

Create a new tag.

#### Synopsis

```bash
atomic tag create [OPTIONS] [NAME]
```

#### Arguments

- **`[NAME]`** — Name of the tag to create.

#### Options

- **`-m, --message <MESSAGE>`** — Message for an annotated tag.
- **`-a, --author <AUTHOR>`** — Author for an annotated tag.
- **`-s, --view <VIEW>`** — View to tag.
- **`-f, --force`** — Overwrite existing tag.
- **`-v, --verbose`** — Emit extra diagnostic output.
- **`--no-color`** — Disable ANSI color in output.

#### Example

```bash
atomic tag create v1.0.0 -m "First stable release" -a "Release Team <team@example.com>"
```

### `tag delete` — Delete a tag

Delete a tag.

#### Synopsis

```bash
atomic tag delete [OPTIONS] [NAME]
```

#### Arguments

- **`[NAME]`** — Name of the tag to delete.

#### Options

- **`-v, --verbose`** — Emit extra diagnostic output.
- **`--no-color`** — Disable ANSI color in output.

#### Example

```bash
atomic tag delete v0.9.0-beta
```

### `tag list` — List all tags

List all tags.

#### Synopsis

```bash
atomic tag list [OPTIONS]
```

#### Options

- **`-s, --view <VIEW>`** — Filter tags by view.
- **`-p, --pattern <PATTERN>`** — Filter tags by name pattern.
- **`--annotated-only`** — Show only annotated tags.
- **`-v, --verbose`** — Show additional details (state, sequence, date).
- **`--no-color`** — Disable ANSI color in output.

#### Example

```bash
atomic tag list --view main --pattern "v1.*" --verbose
```

### `tag show` — Show details for a specific tag

Show details for a specific tag.

#### Synopsis

```bash
atomic tag show [OPTIONS] [NAME]
```

#### Arguments

- **`[NAME]`** — Name of the tag to show.

#### Options

- **`-v, --verbose`** — Emit extra diagnostic output.
- **`--no-color`** — Disable ANSI color in output.

#### Example

```bash
atomic tag show v1.0.0
```

## Examples

```bash
# Create an annotated tag on the current view
atomic tag create v1.0.0 -m "First stable release"

# Create a tag for a specific view, overwriting any existing tag
atomic tag create release-1.0 --view release --force

# List all tags
atomic tag list

# List only annotated tags for the main view
atomic tag list --view main --annotated-only

# Show details for a tag
atomic tag show v1.0.0

# Delete a tag
atomic tag delete v0.9.0-beta
```

## See Also

- [`atomic record`](./record.md) - Record changes
- [`atomic log`](./log.md) - View history
- [`atomic view`](./view.md) - Manage views
