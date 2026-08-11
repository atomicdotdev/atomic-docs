---
sidebar_position: 12
title: pull
---

# atomic pull

Pull changes from a remote.

## Synopsis

```bash
atomic pull [OPTIONS] [REMOTE]
```

## Description

The `pull` command downloads changes from a remote repository and applies them
to your local view. Atomic connects to the remote, determines which changes are
missing locally, downloads them, and applies them to the target view.

Atomic's pull operation is mathematically guaranteed to be conflict-free: patch
theory ensures that changes can be applied in any order with consistent results.

If the target local view doesn't exist yet, `pull` **creates it automatically**
rather than failing — so pulling a teammate's view (or a brand-new view named
with `--to-view`) just works. When the target view is also your current view,
the working copy is materialized to reflect the pulled changes; when it's a
different view, the changes are applied to that view's change log and `pull`
prints a hint to `atomic view switch <view>` to check it out.

## Arguments

### `[REMOTE]`

Remote name or URL to pull from. Passed positionally. If not specified, the
default remote configured in the repository is used.

```bash
# Pull from default remote
atomic pull

# Pull from named remote
atomic pull origin

# Pull from a URL
atomic pull ssh://user@host/path/to/repo
```

## Options

### `--to-view <TO_VIEW>`

Local view to pull into. If not specified, defaults to the **remote view being
pulled** (`--from-view`), so `atomic pull --from-view X` pulls into a local
view named `X`. The view is **created automatically** if it doesn't already
exist locally.

```bash
atomic pull origin --to-view feature-new-ui
```

### `--from-view <FROM_VIEW>`

Remote view to pull from. If not specified, defaults to your **current view**.

```bash
atomic pull origin --from-view develop
```

### `-n, --dry-run`

Show what would be pulled without actually pulling.

```bash
atomic pull --dry-run
```

### `-a, --all`

Pull all changes, not just those missing locally.

```bash
atomic pull --all
```

### `-k, --insecure`

Skip TLS certificate verification.

```bash
atomic pull -k https://insecure-server/repo
```

### `--timeout <TIMEOUT>`

Request timeout in seconds. Defaults to `30`.

```bash
atomic pull --timeout 60
```

### `--download-only`

Download changes without applying them to the local view.

```bash
atomic pull --download-only
```

### `--identity <IDENTITY>`

Identity to use for authentication.

```bash
atomic pull --identity work
```

### Global Options

- `-v, --verbose` — Emit extra diagnostic output.
- `--no-color` — Disable ANSI color in output.
- `-h, --help` — Print help.

## Examples

### Basic Pull

```bash
# Pull from default remote
atomic pull

# Pull from a named remote
atomic pull origin

# Pull from upstream
atomic pull upstream
```

### Pulling Between Views

```bash
# Pull the remote develop view into the current view
atomic pull origin --from-view develop

# Pull a remote view into a local view of the same name.
# --to-view defaults to --from-view, and the local view is created if missing.
atomic pull origin --from-view feature-auth

# Pull a remote view into a differently named local view
atomic pull origin --from-view feature-auth --to-view my-local-copy
```

:::note View defaults and auto-creation
`--from-view` defaults to your current view, and `--to-view` defaults to
`--from-view`. If the target local view doesn't exist, `pull` creates it
instead of erroring with "View not found." Pulling into a view other than the
current one updates that view's change log without touching your working copy —
run `atomic view switch <view>` to check it out.
:::

### Previewing and Downloading

```bash
# Preview what would be pulled
atomic pull origin --dry-run

# Pull all changes
atomic pull origin --all

# Download changes without applying them
atomic pull origin --download-only
```

### Authentication and Transport

```bash
# Use a specific identity
atomic pull origin --identity work

# Increase the request timeout
atomic pull origin --timeout 60

# Pull from a custom remote URL
atomic pull ssh://contributor@server/repo
```

## See Also

- [`atomic push`](./push.md) - Push changes to a remote
- [`atomic clone`](./clone.md) - Clone a remote repository
- [`atomic remote`](./remote.md) - Manage remotes
- [`atomic view`](./view.md) - Manage views
