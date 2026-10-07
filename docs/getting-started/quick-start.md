---
sidebar_position: 0
title: Quick Start
---

# Quick Start

This guide covers the core Atomic workflow: install, create a project, work with an AI agent, and land a reviewed, provenance-backed change.

**What you'll do:**

- Install Atomic and set up your identity with Atomic Storage  
- Initialize a repository and record your first change  
- Install the OpenCode plugin and direct the agent's work with intents  
- Verify the work and sign it  
- Branch with views, review, and promote changes  
- Push everything to a remote

**Prerequisites:** a bash environment (Linux, macOS, or WSL2). For source installs, see [Installation](./installation).

## 1\. Install Atomic

The recommended path is the hosted installer script from Atomic Storage:

```sh
curl -sSf https://atomic.storage/install.sh | sh
```

For other installation methods (including building from source), see [Installing Atomic](./installation).

> **Tip:** An AI agent can run this setup for you. Download the [Atomic Setup skill for agents](/atomic-setup-skill.md) and give it to your coding agent. The skill covers installation, identity setup, registration, and agent integration, and asks for confirmation before each step that changes your system.

## 2\. Set Up Your Identity

Identities sign your changes and authenticate you to Atomic Storage:

```sh
atomic identity new alice-acme --email alice@acme.com --set-default
atomic identity register https://atomic.storage
atomic org show
atomic identity whoami
```

- `--set-default` makes `alice-acme` the identity used for signing  
- `identity register` connects your identity to Atomic Storage  
- `identity whoami` confirms who you are signed in as

## 3\. Initialize a Project
A project groups files and agent intent across changes, similar to a repository.

```sh
mkdir myproject
cd myproject
atomic init
```

This creates an `.atomic` directory, or repository, containing:

| Entry | What it is |
| :---- | :---- |
| `pristine` | The database storing your recorded changes |
| `tree` | Information about tracked files |
| `config.toml` | Repository configuration |
| `changes/` | Storage for change patches |

## 4\. Record Your First Change
Changes are recorded as patches. A patch is a semantic change to the repository database rather than a linear snapshot.

```sh
atomic add *                          # track files ("add to tree")
atomic status                         # see what changed
atomic diff                           # review the diff
atomic record -m "Initial commit"     # record a change
atomic log                            # view history
```

You can also record a specific file directly:

```sh
atomic record file.txt
```

For a deeper walkthrough of the local workflow, see [Your First Repository](./first-repository).

## 5\. Install the OpenCode Plugin

Atomic records every agent turn automatically, with full provenance (model, tokens, cost, and a causal decision graph). Install the OpenCode plugin with one command:

```sh
atomic agent enable --agent opencode
opencode   # start OpenCode and switch to the Atomic agent
```

This installs the OpenCode plugin, the Atomic agent prompt, and the Atomic skills, and registers the plugin in your OpenCode config without overwriting existing settings. In OpenCode, switch to the Atomic agent. Recording happens when a session goes idle or a turn ends.

Confirm the install:

```sh
atomic agent status --verbose
```

You can activate other agents the same way with `atomic agent enable --agent <agent name>`; it auto-detects from directories like `.claude/` or `.cursor/`. Supported agents include Claude Code, Gemini CLI, Codex, Cursor, Copilot, Cline, and more; see the [Integration Matrix](https://docs.atomic.dev/agents/installing-agent-integrations#integration-matrix).

## 6\. Turn a Prompt into an Intent

An **intent** records the *why* behind a unit of work. Each intent is structured to include a `:::why`, checkable acceptance criteria, and ordered tasks that name the files they touch. An intent is complete once it validates and is signed.

```sh
# 1. Scaffold a directive-based intent
atomic intent new "Add the login flow"

# 2. Fill the directive stubs in the printed file, then sync
atomic vault sync

# 3. Gate it, then sign it
atomic intent validate <ID>
atomic intent attest <ID>

# 4. Review your intents
atomic intent list
atomic intent show <ID>
```

`validate`, `attest`, and `show` read from the vault **database**, so always run `atomic vault sync` after editing an intent file and before validating or attesting.

To track the work itself, start a goal linked to the intent:

```sh
atomic vault goal start --intent <ID>
# ... work happens (with your agent) ...
atomic vault goal stop --promote
```

See [Atomic Vault](./atomic-vault) for the full intent lifecycle. The vault can also be queried and mapped as a knowledge graph; see [Querying the Graph](./querying-the-graph).

## 7\. Review What Happened
Work with your agent, then review what was recorded:

```sh
# See the recorded changes with AI provenance (includes change hashes)
atomic log

# Check session and hook status
atomic agent status --verbose

# Inspect attestations (cost, tokens, model breakdown)
atomic agent attest

# View details for a specific attestation with change hash
atomic agent attest --hash XMJZ3IPF

# Generate AI reasoning summaries
atomic agent explain <session-id> --all --save
```

## 8\. Branch with Views

Views are Atomic's equivalent of branches, but they are **filtered perspectives on the same graph**, not forks. All changes are stored in one canonical graph, and a view decides which are visible.

```sh
# Create a draft feature view and switch to it
atomic view create feature-login --draft --switch

# List views, switch back
atomic view list
atomic view switch dev
```

Agent sessions already work this way: each session starts on an isolated draft view forked from your current view, and returns you to your original view when it ends. See [AI Agent Workflows](./ai-agent-workflows#agent-isolation-with-views).

## 9\. Review and Land Your Changes

Bring changes into a view in two ways: insert all of the current view's changes, or insert a single change by hash.

```sh
# Insert the current view's changes to its parent
atomic insert

# Insert a single change into a specific view
atomic insert <HASH> --view dev
```

**Provenance** is the recorded chain of AI work: session, turns, changes, and views. Each change carries its provenance, which you can inspect directly:

```sh
# Inspect a specific change (hash from atomic log)
atomic change <HASH>
atomic diff -c <HASH> --word-diff

# Trace the change's provenance chain
atomic provenance trace <HASH>
```

Promotion into a shared view requires an **independent review intent**, signed by a different identity than the work's author. The reviewer does not edit your intent; they create a new one:

```sh
atomic intent new "Review the login flow" \
  --review urn:atomic:intent:<WORK_UID>

atomic vault sync
atomic intent update <REVIEW_ID> --status done
atomic vault sync
atomic intent validate <REVIEW_ID>
atomic intent attest <REVIEW_ID> --identity reviewer
```

## 10\. Push Everything

Changes, provenance, and session data travel together:

```sh
atomic push
```

Collaborators within your organization receive your changes **and** the context behind them: intents, attestations, and provenance. `atomic pull` brings remote changes in the same way.

## 11\. Coming from Git?

| Git | Atomic | Key Difference |
| :---- | :---- | :---- |
| `git commit` | `atomic record` | Submits a change as a semantic patch, not a snapshot |
| `git commit` | `atomic change` | The recorded change itself (inspect with `atomic change <HASH>`) |
| `git branch` | `atomic view` | A filtered perspective on the shared change graph, not a linear branch |
| git repo | `atomic project` | Manage related/associated files |
| Commit hash | Change hash | Cryptographic identifier for the change |
| Staging area | Add to tree | Files marked for tracking |
| Working tree | Working copy | Your editable files |

Existing Git repositories can be imported into Atomic, and Atomic can continue to publish to Git for teammates who stay on Git tooling:

```sh
atomic git import
```

Full Git interoperability is coming soon. See [Migrating from Git](./migrating-from-git) for the current workflow.

### Git interop commands

Atomic and Git can run side by side. The rule to remember: **Git shadows Atomic, not the other way around.** Atomic is the source of truth; the Git repository is a downstream mirror that Atomic generates. Record work in Atomic first (`atomic record`), then publish it to Git. Avoid committing hand edits directly in Git.

```sh
# Import Git history into Atomic (first-time migration)
atomic git import
atomic git import --incremental     # only commits not yet in Atomic
atomic git import --all             # include inner-PR commits, not just first-parent
atomic git import --dry-run         # preview without creating anything

# Keep the two synchronized automatically
atomic git hooks install
atomic git hooks status             # verify all hooks are installed

# Publish Atomic state as a Git commit, with provenance trailers
atomic git push
```

If the Git side drifts (for example, from a raw `git commit`), reconcile with `atomic git import --incremental` before pushing. The full setup and reconcile-then-push workflow are covered in [Git Shadow](./git-shadow-sync).

## Cheat Sheet

The full workflow in order. Copy and paste each block:

```sh
# Install & identity
curl -sSf https://atomic.storage/install.sh | sh
atomic identity new alice-acme --email alice@acme.com --set-default
atomic identity register https://atomic.storage
atomic identity whoami

# Repository & first change
mkdir myproject && cd myproject
atomic init
atomic add *
atomic status && atomic diff
atomic record -m "Initial commit"
atomic log

# Install the OpenCode plugin
atomic agent enable --agent opencode
opencode
atomic agent status --verbose

# Intent: prompt -> criterion -> task -> file
atomic intent list
atomic vault context --files src/
atomic intent new "Add the login flow"
# fill :::why, criteria, tasks (::file-ref), scope, constraints
atomic vault sync
atomic intent update <ID> --status in_progress
# ... agent session records turns automatically ...

# Verify & sign
# run checks, add ::verification records, mark tasks done, criteria met
atomic vault sync
atomic intent update <ID> --status done
atomic vault sync
atomic intent validate <ID> && atomic intent attest <ID> && atomic intent verify <ID>

# Views
atomic view create feature-login --draft --switch

# Review & land
atomic change <HASH> && atomic diff -c <HASH> --word-diff
atomic provenance trace <HASH>
atomic intent new "Review the login flow" --review urn:atomic:intent:<WORK_UID>
atomic vault sync
atomic intent update <REVIEW_ID> --status done
atomic vault sync
atomic intent validate <REVIEW_ID> && atomic intent attest <REVIEW_ID> --identity reviewer
atomic insert preview feature-login --to dev
atomic insert

# Git shadow (optional)
atomic git import
atomic git hooks install && atomic git hooks status
atomic git push

# Share
atomic push
```

## What's Next

- [Your First Repository](./first-repository): a deeper dive into the local workflow  
- [Atomic Vault](./atomic-vault): the full intent lifecycle, review intents, and signed attestations  
- [Querying the Graph](./querying-the-graph): build the knowledge graph with `atomic query enrich`, then explore it with `atomic query search "login"` and `atomic query graph "login"`. (`atomic vault query` is an alias for `atomic query`.)  
- [Comparison with Git](./comparison-with-git): how Atomic differs from Git  
- [AI Agent Workflows](./ai-agent-workflows): provenance, session isolation, attestation details, and `atomic agent explain`  
- [Migrating from Git](./migrating-from-git) and [Git Shadow](./git-shadow-sync): the two-way Git workflow  
- [Command Reference](/commands/overview): full documentation for every command

