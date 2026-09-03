---
title: "How to Build an Audit Trail for AI-Generated Code"
description: "How to connect intent, AI session evidence, provenance, changes, and signed review decisions into a verifiable audit trail."
keywords:
  - AI-generated code audit trail
  - AI code provenance
  - signed attestation
  - software supply chain
  - Atomic Vault
sidebar_position: 6
---

# How to Build an Audit Trail for AI-Generated Code

Build the audit trail by linking the approved intent, content-addressed code change, AI execution evidence, and promotion decision. Keep signed intent attestations, AI session attestations, signed provenance projections, and signed triage reports distinct because each proves a different claim.

## What are the four audit artifacts?

| Artifact | What it establishes | What it does not establish |
|---|---|---|
| Signed intent attestation | An identity signed a specific, validated statement of purpose, scope, criteria, and evidence | That an AI session followed the intent or that the code is correct |
| AI session attestation | A content-addressed summary of a session, its covered changes, model metadata, timing, and usage data when available | Independent approval or, by itself, an identity signature over requirements |
| Signed provenance projection | A signed presentation of selected provenance facts for a change | Hidden chain-of-thought, complete private transcripts, or code approval |
| Signed triage report | A reviewer signed the candidate set, view state, findings, and promotion assessment | Permanent approval after the source view or reviewed intent changes |

A separate signed review intent can capture the reviewer's acceptance criteria and judgment. Do not collapse all of these records into a single “AI approved” label.

## How do you sign the requirement and acceptance record?

Synchronize the completed work intent, attest it with the responsible identity, validate the signed form, and verify the resulting proof:

```bash
atomic vault sync
atomic intent attest <INTENT> --identity <IDENTITY>
atomic intent validate <INTENT>
atomic intent verify <INTENT> --identity <IDENTITY>
```

The signature covers the canonical intent state. Attestation runs the authoring gate and refuses non-fillable violations; the post-attestation `validate` shown above should pass. If the intent changes later, sync and verify it again—a stale attestation is not approval of the current text. See [`atomic intent`](/commands/intent) and [Atomic Vault](/getting-started/atomic-vault).

## How do you connect the code to the AI session?

Start from the immutable change hash. Its default view binds the code summary, the first embedded provenance entry displayed as `=== Attestation ===`, and the Change Ledger in one inspection surface; export signed provenance only when the audit policy requires a retained W3C PROV artifact:

```bash
atomic change <HASH>
atomic provenance trace <HASH>
atomic provenance show <HASH> --sign > provenance.signed.json
```

`trace` follows the evidence chain associated with the change. `show --sign` writes the signed provenance projection to standard output, so redirect it to retained storage as shown above. Inspect and protect the exported file because the signature applies to the presented facts.

Inspect the session attestation separately:

```bash
atomic agent attest
atomic agent attest --hash <ATTESTATION_HASH> --verbose
```

List the repository's attestations, identify the one whose covered changes include the code change, and inspect it using the attestation's own hash. The session attestation answers operational questions—what session ran, which changes it covered, which model metadata was captured, and how much usage was reported—not whether the resulting behavior is acceptable. See [AI Agent Workflows](/getting-started/ai-agent-workflows), [How to See Why an AI Agent Changed Your Code](/agents/provenance), and [AI Agent Session Audit Trails](/agents/attestations).

## How do you sign the review and promotion record?

Compute the candidate set, inspect the report, then sign the final triage state:

```bash
atomic triage candidates <FEATURE> --into <TARGET>
atomic triage review <FEATURE> --into <TARGET> --json
atomic triage review <FEATURE> --into <TARGET> \
  --attest --identity <IDENTITY> > triage-review.signed.json
```

The signed triage report should identify the feature and target views, candidate hashes, dependency closure, findings, and reviewed view state. `--attest` emits the signed export to standard output; retain that file under your audit policy and regenerate it whenever the candidate set or linked review substance changes.

**Before signing:**

- [ ] Every candidate hash was inspected.
- [ ] Dependencies and out-of-scope changes were explained.
- [ ] Acceptance evidence applies to the reviewed state.
- [ ] The signing identity is authorized and, when required, independent.
- [ ] No secret or unnecessary personal data appears in the projection.

## Where do durable decisions and lessons belong?

Use memories for reusable knowledge, not for session telemetry. Validate, attest, and verify each durable memory independently:

```bash
atomic vault sync
atomic memory attest <MEMORY> --identity <IDENTITY>
atomic memory validate <MEMORY>
atomic memory verify <MEMORY> --identity <IDENTITY>
```

A memory can preserve a decision, lesson, constraint, preference, or context that future work should retrieve. It should link to the narrowest relevant source and should not duplicate an entire transcript. See [`atomic memory`](/commands/memory).

## What should the end-to-end chain contain?

A minimal audit chain is:

```text
signed intent
  → content-addressed change
  → provenance trace
  → AI session attestation
  → signed provenance projection
  → signed triage report
  → inserted target state
```

Verify the joins, not just the existence of files:

| Join | Verification question |
|---|---|
| Intent → change | Does the linked task cover the exact modified path and behavior? |
| Change → provenance | Does the trace associate the recorded activity with this hash? |
| Provenance → session | Does the session attestation cover the change? |
| Change → triage | Is the same hash in the signed candidate set? |
| Triage → target | Was that reviewed set, and not a later set, promoted? |

Use `atomic vault query neighbors` to inspect graph relationships and [`atomic change`](/commands/change) plus [`atomic diff`](/commands/diff) to inspect the code itself.

## How should privacy and token data be handled?

Auditability does not require publishing private chain-of-thought or retaining every prompt byte. Capture purpose, tool activity, selected evidence, and causal links at the minimum detail required by policy.

- **Never include secrets in signed artifacts.** Signatures make accidental disclosure durable and verifiable.
- **Treat transcripts as optional and redactable.** A condensed unhashed transcript can be redacted without redefining the content-addressed code change; verify what your integration stores before sharing artifacts.
- **Treat token and cost fields as optional telemetry.** Providers or integrations may omit them. Missing token counts reduce usage accounting detail, but they do not invalidate a change hash, intent signature, provenance signature, or triage signature.
- **Use optional token or detail limits as privacy and size controls.** If an integration supports a limit, document the chosen limit; do not present a capped projection as a complete transcript.
- **Sign projections only after review.** A signature proves who endorsed that projection, not that omitted private data never existed.

:::warning Development signing keys
Atomic currently stores local signing keys unencrypted on disk. Treat intent, memory, provenance, and triage signatures as non-production development signatures until key-at-rest encryption is available; protect the key files and do not use this setup as a hardware-backed production trust root.
:::

## Audit readiness checklist

- [ ] Work intent validates, is freshly attested, and verifies.
- [ ] Every promoted change has a stable hash and traceable provenance.
- [ ] Session attestations identify their covered changes.
- [ ] Signed provenance projections disclose only policy-approved detail.
- [ ] Token, cost, transcript, and retention policies are documented.
- [ ] Independent triage is signed at the final candidate state.
- [ ] Durable lessons are stored as separate verified memories.
- [ ] A third party can traverse the chain without treating captured AI attribution as independently authenticated authorship.
