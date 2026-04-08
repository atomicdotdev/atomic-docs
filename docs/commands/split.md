---
title: split
---

# atomic split

Split a view with advanced options.

## Synopsis

```bash
atomic split [OPTIONS] <STACK>
```

## Description

The `split` command creates a new view by splitting an existing view. This is similar to `atomic view create` but provides additional options for advanced use cases.

## Arguments

### `<STACK>`

Name of the new view to create.

## Options

### `--stack <SOURCE>`

Split from a specific source view instead of the current view.

```bash
atomic split new-feature --stack main
```

## Examples

```bash
# Split current view
atomic split experimental

# Split from specific view
atomic split hotfix --stack release-1.0
```

## See Also

- [`atomic view`](./view.md) - Basic view management
- [`atomic record`](./record.md) - Record changes in views

## Documentation Status

⚠️ **This command documentation is a placeholder and needs to be expanded with complete details from the source code.**

For now, refer to the built-in help:

```bash
atomic split --help
```
