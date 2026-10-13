---
sidebar_position: 2
title: "The Graph Model: Soft Deletes & AI Attribution"
description: "Understanding how Atomic's graph model enables perfect attribution tracking through soft deletes"
keywords: [atomic, graph model, vertices, edges, soft delete, AI attribution, provenance, CRDT]
---

# The Graph Model Explained

*How Atomic tracks every change—and why nothing is ever truly deleted*

---

## Understanding the Numbers

When you use Atomic, you'll see output like this:

```bash
$ atomic record -m "initial"
[dev 1/XWMUEDIX] initial
 1 file changed, +3 vertices, ~0 edges, 21 bytes

$ atomic record -m "edit file"  
[dev 2/YRFGB3CG] edit file
 1 file changed, +1 vertices, ~1 edges, 30 bytes
```

What do `+3 vertices` and `~1 edges` mean? Why does creating a file use 3 vertices, but editing it only uses 1?

This guide explains Atomic's graph model in plain terms—and reveals why this design is revolutionary for tracking AI-generated code.

---

## How Atomic Stores Your Files

Unlike Git (which stores snapshots), Atomic stores your files as a **directed graph**:

- **Vertices** = chunks of content (pieces of text)
- **Edges** = connections showing the order of content

Think of it like a chain of puzzle pieces, where each piece is some text and the connections tell you what order to read them in.

---

## FileAdd: Creating a New File (+3 vertices)

When you create a file called `hello.txt` with content `Hello World`, Atomic creates **3 vertices**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    FileAdd: 3 Vertices Created                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ROOT (virtual)                                                        │
│      │                                                                  │
│      ▼                                                                  │
│   ┌─────────────────┐                                                   │
│   │ NAME VERTEX     │  ◄── "hello.txt" (the filename)                   │
│   │ "hello.txt"     │      Lives in the parent directory                │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ INODE VERTEX    │  ◄── Empty marker (like a file's ID card)         │
│   │ (empty)         │      Survives renames, identifies the file        │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ CONTENT VERTEX  │  ◄── "Hello World" (actual file content)          │
│   │ "Hello World"   │                                                   │
│   └─────────────────┘                                                   │
│                                                                         │
│   Stats: +3 vertices, ~0 edges                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why 3 vertices?

| Vertex | Purpose |
|--------|---------|
| **Name vertex** | The filename, stored in the parent directory's graph |
| **Inode vertex** | An empty marker that identifies this file (survives renames) |
| **Content vertex** | The actual text content |

---

## Edit/Replacement: Modifying a File (+1 vertex, ~1 edge)

Now let's say you change `Hello World` to `Hello Universe`.

**Old approach (full replacement):** Delete everything, recreate 3 new vertices. Wasteful!

**Atomic's approach (Edit/Replacement):** Only change what's different:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Replacement: 1 Vertex + 1 Edge                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   BEFORE:                           AFTER:                              │
│                                                                         │
│   ┌─────────────────┐               ┌─────────────────┐                 │
│   │ NAME VERTEX     │               │ NAME VERTEX     │  (unchanged)    │
│   │ "hello.txt"     │               │ "hello.txt"     │                 │
│   └────────┬────────┘               └────────┬────────┘                 │
│            │                                 │                          │
│            ▼                                 ▼                          │
│   ┌─────────────────┐               ┌─────────────────┐                 │
│   │ INODE VERTEX    │               │ INODE VERTEX    │  (unchanged)    │
│   └────────┬────────┘               └────────┬────────┘                 │
│            │                                 │                          │
│            ▼                                 ▼                          │
│   ┌─────────────────┐               ┌─────────────────┐                 │
│   │ "Hello World"   │──────────────►│ "Hello World"   │  DELETED        │
│   │                 │   mark as     │ ╳╳╳╳╳╳╳╳╳╳╳╳╳   │  (edge mod)     │
│   └─────────────────┘   deleted     └────────┬────────┘                 │
│                                              │                          │
│                                              ▼                          │
│                                     ┌─────────────────┐                 │
│                                     │ "Hello Universe"│  NEW VERTEX     │
│                                     │                 │  (+1 vertex)    │
│                                     └─────────────────┘                 │
│                                                                         │
│   Stats: +1 vertices (new content), ~1 edges (mark old as deleted)      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why +1 vertex, ~1 edge?

| Operation | What it means |
|-----------|---------------|
| **+1 vertex** | The new content "Hello Universe" is a new chunk |
| **~1 edge** | We modified an edge to mark "Hello World" as deleted |

:::tip Key Insight
The old content isn't erased—it's marked with a DELETED flag on its edge. The vertex still exists in the graph!
:::

---

## The Diff Algorithm's Role

The diff algorithm (Myers or Patience) compares old vs new content and tells us:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Diff Algorithm Output                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Old Content:          New Content:          Diff Operations:          │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐  │
│   │ line1        │      │ line1        │      │ KEEP   line1         │  │
│   │ line2        │  vs  │ MODIFIED     │  =>  │ DELETE line2         │  │
│   │ line3        │      │ line3        │      │ INSERT MODIFIED      │  │
│   └──────────────┘      └──────────────┘      │ KEEP   line3         │  │
│                                               └──────────────────────┘  │
│                                                                         │
│   DELETE = mark existing vertex's edge as DELETED (~1 edge)             │
│   INSERT = create new vertex for new content (+1 vertex)                │
│   KEEP   = do nothing, content already exists in graph                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Operation Stats

| Operation | Vertices Added | Edges Modified | Why |
|-----------|---------------|----------------|-----|
| **FileAdd** (new file) | +3 | ~0 | Name + Inode + Content |
| **Edit** (insert only) | +1 | ~0 | Just new content chunk |
| **Edit** (delete only) | +0 | ~1 | Mark old content as deleted |
| **Replacement** (change) | +1 | ~1 | New content + mark old as deleted |
| **FileDel** (delete file) | +0 | ~1+ | Mark file edges as deleted |
| **FileMove** (rename) | +1 | ~1 | New name vertex + delete old name edge |

---

## Soft Deletes: The Key to Everything

Here's the crucial insight: **content is never truly deleted in Atomic**.

When you "delete" something, we just mark an edge with a `DELETED` flag. The original vertex—and all its metadata—remains in the graph forever.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Soft Delete Preserves History                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Git Model (Hard Delete):          Atomic Model (Soft Delete):         │
│                                                                         │
│   ┌──────────────┐                  ┌──────────────┐                    │
│   │ "old code"   │                  │ "old code"   │                    │
│   │ by: Alice    │  ──► GONE!       │ by: Alice    │  ──► STILL HERE!   │
│   │ AI: Claude   │                  │ AI: Claude   │      (just hidden) │
│   └──────────────┘                  └──────┬───────┘                    │
│                                            │ DELETED flag               │
│                                            ▼                            │
│                                     ┌──────────────┐                    │
│                                     │ "new code"   │                    │
│                                     │ by: Bob      │                    │
│                                     │ AI: none     │                    │
│                                     └──────────────┘                    │
│                                                                         │
│   In Git: You lose Alice's         In Atomic: Alice's attribution      │
│   attribution when Bob rewrites    is preserved. We know the NEW       │
│   the code.                        code replaced HER code.             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Why This Matters: AI Attribution

This graph model is **revolutionary for tracking AI-generated code**.

### The Problem with Git

In Git, when someone rewrites AI-generated code, you lose the original attribution:

```bash
# Alice uses Claude to generate auth code
git commit -m "Add authentication (AI-generated)"

# Bob rewrites it for security
git commit -m "Fix security issue in auth"

# Now: WHO originally wrote the auth logic? 
# Git says: Bob. The AI attribution is buried in history.
```

### The Atomic Solution

Every vertex carries its full provenance—forever:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI Provenance Through Edits                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Change #1: AI generates function                                      │
│   ┌─────────────────────────────────────────┐                          │
│   │ Vertex: "function authenticate() {..."  │                          │
│   │ Author: Alice                           │                          │
│   │ Provenance:                             │                          │
│   │   - AI: Claude Opus 4                   │                          │
│   │   - Type: code_generation               │                          │
│   │   - Tokens: 1,247                       │                          │
│   │   - Cost: $0.03                         │                          │
│   └─────────────────────────────────────────┘                          │
│                        │                                                │
│                        │ Change #2: Human fixes a bug                   │
│                        │ (Replacement: ~1 edge, +1 vertex)              │
│                        ▼                                                │
│   ┌─────────────────────────────────────────┐                          │
│   │ Vertex: "function authenticate() {..."  │  ◄── DELETED but         │
│   │ Author: Alice                           │      PRESERVED!          │
│   │ Provenance: Claude Opus 4               │                          │
│   └─────────────────────────────────────────┘                          │
│                        │                                                │
│                        ▼                                                │
│   ┌─────────────────────────────────────────┐                          │
│   │ Vertex: "function authenticate() {..."  │  ◄── New vertex          │
│   │ Author: Bob                             │      Human edit          │
│   │ Provenance: none (human-written)        │                          │
│   │ REPLACES: [points to Alice's vertex]    │  ◄── Link to original!   │
│   └─────────────────────────────────────────┘                          │
│                                                                         │
│   We can ALWAYS trace back:                                            │
│   "This code was originally AI-generated by Claude for Alice,          │
│    then modified by Bob (human) to fix a bug"                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What Metadata is Preserved?

Every vertex in Atomic carries rich metadata:

```text
Vertex {
  content: "function validate(input) { ... }",
  change_hash: "ABC123...",
  author: "Alice <alice@company.com>",
  timestamp: "2024-01-25T10:30:00Z",
  provenance: Some(Provenance {
    vendor: Anthropic,
    model: "claude-opus-4",
    tool: Cursor,
    suggestion_type: CodeGeneration,
    tokens: TokenUsage { input: 500, output: 747 },
    cost: Cost { amount: 0.03, currency: USD },
    session_id: "sess_abc123",
  }),
}
```

This metadata travels with the vertex **forever**—even when "deleted", the vertex exists and can be queried.

---

## Unrecord: Undo Without Losing History

In Git, undoing a commit either:
- `git revert` — Creates a new commit that undoes changes (loses context)
- `git reset` — Erases commits entirely (loses everything)

In Atomic, **Unrecord** preserves everything:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Unrecord: Undo Without Losing History                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Original State:        After Bad Change:      After Unrecord:         │
│                                                                         │
│   ┌─────────┐            ┌─────────┐            ┌─────────┐             │
│   │ "good"  │            │ "good"  │ DELETED    │ "good"  │ ALIVE       │
│   │ AI:opus │            │ AI:opus │            │ AI:opus │             │
│   └─────────┘            └────┬────┘            └─────────┘             │
│                               │                                         │
│                               ▼                                         │
│                          ┌─────────┐            ┌─────────┐             │
│                          │ "bad"   │            │ "bad"   │ DELETED     │
│                          │ AI:none │            │ AI:none │ (unrecorded)│
│                          └─────────┘            └─────────┘             │
│                                                                         │
│   The "good" vertex with AI attribution is RESURRECTED.                │
│   The "bad" vertex is now marked as deleted.                           │
│   ALL METADATA IS PRESERVED - nothing is ever lost!                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Credit Command: Who Wrote What?

The graph model enables powerful attribution queries:

```bash
$ atomic credit src/auth.rs

Lines 1-50:   Alice (human)           - original implementation
Lines 51-80:  Claude Opus 4 (AI)      - generated for Bob
Lines 81-95:  Carol (human)           - bug fix
Lines 96-120: Claude Opus 4 (AI)      - generated for Bob
              └── modified by Dave (human) - security review

AI Summary:
- 45% of current code has AI provenance
- Original AI cost: $0.12 (2,847 tokens)
- AI code modified 2x by humans
```

This is only possible because we **never delete the original vertices**.

---

## CRDT Properties: Why Order Doesn't Matter

The graph model gives Atomic **CRDT-like** merge properties:

1. **Vertices are immutable** — Once created, content never changes (we just add new vertices)
2. **Deletions are markers** — Old content isn't erased, just flagged (can be resurrected!)
3. **Order is flexible** — Edges define order, and independent changes merge automatically

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Why This Enables Clean Merges                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Alice's change:                 Bob's change:                         │
│   Edit line 2                     Edit line 5                           │
│   +1 vertex, ~1 edge              +1 vertex, ~1 edge                    │
│         │                               │                               │
│         └───────────┬───────────────────┘                               │
│                     │                                                   │
│                     ▼                                                   │
│              Merge Result:                                              │
│              Both changes apply cleanly!                                │
│              +2 vertices, ~2 edges                                      │
│                                                                         │
│   Because the vertices don't overlap, there's no conflict.              │
│   Each change adds its own vertex and modifies its own edge.            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Git vs Atomic

| Feature | Git | Atomic |
|---------|-----|--------|
| Delete old content | Erased from current tree | Soft-deleted (edge flag) |
| Original metadata | Lost on rewrite | Preserved forever |
| AI attribution | Only in commit message | In every vertex |
| Undo (unrecord) | Reverts lose context | Resurrects original |
| Audit trail | Commit history only | Complete graph traversal |
| Legal compliance | Manual tracking | Built into the model |

---

## Try It: See the Graph in Action

```bash
# Create a repository
atomic init my-project && cd my-project

# Create and record a file
echo "Hello World" > hello.txt
atomic add hello.txt
atomic record -m "Add hello"
# Output: +3 vertices, ~0 edges

# Edit the file
echo "Hello Universe" > hello.txt
atomic record -m "Edit hello"
# Output: +1 vertices, ~1 edges

# See what's in the change
atomic change
# Shows: ± hello.txt (+1 vertex, ~1 edge: replace)
```

---

## Summary

:::info The Graph Model in One Sentence
**Atomic stores your code as a graph of immutable vertices connected by edges—"deleting" content just marks edges as deleted, preserving all metadata forever.**
:::

This isn't just a technical detail—it's what makes Atomic the **system of record for AI-assisted development**:

- ✅ **Legal compliance**: Always prove what was AI-generated
- ✅ **Audit trail**: Complete history of human vs AI contributions
- ✅ **Cost tracking**: AI token usage preserved even after rewrites
- ✅ **Credit/blame**: Know who introduced what, even after refactoring

The Replacement model (`+1 vertex, ~1 edge`) is fundamental to Atomic's value proposition. By keeping old content instead of erasing it, every piece of code maintains its complete lineage.

---

<div style={{textAlign: 'center', marginTop: '2rem'}}>

**Learn More**

[The Lego Story: Visual Analogy →](/concepts/the-lego-story)

[Hunks: Technical Deep Dive →](/concepts/hunks-edit-replacement)

[Change Identity →](/concepts/change-identity)

</div>
