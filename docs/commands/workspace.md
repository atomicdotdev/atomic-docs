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
atomic workspace list [--org <ORG>] [--format table|json]
atomic workspace show <SLUG> [--org <ORG>] [--format table|json]
atomic workspace set <SLUG> [--no-verify] [--org <ORG>]
atomic workspace update <SLUG> [--name <NAME>] [--description <TEXT>] [--visibility private|public] [--org <ORG>]
atomic workspace delete <SLUG> --force [--org <ORG>]
```

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

`atomic workspace set <SLUG>` records a default workspace for the **current
default organization**. Once set, commands that take `--workspace` (like
`atomic project create`) use the default and you can drop the flag:

```bash
atomic org set acme
atomic workspace set platform
atomic project create api --kind rust    # uses workspace=platform under acme
```

Defaults are stored per-org under `[server.default_workspaces]` in
`~/.atomic/config.toml`, so switching orgs picks up the correct default:

```toml
[server]
default_org = "acme"

[server.default_workspaces]
acme = "platform"
open-source = "site"
```

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

## Related commands

- [`org`](org.md)
- [`project`](project.md)
- [`team`](team.md)
