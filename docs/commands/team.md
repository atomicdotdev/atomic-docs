---
sidebar_position: 18
title: team
---

# atomic team

Manage Atomic Storage teams and team members.

Teams group organization members. Team slugs are scoped to an organization, so
`engineering` in one organization is separate from `engineering` in another.
Team management commands authenticate with your current default identity;
`--org` selects the organization domain/subdomain to operate on.

## Synopsis

```bash
atomic team create <NAME> [--description <TEXT>] [--visibility visible|secret] [--org <ORG>]
atomic team list [--org <ORG>] [--format table|json]
atomic team show <TEAM> [--org <ORG>] [--format table|json]
atomic team update <TEAM> [--name <NAME>] [--description <TEXT>] [--visibility visible|secret] [--org <ORG>]
atomic team delete <TEAM> --force [--org <ORG>]
atomic team member <COMMAND>
```

## Team commands

```bash
atomic team create engineering \
  --description "Engineering team" \
  --visibility visible \
  --org acme

atomic team list --org acme
atomic team show engineering --org acme
atomic team update engineering --visibility secret --org acme
atomic team delete engineering --force --org acme
```

## Team members

```bash
atomic team member add engineering bob@acme.com --role maintainer --org acme
atomic team member list engineering --org acme
atomic team member remove engineering bob@acme.com --force --org acme
```

In production, the member should have a registered identity tied to the organization's email domain. Prefer that verified email address (for example, `bob@acme.com`) when adding or removing team members. Member identities can also be specified by UUID or identity name when the server can resolve them.

## Visibility

| Visibility | Meaning |
| --- | --- |
| `visible` | Discoverable by organization members |
| `secret` | Visible only to team members and org admins/owners |

## Organization scoping

Team routes are scoped by organization subdomain on Atomic Storage:

```text
https://delta.atomic.storage/teams/engineering
https://atomic.atomic.storage/teams/engineering
```

Both teams can have the same slug because their organization base URLs differ.

## Related commands

- [`org`](org.md)
- [`workspace`](workspace.md)
- [Team collaboration overview](/teams/overview)
