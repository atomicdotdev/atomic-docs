---
sidebar_position: 1
title: Team Collaboration Overview
---

# Team Collaboration Overview

Atomic Storage adds organization, workspace, project, and team management on top
of Atomic VCS. Management commands use your current default identity as the
caller, while `--org` selects the organization domain/subdomain being managed.
The model is simple:

- **Identities** authenticate users with Ed25519 public keys.
- **Organizations** own workspaces, projects, teams, and membership.
- **Workspaces** group projects and form a visibility boundary.
- **Projects** map to hosted Atomic repositories.
- **Teams** group organization members for permission grants and collaboration.

## Tested collaboration flow

A production team flow should use developer identities tied to the organization's domain. In the example below, Alice and Bob use identities with `@acme.com` email addresses, and Alice keeps her `alice-acme` identity selected while administering the `acme` organization. In other words, `atomic identity default alice-acme` chooses the authenticated caller; `--org acme` chooses the organization being managed.

```bash
# 1. Create and register organization-domain identities
atomic identity new alice-acme --email alice@acme.com --set-default
atomic identity register https://atomic.storage

atomic identity new bob-acme --email bob@acme.com
atomic identity default bob-acme
atomic identity register https://atomic.storage
# If your server requires email/domain verification, complete that before Alice adds Bob.

# 2. Alice creates and administers the organization
atomic identity default alice-acme
atomic org create acme --email team@acme.com
atomic org set acme

# 3. Add Bob by his organization-domain email address
atomic org member add bob@acme.com --role member --org acme
atomic org member list --org acme

# 4. Create a workspace and project as Alice
atomic workspace create platform --visibility private --org acme
atomic project create api --workspace platform --kind rust --org acme

# 5. Create a team and add Bob by organization-domain email
atomic team create engineering \
  --description "Engineering team" \
  --visibility visible \
  --org acme

atomic team member add engineering bob@acme.com --role maintainer --org acme
atomic team member list engineering --org acme
```

## Organizations

An organization is the top-level collaboration boundary. It has a URL-safe slug
and is addressed by subdomain on Atomic Storage:

```text
https://acme.atomic.storage
```

Common commands:

```bash
atomic org show
atomic org create acme --email team@acme.com
atomic org set acme
atomic org update acme --email ops@acme.com
atomic org delete acme --force
```

### Organization members

Organization members are identities registered on the same server. In production, use the developer's verified organization-domain email address (for example, `bob@acme.com`) instead of a bare local identity nickname. If domain/email verification is enabled, complete that verification before adding the member. The CLI can resolve members by UUID, verified email, or identity name when the server has that identity.

```bash
atomic org member add bob@acme.com --role admin --org acme
atomic org member list --org acme
atomic org member update bob@acme.com --role member --org acme
atomic org member remove bob@acme.com --force --org acme
```

Organization roles currently used by the CLI:

| Role | Use |
| --- | --- |
| `owner` | Full organization control |
| `admin` | Manage organization resources and members |
| `member` | Collaborate in the organization |

## Workspaces and projects

Workspaces group projects. Projects are repositories. Both have visibility.

```bash
atomic workspace create private-api --visibility private --org acme
atomic workspace create open-source --visibility public --org acme

atomic project create backend --workspace private-api --visibility private --org acme
atomic project create sdk --workspace open-source --visibility public --org acme
```

### Visibility rules

Atomic Storage enforces visibility at both the workspace and project boundary.
A project must be readable **and** its parent workspace must be readable.

| Workspace visibility | Project visibility | Non-member can read? |
| --- | --- | --- |
| public | public | yes |
| public | private | no |
| private | public | no |
| private | private | no |

This prevents two common leaks:

1. A public workspace accidentally exposing private projects.
2. A public project bypassing a private workspace boundary.

## Teams

Teams are organization-scoped groups of members. Team slugs are scoped by the
organization subdomain, not globally. That means these are distinct teams:

```text
https://delta.atomic.storage/teams/engineering
https://atomic.atomic.storage/teams/engineering
```

Common commands:

```bash
atomic team create engineering --visibility visible --org acme
atomic team show engineering --org acme
atomic team list --org acme
atomic team update engineering --visibility secret --org acme
atomic team delete engineering --force --org acme
```

### Team visibility

| Visibility | Meaning |
| --- | --- |
| `visible` | Discoverable by organization members |
| `secret` | Visible only to team members and org admins/owners |

### Team members

```bash
atomic team member add engineering bob@acme.com --role maintainer --org acme
atomic team member list engineering --org acme
atomic team member remove engineering bob@acme.com --force --org acme
```

The staging deployment currently accepts `maintainer` for the team member path
covered by the CLI harness. Unsupported roles are rejected by the CLI/server
combination until the deployed role schema is widened.

## Initializing a hosted project

Use `project init` when you have a local repository and want to connect it to a
hosted Atomic Storage project:

```bash
mkdir api && cd api
atomic init --kind rust

atomic project init api --workspace platform --kind rust --org acme
atomic remote -v
```

The command creates the project if needed and stores a remote URL like:

```text
https://acme.atomic.storage/workspaces/platform/projects/api/code
```

## See also

- [Quickstart](/getting-started/quickstart)
- [Team command reference](/commands/team)
- [Organization command reference](/commands/org)
- [Workspace command reference](/commands/workspace)
- [Project command reference](/commands/project)
