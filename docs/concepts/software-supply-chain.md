---
title: "Software Supply Chain: How Atomic Maps to the Standards"
description: "How Atomic's signed changes, intents, grants, provenance and exports map to RFC 8785, W3C Data Integrity, DIDs, W3C PROV, DSSE and in-toto, and which CI job holds each one."
keywords:
  - software supply chain
  - AI-generated code provenance
  - RFC 8785
  - DSSE
  - in-toto
  - signed changes
sidebar_position: 8
---

# Software Supply Chain: How Atomic Maps to the Standards

Supply-chain security asks three questions about any artifact: who produced it, from what, and whether the bytes you hold are the bytes they signed. Atomic answers them for each change, intent, grant and review an AI agent or a person makes, and it uses a published standard wherever one exists. This page maps each Atomic record to the standard behind it, gives the command that shows it, and names the CI job that keeps it honest.

## What maps to what

| Supply-chain piece | Standard | What Atomic does | See it |
|---|---|---|---|
| Canonical bytes before hashing or signing | [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (JCS) | Canonical nodes (intents, memories, grants, provenance projections, triage references) are canonicalized by one function before they are hashed or signed, so the content hash and the signature never use two different canonical forms | [`atomic-canonical/src/jcs.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-canonical/src/jcs.rs) |
| Admitting JSON that arrives as bytes | [RFC 7493](https://www.rfc-editor.org/rfc/rfc7493) (I-JSON), integers only, depth 128 | A grant certificate that arrives as bytes (from disk, stdin or a request header) is admitted by `jcs::admit_document` before it is parsed: repeated member names, nesting past 128, integers outside the safe range, fractional numbers and ill-formed strings are refused, through the [`jcs-admit`](https://crates.io/crates/jcs-admit) crate | Same file, `admit_document` |
| Content addressing | BLAKE3 | Changes, session attestations and provenance graphs are stored under their BLAKE3 hash; a canonical node's `contentHash` is `blake3:` of its JCS bytes | [`atomic-canonical/src/hash.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-canonical/src/hash.rs), [Change Identity](/concepts/change-identity) |
| Signed changes | Ed25519 | `atomic record --identity <IDENTITY>` signs the change's content hash under a domain separator, so a change signature cannot be replayed as a signature over anything else. Verification takes the public key from outside the change; the embedded `signer_did` is only a hint | [`atomic-core/src/change/signing.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-core/src/change/signing.rs) |
| Signed records | [W3C Data Integrity](https://www.w3.org/TR/vc-data-integrity/), cryptosuite `eddsa-jcs-2022` | Intents, memories, grants, triage reports and signed provenance projections carry a `DataIntegrityProof` over their JCS bytes | [`atomic-canonical/src/proof.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-canonical/src/proof.rs) |
| Signer identifiers | [DIDs](https://www.w3.org/TR/did-core/): `did:atomic` and `did:key` | `did:atomic` is the BLAKE3 fingerprint Atomic already uses as an identity ID; `did:key` encodes the same Ed25519 key for tools that resolve it natively. Verification accepts either for the same key | [`atomic-canonical/src/did.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-canonical/src/did.rs) |
| Agent authority | Signed grants (`AgentDelegation`, `AgentDelegationRequest`, `DelegationRevocation`) | A person signs a narrow, expiring grant for an agent key; the grant carries both DIDs so a clone can verify it offline | `atomic identity grant new`, [`atomic-canonical/src/delegation.rs`](https://github.com/atomicdotdev/atomic/blob/dev/atomic-canonical/src/delegation.rs) |
| Provenance | [W3C PROV](https://www.w3.org/TR/prov-o/) as JSON-LD | Each turn's provenance graph is content addressed and links to the previous turn's hash; `provenance show` projects it as PROV JSON-LD, signed on request | `atomic provenance show <HASH> --sign`, [Provenance](/agents/provenance) |
| Portable signed envelope | [DSSE](https://github.com/secure-systems-lab/dsse) v1 | An optional build wraps provenance projections in a DSSE envelope, and an offline reader checks it against a key you pin | `atomic provenance show <HASH> --dsse`, `atomic provenance verify-dsse` ([atomic#235](https://github.com/atomicdotdev/atomic/pull/235)) |
| Release downloads | SHA-256 | Each GitHub release publishes `checksums-sha256.txt` for every archive | [Releases](https://github.com/atomicdotdev/atomic/releases) |

### Where in-toto and SLSA fit

Atomic does not emit [in-toto](https://in-toto.io/) Statements or [SLSA](https://slsa.dev/) build provenance. Two parts of it meet them. The DSSE export uses the envelope in-toto uses, with Atomic's own payload type, `application/vnd.atomic.provenance-export.v1+json`: a DSSE verifier that supports Ed25519 can check the signature, and the payload is read as Atomic's export schema rather than as an in-toto Statement. The JSON admission layer is tested in CI against the conformance suite for the in-toto `ai-agent-action` predicate (next section), so Atomic agrees with that suite's verdict on each byte fault the suite tests.

## How CI holds each piece

Each row is a job that fails the build when the property breaks. A row that names a pull request describes the job that pull request adds; it runs on `dev` once that pull request merges. Versions are pinned, so a new release of a dependency changes CI only through a reviewed pull request.

| Job | Workflow | What it checks | Pinned to |
|---|---|---|---|
| `Test` | `ci.yml` | The JCS, depth and ingest-boundary tests in `atomic-canonical/tests/`, on Linux, macOS and Windows | `jcs-admit` in `Cargo.toml` |
| `Conformance vectors` | `ci.yml` ([atomic#228](https://github.com/atomicdotdev/atomic/pull/228)) | Replays the `ai-agent-action` suite from [agent-evidence-vectors](https://github.com/probityai/agent-evidence-vectors) through `jcs::admit_document` and `jcs::canonicalize`. A document rejected for a byte fault must be refused, every other document admitted, and every record line of an accepting vector must already be canonical, byte for byte | The suite at its `v0.25.0` commit; `jcs-admit` 0.1.1 |
| `Evidence replay checker` | `ci.yml` ([atomic#234](https://github.com/atomicdotdev/atomic/pull/234), [atomic#284](https://github.com/atomicdotdev/atomic/pull/284)) | Installs the optional evidence checker with hashes and runs its controls: the installed release is the pinned one, a supported claim keeps its binding and scope, changed bytes give `not_established`, a missing passage gives `contradicted`, and a request cannot choose the executable | [`probity-verify`](https://pypi.org/project/probity-verify/) in `docs/examples/evidence-replay/requirements.txt`, proposed weekly by Dependabot |
| `export-consumer` | `provenance-dsse.yml` ([atomic#235](https://github.com/atomicdotdev/atomic/pull/235)) | Exports a real provenance graph as DSSE, verifies it with the CLI and with an independent Python reader, compares the two outputs byte for byte, and checks that wrong keys, payload types and payloads are refused | [`dsse`](https://crates.io/crates/dsse) 0.1.1 in `atomic-canonical/Cargo.toml`, behind the optional `dsse-export` feature |
| `native-delegation-consumer` | `native-delegation.yml` ([atomic#236](https://github.com/atomicdotdev/atomic/pull/236)) | Runs grant persistence, revocation and recovery cases in fresh processes, then checks the retained packet with an installed offline reader that never runs the Atomic binary | The reader's reviewed source commit, in the workflow |

Run the conformance replay locally:

```bash
git clone --depth 1 --branch v0.25.0 https://github.com/probityai/agent-evidence-vectors /tmp/aev
AEV_SUITE=/tmp/aev/vectors-ai-agent-action \
  cargo test -p atomic-canonical --test conformance_corpus -- --ignored
```

One accepting vector is skipped, and the test says why: it counts its depth limit inside one member, while `admit_document` counts from the document root. The rejecting side of the same limit is still checked.

## Verify it yourself

These commands check a record against a key you chose, not against a key the record carries.

**A signed intent.** The proof covers the canonical intent; a later edit makes it stale:

```bash
atomic intent verify <INTENT> --identity <IDENTITY>
```

**A provenance export.** Build with the optional feature, export, and verify against the exporter's public key, pinned out of band:

```bash
cargo build -p atomic-cli --features dsse-export
atomic provenance show <HASH> --identity <IDENTITY> --dsse > export.dsse.json
atomic provenance verify-dsse export.dsse.json --public-key <PINNED_BASE32_KEY> > verified.json
```

`verify-dsse` writes the authenticated payload bytes only after the signature and profile checks pass. It needs no repository and no local identity store.

**A criterion's retained evidence.** Replay a narrowly defined claim with a checker you selected; replay can add refusals but never marks a criterion met:

```bash
atomic intent validate <INTENT> --json \
  --replay-evidence manifest.json --evidence-checker ./checker
```

See `docs/examples/evidence-replay/README.md` in the repository for the manifest, the checker contract and the four supported claim types.

**A release download.** Fetch the checksum file from the same release and check the archive you downloaded:

```bash
sha256sum --check --ignore-missing checksums-sha256.txt
```

## What each record establishes

| Record | Establishes | Does not establish |
|---|---|---|
| Change signature | The holder of a key you trust signed this change's content hash | That the change is correct, or that the key holder wrote it |
| Intent, memory or triage proof | An identity signed this exact canonical record | That the work met the intent, or that the record is still current after an edit |
| Grant | A person authorized an agent key, within the grant's scope and expiry | That the agent stayed in scope, or server-side enforcement |
| Provenance projection | The selected, observed events and inferred links for a change | Hidden reasoning, a complete session, or authorship beyond what was captured |
| DSSE export | The exporter signed these projection bytes | Original authorship, that the exporter was authorized, or that referenced changes were verified |
| Release checksum | The archive matches the bytes the release published | Who built the archive or from which source |

:::warning Development signing keys
Atomic stores local signing keys unencrypted on disk. Treat change, intent, memory, provenance and triage signatures as development signatures until key-at-rest encryption lands, and protect the key files. See [How to Build an Audit Trail for AI-Generated Code](/guides/audit-trail-for-ai-generated-code).
:::

## See also

- [How to Build an Audit Trail for AI-Generated Code](/guides/audit-trail-for-ai-generated-code)
- [How to See Why an AI Agent Changed Your Code](/agents/provenance)
- [AI Agent Session Audit Trails](/agents/attestations)
- [`atomic identity`](/commands/identity) and [`atomic provenance`](/commands/provenance)
