---
sidebar_position: 16
title: workspace
---

# atomic workspace

Manage Atomic Storage workspaces.

A workspace groups related projects inside an organization. Workspace visibility
is an access boundary: a public project inside a private workspace is still not
readable by non-members.

## Synopsis

```bash
atomic workspace create <NAME> [--description <TEXT>] [--visibility private|public] [--org <ORG>]
atomic workspace list [--org <ORG>] [--server <NAME>] [--format table|json]
atomic workspace show <SLUG> [--org <ORG>] [--format table|json]
atomic workspace set <SLUG> [--no-verify] [--org <ORG>]
atomic workspace update <SLUG> [--name <NAME>] [--description <TEXT>] [--visibility private|public] [--org <ORG>]
atomic workspace delete <SLUG> --force [--org <ORG>]
atomic workspace grant <list|add|remove> <SLUG> [--team <TEAM>|--user <USER>] [--permission <PERM>] [--org <ORG>]
```

:::note Org resolution
When `--org` is omitted, commands use the default organization of the **active
server profile**. If that profile has no default org set, Atomic falls back to
the **personal org of your default identity** (its name). Set an explicit
default with [`atomic org set <slug>`](org.md), and see
[`atomic server`](server.md) for how the active profile is chosen.
:::

## Examples

```bash
atomic workspace create platform --visibility private --org acme
atomic workspace create open-source --visibility public --org acme
atomic workspace list --org acme
atomic workspace show platform --org acme
atomic workspace update platform --visibility public --org acme
atomic workspace delete platform --force --org acme
```

## Default workspace per organization

`atomic workspace set <SLUG>` records a default workspace for the resolved
organization (see the org-resolution note above). Once set, commands that take
`--workspace` (like `atomic project create`) use the default and you can drop
the flag:

```bash
atomic org set acme
atomic workspace set platform
atomic project create api --kind rust    # uses workspace=platform under acme
```

Defaults are stored **per-org on the active server profile** in
`~/.atomic/config.toml`. When the legacy `[server]` block is active, they live
under `[server.default_workspaces]`:

```toml
[server]
default_org = "acme"

[server.default_workspaces]
acme = "platform"
open-source = "site"
```

When a **named profile** is active (see [`atomic server`](server.md)), the same
defaults live on that profile instead — so switching servers picks up the
correct workspace defaults:

```toml
default_server = "prod"

[servers.prod]
url = "https://atomic.storage"
default_org = "acme"

[servers.prod.default_workspaces]
acme = "platform"
```

Reads and writes always target the same active profile, so a default set with
`atomic workspace set` is picked up by `atomic project create`/`list` against
that server.

The slug is verified against the server before being written, so a wrong slug
fails fast instead of producing a 404 later:

```text
✗ Invalid argument: Workspace 'platfor' not found on the server.
  Check the slug with: atomic workspace list
  Or pass --no-verify to set the value without checking.
```

Pass `--no-verify` to skip the check (offline use, or pointing at a workspace
that has not yet been provisioned).

## Visibility

| Visibility | Meaning |
| --- | --- |
| `private` | Only identities with organization or explicit workspace access can read it |
| `public` | Non-members can read workspace metadata and public projects inside it |

A public workspace does not make private projects public. A private workspace
blocks non-member access even to projects marked public.

## Grants

`atomic workspace grant` manages who can access a workspace, by team or by
user. Grants layer on top of visibility for fine-grained access.

```bash
# List current grants on a workspace
atomic workspace grant list platform --org acme

# Grant a team write access
atomic workspace grant add platform --team engineering --permission write --org acme

# Revoke a team's access
atomic workspace grant remove platform --team engineering --org acme
```

**Arguments & options:**

| Option | Description |
| --- | --- |
| `<SLUG>` | Workspace slug (required) |
| `--team <TEAM>` | Grant/revoke for a team (resolved to a UUID via the server) |
| `--user <USER>` | Grant/revoke for a user |
| `--permission <PERM>` | Permission level to grant (e.g. `read`, `write`); required for `add` |
| `--org <ORG>` | Organization override |
| `--format table\|json` | Output format for `grant list` |

Either `--team` or `--user` must be specified for `add`/`remove`.

## Related commands

- [`org`](org.md)
- [`project`](project.md)
- [`team`](team.md)
- [`server`](server.md)
