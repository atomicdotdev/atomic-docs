---
title: "How to Find the Root Cause of a Bug an AI Agent Introduced"
description: "A change-first workflow for locating the introducing hunk, proving causation, and tracing AI provenance without guessing authorship from a file path."
keywords:
  - AI agent bug root cause
  - AI code debugging
  - change provenance
  - introducing change
  - Atomic version control
sidebar_position: 7
---

# How to Find the Root Cause of a Bug an AI Agent Introduced

Find the root cause by reproducing the symptom, identifying the exact change that first introduced the faulty behavior, inspecting its hunks, and then tracing that change's provenance. Do not infer authorship or causation merely because an AI agent touched the same path; path history provides candidates, while the introducing change and trace provide evidence.

## What evidence should you collect first?

Write down a narrow failure statement before reading provenance:

- The observable symptom.
- The smallest known reproduction.
- The affected path, symbol, input, and environment.
- The expected and actual result.
- The first known bad state and last known good state, if available.

Check whether unrecorded work could be contaminating the reproduction:

```bash
atomic status --short
```

Do not attribute a dirty working-copy edit to a recorded AI change. Preserve or isolate local work before comparing recorded states.

## Which recorded changes are candidates?

Start with path history:

```bash
atomic log --path <PATH>
```

Then narrow by code structure and relationships:

```bash
atomic vault query entities <PATH>
atomic vault query code "<SYMBOL_OR_PATTERN>"
atomic vault query neighbors file:<PATH>
```

Path history answers “which changes touched this file?” It does not answer “which change caused this bug?” A later formatting edit, test addition, or unrelated AI session may touch the path without introducing the failure.

## How do you identify the introducing change?

Inspect candidate changes from the last known good state toward the first known bad state:

```bash
atomic change <HASH>
atomic diff -c <HASH> --word-diff
```

Look for the first hunk that changes the behavior needed to reproduce the bug. Common root causes include an inverted condition, missing validation, incorrect default, stale cache key, reordered side effect, broadened match, or incompatible API assumption.

A candidate is strong only when the evidence connects all three levels:

| Level | Required evidence |
|---|---|
| Symptom | A repeatable input produces the observed failure |
| Behavior | A specific code path explains that failure |
| Change | A specific hunk introduced or enabled that behavior |

When practical, confirm that the reproduction fails with the candidate present and passes in a state without it. Correlation in history is not enough.

## How do you separate root cause from contributing factors?

Build a short causal chain:

```text
input or event
  → faulty state transition or decision
  → incorrect line/token/operation
  → introducing hunk
  → introducing change hash
```

Classify other findings separately:

| Finding | Classification |
|---|---|
| The hunk directly creates the faulty behavior | Root cause |
| Missing test allowed the bug to ship | Contributing control failure |
| A dependency exposed an existing defect | Trigger or precondition |
| A later change touched the file but preserved the bug | Unrelated history |
| An AI session read or edited the path without introducing the hunk | Not authorship evidence |

This prevents a broad “the agent changed this module” conclusion from replacing a technical explanation.

## When should you trace AI provenance?

After identifying the likely introducing hash, read its embedded provenance block and Change Ledger. Project or traverse related graph evidence only when needed:

```bash
atomic change <HASH>
atomic provenance trace <HASH>
atomic vault query neighbors change:<HASH>
```

The trace can connect the change to its goal, exploration, edit activity, verification, and session records. List attestations covering the affected view, then inspect the relevant artifact by its own hash:

```bash
atomic agent attest --view <VIEW>
atomic agent attest --hash <ATTESTATION_HASH> --verbose
```

Use provenance to inspect which session and hook-reported attribution are associated with the introducing change. Do not use it to skip the causal analysis: a valid trace establishes an association with the change, not that the metadata source was independently authenticated or that the change is the bug's root cause.

See [How to See Why an AI Agent Changed Your Code](/agents/provenance), [AI Agent Session Audit Trails](/agents/attestations), and [Querying the Knowledge Graph](/getting-started/querying-the-graph).

## What does and does not support AI attribution?

| Observation | Conclusion |
|---|---|
| AI provenance trace is attached to the introducing change | Evidence that Atomic associated the recorded session activity with that change |
| Session attestation covers the introducing change | Evidence that the attestation's captured coverage set includes the change |
| AI touched the same path in another change | No conclusion about this bug |
| Commit message mentions an agent | A clue, not cryptographic or causal proof |
| AI added a test after the bug existed | No evidence that AI introduced the bug |
| Human later inserted the AI change into a shared view | Human promotion decision, distinct from change production |

State uncertainty explicitly when provenance is absent or incomplete. “The change introduced the bug, but its agent attribution is unverified” is more accurate than guessing.

## How should you document the root cause?

Use a statement that names behavior and evidence:

> Change `<HASH>` introduced `<FAULTY_BEHAVIOR>` in `<PATH_OR_SYMBOL>` by `<MECHANISM>`. Reproduction `<TEST_OR_INPUT>` fails when that change is present and succeeds without it. `atomic provenance trace <HASH>` links the change to `<SESSION_OR_IDENTITY>`; `<CONTRIBUTING_FACTOR>` allowed it to pass review.

Avoid statements such as “the AI broke authentication” unless the introducing change, trace, and affected behavior all support that scope.

## How do you prevent recurrence?

Fix the mechanism, add the smallest regression check that reproduces it, and review the final change as a new unit of work. Capture durable lessons or constraints separately, then validate, attest, and verify them:

```bash
atomic memory new --kind lesson --text "<DURABLE_LESSON>" --derived-from <URN>
atomic vault sync
atomic memory attest <MEMORY> --identity <IDENTITY>
atomic memory validate <MEMORY>
atomic memory verify <MEMORY> --identity <IDENTITY>
```

For review and evidence requirements, see [Atomic Vault](/getting-started/atomic-vault).

## Root-cause checklist

- [ ] The symptom is reproducible and narrowly stated.
- [ ] The working copy state is understood.
- [ ] Path history was used only to generate candidates.
- [ ] The introducing hunk and change hash were inspected directly.
- [ ] Causation was distinguished from missing tests and other contributors.
- [ ] Provenance was traced from the introducing change, not inferred from the path.
- [ ] AI session evidence and human promotion decisions were kept distinct.
- [ ] The fix includes a regression check for the original mechanism.
