---
sidebar_position: 4
title: "Atomic Performance: Benchmarks at Agent Scale"
description: Published Atomic performance measurements, the indexing architecture behind them, and the agent-scale benchmarks that still need to be run.
keywords: [atomic, performance, benchmark, AI agents, btree, scalability]
---

# Atomic Performance: Benchmarks at Agent Scale

Atomic's published January 2026 stress test reported approximately **1,680–1,690 synthetic changes per second** across a sequential dependency chain up to **100,000 changes**, with roughly **60 seconds** reported for the largest run. Those values imply about **592–595 µs per change**; the source also rounds the result to “~500 µs,” so raw samples are required before treating that rounded figure as a measured mean.

## Benchmark snapshot

| Field | Published value |
|---|---|
| Benchmark date | January 2026 |
| Repository fixture | 1,000 synthetic files |
| Change pattern | Sequential dependency chain; each change appends one line to the same file |
| Tested chain length | 10 to 100,000 changes |
| Sustained throughput | Approximately 1,680–1,690 changes/second |
| Total time at 100,000 changes | Approximately 60 seconds |
| Per-change time derived from throughput | Approximately 592–595 µs |
| Separately reported rounded description | “~500 µs”; not arithmetically consistent with the reported throughput |
| Observed scaling | No degradation reported across the tested chain lengths |

The result is documented in [Performance Benchmarking Strategy](/proposals/performance-benchmarking-strategy#scenario-1-context-calculation-stress-test).

:::caution Benchmark limitation
The published record does not include the hardware, operating system, Atomic revision, build profile, raw samples, warm-up policy, variance, or a runnable benchmark artifact. It also reports the inconsistent rounded per-change figure noted above. Treat these numbers as a directional project measurement, not an independently reproducible comparison or service-level objective.
:::

## What this benchmark does and does not show

### It measures

- construction and recording of many small synthetic changes;
- a deep sequential dependency chain;
- whether per-change time degrades as that chain grows.

### It does not measure

- multiple agents writing concurrently;
- p50, p95, or p99 latency;
- end-to-end `atomic record`, `status`, `diff`, `push`, or `pull` latency;
- materialization of large files or whole repositories;
- database size, memory use, or write amplification;
- cold-cache behavior;
- remote service and network latency.

No public concurrent-agent benchmark is available yet. Claims about 50, 100, or 1,000 simultaneous agents should not be inferred from the sequential result above.

## Why repository-scale graph traversal can stay local

Atomic stores graph edges in two coordinated B-tree indexes:

| Index | Key shape | Purpose |
|---|---|---|
| **Global graph** | graph vertex → edges | Cross-file and repository-wide graph operations |
| **File-scoped graph** | file identity + graph vertex → edges | Traversal limited to one file's graph region |

If a repository contains `n` indexed graph entries and the target file contains `m` entries, file-scoped lookup plus iteration is:

```text
O(log n + m)
```

A repository-wide scan is:

```text
O(n)
```

The secondary index does not make every command constant-time. It changes the relevant unit of work for file traversal from the whole repository to the indexed region for the target file.

## Why this architecture helps agent workloads

Coding agents frequently inspect, edit, diff, and verify a small set of files while the repository's total history is much larger. A file-scoped graph index limits traversal to those files instead of repeatedly scanning unrelated graph entries.

The expected benefit depends on the workload:

- It is largest when `m` is much smaller than `n`.
- It is smaller for repository-wide operations.
- It trades additional storage and write amplification for faster targeted reads.
- It does not remove filesystem, parser, process-startup, locking, or network costs.

Those costs need separate end-to-end benchmarks.

## Remote divergence search

For a remote with usable cached state, Atomic can search for the divergence point rather than comparing every historical state from the beginning.

A binary search over `n` states requires at most approximately:

```text
ceil(log2(n))
```

For **100,000 states**, that is approximately **17 state checks**. This is an algorithmic count, not a measured sync latency. Each check can involve storage access or a network round trip, and a cold cache can require a full changelist path.

After divergence is found, delta work scales with the number of changes since that point, conventionally written as `k`:

```text
warm cached path: O(log n + k)
cold or unusable cache: can require O(n)
```

## Performance claims supported today

| Claim | Evidence level |
|---|---|
| The January 2026 sequential stress test reported ~1,680–1,690 changes/second | Published directional measurement |
| The same test reported ~60 seconds for 100,000 changes | Published directional measurement |
| The throughput implies ~592–595 µs/change | Arithmetic derived from the reported throughput |
| The source's separate “~500 µs” description is a measured mean | **Not established without raw results** |
| File-scoped graph lookup avoids a full graph scan | Architecture and complexity analysis |
| Binary divergence search takes ~17 checks at 100,000 states | Derived from `ceil(log2(100000))` |
| End-to-end operations are always under 50ms | **Not supported by a reproducible benchmark** |
| Atomic supports a measured 100- or 1,000-agent swarm | **Not yet benchmarked publicly** |
| Performance is independent of repository size for every operation | **Not supported** |

## Agent-scale benchmark plan

A credible concurrent-agent result should publish at least these dimensions:

| Dimension | Required disclosure |
|---|---|
| Build | Atomic revision, release/debug profile, feature flags |
| Machine | CPU, cores, RAM, storage, operating system |
| Repository | File count, byte size, graph entries, change count, dependency topology |
| Agents | Concurrent sessions, model or simulator, turns per session, files per turn |
| Isolation | Separate checkouts, view topology, and shared services |
| Workload | Read/edit/test mix, overlap rate, conflict rate, change size |
| Storage state | Warm/cold cache, initial database size, write amplification |
| Remote state | Local/mock/real remote and network latency |
| Statistics | Warm-up, samples, median, p95, p99, variance, failures |
| Artifacts | Runnable harness, fixture generator, raw results, before/after revisions |

The minimum useful matrix should vary both repository size and concurrent writers:

| Repository history | Concurrent agents | Required outputs |
|---:|---:|---|
| 1,000 changes | 1, 10 | Throughput, p50/p95/p99, memory, conflicts |
| 10,000 changes | 1, 10, 50 | Throughput, p50/p95/p99, memory, lock wait |
| 100,000 changes | 1, 10, 50, 100 | Throughput, p50/p95/p99, memory, failures |

Until that matrix has a runnable artifact and raw results, it is a benchmark plan rather than a benchmark claim.

## How to read Atomic performance results

When comparing a published number, ask four questions:

1. **What exact operation was timed?** Graph traversal, change construction, recording, materialization, and remote sync have different costs.
2. **What scales?** Total graph entries (`n`), entries in one file (`m`), changes since divergence (`k`), file bytes, or concurrent writers.
3. **What was excluded?** Process startup, filesystem I/O, parsing, tests, and network time can dominate an internal operation.
4. **Can the result be reproduced?** A command, fixture generator, revision, machine description, and raw samples are required.

This prevents an internal microbenchmark from being presented as end-to-end agent throughput.

## Implementation references

The relevant implementation areas in the Atomic source tree are:

- `atomic-core/src/pristine/tables.rs` — global and file-scoped graph table definitions;
- `atomic-core/src/pristine/inode_graph/` — file-scoped graph key and traversal implementation;
- `atomic-core/src/pristine/traits/graph.rs` — graph query interfaces;
- `atomic-core/src/apply/graph_batch.rs` — coordinated graph write path;
- `atomic-remote/src/sync.rs` — remote state and delta synchronization paths.

## Next steps

- [Performance Benchmarking Strategy](/proposals/performance-benchmarking-strategy)
- [Why Changes Compose: The Atomic Data Model](/concepts/the-lego-story)
- [Graph Model & AI Attribution](/concepts/graph-model-explained)
- [How to Run Multiple AI Coding Agents Without Merge Conflicts](/guides/multiple-ai-agents-without-merge-conflicts)
