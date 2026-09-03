---
sidebar_position: 2
title: How to See Why an AI Agent Changed Your Code
description: Trace the prompts, tool activity, edits, and verification that led to an AI-generated code change.
---

# How to See Why an AI Agent Changed Your Code

Use an Atomic provenance graph to connect an AI-generated change to the goal, observed tool activity, edits, and verification that preceded it. The graph records auditable events and **inferred causal links**; it explains the evidence behind a change without claiming to expose a model's private chain-of-thought.

## What Is a Provenance Graph?

When an agent works on a task, it follows a pattern: understand the goal, read code to orient, make edits, then verify. Atomic captures this pattern as a directed acyclic graph with typed nodes and causal edges.

```
Goal: "Fix the authentication bug"
  │
  ├──led_to──▶ Exploration: read src/auth.rs
  ├──led_to──▶ Exploration: grep "verify_token"
  │                │
  │                ├──explored_via──▶ Commitment: edit src/auth.rs
  │                                      │
  │                                      ├──verified_by──▶ Verification: bash "cargo test"
  │                                      │
  │                                      └──committed_via──▶ PatchProposal: Change XMJZ3IPF (2 files)
  │
  └──led_to──▶ Goal: "Add test coverage" (next turn)
```

Each node has a timestamp, tool name, duration, and summary. Each edge has a kind that describes the inferred causal relationship. The graph is built incrementally as tool calls arrive; when a turn records a change, Atomic saves that turn's provenance as a content-addressed artifact.

## Node Types

Tool calls are classified into node types by a rule-based classifier that examines status, tool name, input, and output. A failed operation is classified as an Error before the remaining rules are applied:

| Node Type | Description | Example Tools |
|-----------|-------------|---------------|
| **Goal** | Human prompt that starts a turn | User message |
| **Exploration** | Read-only operations to understand code | `read`, `grep`, `list_directory`, `glob` |
| **Commitment** | File-modifying operations | `edit`, `write`, `edit_file`, `create_file` |
| **Verification** | Test or validation operations | `bash` (with `test`, `check`, `lint` in command) |
| **Execution** | Non-test shell commands | `bash` (with `install`, `build`, `run` in command) |
| **Error** | Failed operations | Any tool with error status |
| **HumanGate** | Permission requested from user | Approval prompts |
| **PatchProposal** | A recorded Atomic change | Created when `record_turn()` succeeds |
| **Decision** | Consolidated reasoning node | Created by post-hoc consolidation |

### Classification Rules

The classifier uses the tool name as the primary signal, with input/output inspection for disambiguation:

- **`read`**, **`grep`**, **`glob`**, **`list_directory`** → Exploration when successful
- **`edit`**, **`write`**, **`edit_file`**, **`create_file`** → Commitment when successful
- **`bash`** / **`terminal`** → inspects the command string:
  - Contains `test`, `check`, `lint`, `clippy`, `pytest`, `jest`, `cargo test` → Verification
  - Contains `install`, `build`, `compile`, `run`, `start` → Execution
  - Otherwise → Exploration (read-only shell command)
- Error status on any tool → Error

## Edge Types

Edges are inferred automatically from the sequence of events and the cursor state (current goal, pending explorations, last commitment):

| Edge Kind | Meaning | When Created |
|-----------|---------|--------------|
| **LedTo** | Goal initiated this action | Goal → Exploration, Goal → Commitment (when no explorations precede it) |
| **ExploredVia** | Explorations informed this commitment | Exploration → Commitment |
| **VerifiedBy** | Commitment was validated | Commitment → Verification |
| **CommittedVia** | Commitments became this patch | Commitment → PatchProposal |
| **FailedWith** | Previous action caused this error | Any node → Error |
| **BlockedBy** | Action was blocked by human gate | Any node → HumanGate |
| **ResumedAfter** | Goal resumed after a gate was resolved | HumanGate → Goal |

### Edge Inference Example

```
append_goal("Fix the auth bug")         → Goal node created
append_tool_call("read", "src/auth.rs") → Exploration, edge: Goal --led_to-→ Exploration
append_tool_call("grep", "verify_token")→ Exploration, edge: Goal --led_to-→ Exploration
append_tool_call("edit", "src/auth.rs") → Commitment, edges: Exploration --explored_via-→ Commitment (×2)
append_tool_call("bash", "cargo test")  → Verification, edge: Commitment --verified_by-→ Verification
append_patch_proposal("XMJZ3IPF", ...) → PatchProposal, edge: Commitment --committed_via-→ PatchProposal
```

The pending explorations list is cleared when a commitment arrives, so each commitment links to the observed explorations that preceded it. Those temporal links are review evidence, not proof of a model's hidden reasoning.

## How Provenance Graphs Are Built

The **ProvenanceAccumulator** maintains an in-memory graph for each session. Because each hook invocation is a separate process, the accumulator is persisted to disk between invocations:

```
.atomic/sessions/{session_id}/graph.json
```

### Lifecycle

1. **`session-start`** — Session created, accumulator initialized (empty graph)
2. **`user-prompt`** (TurnStart) — Accumulator loaded from disk, **Goal** node appended, saved back
3. **`after-tool`** (PostToolUse) — Accumulator loaded, **tool call node** appended (classified), saved back
4. **`stop`** (TurnEnd) — If a change was recorded:
   - Accumulator loaded
   - **PatchProposal** node appended
   - Graph converted to content-addressed `ProvenanceGraph`
   - Saved to repository via `repo.save_provenance_graph()`
   - `last_provenance_hash` updated for chaining
   - Accumulator saved back to disk
5. **`session-end`** — If the session recorded changes, Atomic attempts to create an attestation (the provenance graph data is already saved)

### Multi-Turn Chaining

Each turn's `ProvenanceGraph` is a self-contained artifact with a `previous` field pointing to the prior turn's graph hash. This creates a chain:

```
Turn 1 graph (hash: ABCD23EF)  ←  Turn 2 graph (hash: DEFG45HJ, previous: ABCD23EF)  ←  Turn 3 graph (...)
```

The accumulator maintains session context across turns, but each saved `ProvenanceGraph` contains the nodes and edges added since the previous save. The `previous` hash links the per-turn artifacts into a session chain.

## Storage

### On Disk

Provenance graphs are stored alongside changes in the two-level directory structure:

```
.atomic/changes/{change-hash[0:2]}/{full-change-hash}.change
.atomic/changes/{attestation-hash[0:2]}/{full-attestation-hash}.attest
.atomic/changes/{provenance-hash[0:2]}/{full-provenance-hash}.provenance
```

The `.provenance` extension distinguishes them from `.change` and `.attest` files.

### Content Addressing

Like changes and attestations, provenance graphs are content-addressed:

```
hash = blake3(serialized_graph)
path = .atomic/changes/{hash[0:2]}/{hash}.provenance
```

The graph is serialized with [postcard](https://docs.rs/postcard) for compact binary representation.

### Push

Provenance graphs travel with the changes they explain. When you push:

1. Atomic uploads the changes
2. For each pushed change, finds provenance graphs that reference it
3. Uploads provenance graphs where all explained changes have been pushed

```bash
$ atomic push origin

  ✓ Pushed 2 changes
  ✓ XMJZ3IPF provenance (7 nodes, 1 change)
  ✓ R3KQP7YN provenance (12 nodes, 1 change)
```

The server stores them and serves them to the web UI for visualization.

## Viewing Provenance Graphs

### CLI

Start with `atomic change`, whose default output already includes the causal Change Ledger when a provenance graph is available:

```bash
# Files, graph summary, inline AI metadata, and Change Ledger
atomic change <hash>

# Optional: project the ledger as a human-readable provenance chain
atomic provenance trace <hash>

# Optional: export and retain signed W3C PROV JSON-LD
atomic provenance show <hash> --sign > provenance.signed.json
```

The `=== Attestation ===` block above it is the first embedded provenance entry rendered for display, not a separate attestation artifact. The Change Ledger records observed activity and inferred causal links directly beside the change it explains. Signed W3C PROV output uses local development keys that are currently unencrypted at rest. See [How to Build an Audit Trail for AI-Generated Code](/guides/audit-trail-for-ai-generated-code) before treating the export as a trust artifact.

## Data Model

### Selected `ProvenanceGraph` Fields

The content-addressed artifact stored in the repository includes:

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | `String` | Session this graph belongs to |
| `agent_name` | `String` | Agent registry key (e.g., `opencode`) |
| `agent_display_name` | `String` | Human-readable name (e.g., `OpenCode`) |
| `agent_vendor` | `String` | Provider (e.g., `anthropic`) |
| `nodes` | `Vec<ProvenanceNode>` | All nodes in the graph |
| `edges` | `Vec<ProvenanceEdge>` | All causal edges |
| `changes_explained` | `Vec<Hash>` | Change hashes this graph explains |
| `previous` | `Option<Hash>` | Hash of prior graph in this session (for chaining) |

### ProvenanceNode

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | Unique node ID (session prefix + counter) |
| `kind` | `NodeKind` | Goal, Exploration, Commitment, Verification, etc. |
| `timestamp` | `i64` | Unix timestamp |
| `summary` | `String` | Human-readable description |
| `tool_name` | `Option<String>` | Tool that produced this node |
| `tool_call_id` | `Option<String>` | Unique tool invocation ID |
| `duration_ms` | `Option<u64>` | Tool execution time |
| `change_hash` | `Option<Hash>` | For PatchProposal nodes |
| `detail` | `Option<String>` | JSON detail (files, command, etc.) |

### ProvenanceEdge

| Field | Type | Description |
|-------|------|-------------|
| `from` | `String` | Source node ID |
| `to` | `String` | Target node ID |
| `kind` | `EdgeKind` | LedTo, ExploredVia, VerifiedBy, CommittedVia, etc. |

## Compaction Context

When OpenCode compacts a conversation to fit the context window, the provenance graph is injected as a structured summary. This preserves the agent's decision history across compaction boundaries:

```markdown
## Session Provenance (12 nodes)

### Goals
- Fix the authentication bug
- Add test coverage

### Decisions
- Read src/auth.rs, grep verify_token → edit src/auth.rs
- Run cargo test → passed

### Patches
- Change XMJZ3IPF: src/auth.rs, src/auth/tests.rs
```

This keeps the agent oriented about what it has already explored and committed, even after the raw conversation is compacted away.

## See Also

- [AI Agent Session Audit Trails](attestations.md) — Session-level audit nodes that reference provenance graphs
- [How Atomic Records What Your AI Coding Agent Did](overview.md) — How the full agent lifecycle works
- [`atomic agent` command reference](/commands/agent) — CLI documentation
