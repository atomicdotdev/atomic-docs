---
sidebar_position: 5
title: clone
---

# atomic clone

Clone a hosted Atomic repository into a new local directory.

## Synopsis

```bash
atomic clone <SOURCE> [PATH] [OPTIONS]
```

## Description

`clone` creates a complete, independent local copy of a hosted project:

1. Initializes a new repository in the target directory
2. Connects to the remote and downloads its changes
3. Inserts them into the requested view
4. Configures the remote as `origin`

`<SOURCE>` is either a **full URL** or a **project reference** that Atomic
resolves from your configuration.

## Arguments

### `<SOURCE>`

Either a full clone URL, or — when it contains no `://` — a **project
reference** resolved against your active [server profile](server.md):

- `<project>` — uses your default org and default workspace
- `<workspace>/<project>` — uses the given workspace

```bash
# Project reference (resolved from config)
atomic clone hello-world
atomic clone demos/hello-world

# Full URL
atomic clone https://acme.atomic.storage/workspaces/demos/projects/hello-world/code
```

For a reference, the URL is built as
`{org_base_url}/workspaces/{workspace}/projects/{project}/code`, where the org
comes from the active profile's default org (falling back to the **personal org
of your default identity**) and the workspace from the org's default workspace
(set with [`atomic workspace set`](workspace.md)).

### `[PATH]`

Optional destination directory. Defaults to the project/repository name
inferred from the source.

```bash
atomic clone hello-world               # → ./hello-world
atomic clone hello-world my-checkout   # → ./my-checkout
```

## Options

### Project-reference resolution

These apply only when `<SOURCE>` is a reference (ignored for full URLs):

| Option | Description |
|--------|-------------|
| `--org <ORG>` | Organization override (default: active profile's org → identity's personal org) |
| `-w`, `--workspace <SLUG>` | Workspace override (takes precedence over a `workspace/` prefix) |
| `--server <NAME>` | [Server profile](server.md) to resolve against (default: the active profile) |

```bash
# Clone from a specific workspace and server without changing your defaults
atomic clone hello-world --workspace demos --server staging
```

### `--view <VIEW>`

View to clone and check out (default: `dev`).

```bash
atomic clone hello-world --view main
```

### `-k`, `--insecure`

Skip TLS certificate verification. Use only for testing or self-signed
certificates.

### `--timeout <SECONDS>`

Request timeout in seconds (default: 30).

### `--download-only`

Download changes into the change store without inserting them into a view.
Useful for inspecting changes first; apply them later with `atomic insert`.

### `--into-existing`

Bootstrap Atomic inside an existing Git checkout without materializing Atomic
content over the Git working tree. Requires a `[PATH]` pointing at the Git
worktree root.

### `--all-views`

Also clone **every other view** the remote exposes, not just `--view`. Each
additional view is created locally and populated from the remote. Because
changes are content-addressed and shared across views, this mostly adds view
references without re-downloading content.

Without this flag, `clone` fetches only the requested `--view`, but prints a
hint listing the other views available on the remote so you know they exist.

```bash
# Clone every view, not just dev
atomic clone hello-world --all-views
```

:::note Views arrive as shared
The server stores every pushed view as a self-contained **shared** view, so a
draft's original parent relationship isn't transmitted and can't be
reconstructed on clone. `--all-views` recreates the sibling views by name (each
with its complete graph); it does not restore draft scope or parent links.
Requires a server that supports the view-inventory endpoint — older servers are
treated as single-view.
:::

## Examples

### Clone by project reference

```bash
# Uses your active server, default org, and default workspace
atomic clone hello-world

# Name the workspace inline
atomic clone demos/hello-world

# Override workspace/server for one command
atomic clone hello-world -w demos --server staging
```

### Clone by URL

```bash
atomic clone https://acme.atomic.storage/workspaces/demos/projects/hello-world/code
```

### Clone a specific view

```bash
atomic clone hello-world --view main
```

### Download without applying

```bash
atomic clone hello-world --download-only
# then, inside the repo:
atomic insert <hash>
```

### Clone all views

```bash
# Reconstruct every view the remote exposes, each fully populated
atomic clone hello-world --all-views
cd hello-world
atomic view list        # shows all remote views, not just dev
```

## Authentication

Atomic authenticates with your configured **identity** (an Ed25519 key), not
SSH keys or passwords. The identity is inferred from the target server, and a
short-lived signed token is minted automatically. Register with a server first:

```bash
atomic identity register https://atomic.storage
```

See [`atomic identity`](./identity.md) and [`atomic server`](./server.md).

## After cloning

```bash
cd hello-world
atomic log            # inspect history
atomic status         # working copy state
atomic view list      # available local views
atomic view list --remote   # views available on the remote
```

By default `clone` pulls only the requested `--view`. To bring down every view
the remote has, use [`--all-views`](#--all-views), or inspect what's available
first with [`atomic view list --remote`](./view.md).

The remote is saved as `origin` in `.atomic/config.toml`, so `atomic push` /
`atomic pull` work without re-specifying the URL.

## See Also

- [`atomic project`](./project.md) — the hosted projects you clone
- [`atomic server`](./server.md) — server profiles used to resolve references
- [`atomic workspace`](./workspace.md) — set the default workspace
- [`atomic init`](./init.md) — initialize a brand-new repository
- [`atomic pull`](./pull.md) / [`atomic push`](./push.md) — sync with the remote
