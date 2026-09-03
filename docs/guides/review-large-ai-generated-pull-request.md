---
title: "How to Review a Large AI-Generated Pull Request"
description: "A practical workflow for reviewing large AI-generated changes with GitHub or GitLab pull requests and Atomic-native triage."
keywords:
  - AI-generated pull request
  - AI code review
  - Atomic triage
  - GitHub pull request
  - GitLab merge request
sidebar_position: 5
---

# How to Review a Large AI-Generated Pull Request

Review a large AI-generated pull request as a bounded set of candidate changes, not as one monolithic diff. Keep GitHub or GitLab for discussion and CI when that is your collaboration surface, and use Atomic-native triage to identify what would land, inspect each change and its provenance, verify acceptance evidence, and sign the review before promotion.

## Is this a GitHub/GitLab review or an Atomic-native review?

They are related workflows, but they answer different questions.

| Review surface | Primary job | Source of truth |
|---|---|---|
| GitHub pull request or GitLab merge request | Conversation, line comments, approvals, and hosted CI | The hosting platform's branch diff and checks |
| Atomic triage | Candidate-set calculation, dependency closure, intent coverage, provenance, evidence, and promotion readiness | Content-addressed Atomic changes and view state |

If Git remains the team's collaboration platform, continue the hosted review and use Atomic as the provenance and verification sidecar. See [Git Shadow Sync](/getting-started/git-shadow-sync) for the supported GitHub/GitLab workflow.

## What would actually land?

Start with the candidate set instead of reading every changed file in arbitrary order:

```bash
atomic triage candidates <FEATURE> --into <TARGET>
```

This separates changes present only in the feature view from changes already visible in the target and exposes dependency-closure additions. Treat every candidate hash and every added dependency as review scope.

**Candidate-set checklist:**

- [ ] Every candidate belongs in this promotion.
- [ ] Dependency additions are expected, not unrelated baggage.
- [ ] The target view is the intended integration point.
- [ ] The feature view did not move after review began.

## Which triage format should you use?

Use the format that matches the reviewer or tool:

```bash
atomic triage review <FEATURE> --into <TARGET> --walkthrough
atomic triage review <FEATURE> --into <TARGET> --json
atomic triage review <FEATURE> --into <TARGET> --html
```

| Format | Best use |
|---|---|
| `--walkthrough` | Human review in a deliberate order |
| `--json` | Automation, policy checks, and LLM extraction |
| `--html` | Shareable visual inspection |

Triage checks linkage and evidence structure; it does not prove that the implementation is correct. A conforming intent can still describe bad code, so inspect the actual changes.

## How should you inspect each AI-generated change?

For every candidate hash, start with the combined change summary and then inspect token-level detail:

```bash
atomic change <HASH>
atomic diff -c <HASH> --word-diff
```

Review in risk order rather than file order:

| Priority | Look for |
|---|---|
| 1. Security and data boundaries | Authorization, validation, secret handling, destructive operations |
| 2. Public behavior | API contracts, schemas, migrations, compatibility |
| 3. Failure paths | Error propagation, retries, timeouts, cleanup, partial writes |
| 4. Concurrency and state | Races, ordering, idempotency, shared mutable state |
| 5. Verification | Regression tests, negative cases, realistic fixtures |
| 6. Maintainability | Duplication, generated noise, unnecessary abstractions |

Large AI changes often look internally consistent when the same model is reported across all layers. Independently verify assumptions at module boundaries instead of accepting consistency as correctness.

## How do you verify why the change exists?

Read the embedded provenance displayed as `=== Attestation ===` and the `=== Change Ledger ===` in `atomic change <HASH>` rather than guessing from its message or author label. Use the dedicated projection when review policy requires it:

```bash
atomic provenance trace <HASH>
```

List attestations covering the feature view, then inspect the relevant attestation by its own hash:

```bash
atomic agent attest --view <FEATURE>
atomic agent attest --hash <ATTESTATION_HASH> --verbose
```

Provenance can show the goal, exploration, edits, and verification associated with a change. A session attestation summarizes agent activity; neither artifact replaces code inspection or an independent review decision. See [How to See Why an AI Agent Changed Your Code](/agents/provenance) and [AI Agent Session Audit Trails](/agents/attestations).

## How do you check intent and evidence?

For each linked work intent, ask whether the acceptance criteria are specific, current, and supported by evidence. Validate and verify the signed record:

```bash
atomic intent validate <INTENT>
atomic intent verify <INTENT> --identity <IDENTITY>
```

Check that:

- [ ] The intent explains why the change is needed.
- [ ] Acceptance criteria describe observable outcomes.
- [ ] Tests cover failure and boundary cases, not only the happy path.
- [ ] Modified paths are in scope.
- [ ] Evidence applies to the exact candidate state under review.
- [ ] The reviewer is independent of the work author where policy requires it.

For the full intent and review model, see [Atomic Vault](/getting-started/atomic-vault).

## When is the review ready to sign?

Sign the triage report only after inspecting every candidate, resolving blockers, and rerunning required checks:

```bash
atomic triage review <FEATURE> --into <TARGET> \
  --attest --identity <IDENTITY> > triage-review.signed.json
```

A signed report binds the reviewed candidate set and view state. `--attest` emits the signed export to standard output, so retain the redirected file under your review policy. If the feature view changes, regenerate and reassess the report; an earlier signature is not approval of new changes. Current local signing keys are unencrypted development keys; see [How to Build an Audit Trail for AI-Generated Code](/guides/audit-trail-for-ai-generated-code) for the trust limitation.

## How do you promote the reviewed changes?

Preview the integration, insert the view, and immediately check repository state:

```bash
atomic insert preview <FEATURE> --to <TARGET>
atomic view switch <TARGET>
atomic insert view <FEATURE> --to <TARGET>
atomic conflicts --short
atomic status --short
```

Run the post-insert checks with the target view current, as shown above. Do not insert merely because the hosted PR has an approval or triage reports no structural blocker. Promotion should require both code-level judgment and current evidence. See [`atomic insert`](/commands/insert) for promotion mechanics and [Merging and Conflicts](/concepts/merging-and-conflicts) for conflict behavior.

## Final review checklist

- [ ] Candidate set and dependency closure are understood.
- [ ] Every change was inspected with hunk and word-level views.
- [ ] High-risk boundaries and failure paths were reviewed first.
- [ ] Provenance was traced without treating it as proof of correctness.
- [ ] Intent, evidence, and signatures are current.
- [ ] Hosted CI and required local checks passed.
- [ ] Triage was rerun and signed at the final feature state.
- [ ] Insert preview matched the reviewed candidate set.
- [ ] Post-insert status and conflicts are clean.
