---
sidebar_position: 22
title: sandbox
---

# atomic sandbox

Provision concurrent agent sandboxes (copy-on-write working trees).

## Synopsis

```bash
atomic sandbox <SUBCOMMAND>
atomic sandbox create <n> [--dest <PATH>] [--view <VIEW>] [--from <VIEW>]
atomic sandbox stage <VIEW> --out <DIR> [--base <VIEW>]
atomic sandbox seal <VIEW> --out <DIR> [--entrypoint <ARG>] [--env <KEY=VAL>]
atomic sandbox open <VIEW> [--acting-as <DID>] [--ttl <SECS>] [--capability <CAP>] [--dest <DIR>]
atomic sandbox renew <VIEW> [--ttl <SECS>]
atomic sandbox close <VIEW>
atomic sandbox materialize [--prefix <PATH>]
```

## Description

`atomic sandbox` creates isolated working environments for concurrent agents. Multiple AI agents working in the same directory contend for the same working copy; a sandbox gives each agent its own **copy-on-write clone of the working tree** so they can record changes in parallel without stepping on each other.

Sandboxes compose with views: by default a sandbox operates on the current view, but with `--from` it creates a **new draft view** (named after the sandbox) and points the sandbox at it — each agent then works in its own view, exactly like the multi-agent [view hierarchy](view.md#how-it-works).

Sandboxes also bridge to the container world:

- **`stage`** packages a sandbox's draft view as a **layered OCI image** — a shared base plus a thin delta — so identical bases are stored once across many sandboxes.
- **`seal`** flattens a view into a **self-contained OCI runtime image** with a fixed entrypoint and environment, suitable for running or shipping.
- **`open` / `renew` / `close`** grant, extend, and revoke a remote sandbox's access to one view, with a TTL and explicit capabilities.
- **`materialize`** runs inside a remote sandbox to write its view's tree and cache.

## Subcommands

### `sandbox create` — Create a Sandbox

#### Synopsis

```bash
atomic sandbox create <n> [OPTIONS]
```

#### Arguments

**`<n>`** — Name of the sandbox (used in the default destination path).

#### Options

| Option | Description |
|--------|-------------|
| `--dest <PATH>` | Destination directory for the sandbox working tree |
| `--view <VIEW>` | View the sandbox operates on (defaults to the current view) |
| `--from <VIEW>` | Create a new draft view (named after the sandbox) from this view, and point the sandbox at it |

#### Examples

```bash
# Sandbox on the current view
atomic sandbox create fix-auth

# Sandbox on its own fresh draft view forked from dev
atomic sandbox create fix-auth --from dev

# Custom location
atomic sandbox create review --dest /tmp/review-tree
```

Each sandbox can record its own changes; because the clone is copy-on-write, creating many sandboxes is cheap.

### `sandbox stage` — Stage a Layered OCI Image

#### Synopsis

```bash
atomic sandbox stage <VIEW> --out <DIR> [OPTIONS]
```

#### Arguments

**`<VIEW>`** — The view to stage (the sandbox's draft view).

#### Options

| Option | Description |
|--------|-------------|
| `--base <VIEW>` | The shared base view the delta is computed against (default: `dev`) |
| `-o, --out <DIR>` | Output directory for the OCI image layout |

#### Examples

```bash
# Stage the fix-auth draft view as a thin delta over dev
atomic sandbox stage fix-auth --base dev -o out/oci
```

The result is an OCI image layout whose layers are the shared base view plus only the changes the sandbox introduced — ideal when staging many sandboxes from one base.

### `sandbox seal` — Seal a Self-Contained Image

#### Synopsis

```bash
atomic sandbox seal <VIEW> --out <DIR> [OPTIONS]
```

#### Arguments

**`<VIEW>`** — The view to seal.

#### Options

| Option | Description |
|--------|-------------|
| `-o, --out <DIR>` | Output directory for the OCI image layout |
| `--entrypoint <ARG>` | Image entrypoint argv (repeatable), e.g. `--entrypoint /app/run` |
| `--env <KEY=VAL>` | Image environment variable (repeatable), e.g. `--env PORT=8080` |

#### Examples

```bash
# Seal a view into a runnable image
atomic sandbox seal release-candidate -o out/oci \
  --entrypoint /app/run --env PORT=8080
```

Unlike `stage`, the sealed image is flattened and self-contained — no shared base required.

### `sandbox open` — Grant a Remote Sandbox One View

#### Synopsis

```bash
atomic sandbox open <VIEW> [OPTIONS]
```

#### Arguments

**`<VIEW>`** — The view the sandbox reaches.

#### Options

| Option | Description |
|--------|-------------|
| `--acting-as <DID>` | The identity the sandbox's work is attributed to (an agent's DID) |
| `--ttl <SECS>` | How long the grant lasts, in seconds (1..31536000; renew with `atomic sandbox renew`) (default: 7200) |
| `--capability <CAP>` | A capability to grant (repeatable). Defaults to reading and submitting the view, its provenance, and its vault |
| `--dest <DIR>` | Write the pointer into this directory (created if needed, mode 0600) |

#### Examples

```bash
# Grant a sandbox read/submit access to feature-auth for 2 hours
atomic sandbox open feature-auth --acting-as did:atomic:agent-01

# Grant for 30 seconds with the pointer written to a specific dir
atomic sandbox open feature-auth --ttl 30 --dest /tmp/sandbox-pointer
```

### `sandbox renew` — Extend a Grant

```bash
atomic sandbox renew <VIEW> [--ttl <SECS>]
```

Extend a remote sandbox's grant. `--ttl` is the new lifetime from now, in seconds (default: 7200).

### `sandbox close` — Revoke a Grant

```bash
atomic sandbox close <VIEW>
```

Revoke a remote sandbox's grant now.

### `sandbox materialize` — Materialize Inside a Remote Sandbox

```bash
atomic sandbox materialize [--prefix <PATH>]
```

Inside a remote sandbox: write its view's tree and make its cache.

| Option | Description |
|--------|-------------|
| `--prefix <PATH>` | Materialize only entries at or under this path (a monorepo folder), plus the directories that lead to it. Default: the whole view |

#### Example

```bash
# Inside the sandbox: fetch only the crates/ subtree
atomic sandbox materialize --prefix crates/
```

## See Also

- [view](view.md) — Views and the filter hierarchy sandboxes attach to
- [session](session.md) — The agent session ledger
- [agent lifecycle](agent-lifecycle.md) — Declaring managed agent runs
- [multiple-ai-agents guide](/guides/multiple-ai-agents-without-merge-conflicts) — Sandboxes for multi-agent isolation
