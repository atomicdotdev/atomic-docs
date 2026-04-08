---
sidebar_position: 10
title: view
---

# atomic view

Manage views (filtered perspectives on the repository graph).

## Synopsis

```bash
atomic view <SUBCOMMAND>
atomic view create <NAME> [OPTIONS]
atomic view switch <NAME>
atomic view list [--verbose]
atomic view delete <NAME> [--force]
```

## Description

Views in Atomic are **change-set filters** on a single canonical graph. Every edge in the repository is written to one global `GRAPH` immediately — views determine which subset of that graph is visible by tracking which changes belong to them in `VIEW_CHANGES`.

This is fundamentally different from Git branches. A Git branch is a pointer to a commit; an Atomic view is an ordered set of change references that filters the ambient graph into a coherent perspective.

### View Scopes

| Scope | Edge Visibility | Lifecycle | Use Case |
|-------|----------------|-----------|----------|
| **Shared** | Filtered from canonical `GRAPH` | Permanent (cannot be deleted) | `dev`, `release`, `main` |
| **Draft** | Filtered from canonical `GRAPH` | Ephemeral (deletable) | features, bugs, experiments |

Both scopes read from and write to the same canonical `GRAPH`. The difference is lifecycle: draft views can be deleted (their `VIEW_CHANGES` entries are removed; orphaned edges are cleaned by GC), while shared views are permanent collaborative history.

### How It Works

Views form a parent hierarchy that defines the **filter chain** for graph traversal:

```
  main  (Shared, parent=None — the only true root)
    │
  release  (Shared, parent=main)
    │
  dev  (Shared, parent=release)
    │
    ├── service-auth  (Draft, parent=dev)
    │     ├── feature-login   (Draft, parent=service-auth)
    │     └── feature-logout  (Draft, parent=service-auth)
    │
    └── service-payments  (Draft, parent=dev)
          └── bug-checkout  (Draft, parent=service-payments)
```

A view's **effective filter** is the union of its own `VIEW_CHANGES` and all ancestor views' `VIEW_CHANGES`, plus the transitive dependency closure:

```
feature-login filter = VIEW_CHANGES[feature-login]
                     ∪ VIEW_CHANGES[service-auth]   (parent, Draft)
                     ∪ VIEW_CHANGES[dev]             (ancestor, Shared)
                     ∪ VIEW_CHANGES[release]         (ancestor, Shared)
                     ∪ VIEW_CHANGES[main]            (root)
                     ∪ dependency closure
```

During graph traversal, an edge is visible if the change that introduced it is in the view's effective filter. All edges live in the single `GRAPH` table; the view just decides which ones to follow.

This means a team working on `service-payments` automatically sees infrastructure changes that were inserted into `dev` from `service-auth` — no sync, no rebase, no manual intervention.

### Key Differences from Git Branches

| Aspect | Git Branches | Atomic Views |
|--------|--------------|--------------|
| Data Model | Pointer to a commit | Ordered set of change references |
| Storage | Duplicates history | Single `GRAPH`, per-view change filters |
| "Merging" | 3-way merge with conflicts | Insert change references (with dependency closure) |
| State | HEAD commit hash | Merkle hash of change sequence |
| Cleanup | Manual `git branch -D` + orphaned objects | Delete `VIEW_CHANGES` entries; GC orphaned edges |
| Collaboration | Isolated snapshots | Filtered perspectives, real-time sharing |

## Subcommands

### `view create` — Create a New View

#### Synopsis

```bash
atomic view create <NAME> [OPTIONS]
```

#### Arguments

**`<NAME>`** — Name for the new view.

#### Options

| Option | Description |
|--------|-------------|
| `--draft`, `-d` | Create a draft view (ephemeral, deletable) |
| `--parent <VIEW>` | Set the parent view (defaults to current view) |
| `--from <VIEW>` | Fork from an existing view (copies its change log) |
| `--switch`, `-s` | Switch to the new view after creation |

#### Examples

```bash
# Create a draft feature view (most common workflow)
atomic view create feature-auth --draft

# Create a draft view with an explicit parent
atomic view create feature-login --draft --parent service-auth

# Create a shared view (permanent, like a release line)
atomic view create release-2.0

# Fork from an existing view (copies change history)
atomic view create hotfix --from release-1.0

# Create and switch in one command
atomic view create feature-api --draft --switch
```

#### View Scopes

**Without `--draft`** (default): Creates a **shared** view. The view is permanent and visible to all collaborators. Use for long-lived integration points like `dev`, `release`, `main`.

**With `--draft`**: Creates a **draft** view. The view can be deleted when no longer needed — deletion removes its `VIEW_CHANGES` entries, and orphaned edges are cleaned by GC. Use for features, bugs, experiments, and service-level work.

#### Parent Chain

The `--parent` option sets where this view sits in the filter hierarchy. When you're working in a view, graph traversal filters edges through your view's changes, then your parent's, all the way up to the root.

```bash
# Stacked draft views for team-level organization
atomic view create service-auth --draft --parent dev
atomic view create feature-login --draft --parent service-auth
atomic view create feature-oauth --draft --parent service-auth

# feature-login sees:
#   VIEW_CHANGES[feature-login]     ← my changes
#   ∪ VIEW_CHANGES[service-auth]    ← parent's changes
#   ∪ VIEW_CHANGES[dev]             ← grandparent's changes (and up)
```

### `view switch` — Switch to a Different View

#### Synopsis

```bash
atomic view switch <NAME>
```

#### Arguments

**`<NAME>`** — Name of the view to switch to.

#### Examples

```bash
# Switch to main
atomic view switch main

# Switch to a feature view
atomic view switch feature-auth

# Switch to a service view
atomic view switch service-auth
```

When you switch views:
1. The working copy is updated to match the target view's state
2. Files are created, updated, or removed to reflect the new view's graph filter
3. The new view becomes the current view

**Note**: Switching views updates your working copy files. Unrecorded changes may be affected.

### `view list` — List All Views

#### Synopsis

```bash
atomic view list [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--verbose`, `-v` | Show scope, parent, change count, and state hash |

#### Examples

```bash
# Simple list (current view marked with *)
$ atomic view list
  dev
* feature-auth
  release-1.0
  service-auth
```

```bash
# Verbose list showing the view model
$ atomic view list --verbose
* dev            [shared]  (12 changes)  state: 2AAAAAAAA...
  feature-auth   [draft]   (3 changes)   state: XYZABCDEF...  parent: dev
  release-1.0    [shared]  (8 changes)   state: QRSTUVWXY...  parent: main
  service-auth   [draft]   (15 changes)  state: 123456789...  parent: dev
  feature-login  [draft]   (2 changes)   state: ABCDEFGHI...  parent: service-auth
```

### `view delete` — Delete a View

#### Synopsis

```bash
atomic view delete <NAME> [OPTIONS]
```

#### Arguments

**`<NAME>`** — Name of the view to delete.

#### Options

| Option | Description |
|--------|-------------|
| `--force`, `-f` | Force deletion without confirmation |

#### Rules

- **Shared views cannot be deleted** — they represent permanent collaborative history.
- **Views with children cannot be deleted** — delete or reparent children first.
- **The current view cannot be deleted** — switch to a different view first.
- **Draft views** have their `VIEW_CHANGES` entries removed. Orphaned edges (not referenced by any other view) are cleaned by background GC.

#### Examples

```bash
# Delete an abandoned feature view
atomic view delete feature-old
# ✓ Deleted view: feature-old

# Force delete without confirmation prompt
atomic view delete experiment --force
# ✓ Deleted view: experiment
```

#### What Happens to Inserted Changes?

When you insert changes from a draft view into a shared view (like `dev`), those change references are added to the target view's `VIEW_CHANGES`. If you then delete the source draft view:

- `VIEW_CHANGES` entries for the draft view → **removed**
- Change references already inserted into other views → **preserved**
- Edges in the canonical `GRAPH` → **preserved** (as long as any view references them)
- Edges referenced only by the deleted view → **cleaned by GC**

This is the clean lifecycle:

```bash
# Create and work
atomic view create feature --draft --switch
atomic record -m "add login"
atomic record -m "add logout"
atomic record -m "add session mgmt"

# Insert some changes into dev
atomic insert <login-hash> --to-view dev
atomic insert <session-hash> --to-view dev

# Abandon the rest and clean up
atomic view switch dev
atomic view delete feature
# ✓ "logout" change reference removed (never inserted anywhere else)
# ✓ "login" and "session" references preserved in dev
# ✓ Orphaned edges from "logout" cleaned by GC
```

## View Types in Practice

### Short-Lived Feature Work

```bash
# Create a draft view for a quick bug fix
atomic view create bugfix-123 --draft --switch
atomic record -m "Fix null pointer in auth"
atomic insert <hash> --to-view dev
atomic view switch dev
atomic view delete bugfix-123
```

### Long-Lived Service Work (Monorepo)

```bash
# Team A: service-level view that lives for months
atomic view create service-auth --draft --parent dev

# Individual features stacked on the service view
atomic view create feature-oauth --draft --parent service-auth --switch
atomic record -m "Add OAuth provider"
atomic record -m "Add token refresh"

# Insert shared infrastructure into dev (visible to all teams)
atomic insert <oauth-provider-hash> --to-view dev

# Team B sees it immediately via their filter chain
# (service-payments is also parented on dev)
```

### Release Management

```bash
# Create a shared release view
atomic view create release-2.0 --parent main

# Insert specific changes from dev
atomic insert <feature-hash> --to-view release-2.0
atomic insert <bugfix-hash> --to-view release-2.0

# Tag the release
atomic tag create v2.0.0 --stack release-2.0 -m "Release 2.0"
```

## Inserting Changes Between Views

When you insert a change into another view, Atomic automatically resolves the **full dependency closure** — it's not a cherry-pick of a single change, it pulls in every change the target depends on to remain mathematically consistent:

```bash
# feature has changes: C1, C2, C3, C4, C5
# C5 depends on C1 → C2 → C3

atomic insert C5 --to-view dev
# Atomic computes: deps(C5) = {C1, C2, C3}
# dev already has: {C1}
# Missing: {C2, C3, C5} → inserted in dependency order
```

Because all edges are already in the canonical `GRAPH`, insert is an **O(1) metadata operation** per change — it only writes entries to `VIEW_CHANGES`. No edge copying is needed.

This ensures the target view is always in a mathematically consistent state. You never get a "missing dependency" error after inserting.

See [`atomic insert`](./insert.md) for the full insert command reference.

## Comparing Views

```bash
# Preview what would be inserted (dry run)
atomic insert --from feature --to-view dev --dry-run

# See the change-level diff between two views
# (which changes exist in one but not the other)
```

## View Properties

Each view maintains:

| Property | Description |
|----------|-------------|
| **Name** | Human-readable identifier |
| **Scope** | `Shared` (permanent) or `Draft` (deletable) |
| **Parent** | The view this one is based on (`None` for root) |
| **Change sequence** | Ordered list of change references in `VIEW_CHANGES` |
| **Merkle state** | Cryptographic hash of the change sequence |
| **Change count** | Number of changes referenced |

### Merkle State

Each view maintains an incremental Merkle hash representing its complete state:

```
state_0 = Hash(empty)
state_1 = Hash(state_0 || change_hash_1)
state_2 = Hash(state_1 || change_hash_2)
...
```

This enables efficient sync (compare Merkle states to find divergence), integrity verification, and deterministic state identification.

## Default View

When you initialize a repository, a default shared view is created:

```bash
atomic init
# Creates "dev" view (shared, root)

# Or specify a custom name
atomic init --stack main
```

:::note
The `--stack` flag on `init` and other commands (like `log --stack`) has not yet been renamed to `--view`. This only affects the `atomic view` subcommand itself.
:::

## Performance

View operations are fast because they only manipulate metadata (`VIEW_CHANGES` entries), not graph edges:

| Operation | Time | Notes |
|-----------|------|-------|
| Create | < 10ms | Writes view metadata |
| Switch | 100ms–5s | Depends on working copy size (materializing the view) |
| List | < 10ms | Scans `VIEWS` table |
| Delete (draft) | < 50ms | Removes `VIEW_CHANGES` entries; GC cleans orphaned edges |
| Delete (shared) | Blocked | Shared views are permanent |
| Insert (per change) | O(1) | Metadata write to `VIEW_CHANGES` (no edge copying) |
| Graph traversal | O(edges) | Filtered by `introduced_by ∈ visible_changes` |

## Configuration

```toml
# .atomic/config.toml

[repository]
default_view = "dev"

[view.main]
protected = true  # Prevent accidental deletion

[view.release]
protected = true
```

## See Also

- [`atomic record`](./record.md) — Record changes in the current view
- [`atomic insert`](./insert.md) — Insert changes between views
- [`atomic stash`](./stash.md) — Temporarily save uncommitted changes
- [`atomic log`](./log.md) — View change history
- [`atomic diff`](./diff.md) — Compare working copy with recorded state
- [`atomic tag`](./tag.md) — Tag view states