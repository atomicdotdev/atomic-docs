---
title: How to Trace What Your AI Coding Agent Changed and Why
description: A step-by-step guide to tracing AI coding agent files, hunks, provenance, captured attribution, attestations, intents, and promotion decisions.
keywords:
  - track AI agent changes
  - AI coding agent reasoning
  - AI provenance
  - AI code audit trail
  - agent attestation
sidebar_position: 4
---

# How to Trace What Your AI Coding Agent Changed and Why

Trace an AI coding agent by linking working-copy differences to a recorded change hash, then inspect that change's hunks, provenance, and session attestation. This shows what changed, which observed activity preceded it, which agent and model metadata the hooks reported, and which evidence is available for review.

## How can I track what my AI agents are actually doing?

Start from the recorded change, then separate the evidence by the question it can answer. A diff describes code; provenance describes observed activity and inferred causal links; a session attestation describes captured attribution and change coverage.

| Question | Primary evidence |
|---|---|
| Which files changed? | Status and name-status diff |
| How large is the change? | Diff statistics |
| Which tokens changed? | Word diff |
| Which recorded operations produced the result? | Change hunks |
| What activity preceded the patch? | Provenance trace |
| Which agent session and model covered it? | Attestation |
| What outcome was requested? | Intent |
| What durable conclusion came from the work? | Memory |

## How do you identify what changed?

Start with the smallest summaries, then inspect token-level detail only where needed.

```bash
atomic status -s
atomic diff --stat
atomic diff --name-status
atomic diff --word-diff
```

A practical order is:

1. Confirm the working copy contains only expected paths.
2. Check whether the size matches the requested scope.
3. Flag additions, deletions, renames, and unexpected file types.
4. Inspect subtle replacements with the word diff.

See the [status](/commands/status) and [diff](/commands/diff) references for output semantics. These commands describe the current working copy; use a change hash for recorded history.

## How do you find the recorded change for a file?

Query history by path, then inspect the selected change.

```bash
atomic log --path <PATH>
atomic change <HASH>
```

The path log narrows the candidates. The default change output shows the file and graph summary, embedded provider/model/token/cost metadata, and the Change Ledger associated with the selected hash. Use the [log](/commands/log) and [change](/commands/change) references for detailed formats and current option limitations.

## Why isn't an AI agent trace enough to explain a code change?

An agent trace is chronological telemetry: prompts, tool calls, file reads, edits, commands, and responses in the order they occurred. That can show **what the agent did**, but a trace alone does not identify which observations informed a particular edit, which verification followed it, or which recorded patch resulted.

Atomic provenance maps those observed trace events into typed nodes and inferred causal edges, then connects the patch proposal to a stable change hash. It answers “what evidence is associated with this change and how is it connected?” without claiming to expose the model's private chain-of-thought.

See the [actual `atomic change` example](/commands/change#example) to view the code summary, embedded AI provenance, and causal Change Ledger in one command.

## How does Atomic map an agent trace to provenance?

Read the `=== Change Ledger ===` section from the default command first. Use `atomic provenance` only when you need a separate W3C PROV projection:

```bash
atomic change <HASH>
atomic provenance trace <HASH>
atomic provenance show <HASH>
```

| Provenance element | Review question |
|---|---|
| Goal | What task initiated the observed work? |
| Exploration | What files, symbols, or commands were inspected? |
| Commitment | Which file-modifying action was observed? |
| Verification | What check was observed after the edit? |
| Patch proposal | Which change hash resulted? |
| Inferred edge | Which observed events were linked causally? |

Read [How to See Why an AI Agent Changed Your Code](/agents/provenance) for classification rules, inferred edge types, storage, and chaining.

## How do you inspect agent, model, and session attribution?

List repository attestations, filter them by view, then inspect a specific attestation by its own hash. This displays captured attribution and coverage metadata; it does not independently prove that the model provider reported every field correctly.

```bash
atomic agent attest
atomic agent attest --hash <ATTESTATION_HASH>
atomic agent attest --view <VIEW>
atomic agent attest --verbose
```

Attestations can report the agent, session, covered changes, model, duration, token usage, cost, and code statistics. Usage and cost may be absent when an integration does not report those metrics, so treat missing values as unavailable rather than zero effort or human authorship. [AI Agent Session Audit Trails](/agents/attestations) explains coverage and fallback behavior.

## Why might a turn have no recorded change?

Hooks skip read-only turns. If the agent only answers a question, reads files, or investigates without modifying the working copy, there is no code change to record; this avoids empty changes that imply a code modification occurred.

When reconstructing a session, do not assume one change exists for every conversational turn. Use the available provenance and session evidence, and keep claims limited to what was observed.

## How do you connect the change to the requested outcome?

Use a validated and signed intent as the definition of done.

```bash
atomic intent list
atomic intent new "<OUTCOME>"
# Edit the generated directive file, then persist it
atomic vault sync
atomic intent attest <INTENT_ID>
atomic intent validate <INTENT_ID>
atomic intent verify <INTENT_ID>
```

The intent should contain the reason for the work, checkable acceptance criteria, tasks, scope, and constraints. Attestation runs the authoring gate and refuses non-fillable violations; the post-attestation `validate` shown above should pass before signature verification. The [`atomic intent` reference](/commands/intent) documents the directive format and verification process.

## How do you retain the conclusion without storing a transcript?

Record only durable knowledge that future work should reuse, and link it to the source artifact.

```bash
atomic memory new --kind <KIND> --text "<TEXT>" --derived-from <URN>
atomic vault sync
atomic memory attest <MEMORY_ID>
atomic memory validate <MEMORY_ID>
atomic memory verify <MEMORY_ID>
```

A useful memory states a decision, lesson, constraint, preference, or stable context. It should not claim private reasoning or duplicate raw conversation; see the [`atomic memory` reference](/commands/memory) for supported kinds.

## How do you gather additional repository context?

Use the vault to retrieve durable context and investigate code relationships around the affected path or entity.

```bash
atomic vault context
atomic vault query code "<QUERY>"
atomic vault query entities <PATH>
atomic vault query neighbors <NODE_ID>
```

These queries help answer whether the agent followed known constraints and whether related entities need review. See [Querying the Graph](/getting-started/querying-the-graph) for query guidance.

## When is the evidence sufficient to promote the change?

Promote only when the changed paths are expected, the hunks satisfy the intent, provenance claims match the observed record, and available attestation fields have been reviewed.

```bash
atomic insert change <HASH> --to <VIEW>
```

Insertion names the exact reviewed change and target view. The [`atomic insert` reference](/commands/insert) explains dependency handling, while [AI Agent Workflows](/getting-started/ai-agent-workflows) explains agent-view isolation.

## What is the shortest complete audit sequence?

- [ ] Identify paths and scope with status and diff summaries.
- [ ] Locate the recorded hash through path history.
- [ ] Inspect graph hunks and token-level edits.
- [ ] Trace observed activity and clearly label inferred causal links.
- [ ] Check attestation coverage and note unavailable usage fields.
- [ ] Verify the intent that defines the expected outcome.
- [ ] Capture only durable conclusions as memories.
- [ ] Insert the exact reviewed change into the intended view.
