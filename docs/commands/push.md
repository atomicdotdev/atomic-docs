---
sidebar_position: 11
title: push
---

# atomic push

Push changes to a remote.

## Synopsis

```bash
atomic push [OPTIONS] [REMOTE]
```

## Description

The `push` command uploads changes to a remote repository, enabling
collaboration and backup. Atomic compares your local view state with the
remote, determines which changes are missing on the remote, and uploads them.

Atomic's push operation is conflict-free due to the mathematical properties of
patch theory: the remote can accept pushes from multiple sources without merge
conflicts.

### Draft views push their complete graph

When you push a **draft** view, `push` uploads the view's **full effective
change set** — the draft's own changes **plus** every change it inherits from
its shared base — in dependency order, not just the draft's delta. This
guarantees the remote ends up with a complete, self-contained graph for that
view, even on a fresh remote that has never seen the base.

Changes the remote already has are skipped automatically: they're deduplicated
by hash and, when they exist on the remote under another view, adopted as a
cheap metadata operation rather than re-uploaded. So re-including the shared
base is idempotent — nothing is transferred twice.

> This is why the remote stores every pushed view as a self-contained (shared)
> view: the draft/parent relationship is a local concept and isn't transmitted,
> but the view's content is always complete. See
> [`atomic clone --all-views`](./clone.md) for reconstructing sibling views on
> the receiving side.

## Arguments

### `[REMOTE]`

Remote name or URL to push to. Passed positionally. If not specified, the
default remote configured in the repository is used.

```bash
# Push to default remote
atomic push

# Push to named remote
atomic push origin

# Push to a URL
atomic push ssh://user@host/path/to/repo
```

## Options

### `--to-view <TO_VIEW>`

Remote view to push to.

```bash
atomic push origin --to-view main
```

### `--from-view <FROM_VIEW>`

Local view to push from. For a draft view this pushes its full effective change
set (own changes plus the inherited shared base), so the remote receives a
complete graph.

```bash
atomic push --from-view feature-new-ui
```

### `-n, --dry-run`

Show what would be pushed without actually pushing.

```bash
atomic push --dry-run
```

### `-f, --force`

Force push even if histories have diverged.

```bash
atomic push --force
```

### `-a, --all`

Push all changes, not just those missing on the remote.

```bash
atomic push --all
```

### `-k, --insecure`

Skip TLS certificate verification.

```bash
atomic push -k https://insecure-server/repo
```

### `--timeout <TIMEOUT>`

Request timeout in seconds. Defaults to `30`.

```bash
atomic push --timeout 60
```

### `--identity <IDENTITY>`

Identity to use for authentication.

```bash
atomic push --identity work
```

### Global Options

- `-v, --verbose` — Emit extra diagnostic output.
- `--no-color` — Disable ANSI color in output.
- `-h, --help` — Print help.

## Examples

### Basic Push

```bash
# Push current view to default remote
atomic push

# Push to a named remote
atomic push origin

# Push from a specific local view
atomic push --from-view feature-auth
```

### Pushing Between Views

```bash
# Push the local feature view to the remote main view
atomic push origin --from-view feature-ready --to-view main
```

### Previewing and Forcing

```bash
# Preview what would be pushed
atomic push origin --dry-run

# Push everything, forcing past divergence
atomic push origin --all --force
```

### Authentication and Transport

```bash
# Use a specific identity
atomic push origin --identity work

# Increase the request timeout
atomic push origin --timeout 60

# Push to a custom remote URL
atomic push ssh://backup@server/repos/project
```

## See Also

- [`atomic pull`](./pull.md) - Pull changes from a remote
- [`atomic clone`](./clone.md) - Clone a remote repository
- [`atomic remote`](./remote.md) - Manage remotes
- [`atomic view`](./view.md) - Manage views
