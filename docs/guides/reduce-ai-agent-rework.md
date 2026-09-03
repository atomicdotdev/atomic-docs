---
title: How to Reduce Rework from AI Coding Agents
description: A practical workflow for reducing AI coding agent rework with scoped intents, targeted context, review evidence, and durable memories.
keywords:
  - reduce AI agent rework
  - AI coding agent workflow
  - intent-driven development
  - AI code review
  - Atomic vault
sidebar_position: 2
---

# How to Reduce Rework from AI Coding Agents

Reduce AI coding agent rework by defining a testable outcome before editing, retrieving only relevant project context, and reviewing small recorded changes against that outcome. Preserve validated lessons as memories so later turns do not repeat the same investigation or mistake.

## Why do AI coding agents create rework?

Rework usually begins before code is written. An agent may receive an ambiguous outcome, miss a repository constraint, inspect the wrong dependency, or make a large change before the reviewer can detect drift.

| Rework source | Control |
|---|---|
| Ambiguous request | Write an intent with explicit acceptance criteria |
| Missing repository context | Load project context and query relevant code entities |
| Oversized change | Inspect scope and paths after each recorded turn |
| Repeated investigation | Store validated lessons as durable memories |
| Unreviewed promotion | Insert only the reviewed change into the target view |

## What context should the agent retrieve first?

Start with durable project context, then narrow the search to code and relationships relevant to the task.

```bash
atomic vault context
atomic vault query code "<QUERY>"
atomic vault query entities <PATH>
atomic vault query neighbors <NODE_ID>
```

| Question | Query |
|---|---|
| What constraints and prior decisions apply? | `atomic vault context` |
| Where does a behavior appear in source? | `atomic vault query code "<QUERY>"` |
| What symbols are defined in a file? | `atomic vault query entities <PATH>` |
| What is structurally related to a result? | `atomic vault query neighbors <NODE_ID>` |

Stop gathering context when the agent can name the affected behavior, likely files or entities, acceptance checks, and explicit scope exclusions. See [Querying the Graph](/getting-started/querying-the-graph) for query behavior and output formats.

## How should the task be defined before editing?

Use one intent for one reviewable outcome. The intent should state why the work matters, concrete acceptance criteria, ordered tasks, files or areas in scope, and constraints that must remain true.

```bash
atomic intent list
atomic intent new "<OUTCOME>"
# Edit the generated directive file, then persist it
atomic vault sync
atomic intent attest <INTENT_ID>
atomic intent validate <INTENT_ID>
atomic intent verify <INTENT_ID>
```

Check existing intents before creating one, complete its structure, attest it, then validate the signed form and verify its signature. Attestation runs the authoring gate and refuses non-fillable violations. Keep command details in the [`atomic intent` reference](/commands/intent); the important rework control is that every criterion must be observable rather than subjective.

### What makes an acceptance criterion useful?

A useful criterion is:

- specific enough to pass or fail;
- tied to user-visible behavior, an invariant, or a concrete artifact;
- narrow enough to verify within the same unit of work;
- independent of how the agent chooses to implement it.

“Improve error handling” invites interpretation. “Invalid configuration returns the documented error and leaves repository state unchanged” defines a reviewable result.

## How can drift be detected early?

Review the shape of the working copy before reading every line. Then inspect token-level edits only where the scope or risk justifies it.

```bash
atomic status -s
atomic diff --stat
atomic diff --name-status
atomic diff --word-diff
```

| Signal | Rework question |
|---|---|
| Unexpected file | Did the agent expand scope without justification? |
| Large line count | Should the work be split into a smaller intent? |
| Rename, deletion, or type change | Was the structural change requested? |
| Subtle token replacement | Does the edit preserve the intended semantics? |

Use the [status](/commands/status) and [diff](/commands/diff) references for output details. A short scope check after each recorded turn is cheaper than reviewing a large, drifting change set at the end.

## How do you review a risky implementation decision?

Trace from the affected path to the recorded change, then inspect the default change view before expanding low-level details.

```bash
atomic log --path <PATH>
atomic change <HASH>
```

The default change view combines the file and graph summary with embedded AI provenance metadata and the Change Ledger: observed goals, tools, edits, decisions, and verification connected by inferred causal links. It does not expose private chain-of-thought. See [How to See Why an AI Agent Changed Your Code](/agents/provenance) for the data model and limits.

## How should reusable learning be retained?

Create a memory only for knowledge likely to matter in later work, such as a repository constraint, corrective lesson, architectural decision, or stable preference.

```bash
atomic memory new --kind <KIND> --text "<TEXT>" --derived-from <URN>
atomic vault sync
atomic memory attest <MEMORY_ID>
atomic memory validate <MEMORY_ID>
atomic memory verify <MEMORY_ID>
```

A memory should record the durable conclusion and its source, not a transcript of the turn. See the [`atomic memory` reference](/commands/memory) for supported kinds and fields.

## When should an agent change be promoted?

Promote a change only after its intent is satisfied, its scope is understood, and its evidence has been reviewed.

```bash
atomic insert change <HASH> --to <VIEW>
```

Insertion is selective: the reviewer chooses the approved change and target view. Learn how views isolate agent work in [AI Agent Workflows](/getting-started/ai-agent-workflows) and use the [`atomic insert` reference](/commands/insert) for dependency behavior.

## What should reviewers know about hook coverage?

- Hooks skip read-only turns because no file change exists to record.
- Token usage and cost can be absent when an integration does not report those fields.
- Missing usage data is not evidence that no model was used; inspect the available identity, change, provenance, and attestation fields together.

## What is the minimum rework-reduction checklist?

- [ ] One intent describes one reviewable outcome.
- [ ] Acceptance criteria are concrete and observable.
- [ ] Relevant context and code relationships were queried before editing.
- [ ] Changed paths and scope were checked after each recorded turn.
- [ ] Risky token edits and graph hunks were inspected.
- [ ] Durable lessons were captured without copying transient discussion.
- [ ] Only the reviewed change was inserted into the target view.
