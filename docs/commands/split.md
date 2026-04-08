---
title: split
---

# atomic split

Create a new view by forking from an existing one.

## Synopsis

```bash
atomic split [OPTIONS] <NAME>
```

## Description

The `split` command creates a new view by forking from an existing view. This is a convenience wrapper around `atomic view create <NAME> --from <SOURCE>`, providing a streamlined interface for the common operation of branching off a new line of work.

When you split, Atomic:

1. Creates a new view with the given name
2. Copies the change log from the source view (or current view if `--view` is not specified)
3. Optionally switches to the new view

The new view is a **Draft** view parented on the source, sharing the same underlying graph. No data is duplicated — only change references are copied to `VIEW_CHANGES`.

## Arguments

### `<NAME>`

Name of the new view to create.

View names should be descriptive and follow a naming convention like `feature-*`, `bugfix-*`, `release-*`, etc.

## Options

### `--view <SOURCE>`

Split from a specific source view instead of the current view.

```bash
atomic split new-feature --view main
```

### `--switch`, `-s`

Switch to the new view after creating it. By default, the current view remains unchanged after splitting.

```bash
atomic split feature-auth --switch
```

## Examples

### Split from Current View

```bash
# Create a new view forked from whatever view you're on
atomic split experimental
# Created view: experimental (split from dev with 5 changes)
```

### Split from a Specific View

```bash
# Create a hotfix view from the release view
atomic split hotfix --view release-1.0
# Created view: hotfix (split from release-1.0 with 42 changes)
```

### Split and Switch

```bash
# Create and immediately switch to the new view
atomic split feature-auth --switch
# Created view: feature-auth (split from dev with 10 changes)
# Switched to view: feature-auth
```

## Equivalent Command

`atomic split` is equivalent to:

```bash
atomic view create <NAME> --from <SOURCE>
```

Use `atomic view create` directly when you need additional options like `--draft`, `--parent`, or more fine-grained control over view creation.

## See Also

- [`atomic view`](./view.md) - Full view management (create, switch, list, delete)
- [`atomic insert`](./insert.md) - Insert changes between views
- [`atomic record`](./record.md) - Record changes in the current view

## Documentation Status

⚠️ **This command documentation may be incomplete.** For the most up-to-date options, refer to the built-in help:

```bash
atomic split --help
```
