---
sidebar_position: 10
title: stack
---

# atomic stack

Manage workspaces (independent lines of development).

## Synopsis

```bash
atomic stack <SUBCOMMAND>
atomic stack new <NAME> [OPTIONS]
atomic stack switch <NAME>
atomic stack list [--verbose]
atomic stack delete <NAME>
```

## Description

Stacks in Atomic are **workspaces** — views of the repository graph with their own edge storage and lifecycle. Every stack sees the shared graph, but how and where it stores its own edges depends on its **kind**:

| Workspace Kind | Edge Storage | Lifecycle | Use Case |
|----------------|-------------|-----------|----------|
| **Shared** | Global `GRAPH` | Permanent | dev, release, main |
| **Local** | Per-stack `STACK_GRAPH` | Ephemeral (deletable) | feature, bug, service work |

All workspaces see the shared graph — local workspaces are **not** isolated. They layer their own pending edges on top of the global graph via an **overlay chain**, giving full visibility into dependencies and build infrastructure while keeping their own work separate.

### How It Works

```
  main  (Shared, root)
    │
  release  (Shared, parent=main)
    │
  dev  (Shared, parent=release)
    │
    ├── service-auth  (Local, parent=dev)
    │     ├── feature-login   (Local, parent=service-auth)
    │     └── feature-logout  (Local, parent=service-auth)
    │
    └── service-payments  (Local, parent=dev)
          └── bug-checkout  (Local, parent=service-payments)
```

Each local workspace's **effective view** is the union of:
1. Its own `STACK_GRAPH` edges (pending work)
2. Its parent's effective view (recursively)
3. The global `GRAPH` (when a shared ancestor is reached)

```
feature-login sees:
  STACK_GRAPH[feature-login]     ← my pending edges
  ∪ STACK_GRAPH[service-auth]    ← parent's pending edges
  ∪ GRAPH                         ← dev's shared edges (and everything below)
```

This means a team working on `service-payments` automatically sees infrastructure changes that `service-auth` applied to `dev` — no sync, no rebase, no manual intervention.

### Key Differences from Git Branches

| Aspect | Git Branches | Atomic Workspaces |
|--------|-------------|-------------------|
| Data Model | Pointer to a commit | Ordered sequence of changes + overlay chain |
| Storage | Duplicates history | Shared graph + per-workspace edge layer |
| Visibility | Only sees own branch | Sees global graph + parent chain via overlay |
| Merging | 3-way merge with conflicts | Apply changes with automatic dependency closure |
| Cleanup | Manual `git branch -D` + orphaned objects | Cascade delete `STACK_GRAPH` → zero orphans |
| Monorepo | Painful cross-branch dependencies | Automatic via overlay chain |

## Subcommands

### `stack new` — Create a New Workspace

#### Synopsis

```bash
atomic stack new <NAME> [OPTIONS]
```

#### Arguments

**`<NAME>`** — Name for the new workspace.

#### Options

| Option | Description |
|--------|-------------|
| `--local`, `-i` | Create a local workspace (edges in `STACK_GRAPH`, deletable) |
| `--parent <STACK>` | Set the parent workspace (defaults to current) |
| `--from <STACK>` | Fork from an existing workspace (copies change log) |
| `--empty` | Create with no history (orphan workspace) |
| `--switch`, `-s` | Switch to the new workspace after creation |

#### Examples

```bash
# Create a local feature workspace (most common)
atomic stack new feature-auth --local

# Create a local workspace with explicit parent
atomic stack new feature-login --local --parent service-auth

# Create a shared workspace (permanent, like a release branch)
atomic stack new release-2.0

# Fork from an existing workspace (copies change history)
atomic stack new hotfix --from release-1.0

# Create and switch in one command
atomic stack new feature-api --local --switch
```

#### Workspace Kinds

**Without `--local`** (default): Creates a **shared** workspace. Edges are written to the global `GRAPH` table and are permanent. Use for long-lived integration points like `dev`, `release`, `main`.

**With `--local`**: Creates a **local** workspace. Edges are written to the per-stack `STACK_GRAPH` table and are cascade-deleted when the workspace is removed. Use for features, bugs, experiments, and service-level work.

#### Parent Chain

The `--parent` option sets where this workspace sits in the overlay hierarchy. When you're working in a local workspace, graph traversal reads edges from your `STACK_GRAPH`, then your parent's, then your grandparent's, all the way up to the shared graph.

```bash
# Stacked local workspaces for team-level organization
atomic stack new service-auth --local --parent dev
atomic stack new feature-login --local --parent service-auth
atomic stack new feature-oauth --local --parent service-auth

# feature-login sees: its own edges + service-auth edges + dev edges
# feature-oauth sees: its own edges + service-auth edges + dev edges
# service-auth sees:  its own edges + dev edges
```

### `stack switch` — Switch to a Different Workspace

#### Synopsis

```bash
atomic stack switch <NAME>
```

#### Arguments

**`<NAME>`** — Name of the workspace to switch to.

#### Examples

```bash
# Switch to main
atomic stack switch main

# Switch to a feature workspace
atomic stack switch feature-auth

# Switch to a service workspace
atomic stack switch service-auth
```

When you switch workspaces:
1. The working copy is updated to match the workspace's state
2. Uncommitted changes remain in your working copy
3. The new workspace becomes current

### `stack list` — List All Workspaces

#### Synopsis

```bash
atomic stack list [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--verbose`, `-v` | Show kind, parent, change count, and state hash |

#### Examples

```bash
# Simple list (current workspace marked with *)
$ atomic stack list
* dev
  feature-auth
  release-1.0
  service-auth
```

```bash
# Verbose list showing the workspace model
$ atomic stack list --verbose
* dev            [shared]  (12 changes)  state: 2AAAAAAAA...
  feature-auth   [local]   (3 changes)   state: XYZABCDEF...  parent: dev
  release-1.0    [shared]  (8 changes)   state: QRSTUVWXY...  parent: main
  service-auth   [local]   (15 changes)  state: 123456789...  parent: dev
  feature-login  [local]   (2 changes)   state: ABCDEFGHI...  parent: service-auth
```

### `stack delete` — Delete a Workspace

#### Synopsis

```bash
atomic stack delete <NAME>
```

#### Arguments

**`<NAME>`** — Name of the workspace to delete.

#### Rules

- **Shared workspaces cannot be deleted** — they own global graph edges that other workspaces depend on.
- **Workspaces with children cannot be deleted** — delete or reparent children first.
- **The current workspace cannot be deleted** — switch to a different workspace first.
- **Local workspaces cascade-delete** all their `STACK_GRAPH` edges. Zero orphans remain.

#### Examples

```bash
# Delete an abandoned feature workspace
atomic stack delete feature-old
# ✓ Deleted workspace: feature-old (removed 42 edges)

# Delete a workspace whose changes were already applied to dev
atomic stack delete feature-auth
# ✓ Deleted workspace: feature-auth (removed 18 edges)
# Note: Changes applied to dev remain in the global graph.
```

#### What Happens to Applied Changes?

When you apply changes from a local workspace to a shared workspace (like `dev`), those changes' edges are written to the global `GRAPH`. If you then delete the local workspace:

- Edges in `STACK_GRAPH` (pending/unapplied work) → **deleted**
- Edges in `GRAPH` (already applied to a shared workspace) → **preserved**

This is the clean lifecycle:

```bash
# Create and work
atomic stack new feature --local
atomic record -m "add login"
atomic record -m "add logout"
atomic record -m "add session mgmt"

# Apply some changes to dev
atomic apply <login-hash> --to dev
atomic apply <session-hash> --to dev

# Abandon the rest and clean up
atomic stack delete feature
# ✓ "logout" edges removed (never applied anywhere)
# ✓ "login" and "session" edges preserved in dev's global graph
```

## Workspace Types in Practice

### Short-Lived Feature Work

```bash
# Create a local workspace for a quick bug fix
atomic stack new bugfix-123 --local --switch
atomic record -m "Fix null pointer in auth"
atomic apply <hash> --to dev
atomic stack switch dev
atomic stack delete bugfix-123
```

### Long-Lived Service Work (Monorepo)

```bash
# Team A: service-level workspace that lives for months
atomic stack new service-auth --local --parent dev

# Individual features stacked on the service workspace
atomic stack new feature-oauth --local --parent service-auth --switch
atomic record -m "Add OAuth provider"
atomic record -m "Add token refresh"

# Apply shared infrastructure to dev (visible to all teams)
atomic apply <oauth-provider-hash> --to dev

# Team B sees it immediately via their overlay chain
# (service-payments is also parented on dev)
```

### Release Management

```bash
# Create a shared release workspace
atomic stack new release-2.0 --parent main

# Cherry-pick specific changes
atomic apply <feature-hash> --to release-2.0
atomic apply <bugfix-hash> --to release-2.0

# Tag the release
atomic tag create v2.0.0 --stack release-2.0 -m "Release 2.0"
```

## Applying Changes Between Workspaces

When you apply a change to another workspace, Atomic automatically resolves the **full dependency closure** — it's not a cherry-pick of a single change, it pulls everything that change needs to be correct:

```bash
# feature has changes: C1, C2, C3, C4, C5
# C5 depends on C1 → C2 → C3

atomic apply C5 --to dev
# Atomic computes: deps(C5) = {C1, C2, C3}
# dev already has: {C1}
# Missing: {C2, C3, C5} → applied in dependency order
```

This ensures the target workspace is always in a mathematically consistent state. You never get a "missing dependency" error after applying.

```bash
# Apply all missing changes from one workspace to another
atomic apply --from feature --to dev

# Preview what would be applied (dry run)
atomic apply --from feature --to dev --dry-run

# Apply specific changes with their dependencies
atomic apply <hash1> <hash2> --to dev
```

## Comparing Workspaces

```bash
# See which changes are in feature but not in dev
atomic apply --from feature --to dev --dry-run

# See the change-level diff between two workspaces
# (which changes exist in one but not the other)
```

## Stashes Are Local Workspaces

The `atomic stash` command creates short-lived local workspaces under the hood. A stash is simply a local workspace with:
- Auto-generated name (`stash/0`, `stash/1`, etc.)
- Push/pop UX semantics
- No explicit parent (orphan)

See [`atomic stash`](./stash.md) for the stash-specific commands.

## Stack Properties

Each workspace maintains:

| Property | Description |
|----------|-------------|
| **Name** | Human-readable identifier |
| **Kind** | `Shared` or `Local` |
| **Parent** | The workspace this one is based on (`None` for root) |
| **Change sequence** | Ordered list of applied changes |
| **Merkle state** | Cryptographic hash of the change sequence |
| **Change count** | Number of changes applied |

## Default Workspace

When you initialize a repository, a default shared workspace is created:

```bash
atomic init
# Creates "dev" workspace (shared, root)

# Or specify a custom name
atomic init --stack main
```

## Performance

Workspace operations are fast:

| Operation | Time | Notes |
|-----------|------|-------|
| Create | < 10ms | Just metadata |
| Switch | 100ms–5s | Depends on working copy size |
| List | < 10ms | Scans STACKS table |
| Delete (local) | < 50ms | Cascade prefix scan on STACK_GRAPH |
| Delete (shared) | Blocked | Shared workspaces are permanent |
| Overlay traversal | O(edges × chain depth) | Chain depth is typically 1–3 |

## Configuration

```toml
# .atomic/config.toml

[repository]
default_stack = "dev"

[stack.main]
protected = true  # Prevent accidental deletion

[stack.release]
protected = true
```

## See Also

- [`atomic record`](./record.md) — Record changes in current workspace
- [`atomic apply`](./apply.md) — Apply changes between workspaces
- [`atomic stash`](./stash.md) — Temporarily save uncommitted changes
- [`atomic log`](./log.md) — View workspace history
- [`atomic diff`](./diff.md) — Compare working copy with recorded state
- [`atomic tag`](./tag.md) — Tag workspace states
- [The Graph Model](../concepts/graph-model-explained.md) — How vertices and edges work