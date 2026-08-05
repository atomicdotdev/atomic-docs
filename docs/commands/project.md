---
sidebar_position: 17
title: project
---

# atomic project

Manage hosted Atomic Storage projects.

A project maps to one Atomic repository on the server. Projects belong to a
workspace and inherit the workspace as an access boundary.

## Synopsis

```bash
atomic project create <NAME> [--workspace <WORKSPACE>] [--description <TEXT>] [--kind <KIND>] [--default-view <VIEW>] [--visibility private|public] [--org <ORG>] [--server <NAME>]
atomic project list [--workspace <WORKSPACE>] [--org <ORG>] [--server <NAME>] [--format table|json]
atomic project show <WORKSPACE>/<PROJECT> [--org <ORG>] [--format table|json]
atomic project update <WORKSPACE>/<PROJECT> [--name <NAME>] [--description <TEXT>] [--default-view <VIEW>] [--visibility private|public] [--org <ORG>]
atomic project delete <WORKSPACE>/<PROJECT> --force [--org <ORG>]
atomic project init <NAME> [--workspace <WORKSPACE>] [--kind <KIND>] [--description <TEXT>] [--visibility private|public] [--org <ORG>]
```

:::note Org & workspace resolution
`--org` and `--workspace` are optional. When omitted:

- **Org** resolves to the active server profile's default org, falling back to
  the **personal org of your default identity**. Change it with
  [`atomic org set`](org.md).
- **Workspace** (`create`, `list`, `init`) falls back to the default workspace
  for that org, set with [`atomic workspace set`](workspace.md).

Use `--server <NAME>` on `create`/`list` to target a specific
[server profile](server.md) for one invocation instead of the active default.
:::

## Create and inspect projects

```bash
atomic project create api --workspace platform --kind rust --org acme
atomic project list --workspace platform --org acme
atomic project show platform/api --org acme
atomic project update platform/api --description "Public API" --org acme
```

With a default org and workspace configured, you can drop the flags:

```bash
atomic org set acme
atomic workspace set platform
atomic project create api --kind rust    # org=acme, workspace=platform
atomic project list                      # same defaults
```

Target a different environment for a single command with `--server`:

```bash
atomic project list --server staging
```

## Initialize a local repository

`project init` connects the current local repository to a hosted project and
configures the remote URL.

```bash
mkdir api && cd api
atomic init --kind rust
atomic project init api --workspace platform --kind rust --org acme
atomic remote -v
```

The remote URL has this shape:

```text
https://acme.atomic.storage/workspaces/platform/projects/api/code
```

## Visibility

Project visibility is checked together with workspace visibility.

| Workspace | Project | Non-member can read? |
| --- | --- | --- |
| public | public | yes |
| public | private | no |
| private | public | no |
| private | private | no |

## Related commands

- [`workspace`](workspace.md)
- [`org`](org.md)
- [`server`](server.md)
- [`remote`](remote.md)
- [`push`](push.md)
- [`clone`](clone.md)
