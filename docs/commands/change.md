---
title: atomic change
description: Inspect a recorded Atomic change, including files, graph statistics, inline AI attribution, token and cost metadata, and the causal Change Ledger.
keywords: [atomic change, AI attribution, change ledger, provenance, tokens, cost]
---

# `atomic change`

`atomic change <HASH>` is the primary command for answering **what changed, which AI metadata was recorded, and what observed activity led to the change**. The default output includes the change header, dependencies, graph and file summaries, the first embedded provenance entry rendered as `=== Attestation ===`, and the causal Change Ledger when those records are available.

## Synopsis

```bash
atomic change [OPTIONS] [HASH_OR_SEQ]
```

`HASH_OR_SEQ` can be a full change hash, an unambiguous hash prefix, or a sequence number in the selected view. With no argument, Atomic shows the most recent change on the current view.

## Example

The default output is intentionally comprehensive:

```text
$ atomic change GT2RCG5W2WRI52YDW266S5OT57R3ZYVAOOQVHY5KE4XMIAJUW2JA
change GT2RCG5W2WRI (#3)
Author: opencode+ses0 <developer@example.com>
Date:   2026-08-07 10:22:47

    Correct route-derived occupancy calculations

Dependencies: 2
  GJGC6OK6JT77...
  MKS5JQ3W7PWS...

Graph: +286 vertices, ~2 edges, 15593 bytes
Files changed: 5
  ± src/App.tsx (120 hunks: 2x +1 span, ~1 edge: replace; 118x +1 span: new content)
  ± .vault/intents/.../intent.md (41 hunks: new content)

=== Attestation ===
  Vendor:  Other("openrouter")
  Model:   openai/gpt-5.6-terra
  Tool:    Cli("opencode")
  Type:    Complete
  Tokens:
    Input:  36
    Output: 3198
    Total:  4544
  Cost:    $0.099867 USD
  Session: ses_023810ec8ffeY44C5bXvQY4gyr
  Metadata:
    turn_number: 3
    agent_name: opencode
    finish_reason: stop
    step_count: 12

=== Change Ledger ===
  Session: ses_023810ec8ffeY44C5bXvQY4gyr
  Agent:   OpenCode (openrouter)
  Nodes:   22  Edges: 31  Changes: 1

  goal » Correct route-derived occupancy calculations
  exploration » Examine the current intent [read]
  commitment » Edit src/App.tsx [apply_patch]
  execution » bun run build [bash]
  decision » Plan the connected track path
  patch_proposal » Change GT2RCG5W: 5 files
```

The example is abbreviated. Real output prints every recorded ledger node and one summary row for each changed path.

## What the default output contains

### Change header

The first section identifies the change:

- abbreviated hash and view sequence number;
- author attribution and timestamp;
- recorded change message;
- dependency hashes.

Use `--full-hash` when the primary inspected change hash will be copied into an audit record. Dependency hashes remain abbreviated in the current renderer.

### Graph and file summary

`Graph` reports the approximate number of vertices and edges plus stored content bytes. `Files changed` groups graph operations by path so a large change remains scannable instead of printing every low-level operation.

The path symbol indicates the recorded operation, while the parenthetical summary reports hunk counts and common operation shapes such as new content or replacement.

### Embedded provenance displayed as `Attestation`

When the change contains AI provenance, the renderer formats its first embedded provenance entry under the literal heading `=== Attestation ===`:

| Field | Meaning |
|---|---|
| `Vendor` | Provider value reported by the integration |
| `Model` / `Version` | Reported model identifier |
| `Tool` | Agent or CLI integration that recorded the change |
| `Type` | Suggestion/completion classification |
| `Tokens` | Provider-reported input, output, and total usage when available |
| `Cost` | Reported USD cost when available |
| `Request` / `Session` | Captured provider or agent identifiers |
| `Metadata` | Turn number, agent name, finish reason, step count, and other supplied fields |

Despite the display heading, this is an embedded provenance record—not a separate attestation artifact. It is **change-level metadata**, distinct from the session-level attestation artifacts listed and inspected by `atomic agent attest`. Content addressing makes the recorded change tamper-evident under its hash, but it does not independently authenticate the model provider or guarantee that every integration-reported field is complete.

### Change Ledger

When Atomic finds a provenance graph for the change, `=== Change Ledger ===` renders the causal decision DAG associated with it:

- session and agent attribution;
- node, edge, and covered-change counts;
- goals and todos;
- explorations and tool executions;
- commitments and file edits;
- decisions and LLM responses;
- the final patch proposal.

The ledger records observed activity and inferred causal links. It is an audit trail, not private model chain-of-thought and not proof that the implementation is correct.

If no graph is available, the command prints `No provenance graph found for this change.` A missing ledger does not prevent inspection of the change itself.

:::caution Review before sharing
The default view can contain prompts, commands, file paths, tool output summaries, and LLM responses. Review or use structured/redacted output before pasting it into tickets, public logs, or external audit systems.
:::

## Selecting a change

```bash
# Full hash
atomic change GT2RCG5W2WRI52YDW266S5OT57R3ZYVAOOQVHY5KE4XMIAJUW2JA

# Unambiguous hash prefix
atomic change GT2RCG5W

# Sequence number on the current view
atomic change '#3'

# Sequence number on another view
atomic change --view feature-auth '#3'

# Most recent change on the current view
atomic change
```

Quote sequence references so the shell does not interpret `#` as a comment.

## Dependency details and hunk-output limitation

The default output shows dependency hashes and per-file hunk summaries. Use `--show-deps` to include details for each dependency:

```bash
atomic change <HASH> --show-deps
```

:::warning `--show-hunks` currently does not expand output
The CLI accepts `--show-hunks` and advertises graph-operation details in `--help`, but the current formatter does not read the flag. Its output is currently identical to the default view. Use the per-file summaries and [`atomic diff --word-diff`](/commands/diff) until graph-operation expansion is implemented.
:::

## Output formats

### Default

```bash
atomic change <HASH>
```

Human-readable full output with the change summary, embedded provenance displayed as `=== Attestation ===`, and the Change Ledger.

### Short

```bash
atomic change <HASH> --format short
```

One-line output with the hash, sequence, date, author, and first message line.

### JSON

```bash
atomic change <HASH> --format json
```

Machine-readable output containing the change fields, embedded provenance, and available ledger graphs. Missing or corrupt ledger data is non-fatal; when the ledger collection is empty, the `ledger` field is omitted from serialized JSON.

Use JSON for policy checks, dashboards, or redaction pipelines instead of parsing colored terminal output.

## Options

| Option | Description |
|---|---|
| `[HASH_OR_SEQ]` | Full hash, hash prefix, or sequence number; defaults to the latest change |
| `--view <NAME>` | View used to resolve a sequence number |
| `-f, --format <FORMAT>` | `default`, `short`, or `json` |
| `--show-deps` | Show dependency details rather than hashes only |
| `--show-hunks` | Accepted, but currently does not alter formatted output |
| `--full-hash` | Print the primary inspected change hash in full |
| `--no-color` | Disable ANSI colors |
| `-v, --verbose` | Emit additional diagnostic output |

## Common review workflows

### Understand one AI-generated change

```bash
atomic change <HASH>
atomic diff -c <HASH> --word-diff
```

The first command gives the code summary, embedded provenance metadata, and ledger. The second focuses on token-level content differences.

### Export standards-oriented provenance

```bash
atomic provenance trace <HASH>
atomic provenance show <HASH> --sign > provenance.signed.json
```

Use `atomic provenance` when you need the W3C PROV projection or a retained signed export. The Change Ledger in `atomic change` is the faster default for interactive investigation.

### Inspect session-level aggregation

```bash
atomic agent attest --view <VIEW>
atomic agent attest --hash <ATTESTATION_HASH> --verbose
```

`atomic change` shows embedded provenance metadata attached to one change. `atomic agent attest` lists separate session-level artifacts that can cover multiple changes.

## See also

- [How to Trace What Your AI Coding Agent Changed and Why](/guides/track-ai-agent-changes-and-reasoning)
- [How to See Why an AI Agent Changed Your Code](/agents/provenance)
- [AI Agent Session Audit Trails](/agents/attestations)
- [`atomic diff`](/commands/diff)
- [`atomic log`](/commands/log)
