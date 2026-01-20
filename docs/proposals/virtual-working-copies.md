---
sidebar_position: 2
title: Virtual Working Copies
status: Enterprise Only
---

# Virtual Working Copies

**Status**: 🔍 Investigating  
**Proposed**: December 2025 

## Overview

Virtual working copies are a key innovation in Atomic VCS that enable massive AI agent parallelism. Instead of requiring disk-based working directories for each agent, sessions maintain **in-memory virtual working copies** that track only diffs, not full file copies.

## What It Is

A **virtual working copy** is an in-memory data structure that tracks file modifications without materializing them on disk.

```rust
Session {
    pristine_state: HashMap<Path, FileState>,    // Files from parent changes
    virtual_edits: HashMap<Path, Vec<Edit>>,     // Agent's modifications (diffs only)
    change_builder: ChangeRecord,                // Change being constructed
}
```

## How It Works

### Traditional VCS (Git)
```
Agent → Write files to disk → Git reads files → Computes diffs → Creates commit
        💾 Disk I/O           💾 Disk I/O
```

### Virtual Working Copy (Atomic Sessions)
```
Agent → API call → Session computes diff in memory → Creates change
                   🧠 Memory only
```

## Key Operations

### Write File
```python
session.write_file("users.rs", new_content)
```

**What happens internally:**
1. Load pristine state (what file looks like in parent changes) - **lazy**
2. Compute diff between pristine and new content - **in memory**
3. Add diff hunks to change record - **only store diffs**
4. Update virtual edits for subsequent reads - **keep minimal state**

### Read File
```python
content = session.read_file("config.toml")
```

**What happens internally:**
1. Check virtual_edits first (did agent already modify this?)
2. If yes: return the modified content
3. If no: load from pristine state (parent changes)

### Commit
```python
change_hash = session.commit()
```

**What happens internally:**
1. Finalize change record with all accumulated hunks
2. Write ONE change file to `.atomic/changes/`
3. Dispose of session memory

## The "Aha!" Moment

### Without Virtual Working Copies
```
100 agents working simultaneously:
├── Agent 1: /tmp/workspace-1/ (500MB on disk)
├── Agent 2: /tmp/workspace-2/ (500MB on disk)
├── ...
└── Agent 100: /tmp/workspace-100/ (500MB on disk)

Total: 50GB disk space
Coordination: Filesystem locks, merge conflicts
Cleanup: Delete 100 directories
```

### With Virtual Working Copies
```
100 agents working simultaneously:
├── Agent 1: session_1 (5MB in RAM - diffs only)
├── Agent 2: session_2 (5MB in RAM - diffs only)
├── ...
└── Agent 100: session_100 (5MB in RAM - diffs only)

Total: 500MB RAM (100× smaller!)
Coordination: Zero (isolated memory sessions)
Cleanup: Free memory (instant)
```

## Not Like Git Stashes

| Feature | Git Stash | Virtual Working Copy |
|---------|-----------|---------------------|
| Storage location | `.git/` on disk | Process memory |
| Requires working copy | Yes | No |
| Purpose | Temporary storage for humans | Execution environment for agents |
| Scalability | One per developer | Thousands per system |
| Isolation | None (shared working copy) | Complete (separate memory space) |

## The Database Analogy

**Git is like editing database files directly:**
```
Edit users.db file → Database reads file → Computes changes
```

**Atomic sessions are like SQL:**
```sql
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
-- The SQL statement IS the change description
-- No need to materialize rows in files first
```

Similarly, session API calls **are** the change description:
```python
session.write_file("users.rs", content)  # Like SQL INSERT
# The API call IS the transformation
# No need to materialize files on disk first
```

## Memory Efficiency

### What's NOT Stored
- ❌ Full file contents for all files
- ❌ Complete working copy tree
- ❌ Unchanged files

### What IS Stored
- ✅ Diffs (hunks) only
- ✅ Files that were actually modified
- ✅ Lazy-loaded pristine state (only when needed)

**Example:**
- Repository: 10,000 files, 500MB total
- Agent modifies: 50 files, adds 1000 lines
- Session memory: ~5MB (just the diffs!)

## Lazy Loading

Sessions load pristine state **on demand**:

```python
# Create session - loads NOTHING
session = atomic.session.create()

# Read file - loads ONLY this file's pristine state
config = session.read_file("config.toml")  # ~10KB loaded

# Write new file - NO pristine needed
session.write_file("feature.rs", code)  # 0KB pristine loaded

# Write to 50 files - loads ONLY those 50 files' pristine
for file in changes:
    session.write_file(file.path, file.content)  # ~500KB total loaded

# Commit - memory usage minimal throughout
session.commit()
```

## Real-World Example: Kira Spec

### Scenario
Generate 1000 lines of code across 50 files

### Git Approach
```python
# Must materialize full working copy
os.makedirs("agent-workspace-12345")
for file in spec_output:
    write_file(f"workspace/{file.path}", file.content)  # 💾 50 disk writes

git.add("*")  # 💾 Git reads all 50 files back
git.commit()  # Creates commit from computed diffs

shutil.rmtree("agent-workspace-12345")  # Cleanup

# Total disk I/O: 100+ operations
# Disk space during: ~20MB
```

### Session Approach
```python
# No working copy needed
session = atomic.session.create()  # 🧠 0KB memory

for file in spec_output:
    # Loads pristine (if exists), computes diff, stores hunk
    session.write_file(file.path, file.content)  # 🧠 ~5MB memory total

session.commit()  # 💾 ONE disk write (change file)

# Total disk I/O: 1 operation
# Memory during: ~5MB
```

**Benefit:** 100× less I/O, 4× less memory, instant cleanup

## When to Use Virtual Working Copies

### ✅ Perfect For
- Headless agents (CI bots, code generators)
- Multi-agent swarms (100+ agents in parallel)
- Spec executors (Kira, automated refactoring)
- Memory-constrained environments
- High-throughput change generation

### ⚠️ Less Relevant For
- IDE-based agents (already have working copy)
- Single human developer workflows
- Interactive file editing

## Key Takeaway

Virtual working copies make Atomic the first VCS where **changes are first-class operations**, not artifacts computed from file diffs. This enables AI agents to work at unprecedented scale without the filesystem bottlenecks of traditional VCS.

**The paradigm shift:**
- **Git**: Files → Diffs → Commits (state-based)
- **Atomic**: Operations → Changes (transformation-based)

Sessions let agents speak the transformation language natively, without the overhead of state materialization.

---

## For Investors

Virtual working copies represent a fundamental architectural innovation that enables:

1. **100× Cost Reduction**: 100 agents require 500MB RAM vs 50GB disk space (Git approach)
2. **Massive Scalability**: Support 1000+ concurrent AI agents on commodity hardware
3. **Zero Coordination Overhead**: Each session isolated in memory, no filesystem conflicts
4. **Instant Provisioning/Cleanup**: Memory allocation/deallocation vs directory creation/deletion

This is not an incremental improvement—it's the infrastructure for AI-native development at scale. As AI-generated code becomes the majority of code written, traditional VCS becomes the bottleneck. Virtual working copies eliminate that bottleneck.

**Market Impact**: Every AI coding platform (GitHub Copilot, Cursor, Devin, etc.) currently fights the filesystem coordination problem. Virtual working copies make that problem obsolete.