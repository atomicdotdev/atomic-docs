---
sidebar_position: 28
title: update
---

# atomic update

Check for available updates and route to the correct upgrade path.

## Synopsis

```bash
atomic update [--check]
```

## Description

`atomic update` compares your installed CLI version against the latest release and prints the upgrade command appropriate for how Atomic was installed (for example, a package manager or an installer script).

It is safe to run at any time — without `--check` it only prints status and, when an update exists, the exact command to run.

## Options

| Option | Description |
|--------|-------------|
| `--check` | Report status without printing upgrade commands. Exits `1` if an update is available, `0` if up to date, `4` on network error or unparseable versions |

The `--check` exit codes make it script-friendly:

```bash
atomic update --check
if [ $? -eq 1 ]; then
  echo "an update is available"
fi
```

## Examples

### Check and upgrade

```bash
atomic update
# → prints the correct upgrade command for your installation
```

### Gate a script on the version

```bash
atomic update --check || echo "update available (exit $?)"
```

## See Also

- [installation](/docs/getting-started/installation) — Installing Atomic
