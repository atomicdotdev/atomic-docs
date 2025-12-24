---
sidebar_position: 4
title: AI Agent Workflows
---

# AI Agent Workflows with Atomic

Learn how Atomic's architecture supports AI agent workflows, from IDE-based assistants to orchestrated agent swarms, with full change traceability and attribution.

## Overview

Atomic provides a mathematically sound foundation for AI-assisted development. Its patch-based model, change identity preservation, and commutative merge semantics make it ideal for tracking and integrating AI contributions.  This could be from a single IDE assistant or coordinated agent teams.

### Key Benefits for AI Workflows

- ✅ **Change Identity**: Same change = same hash everywhere (unlike Git)
- ✅ **Commutative Merges**: Independent changes merge in any order with identical results
- ✅ **AI Attribution**: Cryptographic tracking of every AI contribution
- ✅ **Explicit Dependencies**: Dependency graph ensures correct application order
- ✅ **Full Traceability**: Link changes back to conversations, specs, and agent sessions

## Understanding Agent Types

Different AI agents have different integration patterns with version control:

| Agent Type | Examples | How They Work | Working Copy |
|------------|----------|---------------|--------------|
| **IDE Assistants** | Copilot, Cursor, Claude Code, Windsurf | Run inside editor, edit files directly | Uses IDE's open project |
| **Spec-Driven Agents** | Kiro, Devin, OpenHands | Follow specifications, make coordinated changes | Typically one project directory |
| **Headless Agents** | CI bots, refactoring tools, code generators | Run programmatically without UI | Can work without filesystem |
| **Agent Swarms** | Orchestrated multi-agent systems | Multiple agents coordinated by controller | Need isolation strategy |

## IDE Agent Workflows (Today)

Most developers interact with AI through IDE-integrated assistants. These agents work within your existing project directory and Atomic workflow.

### Basic Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Your IDE                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  AI Assistant (Copilot/Cursor/Claude Code)      │    │
│  │  • Suggests code completions                     │    │
│  │  • Generates functions/files                     │    │
│  │  • Refactors existing code                       │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Working Copy (your project directory)           │    │
│  │  • Files modified by AI assistant                │    │
│  │  • Same files you edit manually                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  atomic record        │
              │  --ai-assisted        │
              │  --ai-provider "..."  │
              │  --ai-model "..."     │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Atomic Change        │
              │  (with AI attribution)│
              └───────────────────────┘
```

### Recording AI-Assisted Changes

**Integrated IDE Approach (Recommended)**

IDEs can implement session-based provenance tracking. An [experimental reference implementation](#reference-implementation-experimental-fork) demonstrates this pattern with a `/record` command:

```bash
# In an IDE with session tracking, after AI has made changes:
/record dev

# Records to the "dev" stack with full AI attribution extracted from session:
# • Provider and model from conversation
# • Confidence calculated from tool success rate
# • Suggestion type derived from tool usage patterns
# • Token count from session tracking
# • Files detected from edit/write tool calls
```

See the [Experimental Reference Implementation](#reference-implementation-experimental-fork) section in the RFC below for details on how this works.

**Manual Approach**

When not using an integrated IDE, specify attribution flags manually:

```bash
# After AI assistant helps you write code
atomic record \
  --ai-assisted \
  --ai-provider "anthropic" \
  --ai-model "claude-sonnet-4-20250514" \
  --ai-confidence 0.95 \
  --ai-suggestion-type collaborative \
  -m "Implement authentication with AI assistance"
```

### Attribution Flags

| Flag | Description | Example Values |
|------|-------------|----------------|
| `--ai-assisted` | Mark change as AI-assisted | (flag, no value) |
| `--ai-provider` | AI service provider | `anthropic`, `openai`, `github` |
| `--ai-model` | Specific model used | `claude-sonnet-4-20250514`, `gpt-4`, `copilot` |
| `--ai-confidence` | Confidence score (0.0-1.0) | `0.95` |
| `--ai-suggestion-type` | Type of AI contribution | `complete`, `partial`, `collaborative`, `review` |

### Viewing AI Attribution

```bash
# View change log with AI metadata
atomic log
# Output shows AI provider, model, and confidence for each change

# Query AI contribution statistics
atomic attribution
# Shows breakdown by provider, model, and contribution type
```

## Fundamental Differences from Git

### Change Identity

**Git**: Same logical change = different hashes in different contexts

```bash
# Git branch-a
git commit -m "Add feature"
# SHA: abc123def456

# Git branch-b (same change)
git commit -m "Add feature"  
# SHA: 789ghi012jkl  ← DIFFERENT HASH!

# Cherry-pick creates yet another hash
git cherry-pick abc123
# SHA: mno345pqr678  ← THIRD HASH for same change!
```

**Atomic**: Same change = same hash everywhere

```bash
# Record a change
atomic record -m "Add feature"
# Hash: MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Apply to any stack - SAME HASH
atomic apply MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# The change object is identical everywhere
```

### Commutative Merges

When changes are independent, merge order doesn't affect the result:

```
Agent A creates change X (modifies src/auth.rs)
Agent B creates change Y (modifies src/api.rs)

Apply X then Y  →  Result R
Apply Y then X  →  Result R  ← IDENTICAL!
```

This mathematical property is crucial for AI workflows because:
- Multiple agents' work can be integrated in any order
- Results are deterministic and reproducible
- No artificial ordering constraints

---

## RFC: Agent Sessions (Coming Soon) {#agent-sessions-rfc}

:::tip Proposed Feature
The following describes a proposed feature for enhanced AI agent integration. This is under active development and the API may change.

**Update January 2025**: This section has been significantly expanded to clarify how virtual working copies work, especially for large multi-file changes like Kira specs. The key insight: sessions maintain **in-memory virtual working copies** that track only diffs, not full file copies, enabling massive agent parallelism without disk space overhead.
:::

### Motivation

**We're not building better Git stashes. We're building the first VCS designed for programmatic change creation.**

Current AI workflow tracking is **reactive**—you add attribution flags when recording changes. But this approach has fundamental limitations:

- **No connection** between AI tool conversations and the resulting changes
- **No isolation** when multiple agents work simultaneously
- **Filesystem bottlenecks** when scaling to many agents
- **Disk space explosion** when each agent needs its own working copy

**The Core Problem**: Traditional VCS assumes humans edit files on disk, then the VCS computes diffs. This model breaks down when:
- 100 agents need 100 working copies (100× disk space)
- Agents need coordination to avoid filesystem conflicts
- Spec executors generate 1000 lines across 50 files (must materialize everything to disk first)

**Agent Sessions** solve this by providing **virtual working copies** that enable:

1. **Direct Change Construction**: Agents describe transformations programmatically (like SQL for your codebase)
2. **True Isolation**: Each agent gets an in-memory workspace with zero coordination overhead
3. **Massive Parallelism**: 1000 agents = 1000 memory sessions, not 1000 disk workspaces
4. **Full Traceability**: Every change linked back to conversations, specs, and planning discussions

This makes Atomic the first VCS where the majority of changes can come from agents that construct mathematically precise change descriptions without the overhead of filesystem I/O.

### Two Integration Patterns

Agent Sessions support two distinct patterns based on agent type:

#### Pattern 1: IDE Agents (Session as Context)

For IDE-based agents, the session provides **traceability without changing how the agent works**:

```
┌─────────────────────────────────────────────────────────┐
│                        IDE                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  AI Assistant                                    │    │
│  │  conversation_id: "cursor-abc123"                │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Working Copy                                    │    │
│  │  (agent edits files normally)                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Atomic Session (context tracking)  │
        │  • session_id: "atomic-xyz"         │
        │  • tool: "cursor"                   │
        │  • tool_session_id: "cursor-abc123" │
        │  • discussion_id: "disc-456"        │
        └─────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  atomic record (with session)       │
        │  → Change includes full lineage     │
        └─────────────────────────────────────┘
```

The agent still edits files in the working copy. The session just adds metadata linking the change back to:
- The AI tool's conversation
- The planning discussion that initiated the work
- The spec or requirements being implemented

#### Pattern 2: Headless Agents (Virtual Working Copy)

For programmatic agents that don't need a UI, sessions provide a **virtual working copy in memory** instead of requiring disk-based workspaces:

```
┌─────────────────────────────────────────────────────────┐
│              Headless Agent (no IDE)                     │
│  • CI bot                                                │
│  • Automated refactoring tool                            │
│  • Kira spec executor (1000 lines, 50 files)            │
│  • Orchestrated agent in swarm                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │  Atomic Session (virtual working copy)  │
        │                                         │
        │  pristine_state: HashMap<Path, Content> │
        │  virtual_edits:  HashMap<Path, Content> │
        │  change_builder: ChangeRecord           │
        │                                         │
        │  Agent calls: write_file(path, content) │
        │  Session:                               │
        │    1. Loads pristine (from changes)     │
        │    2. Computes diff in memory           │
        │    3. Updates virtual state             │
        │    4. Builds change record              │
        └─────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Atomic Change (single record)      │
        │  • 50 files                         │
        │  • 1000 lines                       │
        │  • NO working copy ever written     │
        └─────────────────────────────────────┘
```

**Key Innovation: Sessions Are NOT Like Git Stashes**

| Aspect | Git Stashes | Atomic Sessions |
|--------|-------------|-----------------|
| **Storage** | Temporary commits in .git | In-memory change objects |
| **Requires Working Copy** | Yes - must have files on disk | No - virtual working copy |
| **What's Stored** | Diff computed from files | Change record built programmatically |
| **Isolation** | Per-developer temporary storage | Per-agent isolated workspace |
| **Scalability** | Limited by disk space | Limited by memory (much smaller) |

**The "Aha!" Moment**

Traditional VCS requires a materialized working copy:
```
Git:  Agent writes 50 files → Git reads 50 files → Computes diffs → Creates commit
      Disk I/O: 100+ operations per agent
```

Atomic sessions maintain virtual working copies:
```
Atomic: Agent calls API 50 times → Session diffs in memory → Creates change
        Disk I/O: Minimal (read pristine lazily, write change once)
```

**How It Works: Virtual Working Copy Architecture**

When a session is created, it maintains three data structures in memory:

```rust
Session {
    // Files as they exist in parent changes (loaded lazily)
    pristine_state: HashMap<Path, FileState>,
    
    // Agent's modifications (only diffs, not full files)
    virtual_edits: HashMap<Path, Vec<Edit>>,
    
    // The change record being constructed
    change_builder: ChangeRecord,
}
```

**Example: Kira Spec Generating 1000 Lines Across 50 Files**

Traditional approach (Git):
```python
# Must materialize full working copy on disk
os.makedirs("agent-workspace-12345")
for file in spec_output:
    write_file(f"agent-workspace-12345/{file.path}", file.content)
    
# Git must read files back from disk
git.add("agent-workspace-12345/*")
git.commit()

# Cleanup required
shutil.rmtree("agent-workspace-12345")
```

**Problem**: For 100 concurrent Kira agents, you need 100 workspace directories!

Session approach (Atomic):
```python
# Create virtual working copy (no disk I/O)
session = atomic.session.create(parent="abc123")

# Agent generates changes
for file in spec_output:
    # Session internally:
    # 1. Lazily loads pristine state (only if needed)
    # 2. Computes diff in memory
    # 3. Adds hunks to change record
    # 4. Updates virtual state
    session.write_file(file.path, file.content)

# Commit writes ONE change file
change_hash = session.commit()
```

**Benefit**: 100 concurrent agents = 100 session objects in memory (minimal overhead)

**Virtual File Operations Support Iteration**

Unlike simple change builders, sessions maintain state that agents can query:

```python
# Agent can read what it just wrote
session.write_file("config.toml", modified_config)

# Later in same session
current_config = session.read_file("config.toml")  # Returns virtual edit!

# Agent can also read pristine files
old_file = session.read_file("legacy.rs")  # Loads from parent changes

# Modify based on existing content
modified = agent.refactor(old_file)
session.write_file("legacy.rs", modified)
```

This enables **iterative change construction** - agents can build complex multi-file changes that reference each other, all within a single session.

**Lazy Pristine Loading**

Sessions only load files from parent changes when actually needed:

```python
# Creating session doesn't load any files
session = atomic.session.create()

# Only loads "config.toml" from pristine when needed
config = session.read_file("config.toml")

# Write to new file - no pristine needed
session.write_file("new_feature.rs", code)

# Commit - pristine only loaded for files that were read
session.record()
```

This makes sessions extremely lightweight - memory usage scales with **changes made**, not **repository size**.

**Massive Parallelism**

```
Git Model (requires working copies):
Agent 1-100: Each needs full working copy on disk
Total: 100 agents × 50 files × 20KB = 100MB+ per repository
Plus: Filesystem coordination overhead

Atomic Session Model (virtual working copies):
Agent 1-100: Each has in-memory session tracking only diffs
Total: 100 agents × diff size (significantly smaller than full files)
Plus: Zero filesystem coordination (each session isolated)
```

This enables:
- **True parallelism**: Multiple agents create changes simultaneously with zero coordination
- **Minimal overhead**: Sessions track only diffs, not full file copies
- **Instant cleanup**: Session disposal is just memory deallocation
- **Orchestration**: Controller can spawn 1000s of agents without filesystem bottlenecks

### Understanding the Mental Model

**"Why isn't this counterintuitive if changes are file-based?"**

It seems paradoxical: Atomic's change records describe file operations, yet sessions work without files. The key insight is that **change records are mathematical objects** that describe transformations, not snapshots.

**The Database Analogy**

Think of sessions like SQL transactions:

```sql
-- You don't edit database files directly
-- You construct SQL statements that describe changes

BEGIN TRANSACTION;
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
UPDATE posts SET author_id = 42 WHERE author_id = 13;
DELETE FROM comments WHERE spam = true;
COMMIT;
```

The SQL statements **are** the change description. You never materialize rows in files, edit them, then compute a diff. You construct the change description directly.

**Atomic Sessions Work the Same Way**

```python
# Git's model: Must materialize files first
write_file("users.rs", new_content)  # Disk I/O
git.add("users.rs")                  # Git reads file to compute diff
git.commit()                         # Creates commit from diff

# Atomic's model: Construct change description directly  
session = atomic.session.create()
session.write_file("users.rs", new_content)  # Computes diff in memory
session.record()                             # Writes change record
```

**What's Actually Stored**

A session's "virtual working copy" isn't storing full file copies:

```rust
// NOT this (would be huge):
virtual_state: HashMap<Path, String>  // Full file contents

// But this (small):
virtual_edits: HashMap<Path, Vec<Hunk>>  // Only the diffs
```

When an agent writes a file, the session:
1. Loads the pristine state (what the file looks like in parent changes)
2. Computes the diff (what changed)
3. Stores only the diff hunks
4. Disposes of both pristine and new content (keeps only diffs)

**Why This Works**

Atomic's change model is fundamentally about **transformations**, not **states**:

- **Git**: Stores states (tree snapshots), computes transformations (diffs) for display
- **Atomic**: Stores transformations (change records), computes states (working copy) when needed

Sessions leverage this by constructing transformations directly, skipping the intermediate state materialization that Git requires.

**The Win for AI Agents**

AI agents naturally think in transformations:
- "Add this function"
- "Refactor this class"  
- "Update these imports"

With sessions, agents express changes in their native language (operations) rather than being forced through Git's model (write files → compute diffs → create commits).

### Proposed API

#### Session Lifecycle

```yaml
# Create a session
POST /api/v1/sessions
  Request:
    stack: string           # Target stack for changes
    base_ref: string        # Base state ("main", merkle hash, etc.)
    tool: string            # "cursor" | "kiro" | "copilot" | "ci-bot" | etc.
    tool_session_id: string # The tool's conversation/session ID
    discussion_id?: string  # Link to planning discussion (optional)
    metadata?: object       # Tool-specific context
  Response:
    session_id: string
    base_state: string      # Merkle hash of base
    expires_at: timestamp

# Get session status
GET /api/v1/sessions/{id}
  Response:
    session_id, stack, base_state, tool,
    pending_operations: [], created_at, expires_at

# Abort session
DELETE /api/v1/sessions/{id}
```

#### File Operations (Headless Agents Only)

```yaml
# Read file content from stack
GET /api/v1/sessions/{id}/files/{path}
  Response:
    content: string | base64
    permissions: int
    exists: bool

# Buffer a file write
PUT /api/v1/sessions/{id}/files/{path}
  Request:
    content: string | base64
    permissions?: int

# Mark file for deletion  
DELETE /api/v1/sessions/{id}/files/{path}
```

#### Record Session

```yaml
# Create Atomic change from session
POST /api/v1/sessions/{id}/record
  Request:
    message: string
    description?: string
    author?: string
    ai_attribution:
      provider: string
      model: string
      confidence?: float
      suggestion_type?: string
  Response:
    change_hash: string
    merkle: string
    files_changed: int
```

### Example: IDE Agent with Session Context

An [experimental reference implementation](#reference-implementation-experimental-fork) demonstrates this pattern. Here's how it works:

```
┌─────────────────────────────────────────────────────────┐
│                    OpenCode TUI                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  AI Conversation Session                         │    │
│  │  • Provider: anthropic                           │    │
│  │  • Model: claude-sonnet-4-20250514               │    │
│  │  • Tool calls: edit, bash, read                  │    │
│  │  • Token usage tracked                           │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  /record dev                                     │    │
│  │  Extracts provenance from session automatically  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Atomic Change        │
              │  Stack: dev           │
              │  AI Attribution:      │
              │  • provider           │
              │  • model              │
              │  • confidence         │
              │  • suggestion_type    │
              │  • token_count        │
              └───────────────────────┘
```

**Using the `/record` command in OpenCode:**

```bash
# While in an OpenCode session, after AI has made changes:
/record dev

# This automatically:
# 1. Detects modified files from the session's tool calls
# 2. Extracts AI provenance (provider, model, tokens, confidence)
# 3. Records changes to the "dev" stack with full attribution
```

**What gets captured:**

| Metadata | Source | Example |
|----------|--------|---------|
| Provider | Session model config | `anthropic` |
| Model | Session model config | `claude-sonnet-4-20250514` |
| Suggestion Type | Derived from tool usage | `complete`, `collaborative` |
| Confidence | Calculated from tool success rate | `0.95` |
| Token Count | Session token tracking | `1500` |
| Files Changed | Tool call analysis | `src/auth.rs`, `src/api.rs` |

**Environment variables passed to Atomic:**

```bash
# The /record command sets these automatically from session context:
ATOMIC_AI_ENABLED=true
ATOMIC_AI_PROVIDER=anthropic
ATOMIC_AI_MODEL=claude-sonnet-4-20250514
ATOMIC_AI_SUGGESTION_TYPE=collaborative
ATOMIC_AI_CONFIDENCE=0.95
ATOMIC_AI_TOKEN_COUNT=1500
```

**Manual recording (fallback):**

```bash
# If not using an integrated IDE, you can still record manually:
atomic record \
  --ai-assisted \
  --ai-provider "anthropic" \
  --ai-model "claude-sonnet-4-20250514" \
  -m "Implement authentication"
```

The key difference with IDE integration is that provenance is **automatically extracted** from the session context rather than manually specified.

### Example: Headless Agent Swarm

```bash
#!/bin/bash
# Orchestrator spawns multiple headless agents

# Agent 1: Authentication work
SESSION_1=$(curl -X POST /api/v1/sessions \
  -d '{"stack": "auth-work", "base_ref": "main", "tool": "refactor-bot"}' \
  | jq -r '.session_id')

# Agent 2: API work (concurrent!)
SESSION_2=$(curl -X POST /api/v1/sessions \
  -d '{"stack": "api-work", "base_ref": "main", "tool": "refactor-bot"}' \
  | jq -r '.session_id')

# Agent 3: Database work (concurrent!)
SESSION_3=$(curl -X POST /api/v1/sessions \
  -d '{"stack": "db-work", "base_ref": "main", "tool": "refactor-bot"}' \
  | jq -r '.session_id')

# All three work in parallel - no filesystem contention!

# Agent 1 reads and writes via API
curl -X GET /api/v1/sessions/$SESSION_1/files/src/auth/login.rs
curl -X PUT /api/v1/sessions/$SESSION_1/files/src/auth/login.rs \
  -d '{"content": "pub fn login() { /* new impl */ }"}'

# Agent 2 works concurrently
curl -X PUT /api/v1/sessions/$SESSION_2/files/src/api/handlers.rs \
  -d '{"content": "pub async fn handle() { /* new impl */ }"}'

# Agent 3 works concurrently  
curl -X PUT /api/v1/sessions/$SESSION_3/files/src/db/models.rs \
  -d '{"content": "pub struct User { /* new impl */ }"}'

# All agents commit - creates Atomic changes
curl -X POST /api/v1/sessions/$SESSION_1/commit \
  -d '{"message": "Refactor auth", "ai_attribution": {"provider": "internal", "model": "refactor-bot-v1"}}'

curl -X POST /api/v1/sessions/$SESSION_2/commit \
  -d '{"message": "Refactor API", "ai_attribution": {"provider": "internal", "model": "refactor-bot-v1"}}'

curl -X POST /api/v1/sessions/$SESSION_3/commit \
  -d '{"message": "Refactor DB", "ai_attribution": {"provider": "internal", "model": "refactor-bot-v1"}}'

# Merge all work to main (order doesn't matter - commutative!)
atomic apply <auth-change-hash>
atomic apply <api-change-hash>
atomic apply <db-change-hash>
```

### Change Lineage

Every change created via Agent Sessions includes full traceability:

```
Change: MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
├── Author: Claude (via Cursor)
├── Atomic Session: session-xyz789
├── Tool: cursor
├── Tool Session: cursor-conversation-abc123
├── Discussion: disc-implement-auth
├── Stack: main
├── Base: main@XYZABC...
├── Files Changed:
│   ├── src/auth/login.rs
│   └── src/auth/hash.rs
└── AI Attribution:
    ├── provider: anthropic
    ├── model: claude-sonnet-4-20250514
    ├── confidence: 0.92
    └── suggestion_type: collaborative
```

This enables:
- **Audit trails**: Track exactly which AI conversation produced which code
- **Discussion linking**: Connect changes back to planning/requirements
- **Tool analytics**: Understand which tools/models are most effective
- **Compliance**: Document AI involvement for regulatory requirements

### Scalability: Headless Agents

| Approach | 10 Agents | 50 Agents | 100 Agents | 1000 Agents |
|----------|-----------|-----------|------------|-------------|
| Git Worktrees | 10× repo size | 50× repo size | 100× repo size | 1000× repo size |
| Atomic Clones | 10× repo size | 50× repo size | 100× repo size | 1000× repo size |
| **Agent Sessions (virtual working copy)** | **1× repo + 10× diff memory** | **1× repo + 50× diff memory** | **1× repo + 100× diff memory** | **1× repo + 1000× diff memory** |

Headless agents using virtual working copies require **zero additional disk space** - only memory for diffs. Since diffs are typically 10-100× smaller than full working copies, this enables massive parallelism.

**Real Numbers Example:**
- Git approach: 100 agents × 500MB working copy = 50GB disk space
- Session approach: 100 agents × 5MB diff memory = 500MB RAM (100× reduction)

### Real-Time Conflict Detection

For headless agents working on the same stack, the session engine can detect conflicts before commit:

```yaml
GET /api/v1/sessions/{id}/conflicts
Response:
  conflicts:
    - file: src/auth.rs
      lines: 15-20
      other_session: session-abc
      severity: warning
      message: "Session abc is also modifying lines 10-25"
```

This allows orchestrators to:
- Detect conflicts early
- Reassign work to avoid overlap
- Serialize conflicting operations

### Integration with Agentic Discussions

Agent Sessions connect to the [Agentic Agile Discussions](../AGENTIC-AGILE-DISCUSSIONS) planning system:

```yaml
POST /api/v1/sessions
  {
    "stack": "feature-work",
    "base_ref": "main",
    "tool": "kiro",
    "tool_session_id": "kiro-spec-456",
    "discussion_id": "disc-789"
  }
```

When the session commits, the change is automatically linked to the discussion, providing full traceability from planning conversation → AI tool conversation → landed code.

### Implementation Status

| Component | Status |
|-----------|--------|
| API Design | 📝 RFC (this document) |
| Session Storage | 🔜 Planned |
| IDE Integration (context tracking) | 🧪 Experimental Reference Implementation |
| Virtual File Operations (headless) | 🔜 Planned |
| Conflict Detection | 🔜 Planned |
| Discussion Integration | 🔜 Planned |

### Reference Implementation: Experimental Fork

:::info Proof of Concept
This is an experimental fork demonstrating the feasibility of the RFC. It is not part of any production IDE and serves as a reference for implementers.
:::

An experimental implementation was built as a fork of [OpenCode](https://opencode.ai) to prove the RFC's viability. This reference implementation demonstrates IDE agent session tracking:

**Command:** `/record <stack>`

**How it works:**
1. OpenCode maintains an active AI conversation session with full context:
   - Provider and model being used
   - Tool calls executed (edit, bash, read, etc.)
   - Token usage and costs
   - Success/failure rates
2. When user types `/record dev`, OpenCode:
   - Extracts provenance metadata from the session
   - Detects modified files from tool call history
   - Calculates confidence score from tool success rates
   - Determines suggestion type from tool usage patterns
   - Sets environment variables for Atomic CLI
   - Executes `atomic record` with full attribution
3. The resulting Atomic change includes complete AI provenance

**Example Session Flow:**

```
User: "Implement user authentication"
AI: <uses edit tool to modify src/auth.rs>
AI: <uses write tool to create src/auth/login.rs>
AI: <uses bash tool to run tests>

User: /record dev

OpenCode automatically:
├── Extracts: provider=anthropic, model=claude-sonnet-4-20250514
├── Detects: src/auth.rs, src/auth/login.rs
├── Calculates: confidence=0.95 (all tools succeeded)
├── Determines: suggestion_type=collaborative
└── Records to "dev" stack with full attribution
```

**Environment Variables Set:**

```bash
ATOMIC_AI_ENABLED=true
ATOMIC_AI_PROVIDER=anthropic
ATOMIC_AI_MODEL=claude-sonnet-4-20250514
ATOMIC_AI_SUGGESTION_TYPE=collaborative
ATOMIC_AI_CONFIDENCE=0.95
ATOMIC_AI_TOKEN_COUNT=1500
ATOMIC_AI_PROMPT_HASH=<sha256>
```

**Key Design Decisions:**

1. **Session as Source of Truth**: All provenance comes from the active session, not manual flags
2. **Stack Targeting**: `/record <stack>` allows targeting different development branches
3. **Automatic File Detection**: No need to specify files - extracted from tool calls
4. **Confidence Calculation**: Based on actual tool execution outcomes, not estimates
5. **Non-Intrusive**: AI continues to work normally; provenance is captured passively

**For IDE Developers:**

This experimental implementation proves the pattern is feasible and can be adapted to any IDE with:
- AI conversation sessions
- File modification tracking
- Shell/process execution capability

The core requirement is maintaining session context that includes:
- Model configuration (provider/model ID)
- Tool/action history
- Success/failure metrics

**Implementation Availability:**

The experimental fork serves as a reference for implementers interested in adding similar functionality to their IDEs. It demonstrates:
- How to extract provenance from session context
- How to calculate confidence scores from tool execution results
- How to determine suggestion types from usage patterns
- How to integrate with Atomic's attribution system via environment variables

### Why This Matters

**Atomic Sessions represent a fundamental shift in how version control systems interact with AI agents.**

Traditional VCS (Git) was designed for humans who:
- Edit files in a working directory
- Run `git add/commit` to capture changes
- Work mostly sequentially, occasionally in parallel

Modern AI development involves agents that:
- Generate code programmatically without a UI
- Need to work in massive parallel swarms
- Think in transformations, not file edits
- Scale to hundreds or thousands of concurrent operations

**The Innovation: VCS as a Transformation Engine**

Sessions make Atomic the first VCS where:

1. **Changes are first-class operations**, not artifacts computed from file diffs
2. **Virtual working copies eliminate filesystem bottlenecks**, enabling 1000× agent parallelism
3. **Memory scales with changes, not repository size**, making massive agent swarms practical
4. **Agents speak their native language** (transformations), not forced through the file → diff → commit pipeline

**Real-World Impact**

| Scenario | Git Approach | Atomic Sessions Approach |
|----------|-------------|-------------------------|
| **100 agents refactoring codebase** | 100 working copies = 50GB disk | 100 sessions = 500MB RAM |
| **Kira spec: 1000 lines, 50 files** | Write files → read files → diff → commit | Construct change directly in memory |
| **Agent swarm coordination** | Filesystem locks, merge conflicts | Isolated memory sessions, conflict detection API |
| **Cleanup after agent finishes** | Delete working copy directory | Free memory (instant) |

**This is not an incremental improvement—it's a different paradigm.**

Git stashes are temporary storage for human developers. Atomic sessions are execution environments for AI agents. The difference is as fundamental as the shift from editing assembly code to writing in high-level languages.

### Feedback

We welcome feedback on this RFC:

1. Which IDE integrations should we prioritize?
2. What additional session metadata would be valuable?
3. How should conflicts be handled for headless agent swarms?
4. What orchestration patterns do you envision for multi-agent workflows?

---

## Best Practices

### 1. Always Include AI Attribution

```bash
# ✅ Good: Full metadata for audit trail
atomic record \
  --ai-assisted \
  --ai-provider "openai" \
  --ai-model "gpt-4-turbo" \
  --ai-confidence 0.95 \
  -m "Implement feature"

# ❌ Bad: Missing attribution
atomic record -m "Implement feature"
```

### 2. Use Descriptive Messages

```bash
# ✅ Good: Clear context
atomic record \
  --ai-assisted \
  --ai-provider "anthropic" \
  -m "Add input validation for user registration (AI-assisted refactor)"

# ❌ Bad: Vague message
atomic record --ai-assisted -m "Fix stuff"
```

### 3. Record Incrementally

```bash
# ✅ Good: Small, focused changes
atomic record --ai-assisted -m "Add login endpoint"
atomic record --ai-assisted -m "Add password hashing"
atomic record --ai-assisted -m "Add session management"

# ❌ Bad: One massive change
atomic record --ai-assisted -m "Add entire auth system"
```

### 4. Review AI-Generated Code

```bash
# Before recording, review what AI generated
atomic diff

# Then record with appropriate confidence
atomic record \
  --ai-assisted \
  --ai-confidence 0.8 \  # Lower if you made significant edits
  -m "Implement feature (AI-assisted, human-reviewed)"
```

---

## Troubleshooting

### Issue: Missing AI Attribution in History

**Cause**: Forgot `--ai-assisted` flag when recording.

**Solution**: Always include attribution flags. Consider shell aliases:

```bash
# Add to your shell profile
alias air='atomic record --ai-assisted --ai-provider'

# Usage
air anthropic --ai-model claude-sonnet-4-20250514 -m "Message"
```

### Issue: Can't Track Which Conversation Produced Code

**Cause**: No link between AI tool's conversation and Atomic changes.

**Solution (Today)**: Include conversation ID in commit message:

```bash
atomic record \
  --ai-assisted \
  -m "Implement auth [cursor-conv:abc123]"
```

**Solution (Future)**: Use Agent Sessions for automatic linking.

### Issue: Multiple People Using AI on Same Codebase

**Cause**: Need to coordinate AI-assisted work.

**Solution**: Use stacks for isolation:

```bash
# Each developer works on their own stack
atomic stack new alice-feature
atomic stack switch alice-feature

# Record AI-assisted changes
atomic record --ai-assisted -m "Alice's AI-assisted work"

# Merge to main when ready
atomic stack switch main
atomic apply <change-hash>
```

---

## Summary

Atomic provides strong foundations for AI agent workflows:

| Workflow Type | Today | With Agent Sessions (Coming Soon) |
|---------------|-------|-----------------------------------|
| **IDE Assistants** | Record with `--ai-assisted` flags | Session links conversation → change |
| **Spec-Driven Agents** | Record with attribution | Session links spec → conversation → change |
| **Headless Agents** | Need separate working directories | Virtual file ops, true parallelism |
| **Agent Swarms** | Complex orchestration | Session API enables simple coordination |

**Key Takeaways**:

- **Today**: Use `--ai-assisted` flags for attribution when recording AI-assisted changes
- **Coming Soon**: Agent Sessions will provide richer traceability and enable headless agent parallelism
- **Always**: Atomic's commutative merges ensure AI contributions integrate cleanly
- **Benefit**: Full audit trail of AI involvement in your codebase
