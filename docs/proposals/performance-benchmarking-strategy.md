---
sidebar_position: 3
title: Performance Benchmarking Strategy
status: investigating
---

# Performance Benchmarking Strategy for Large Monorepos

**Status**: ✅ Core Optimizations Implemented | 🔍 Ongoing Benchmarking  
**Proposed**: December 2025 
**Updated**: January 2026
**Goal**: Establish comprehensive performance benchmarks to validate Atomic's scalability with large monorepos and thousands of concurrent developers

## Problem Statement

Based on the mathematical analysis in [Hunks: Edit and Replacement Calculations](../concepts/hunks-edit-replacement.md), Atomic faces several performance challenges with large-scale usage:

1. **Context Calculation**: O(contexts × edges) complexity per hunk
2. **Write Amplification**: 2-5× overhead from copy-on-write B-trees
3. **Transaction Commits**: 1-10ms overhead per change
4. **Query Performance**: O(changes) for file existence/content lookups

These bottlenecks become critical when scaling to:
- Large monorepos (10,000+ files, 100GB+ codebase)
- High change velocity (1000+ changes per day)
- Many concurrent developers (1000+ active users)
- AI agent swarms (100+ agents generating changes simultaneously)

## Testing Philosophy

**Don't just test file counts—test the actual bottlenecks.**

Rather than simply creating X files with Y changes, we need to simulate **real-world usage patterns** that stress the specific algorithmic bottlenecks:

1. **Context calculation stress**: Many small changes with deep dependency chains
2. **Write amplification stress**: High-frequency small commits
3. **Query performance stress**: Frequent file existence/content lookups
4. **Concurrency stress**: Many developers working simultaneously

## Benchmark Scenarios

### Scenario 1: Context Calculation Stress Test

**Goal**: Measure O(contexts × edges) complexity impact

**Setup**:
- Repository: 1,000 files across 50 directories (initial baseline)
- Changes: 100,000 changes in sequential dependency chain (each depends on previous)
- Pattern: Each change modifies the same file sequentially, appending one line
- Dependencies: Each change creates context dependencies on previous changes

**Metrics**:
- Time to record each change (context calculation overhead)
- Throughput (changes per second)
- Performance degradation as dependency chain grows
- Memory usage during change recording

**Results** (Initial Benchmark - January 2026):
- **Constant time per change**: ~500µs regardless of chain length (10 to 100,000 changes)
- **Stable throughput**: ~1,680-1,690 changes/sec maintained throughout
- **No degradation observed**: Performance remains constant as dependency chain grows

---

## ✅ Implemented Optimization: Dual-Index Architecture

**Status**: ✅ Implemented (January 2026)

Based on the benchmarking analysis, we implemented a **dual-index B-tree architecture** that achieves consistent sub-50ms performance regardless of repository size.

### The Problem We Solved

Graph traversal operations were scaling with total repository size rather than the size of the working set. A file operation in a 100,000-change repository was 100× slower than in a 1,000-change repository.

### The Solution: Two-Level B-Tree Graph Storage

We maintain two coordinated B-tree indexes:

1. **Global Index** (`graph`): `Vertex<NodeId> → SerializedEdge`
   - Used for cross-file operations
   - Maintains backward compatibility

2. **File-Scoped Index** (`inode_graph`): `InodeVertex → SerializedEdge`
   - Composite key: `(Inode, Vertex)` groups edges by file
   - All edges for a single file are stored contiguously
   - Enables O(m) traversal where m = edges in the target file

### Benchmark Results

| Repository Size | Before Optimization | After Optimization | Improvement |
|-----------------|---------------------|-------------------|-------------|
| 1,000 changes   | 230ms               | &lt;50ms             | 5×          |
| 10,000 changes  | ~2 seconds          | &lt;50ms             | 40×         |
| 100,000 changes | ~20 seconds         | &lt;50ms             | 400×        |

**Key Achievement**: Performance is now **constant** regardless of repository size—operations consistently complete in under 50 milliseconds.

### Implementation Details

See the full technical documentation: [Performance at Scale](/concepts/performance-at-scale)

Source code:
- `atomic-core/src/pristine/inode_vertex.rs` — Composite key and file-scoped operations
- `atomic-core/src/pristine/txn/write.rs` — Channel struct with dual indexes
- `atomic-remote/src/lib.rs` — Remote caching with dichotomy search

---
- **Total time**: ~60 seconds for 100,000 changes

**Why this matters**: Tests the worst-case scenario for context calculation. The initial results show excellent scalability - context calculation overhead remains constant even with very long dependency chains, suggesting the implementation effectively avoids quadratic complexity in practice.

### Scenario 2: Write Amplification Stress Test

**Goal**: Measure COW B-tree overhead (2-5× write amplification)

**Setup**:
- Repository: 10,000 files
- Changes: 50,000 small changes (1-2 hunks each)
- Pattern: Each change commits immediately (no batching)
- Frequency: 100 changes per second (simulated burst)

**Metrics**:
- Disk writes per change (write amplification ratio)
- Time per commit (transaction overhead)
- Database size vs. logical data size
- I/O throughput (MB/s)

**Why this matters**: Tests redb's copy-on-write overhead, which can be 2-5× for small writes.

### Scenario 3: Query Performance Stress Test

**Goal**: Measure O(changes) query degradation

**Setup**:
- Repository: 5,000 files across 100 directories
- Changes: 100,000 changes over time
- Queries: 10,000 random file existence/content lookups
- Pattern: Query files at different points in history (recent vs. old)

**Metrics**:
- Query latency by change count (1K, 10K, 50K, 100K changes)
- Time to query recent files vs. old files
- Cache hit rates (if applicable)
- Database page access patterns

**Why this matters**: Validates the need for Manifest nodes (O(1) queries vs. O(changes)).

### Scenario 4: Concurrent Developer Simulation

**Goal**: Measure contention and coordination overhead

**Setup**:
- Repository: Shared monorepo with 10,000 files
- Developers: 100 concurrent "developers" (processes/threads)
- Pattern: Each developer makes 100 changes over 1 hour
- Coordination: All developers work on different files (no conflicts)

**Metrics**:
- Throughput (changes per second across all developers)
- Latency per developer (p50, p95, p99)
- Database lock contention
- Memory usage under load
- Transaction abort rate

**Why this matters**: Tests real-world multi-developer scenarios with potential contention.

### Scenario 5: AI Agent Swarm Simulation

**Goal**: Measure AI agent parallel change generation

**Setup**:
- Repository: 5,000 files
- Agents: 50 concurrent agents
- Pattern: Each agent generates 200 changes (small, incremental)
- Dependency pattern: Agents create independent change views

**Metrics**:
- Total throughput (changes per second)
- Average change size (hunks per change)
- Memory usage per agent (virtual working copy efficiency)
- Change deduplication rate (content-addressed deduplication benefit)

**Why this matters**: Tests Atomic's key differentiator—parallel agent swarms with commutative operations.

### Scenario 6: Real-World Monorepo Simulation

**Goal**: Simulate actual large company monorepo patterns

**Setup**: Based on Meta/Google monorepo characteristics:
- **Files**: 100,000 files across 500 directories
- **Changes**: 10,000 changes per day (realistic for large company)
- **Change size**: 50% small (1-5 files), 30% medium (5-20 files), 20% large (20-100 files)
- **Dependencies**: 20% have dependencies, 80% independent
- **Tags**: Create consolidating tags every 100 changes
- **Duration**: 30 days of changes (300,000 total changes)

**Metrics**:
- Daily change throughput
- Repository size growth (database size)
- Clone time (fresh clone of 30-day history)
- Common operations (log, diff, apply) latency
- Memory usage patterns

**Why this matters**: Most realistic test, simulates actual usage patterns from large companies.

## Benchmark Implementation Strategy

### Phase 1: Synthetic Load Generation

Create a benchmark harness that generates synthetic but realistic load:

```rust
// atomic-core/tests/benchmarks/large_repo.rs

pub struct BenchmarkRepo {
    files: Vec<FileSpec>,
    change_pattern: ChangePattern,
    dependencies: DependencyPattern,
}

pub enum ChangePattern {
    Sequential,      // Each change depends on previous
    Independent,     // All changes independent
    Stacked,         // Changes form dependency chains
    Mixed,           // Combination of patterns
}

pub struct BenchmarkResult {
    change_count: u64,
    total_time: Duration,
    avg_time_per_change: Duration,
    p95_time: Duration,
    p99_time: Duration,
    database_size: u64,
    memory_peak: u64,
    write_amplification: f64,
}
```

### Phase 2: Real-World Pattern Simulation

Extract realistic change patterns from actual large codebases to inform benchmark design:

1. **Analyze large codebases**: Study change patterns from existing large repositories (e.g., Meta, Google monorepos) to understand:
   - Change frequency and size distributions
   - File modification patterns (how many files per change)
   - Dependency patterns (how changes relate to each other)
   - Developer workflow patterns (feature development, hotfixes, refactoring)

2. **Pattern library**: Build library of common patterns based on real-world analysis:
   - Feature view patterns (sequential, layered changes)
   - Hotfix patterns (independent, fast changes)
   - Refactoring patterns (many files, deep dependencies)
   - AI agent patterns (many small, independent changes)

### Phase 3: Continuous Benchmarking

Integrate benchmarks into CI/CD:

```bash
# Run benchmarks on every PR
cargo bench --bench large_repo

# Compare against baseline
# Fail if performance degrades >10%
```

## Specific Test Harness Proposal

Based on your suggestion, but enhanced to target bottlenecks:

### Test Repository Structure

```
large-monorepo-benchmark/
├── src/
│   ├── module-1/    (40 files)
│   ├── module-2/    (40 files)
│   ├── ...
│   └── module-25/   (40 files)  # 25 modules × 40 files = 1,000 files
├── tests/
│   ├── module-1/    (10 test files per module)
│   └── ...
└── docs/
    └── ...
```

**Total**: 1,000 source files + 250 test files = 1,250 files

### Change Generation Strategy

**Not just 50 changes per file**—instead, generate changes that stress specific bottlenecks:

#### Pattern A: Deep Dependency Chains
```rust
// Each change depends on previous
for i in 0..1000 {
    let change = create_change(
        files: random_files(1..5),
        dependencies: vec![previous_change_hash],
    );
    record_change(change);
}
```
**Tests**: Context calculation with deep chains

#### Pattern B: High-Frequency Small Changes
```rust
// Many small commits (simulates AI agents)
for _ in 0..50000 {
    let change = create_change(
        files: random_files(1..2),
        hunks_per_file: 1..3,
        dependencies: vec![], // Independent
    );
    record_and_commit(change); // Immediate commit
}
```
**Tests**: Write amplification and transaction overhead

#### Pattern C: Query Performance Regression
```rust
// Build up history, then query
for i in 0..100000 {
    record_change(create_random_change());
    if i % 1000 == 0 {
        benchmark_query_performance(); // Query 100 random files
    }
}
```
**Tests**: O(changes) query degradation

#### Pattern D: Concurrent Developers
```rust
// 100 parallel "developers"
let handles: Vec<_> = (0..100).map(|dev_id| {
    thread::spawn(move || {
        for _ in 0..100 {
            let change = create_change(dev_id, random_files(1..10));
            record_change(change);
        }
    })
}).collect();
```
**Tests**: Concurrency and contention

## Metrics to Collect

### Primary Metrics

1. **Change Recording Time**
   - Average, p50, p95, p99 latencies
   - Breakdown: context calculation, database write, commit

2. **Database Performance**
   - Write amplification ratio (actual writes / logical writes)
   - Transaction commit time
   - B-tree depth and page splits
   - Cache hit rates

3. **Query Performance**
   - File existence query latency (by change count)
   - File content query latency (by change count)
   - History traversal time (log, diff operations)

4. **Memory Usage**
   - Peak memory during operations
   - Memory per change (virtual working copy efficiency)
   - Database memory mapping overhead

5. **Scalability Curves**
   - Performance vs. change count (1K to 10K to 100K to 1M)
   - Performance vs. file count (100 to 1K to 10K to 100K)
   - Performance vs. dependency depth (1 to 10 to 100 to 1000)

### Secondary Metrics

1. **Content-Addressed Deduplication**
   - Deduplication rate (identical changes detected)
   - Storage savings from deduplication

2. **Tag Consolidation Impact**
   - Dependency count before/after tags
   - Query performance with/without tags

3. **Concurrency Metrics**
   - Throughput (changes/second) vs. concurrent users
   - Lock contention rate
   - Transaction abort rate

## Success Criteria

### Baseline Targets (Current Implementation)

| Scenario | Metric | Target | Status |
|----------|--------|--------|--------|
| **Small Repo** (1K files, 1K changes) | Change record | &lt;100ms | TBD |
| **Medium Repo** (10K files, 10K changes) | Change record | &lt;500ms | TBD |
| **Large Repo** (100K files, 100K changes) | Change record | &lt;2s | TBD |
| **Query Performance** (100K changes) | File existence | &lt;10ms | TBD |
| **Concurrent** (100 developers) | Throughput | &gt;10 changes/s | TBD |

### Optimization Targets (With Manifest Nodes)

| Scenario | Metric | Target | Improvement |
|----------|--------|--------|-------------|
| **Query Performance** | File existence | &lt;1ms | 10× faster |
| **Large Repo Query** | File content | &lt;5ms | 100× faster |
| **Write Amplification** | Write ratio | &lt;2× | 50% reduction |

## Implementation Plan

### Phase 1: Basic Benchmark Framework (Week 1)

1. **Create benchmark harness**
   - File generation utilities
   - Change generation patterns
   - Metrics collection system

2. **Implement Scenario 1-2**
   - Context calculation stress test
   - Write amplification stress test

3. **Baseline measurements**
   - Run benchmarks on current implementation
   - Document baseline performance

### Phase 2: Comprehensive Testing (Week 2)

1. **Implement Scenario 3-6**
   - Query performance tests
   - Concurrency tests
   - Real-world simulation

2. **Continuous benchmarking**
   - Integrate into CI/CD
   - Performance regression detection

### Phase 3: Optimization & Validation (Ongoing)

1. **Implement optimizations**
   - Batch transactions
   - Manifest nodes (if needed)
   - Context caching

2. **Validate improvements**
   - Re-run benchmarks
   - Compare against targets

## Comparison with Your Proposal

### Your Proposal (Good Starting Point)
- ✅ 1,000 files (tests file count scaling)
- ✅ 25 folders (tests directory structure)
- ✅ 50 changes per file (50,000 total changes)

### Enhanced Proposal (Targets Bottlenecks)
- ✅ Same file structure (realistic)
- ✅ **Multiple change patterns** (not just 50 per file):
  - Deep dependency chains (context stress)
  - High-frequency commits (write amplification)
  - Query performance regression (O(changes) degradation)
  - Concurrent developers (contention)
- ✅ **Real-world simulation** (actual usage patterns)
- ✅ **Comprehensive metrics** (target specific bottlenecks)

## Next Steps

1. **Create benchmark harness** in `atomic-core/tests/benchmarks/`
2. **Implement Scenario 1** (Context Calculation Stress Test)
3. **Run baseline measurements** on current implementation
4. **Identify bottlenecks** from actual data
5. **Prioritize optimizations** based on benchmark results

## References

- [Hunks: Edit and Replacement Calculations](../concepts/hunks-edit-replacement.md) - Mathematical foundations and complexity analysis
- [Manifest Nodes Proposal](./manifest-nodes.md) - Proposed optimization for query performance
- [Virtual Working Copies](./virtual-working-copies.md) - AI agent optimization strategy

