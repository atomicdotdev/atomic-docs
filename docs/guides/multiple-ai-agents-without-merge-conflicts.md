---
title: "How to Run Multiple AI Coding Agents Without Merge Conflicts"
description: "How to isolate multiple AI coding agents with copy-on-write sandboxes, draft views, scoped ownership, and previewed integration."
keywords:
  - multiple AI coding agents
  - AI agent merge conflicts
  - parallel coding agents
  - Atomic draft views
  - agent orchestration
sidebar_position: 8
---

# How to Run Multiple AI Coding Agents Without Merge Conflicts

Use `atomic sandbox create --from` to give each file-writing agent a copy-on-write working tree and its own draft view, then partition ownership, preview every insertion, and integrate through one current target view. No VCS can guarantee zero conflicts when agents make incompatible edits, but filesystem isolation plus selective, dependency-aware promotion prevents avoidable collisions and surfaces genuine conflicts earlier.

## What kind of isolation does each agent need?

| Isolation layer | Purpose | Atomic mechanism |
|---|---|---|
| Logical change isolation | Keep each agent's recorded changes reviewable and promotable independently | One draft view per sandbox |
| File-system isolation | Prevent concurrent processes from overwriting the same materialized files | One copy-on-write sandbox per file-writing agent |
| Integration isolation | Detect dependencies and incompatibilities before promotion | Triage and insert preview into one current target view |

:::warning Views alone do not isolate file writes
A draft view is a change-set filter over the repository graph; by itself, it does not create another directory. `atomic sandbox create` supplies the missing filesystem boundary while sharing the canonical `.atomic` graph.
:::

## How should you divide work before starting agents?

Partition by stable ownership boundaries, not by an arbitrary number of prompts. Inspect entities and dependencies before assigning tasks:

```bash
atomic vault query entities <PATH>
atomic vault query neighbors file:<PATH>
atomic vault query code "<SYMBOL_OR_PATTERN>"
```

Prefer assignments such as “authentication validator and its tests” over “half of the authentication feature.” Give one agent ownership of shared coordination files such as schemas, public interfaces, migrations, generated manifests, or dependency lockfiles.

**Planning checklist:**

- [ ] Each task has explicit files or entities in scope.
- [ ] Shared APIs have one owner or a pre-agreed contract.
- [ ] Tests are assigned with the behavior they verify.
- [ ] Generated files and lockfiles have a single writer.
- [ ] Cross-agent dependencies are ordered before execution.
- [ ] Each file-writing agent has its own Atomic sandbox.

## How do you create isolated agent sandboxes?

From the canonical checkout, create each sandbox from the same reviewed parent view:

```bash
atomic sandbox create agent-auth --from dev
atomic sandbox create agent-billing --from dev
atomic sandbox create agent-observability --from dev
```

Each command creates:

- a copy-on-write working tree, using filesystem reflinks where supported;
- a new draft view named after the sandbox and parented to `dev`;
- a pointer back to the canonical `.atomic` graph, so changes recorded in the sandbox are immediately available for central review.

By default, the directories are created beside the repository under `<repo>-sandboxes/<name>`. Use `--dest <PATH>` when the orchestrator needs explicit locations, then start each agent inside its assigned sandbox.

A useful assignment table is:

| Agent | Sandbox and draft view | Working tree | Owned scope |
|---|---|---|---|
| Auth agent | `agent-auth` | `<repo>-sandboxes/agent-auth` | `src/auth/**`, auth tests |
| Billing agent | `agent-billing` | `<repo>-sandboxes/agent-billing` | `src/billing/**`, billing tests |
| Observability agent | `agent-observability` | `<repo>-sandboxes/agent-observability` | metrics adapters and tests |

Names are examples; the important invariant is one writer, one sandbox working tree, and one draft view per concurrent unit of work. See [`atomic view`](/commands/view) for the change-isolation semantics used by each sandbox.

## How do you keep agents from creating semantic conflicts?

File separation helps, but incompatible contracts can conflict without touching the same lines. Require agents to declare assumptions about shared types, API signatures, database schemas, event names, and ordering.

| Risk | Prevention |
|---|---|
| Two agents change the same function differently | Assign one owner or serialize the tasks |
| One agent changes an API another consumes | Land the contract first, then update dependents |
| Multiple agents edit a migration sequence | Use a single migration owner |
| All agents update a lockfile | Designate one final dependency-integration task |
| Generated output overlaps | Generate once after source changes are integrated |
| Nearby edits commute but behavior does not | Run target-level integration tests after each insert |

Atomic can merge independent graph operations, but it must surface genuinely incompatible edits. That is correct behavior, not a failure of isolation.

## How do you review each agent before integration?

Run `atomic status --short` inside each sandbox to confirm its working state. From the canonical checkout, compute exactly what the sandbox's draft view would contribute:

```bash
atomic triage candidates <FEATURE> --into <TARGET>
atomic triage review <FEATURE> --into <TARGET> --walkthrough
```

Review each candidate's code, provenance, intent coverage, tests, and dependency closure. Do not batch-promote several agent views simply because they started from the same parent.

## How do you integrate agent views safely?

Integrate one reviewed view at a time. Preview immediately before insertion, then check conflicts and working state:

```bash
atomic insert preview <SOURCE> --to <TARGET>
atomic view switch <TARGET>
atomic insert view <SOURCE> --to <TARGET>
atomic conflicts --short
atomic status --short
```

Run insertion and the post-insert checks from the canonical checkout with the target view current. After each insert, re-preview the next source against the updated target; the target's state may have changed the next source's dependency or conflict picture.

A practical order is:

1. Shared contracts and foundational types.
2. Independent implementation modules.
3. Consumers of the new contracts.
4. Generated files, lockfiles, and migrations.
5. End-to-end tests and integration cleanup.

See [`atomic insert`](/commands/insert) for preview and promotion behavior.

## What should you do when conflicts still occur?

First determine whether the edits are textually overlapping or logically incompatible. Inspect the conflicted files, choose the intended behavior, remove conflict markers, and verify the combined result before recording a resolution.

```bash
atomic conflicts --short
atomic status --short
```

Do not hide a conflict by letting a later agent overwrite one side. Preserve both candidate changes long enough for a reviewer to understand the disagreement. See [Merging and Conflicts](/concepts/merging-and-conflicts) for Atomic's conflict guarantees and resolution model.

## Can this guarantee conflict-free work at any scale?

No. No VCS can guarantee zero conflicts when agents make incompatible edits to the same behavior, schema, or state transition. This workflow lowers accidental working-directory collisions and makes integration conflicts smaller and earlier; it does not prove arbitrary tasks are independent.

This guide makes no claim that current Atomic has demonstrated 100-agent or 1,000-agent concurrency. Practical throughput depends on sandbox provisioning, separate compute, task independence, review capacity, and integration-test cost; measure those limits in your environment.

## Multi-agent checklist

- [ ] One draft view exists per agent task.
- [ ] Every concurrent file-writing agent has a separate Atomic sandbox.
- [ ] Files, entities, contracts, and generated outputs have clear owners.
- [ ] Dependencies between agent tasks are explicit.
- [ ] Every source view passes triage independently.
- [ ] Every insert is previewed against the current target state.
- [ ] Agent views are integrated one at a time in dependency order.
- [ ] Conflicts and target status are checked after every insert.
- [ ] Combined behavior is tested after integration.
