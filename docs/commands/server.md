---
sidebar_position: 19
title: server
---

# atomic server

Manage named server profiles for Atomic Storage.

## Synopsis

```bash
atomic server                                      # list profiles
atomic server add <NAME> <URL> [OPTIONS]
atomic server set <NAME>
atomic server set --default
atomic server show [NAME]
atomic server remove <NAME>
atomic server set-identity <NAME> <IDENTITY>
atomic server set-identity <NAME> --clear
```

## Description

A **server profile** is a named atomic-storage connection stored under
`[servers.*]` in `~/.atomic/config.toml`. Each profile has its own URL,
default organization, and identity, letting you switch between environments
(e.g. `staging` and `prod`) with a single command — or per-command with
`--server <name>`.

The management commands (`atomic org`, `atomic workspace`, `atomic project`,
`atomic team`) all resolve their target server through the **active** profile:

1. `--server <name>` passed on the command, else
2. the active default profile (`atomic server set <name>`), else
3. the legacy `[server]` block (written by `atomic identity register`).

:::info `server` vs `remote`
`atomic server` manages **atomic-storage connection profiles** (global, in
`~/.atomic/config.toml`) — the URL/org/identity used by management commands.
[`atomic remote`](./remote.md) manages **per-repository remote URLs** (in the
repo's `.atomic/config.toml`) used by `push`/`pull`/`clone`. They are
independent.
:::

## Subcommands

### `server` (no subcommand) — List profiles

Lists all configured server profiles. The active profile is marked with `*`.

```bash
atomic server
```

**Example output:**

```
prod *	https://atomic.storage, identity: alice-prod
staging	https://staging.atomic.storage, org: alice, identity: alice-staging
```

If no named profiles exist, the legacy `[server]` block is shown instead (if
configured), along with a hint to add one.

### `add` — Add a profile

```bash
atomic server add <NAME> <URL> [OPTIONS]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Name for the new profile (e.g. `staging`, `prod`) |
| `<URL>` | Base URL of the atomic-storage server (must include a scheme, e.g. `https://`) |

**Options:**

| Option | Description |
|--------|-------------|
| `--org <ORG>` | Default organization slug for this server |
| `--identity <IDENTITY>` | Identity name to use when connecting to this server |
| `--set-default` | Make this the active default server immediately |

**Examples:**

```bash
# Add a staging profile bound to a specific identity
atomic server add staging https://staging.atomic.storage --identity alice-staging

# Add a prod profile and make it active right away
atomic server add prod https://atomic.storage --org acme --set-default
```

### `set` — Switch the active profile

```bash
atomic server set <NAME>
atomic server set --default
```

Sets `default_server` in `~/.atomic/config.toml`. Pass `--default` (with no
name) to clear the active named profile and **revert to the legacy `[server]`
block**.

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Profile to make active (required unless `--default`) |

**Options:**

| Option | Description |
|--------|-------------|
| `--default` | Clear `default_server` and use the legacy `[server]` block |

**Examples:**

```bash
# Switch to staging
atomic server set staging

# Revert to the legacy [server] block
atomic server set --default
```

### `show` — Show a profile

```bash
atomic server show [NAME]
```

Shows a profile's URL, org, identity, and any per-org default workspaces.
Without a name, shows the **active** profile (or the legacy `[server]` block if
no named profile is active).

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[NAME]` | Profile to show (default: the active profile) |

**Example:**

```bash
atomic server show
# Server profile: prod (active)
#   URL:      https://atomic.storage
#   Org:      acme
#   Identity: alice-prod
```

### `remove` — Remove a profile

Alias: `rm`.

```bash
atomic server remove <NAME>
```

Removes the profile. If it was the active profile, the active default is
cleared and Atomic reverts to the legacy `[server]` block.

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Profile to remove |

**Examples:**

```bash
atomic server remove staging
atomic server rm staging
```

### `set-identity` — Bind an identity to a profile

```bash
atomic server set-identity <NAME> <IDENTITY>
atomic server set-identity <NAME> --clear
```

Binds an identity to a profile so management commands targeting that server
authenticate as it, overriding the global default identity. Use `--clear` to
remove the binding and fall back to the global default.

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<NAME>` | Profile to update |
| `<IDENTITY>` | Identity name to bind (required unless `--clear`) |

**Options:**

| Option | Description |
|--------|-------------|
| `--clear` | Remove the identity binding (revert to the global default) |

**Examples:**

```bash
# Bind an identity
atomic server set-identity prod alice-prod

# Remove the binding
atomic server set-identity prod --clear
```

## Per-command override

Any management command accepts `--server <name>` to target a specific profile
for that invocation without changing the active default:

```bash
atomic project list --server staging
atomic workspace list --server prod
```

## Configuration

Profiles are stored under `[servers.*]` in `~/.atomic/config.toml`, and the
active one is named by `default_server`:

```toml
default_server = "prod"

# Legacy single-server block (used when no named profile is active).
[server]
url = "https://atomic.storage"
default_org = "alice"

[servers.staging]
url = "https://staging.atomic.storage"
default_org = "alice"
identity = "alice-staging"

[servers.prod]
url = "https://atomic.storage"
identity = "alice-prod"

# Per-org default workspaces live on the profile.
[servers.prod.default_workspaces]
acme = "backend"
```

Most of the time you don't edit this by hand — `atomic identity register`,
`atomic server`, `atomic org set`, and `atomic workspace set` maintain it for
you.

## Examples

### Set up staging and production

```bash
# Register production (writes the legacy [server] block)
atomic identity register https://atomic.storage

# Add a staging profile with its own identity
atomic server add staging https://staging.atomic.storage --identity alice-staging

# Work against staging for a while
atomic server set staging
atomic project list

# Switch back to production
atomic server set --default
```

### Inspect what's active

```bash
atomic server          # list all profiles (active marked with *)
atomic server show     # details for the active profile
```

## See Also

- [`atomic identity`](./identity.md) — register with a server and manage identities
- [`atomic org`](./org.md) — set the default organization on the active profile
- [`atomic workspace`](./workspace.md) — set the default workspace per org
- [`atomic remote`](./remote.md) — per-repository remote URLs for push/pull/clone
