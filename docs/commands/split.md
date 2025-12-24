---
title: split
---

# atomic split

Split a stack with advanced options.

## Synopsis

```bash
atomic split [OPTIONS] <STACK>
```

## Description

The `split` command creates a new stack by splitting an existing stack. This is similar to `atomic stack new` but provides additional options for advanced use cases.

## Arguments

### `<STACK>`

Name of the new stack to create.

## Options

### `--stack <SOURCE>`

Split from a specific source stack instead of the current stack.

```bash
atomic split new-feature --stack main
```

## Examples

```bash
# Split current stack
atomic split experimental

# Split from specific stack
atomic split hotfix --stack release-1.0
```

## See Also

- [`atomic stack`](./stack.md) - Basic stack management
- [`atomic record`](./record.md) - Record changes in stacks

## Documentation Status

⚠️ **This command documentation is a placeholder and needs to be expanded with complete details from the source code.**

For now, refer to the built-in help:

```bash
atomic split --help
```
