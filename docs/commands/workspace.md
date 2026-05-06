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
