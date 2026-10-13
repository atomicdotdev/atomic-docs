---
sidebar_position: 29
title: triage
---

# atomic triage

Project the code-review candidate set of a feature view against a target.

## Synopsis

```bash
atomic triage <SUBCOMMAND>
atomic triage candidates <FEATURE> --into <INTO> [--json]
atomic triage review <FEATURE> --into <INTO> [--json] [--walkthrough] [--html] [--attest]
```

## Description

Before a feature view's changes are inserted into a target view (usually `dev`), a reviewer needs to know **what exactly is being proposed**. `atomic triage` computes that candidate set — the changes in the feature view that the target does not already have — and renders it for review.

It is the CLI companion to the review workflow: `candidates` reports the raw set, `review` builds the canonical triage report with a verdict and findings.

Both subcommands take the same two views:

- **`<FEATURE>`** — the feature (source) view to review
- **`--into <INTO>`** — the target view the feature would be inserted into

List available views with [`atomic view list`](view.md#view-list---list-views).

## Subcommands

### `triage candidates` — Report the Candidate Set

#### Synopsis

```bash
atomic triage candidates <FEATURE> --into <INTO> [OPTIONS]
```

#### Arguments

**`<FEATURE>`** — The feature (source) view to review.

#### Options

| Option | Description |
|--------|-------------|
| `--into <INTO>` | The target view the feature would be inserted into |
| `--json` | Emit the candidate set as JSON |

#### Examples

```bash
# What would inserting feature-login into dev bring in?
atomic triage candidates feature-login --into dev

# Machine-readable, for tooling
atomic triage candidates feature-login --into dev --json
```

### `triage review` — Build the Canonical Triage Report

Build the full triage report and render it (verdict + findings).

#### Synopsis

```bash
atomic triage review <FEATURE> --into <INTO> [OPTIONS]
```

#### Arguments

**`<FEATURE>`** — The feature (source) view to review.

#### Options

| Option | Description |
|--------|-------------|
| `--into <INTO>` | The target view the feature would be inserted into |
| `--json` | Emit the full report as JSON instead of the bounded CLI dashboard |
| `--walkthrough` | Print the guided walkthrough: the candidate changes grouped into ordered semantic layers (foundations first), with each layer's rationale, files, and inspect commands. Bounded — never a diff dump |
| `--html` | Write a self-contained HTML report (inline CSS/JS, no external assets) to a file and open it in the default browser |
| `--output <FILE>` | With `--html`, write the report to this path instead of a temp file |
| `--no-open` | With `--html`, write the file but do not open a browser (headless/CI) |
| `--attest` | Emit a signed (attested) JSON export: the report plus an Ed25519 Data Integrity proof, frozen for portability/compliance |
| `--identity <IDENTITY>` | Identity whose key signs the `--attest` export. Defaults to the current default identity |

#### Review workflow

```bash
# 1. Semantic layers, foundations first — what to read, in what order
atomic triage review feature-login --into dev --walkthrough

# 2. Full dashboard with verdict and findings
atomic triage review feature-login --into dev

# 3. Shareable HTML report (no browser in CI)
atomic triage review feature-login --into dev --html --no-open -o report.html

# 4. Frozen, signed export for compliance
atomic triage review feature-login --into dev --attest
```

## See Also

- [view](view.md) — Views and the promote/insert workflow triage precedes
- [insert](insert.md) — Bringing a view's changes into another view
- [provenance](provenance.md) — Signed PROV projections for individual changes
