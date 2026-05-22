---
sidebar_position: 1
title: Quickstart
---

# Atomic Quickstart

<div className="quickstart-hero">
  <p className="quickstart-eyebrow">Atomic VCS + Atomic Storage</p>
  <h1>From identity to hosted project in five steps</h1>
  <p>
    Create an Ed25519 identity, register with Atomic Storage, create an
    organization workspace, initialize a project, and push your first change.
  </p>
  <div className="quickstart-hero-cards">
    <a className="quickstart-hero-card" href="/commands/identity">
      <span>Identity</span>
      <code>atomic identity register</code>
    </a>
    <a className="quickstart-hero-card" href="/teams/overview">
      <span>Teams</span>
      <code>atomic org · atomic team</code>
    </a>
    <a className="quickstart-hero-card" href="/commands/remote-operations">
      <span>Remote repos</span>
      <code>atomic clone</code>
    </a>
  </div>
</div>

## Getting started

<div className="quickstart-steps">

<div className="quickstart-card">
<h3><span className="quickstart-step-number">1.</span> Install the Atomic CLI</h3>
<p>
Install Atomic locally. If you are targeting Atomic Storage, use the CLI build
that matches your deployed server version.
</p>

```bash
curl -sSf https://atomic.storage/install.sh | sh
atomic --version
```

<p>For development builds, install from source:</p>

```bash
git clone https://github.com/atomicdotdev/atomic.git
cd atomic
cargo install --path atomic-cli
```
</div>

<div className="quickstart-card">
<h3><span className="quickstart-step-number">2.</span> Create and register your identity</h3>
<p>
Atomic uses Ed25519 identities for authentication and signing. For team work,
use a developer identity tied to the organization's email domain. Registration
creates your personal organization on the server and writes the server URL and
default organization to your global Atomic config.
</p>

```bash
atomic identity new alice-acme --email alice@acme.com --set-default
atomic identity register https://atomic.storage
atomic org show
```
</div>

<div className="quickstart-card">
<h3><span className="quickstart-step-number">3.</span> Create an organization, workspace, and project</h3>
<p>
Organizations contain members and teams. Workspaces group projects. Projects
map to hosted Atomic repositories.
</p>

```bash
atomic org create acme --email dev@acme.com
atomic org set acme

atomic workspace create platform --visibility private
atomic workspace set platform
atomic project create api --kind rust
```

<p>Public/private access is enforced at both workspace and project boundaries:</p>

| Workspace | Project | Non-member can read? |
| --- | --- | --- |
| public | public | yes |
| public | private | no |
| private | public | no |
| private | private | no |
</div>

<div className="quickstart-card">
<h3><span className="quickstart-step-number">4.</span> Add teammates and teams</h3>
<p>
Register teammates with organization-domain identities, add them to the organization by verified email, then organize them into teams. Team slugs are scoped to the organization subdomain, so
<code>delta/engineering</code> and <code>atomic/engineering</code> are different teams.
</p>

```bash
# Bob first registers an org-domain identity on his machine:
# atomic identity new bob-acme --email bob@acme.com --set-default
# atomic identity register https://atomic.storage

# Alice, using her acme admin identity, adds Bob by org-domain email:
atomic org member add bob@acme.com --role member --org acme

atomic team create engineering \
  --description "Engineering team" \
  --visibility visible \
  --org acme

atomic team member add engineering bob@acme.com --role maintainer --org acme
atomic team member list engineering --org acme
```
</div>

<div className="quickstart-card">
<h3><span className="quickstart-step-number">5.</span> Clone, record, and push</h3>
<p>
`atomic project create` registered the project on the server. Clone it locally,
initialize a vault for AI agent context, then make changes and push.
</p>

```bash
atomic clone https://acme.atomic.storage/workspaces/platform/projects/api/code
cd api
atomic vault init

echo 'fn main() { println!("hello atomic"); }' > src/main.rs
atomic add src/main.rs
atomic record -m "Initial record"
atomic push
```

<p>
The clone wires <code>origin</code> automatically and authenticates as the
identity matching the URL's subdomain. Pull updates from collaborators with
<code>atomic pull</code>.
</p>
</div>

</div>

## What to read next

- [AI agent workflows](/getting-started/ai-agent-workflows)
- [Team collaboration overview](/teams/overview)
- [CLI command reference](/commands/overview)
- [Remote operations](/commands/remote-operations)
