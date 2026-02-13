---
sidebar_position: 14
title: Remote Operations
---

# Remote Operations

Commands for synchronizing your repository with remote servers. Atomic uses a simple push/pull model where changes are content-addressed — the same change hash means the same content everywhere.

## Commands

| Command | Description |
|---------|-------------|
| [`push`](push.md) | Upload local changes to a remote repository |
| [`pull`](pull.md) | Download and apply changes from a remote |
| [`clone`](clone.md) | Create a new local repository from a remote source |
| [`remote`](remote.md) | Add, remove, list, and configure named remotes |

## How Remotes Work

Remotes are named references to repository URLs stored in `.atomic/config.toml`. They let you use short names like `origin` instead of full URLs:

```bash
# Configure once
atomic remote add origin https://api.atomic.dev/acme/platform/core/code

# Use the short name everywhere
atomic push
atomic pull
```

## Sync Model

Unlike Git which transfers commits and refs, Atomic syncs **changes** and **Merkle states**:

1. **Compare states** — Your local stack's Merkle state is compared with the remote's
2. **Find missing changes** — Changes present locally but not remotely (or vice versa)
3. **Transfer changes** — Only the missing changes are uploaded or downloaded
4. **Apply** — Downloaded changes are applied to the local graph

Because changes are content-addressed (identified by their Blake3 hash), the same change always produces the same hash. There's no ambiguity about what's been synced.

## Typical Workflow

### Setting up a new project

```bash
atomic init myproject
cd myproject
atomic remote add origin https://api.atomic.dev/acme/platform/myproject/code
atomic remote default origin

# Work and record changes...
atomic record -m "Initial commit"

# Push to remote
atomic push
```

### Collaborating

```bash
# Pull latest changes from teammates
atomic pull

# Record your work
atomic record -m "Add authentication module"

# Push your changes
atomic push
```

### Working with multiple remotes

```bash
# Add both origin and upstream
atomic remote add origin https://api.atomic.dev/acme/platform/core/code
atomic remote add upstream https://api.atomic.dev/community/oss/atomic/code

# Push to your origin by default
atomic push

# Pull from upstream explicitly
atomic pull --remote upstream
```

## What Gets Pushed

Every `atomic push` sends the complete change including:

- **Hunks** — The graph operations (file diffs)
- **Semantic layer** — FileOps for line/token-level display
- **Provenance** — AI model, tokens, cost (if AI-assisted)
- **Session envelope** — Turn metadata (if recorded by an agent)
- **Transcript** — Conversation data (unhashed, redactable)

The server reconstructs session timelines, usage dashboards, and code review data entirely from the changes it receives. No separate sync protocol needed.

## See Also

- [remote](remote.md) — Managing named remotes
- [push](push.md) — Pushing changes
- [pull](pull.md) — Pulling changes
- [clone](clone.md) — Cloning repositories
- [init](init.md) — Initializing a new repository