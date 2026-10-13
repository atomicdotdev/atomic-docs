---
title: "Version Control for AI Agents: A Technical Guide"
description: A technical guide to version control requirements for AI coding agents, including isolation, semantic changes, provenance, attestations, and selective promotion.
keywords:
  - version control for AI agents
  - AI coding agent version control
  - semantic change graph
  - AI provenance
  - agent attestations
sidebar_position: 3
---

# Version Control for AI Agents: A Technical Guide

Version control for AI agents must isolate concurrent work, preserve stable change identity, expose reviewable semantics, and attach verifiable evidence to each promoted change. Atomic implements those requirements with semantic changes, filtered views, provenance graphs, session attestations, signed intents, and durable memories.

## What does an AI-agent version control system need?

AI agents increase the number and frequency of changes. The version control layer therefore needs to make small changes cheap to inspect, keep parallel work separated, and retain enough evidence for a human or another agent to evaluate the result.

| Requirement | Why it matters for agents | Atomic mechanism |
|---|---|---|
| Isolated work | Concurrent sessions should not silently share unreviewed changes | Draft views and view filters |
| Stable identity | Evidence and dependencies need durable references | Content-addressed change hashes |
| Human-readable review | Reviewers reason about files, lines, and tokens | Semantic operations over the graph |
| Causal evidence | A diff alone does not explain how a change arose | Provenance graphs |
| Attribution and coverage | Teams need to know which agent session covered which changes | Content-addressed session attestations |
| Explicit outcome | Agents need a checkable definition of done | Intents |
| Durable learning | Later agents need validated constraints and lessons | Memories and vault context |

## How is repository state represented?

Atomic stores changes as graph transformations rather than treating a snapshot diff as the primary artifact. Files have stable identities, content is represented by vertices and edges, and the semantic layer maps graph operations to file, line, and token concepts for review.

A view is a filtered perspective on the shared graph. An agent session can record changes in a draft view, while a shared view remains unchanged until a reviewer selects a change for insertion.

Read [Why Changes Compose: The Atomic Data Model](/concepts/the-lego-story) for the storage model and [Is Git Good Enough for AI Coding Agents?](/getting-started/comparison-with-git) for an operational comparison.

## How does a change move through the review boundary?

A compact review sequence separates working-copy inspection, recorded history, causal evidence, and promotion.

```bash
atomic status -s
atomic diff --stat
atomic diff --name-status
atomic diff --word-diff
atomic log --path <PATH>
atomic change <HASH>
atomic diff -c <HASH> --word-diff
atomic agent attest --view <VIEW>
atomic agent attest --hash <ATTESTATION_HASH>
atomic insert change <HASH> --to <VIEW>
```

| Stage | Evidence |
|---|---|
| Scope | Short status, file count, line count, and path status |
| Semantics | Token-level diff and per-file graph summary |
| History | Changes associated with an affected path |
| Cause | Change Ledger with observed activity and inferred provenance edges |
| Captured attribution | Inline change metadata plus session-level attestation coverage |
| Promotion | Explicit change hash and target view |

The command pages for [status](/commands/status), [diff](/commands/diff), [log](/commands/log), [change](/commands/change), [agent attest](/commands/agent#attest), and [insert](/commands/insert) provide the complete option reference.

## What does provenance prove?

Provenance records observed lifecycle events and tool activity, classifies those events, and infers causal links between goals, explorations, edits, verification, and recorded patches. It does not capture or reveal a model's private chain-of-thought, and reviewers should treat inferred edges as structured evidence rather than a perfect account of internal reasoning.

```bash
atomic provenance trace <HASH>
atomic provenance show <HASH> --sign > provenance.signed.json
```

The default `atomic change <HASH>` output already renders the Change Ledger for interactive review. Use a trace to project that evidence into the provenance-specific view. The signed form is emitted to standard output, so redirect and retain it when the workflow requires a verifiable artifact; [How to See Why an AI Agent Changed Your Code](/agents/provenance) explains node classes, edge inference, and storage.

## What do attestations add?

Attestations summarize which changes an agent session covers and can include agent identity, model identity, duration, code statistics, token usage, and cost.

```bash
atomic agent attest
atomic agent attest --hash <ATTESTATION_HASH>
atomic agent attest --view <VIEW>
atomic agent attest --verbose
```

Usage and cost can be absent when an integration does not report them. The attestation remains useful for the fields it does contain, but a reviewer should not interpret missing usage fields as proof of human-only authorship. See [AI Agent Session Audit Trails](/agents/attestations) for coverage and fallback behavior.

## How do intents and memories participate in version control?

Intents make the requested outcome attestable; memories preserve durable conclusions produced by completed work. Both are graph-linked project artifacts rather than unstructured notes detached from the change history.

```bash
atomic intent list
atomic intent new "<OUTCOME>"
# Edit the generated directive file, then persist it
atomic vault sync
atomic intent attest <INTENT_ID>
atomic intent validate <INTENT_ID>
atomic intent verify <INTENT_ID>

atomic memory new --kind <KIND> --text "<TEXT>" --derived-from <URN>
atomic vault sync
atomic memory attest <MEMORY_ID>
atomic memory validate <MEMORY_ID>
atomic memory verify <MEMORY_ID>
```

Use the [`atomic intent`](/commands/intent) and [`atomic memory`](/commands/memory) references for directive shapes, memory kinds, and signature verification. Attestation runs the authoring gate and refuses non-fillable violations; the post-attestation `validate` shown above should pass before signature verification.

## How does the vault give a new agent context?

The vault can load project-level context and answer targeted structural questions before the agent edits code.

```bash
atomic vault context
atomic vault query code "<QUERY>"
atomic vault query entities <PATH>
atomic vault query neighbors <NODE_ID>
```

This reduces repeated repository scans and helps an agent find constraints, definitions, and relationships relevant to the current intent. [Querying the Graph](/getting-started/querying-the-graph) explains how to narrow those queries.

## What happens on a read-only agent turn?

Hooks skip read-only turns because there is no file modification to record as a change. The observed tool activity may contribute session context, but reviewers should not expect an empty code change for every question or inspection turn.

## Does graph-based version control eliminate every conflict?

No. Context-aware changes and filtered views reduce avoidable interference, and independent changes can compose without a snapshot merge, but overlapping or contradictory intent can still require review and resolution. Atomic's benefit is more precise structure and selective promotion, not an absolute guarantee that arbitrary concurrent edits are compatible.

## How does the model behave at high change volume?

File-scoped indexes avoid scanning unrelated graph data for common operations, while content-addressed changes allow evidence to reference stable identities. Read [Atomic Performance: Benchmarks at Agent Scale](/concepts/performance-at-scale) for the indexing design and measured scope of its performance claims.

## What should a technical evaluation verify?

- [ ] Each agent session receives an isolated review boundary.
- [ ] Change identity remains stable when shared across views or repositories.
- [ ] Review output includes file, line, token, and hunk-level evidence.
- [ ] Provenance claims are limited to observed activity and inferred links.
- [ ] Missing token or cost fields are represented as missing, not guessed.
- [ ] Read-only turns do not create meaningless code changes.
- [ ] Promotion names the exact change and target view.
