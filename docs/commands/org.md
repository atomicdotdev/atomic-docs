---
sidebar_position: 15
title: org
---

# atomic org

Manage Atomic Storage organizations and organization members.

Organizations are the top-level collaboration boundary for hosted Atomic
projects. An organization owns workspaces, projects, teams, and membership.
Management commands authenticate with your current default identity; `--org`
selects the organization domain/subdomain to operate on.

## Synopsis

```bash
atomic org show [SLUG] [--org <ORG>] [--format table|json]
atomic org create <NAME> [--email <EMAIL>]
atomic org set <SLUG> [--no-verify]
atomic org update <SLUG> [--name <NAME>] [--email <EMAIL>]
atomic org delete <SLUG> --force [--org <ORG>]
atomic org upgrade <SLUG> [--org <ORG>]
atomic org member <COMMAND>
```

## Common workflow

```bash
atomic identity new alice-acme --email alice@acme.com --set-default
atomic identity register https://atomic.storage

atomic org create acme --email team@acme.com
atomic org set acme
atomic org show
```

## Commands

### `org show`

Show the current organization or a specific organization.

```bash
atomic org show
atomic org show acme
atomic org show --format json
```

### `org create`

Create a team organization. The server derives or validates a URL-safe slug.

```bash
atomic org create acme --email team@acme.com
```

### `org set`

Set the default organization for subsequent management commands. The slug is
verified against the server before being written to local config, so typos and
stale slugs fail fast instead of producing a 404 on the next call.

```bash
atomic org set acme
```

If the org does not exist on the server, the command errors and leaves the
local config unchanged:

```text
✗ Invalid argument: Organization 'acmme' not found on the server.
  Check the slug with: atomic org list
  Or pass --no-verify to set the value without checking.
```

Use `--no-verify` to skip the server check (useful when offline or pointing at
an org that is not yet provisioned):

```bash
atomic org set acme --no-verify
```

### `org update`

Update organization metadata.

```bash
atomic org update acme --email ops@acme.com
```

### `org delete`

Delete an organization. This is destructive and requires confirmation unless
`--force` is supplied.

```bash
atomic org delete acme --force --org acme
```

## Organization members

Before adding a developer to an organization, the developer should have a
registered identity associated with the organization's email domain, such as
`bob@acme.com`. If the server requires email/domain verification, complete that
verification first so the member can be resolved by email.

### `org member list`

```bash
atomic org member list --org acme
atomic org member list --org acme --format json
```

### `org member add`

Add a registered identity to an organization. In production, use a verified organization-domain email address such as `bob@acme.com`. The identity can also be a UUID or name when the server can resolve it.

```bash
atomic org member add bob@acme.com --role member --org acme
atomic org member add bob@acme.com --role admin --org acme
```

### `org member update`

```bash
atomic org member update bob@acme.com --role member --org acme
```

### `org member remove`

```bash
atomic org member remove bob@acme.com --force --org acme
```

## Roles

| Role | Description |
| --- | --- |
| `owner` | Full organization control |
| `admin` | Manage organization resources and members |
| `member` | Collaborate in the organization |

## Related commands

- [`identity`](identity.md)
- [`workspace`](workspace.md)
- [`project`](project.md)
- [`team`](team.md)
