---
sidebar_position: 2
title: Hunks - Edit and Replacement Calculations
---

# Hunks: Mathematical Foundations of Edit and Replacement Operations

## Abstract

This document provides a rigorous mathematical treatment of hunk operations in Atomic. Hunks are the fundamental atomic operations in Atomic's patch-based directed acyclic graph (DAG) model. We prove the correctness properties of Edit and Replacement hunks, showing how they maintain consistency in the graph's mathematical model.

## 1. Preliminaries: The Patch-Based DAG Model

### 1.1 Mathematical Framework

Atomic is built on a **patch-based DAG** where:

- **Vertices** represent immutable blocks of content
- **Edges** represent ordering relationships between vertices
- **Changes** are collections of hunks that introduce new vertices and edges
- **Position** is defined as a point in this graph: `P = (change_id, byte_offset)`

**Definition 1.1** (Vertex): A vertex `V = (c, s, e)` where:
- `c`: Change identifier (NodeId)
- `s`: Start position (ChangePosition) 
- `e`: End position (ChangePosition)
- The vertex represents the immutable byte range `[s, e)` within change `c`

**Definition 1.2** (Position): A position `P = (c, p)` where:
- `c`: Change identifier
- `p`: Byte offset (ChangePosition) within change `c`
- Represents a unique point in the DAG

**Definition 1.3** (Ordering Relation): Vertices are ordered via edges. If vertex `V₁` has an edge to vertex `V₂`, then `V₁` comes before `V₂` in the linear ordering of the file.

### 1.2 Context Dependencies

When creating a new vertex, we must specify its position in the ordering relation via context:

**Definition 1.4** (Up Context): A set of positions `U = {P₁, P₂, ..., Pₙ}` such that the new vertex must appear **after** all vertices containing these positions in the linear ordering.

**Definition 1.5** (Down Context): A set of positions `D = {P₁, P₂, ..., Pₙ}` such that the new vertex must appear **before** all vertices containing these positions in the linear ordering.

**Axiom 1.1** (Consistency): For a valid change, up context and down context must define a consistent ordering. That is, there exists a linear ordering of all vertices such that:
- All up context positions appear before the new vertex
- All down context positions appear after the new vertex

## 2. Hunks as Graph Operations

### 2.1 Edit Hunk

**Definition 2.1** (Edit Hunk): An Edit hunk `E = (path, line_new, pos, content, context)` where:
- `path`: File path (identifies the inode in the DAG)
- `line_new`: **Line number in the NEW file state** (after applying all previous hunks)
- `pos`: Position in the change graph (merkle hash identifier)
- `content`: Byte content to add (if addition) or remove (if deletion)
- `context`: Up and down context positions for ordering

**Mathematical Property 2.1**: The `line_new` field represents the **target position** in the transformed file after all previous operations have been applied. This is not a reference to the old file state, but to the new file state being constructed.

**Theorem 2.1** (Edit Hunk Correctness): Given an Edit hunk `E` with up context `U` and down context `D`, if:
1. All positions in `U` exist in the current DAG state
2. All positions in `D` exist in the current DAG state
3. The ordering constraint `U < E < D` is satisfiable

Then applying `E` produces a valid new DAG state.

**Proof Sketch**: 
- The new vertex is created at positions defined by `content`
- Edges are created from vertices containing positions in `U` to the new vertex
- Edges are created from the new vertex to vertices containing positions in `D`
- The DAG property (acyclicity) is maintained because we insert between existing vertices
- Consistency is maintained because contexts are validated before edge creation

### 2.2 Replacement Hunk

**Definition 2.2** (Replacement Hunk): A Replacement hunk `R = (path, line_new, pos_old, pos_new, content_old, content_new, context)` where:
- `path`: File path
- `line_new`: **Line number in the NEW file state** (same position for both old and new content)
- `pos_old`: Position identifier for the old content (deletion)
- `pos_new`: Position identifier for the new content (addition)
- `content_old`: Byte content being removed
- `content_new`: Byte content being added
- `context`: Shared up and down context for both operations

**Critical Insight**: In a Replacement, both the deletion and addition occur at the **same position** `line_new` in the NEW file state. This is the fundamental property that distinguishes Replacement from two separate Edit hunks.

**Mathematical Property 2.2**: For a Replacement hunk `R`:
- The old content (deletion) and new content (addition) both reference position `line_new`
- This means: in the NEW file, at line `line_new`, we remove `content_old` and insert `content_new`
- The old content existed at some position in the OLD file state, but we reference it by its NEW file position

**Theorem 2.2** (Replacement Hunk Correctness): A Replacement hunk `R` is mathematically equivalent to:
1. An Edit hunk `E_del` that deletes `content_old` at position `line_new`
2. An Edit hunk `E_add` that adds `content_new` at position `line_new`
3. With the constraint that `E_del.line_new = E_add.line_new`

**Proof**: 
From `atomic-core/src/diff/replace.rs:85-109`, we see that a Replacement is created when:
```rust
if old_len > 0 {
    match self.actions.pop() {
        Some(Hunk::Edit { change: c, local, .. }) => {
            if local.line == from_new + 1 {  // Same NEW file position
                // Convert to Replacement
                self.actions.push(Hunk::Replacement { ... });
            }
        }
    }
}
```

This proves that Replacements are created precisely when two Edits would occur at the same `line_new` position. The Replacement is a notational convenience that groups these operations, but the mathematical semantics are: both operations target the same position in the NEW file state.

### 2.3 Line Number Semantics: The Critical Property

**Axiom 2.1** (Line Number Invariant): For any hunk `H`, the field `H.line` represents the **line number in the NEW file state** after applying all hunks that precede `H` in the change sequence.

**Corollary 2.1**: For a Replacement hunk `R`:
- `R.line` is the NEW file line number
- The deletion removes content that, after previous hunks, would appear at line `R.line`
- The addition inserts content that will appear starting at line `R.line`
- Both operations target the same position because they occur in the same transformed file state

**Proof of Corollary 2.1**:
From `atomic-core/src/diff/replace.rs:110-119`, when creating an Edit hunk:
```rust
self.actions.push(Hunk::Edit {
    local: LocalByte {
        line: from_new + 1,  // NEW file line number
        path: diff.path.clone(),
        inode,
        byte: Some(bytes_pos(lines_b, from_new)),
    },
    ...
});
```

The `line` field is set to `from_new + 1`, where `from_new` is the index in the NEW file (`lines_b` array). This proves that `line` always refers to the NEW file state.

For Replacements, the same `local.line` value is used for both the deletion and addition operations, proving they target the same NEW file position.

## 3. Position Calculation in the DAG

### 3.1 Computing Up Context

**Definition 3.1** (Up Context Calculation): Given a deletion range `[old, old + old_len)` in the old file, the up context is computed by:
1. Finding the vertex containing the byte position at `old` in the old file
2. Mapping this to a Position `P = (change_id, byte_offset)` in the DAG
3. This Position becomes part of the up_context set

From `atomic-core/src/diff/replace.rs:123-193`, the `get_up_context` function:
- Finds the vertex containing the byte position in the old file state
- Returns the Position that marks where the new content should appear **after** in the ordering

### 3.2 Computing Down Context

**Definition 3.2** (Down Context Calculation): Given a deletion range `[old, old + old_len)` and addition range `[from_new, from_new + len)` in the new file, the down context is computed by:
1. Finding the vertex containing the byte position after `old + old_len` in the old file
2. Mapping this to a Position `P` in the DAG  
3. This Position becomes part of the down_context set, marking where the new content should appear **before** in the ordering

From `atomic-core/src/diff/replace.rs:238-315`, the `get_down_context` function computes positions that the new vertex must appear before.

### 3.3 The Replacement Position Invariant

**Theorem 3.1** (Replacement Position Invariant): For a Replacement hunk `R` at NEW file line `line_new`:
- The up_context for both deletion and addition is computed from the same old file position range
- The down_context for both deletion and addition is computed from positions after the old file range
- Both operations share the same context because they target the same NEW file position

**Proof**: 
When `local.line == from_new + 1` in `replace.rs:90`, the system creates a Replacement. The `local` structure (which contains `line`) is reused for both the deletion (`change`) and addition (`replacement`) operations. Since they share the same `local.line`, they target the same NEW file position, and thus have the same context requirements.

## 4. Correctness Properties

### 4.1 Commutativity

**Theorem 4.1** (Hunk Commutativity): Two hunks `H₁` and `H₂` commute if they operate on disjoint line ranges in the NEW file state. That is:
- If `H₁.line_new + H₁.length < H₂.line_new` or `H₂.line_new + H₂.length < H₁.line_new`
- Then applying `(H₁, H₂)` produces the same result as `(H₂, H₁)`

**Proof**: Since the hunks operate on disjoint ranges, the context dependencies don't overlap. The DAG edges created are independent, so the order of application doesn't affect the final state.

### 4.2 Consistency Preservation

**Theorem 4.2** (DAG Consistency): Applying a valid hunk to a consistent DAG state produces a consistent DAG state.

**Proof Sketch**:
1. **Acyclicity**: New edges are only created from up_context vertices to the new vertex, and from the new vertex to down_context vertices. Since up_context < down_context by definition, no cycles are introduced.

2. **Ordering**: The new vertex is inserted between existing vertices, preserving the linear ordering property.

3. **Uniqueness**: Each new vertex has a unique `(change_id, start, end)` tuple, ensuring no collisions.

### 4.3 Replacement Semantics Correctness

**Theorem 4.3** (Replacement Semantics): A Replacement hunk `R` correctly models the operation "replace content at position `line_new`" if:
1. The old content exists at position `line_new` after applying previous hunks
2. The new content is inserted at position `line_new` 
3. Both operations use the same context dependencies

**Proof**: 
From the Replacement creation logic, when `local.line == from_new + 1` for both operations, they target the same position. The deletion removes vertices containing the old content, and the addition creates new vertices at the same position. The shared context ensures both operations see the same DAG state, making the replacement atomic and consistent.

## 5. Implementation Verification

### 5.1 Edit Hunk Creation

From `atomic-core/src/diff/replace.rs:110-119`:
```rust
self.actions.push(Hunk::Edit {
    local: LocalByte {
        line: from_new + 1,  // NEW file line number
        path: diff.path.clone(),
        inode,
        byte: Some(bytes_pos(lines_b, from_new)),
    },
    change: Atom::NewVertex(change),
    encoding: encoding.clone(),
});
```

**Verification**: `from_new` is the index in `lines_b` (the NEW file array). Setting `line = from_new + 1` correctly represents the NEW file line number (1-indexed).

### 5.2 Replacement Hunk Creation

From `atomic-core/src/diff/replace.rs:85-97`:
```rust
if old_len > 0 {
    match self.actions.pop() {
        Some(Hunk::Edit { change: c, local, .. }) => {
            if local.line == from_new + 1 {  // Same NEW file position
                self.actions.push(Hunk::Replacement {
                    change: c,      // Deletion (old Edit)
                    local,          // Same local.line (NEW file position)
                    replacement: Atom::NewVertex(change),  // Addition
                    encoding: encoding.clone(),
                });
            }
        }
    }
}
```

**Verification**: 
1. An Edit hunk `E` exists with `E.local.line = L`
2. A new Edit would be created with `line = from_new + 1`
3. If `L == from_new + 1`, both target the same NEW file position
4. They are combined into a Replacement, preserving `local.line = L` for both operations

This proves that Replacements are created precisely when two operations target the same NEW file position, confirming our mathematical model.

### 5.3 Position Serialization

From `atomic-core/src/change/printable.rs:471-493`:
```rust
Replace {
    path,
    line,    // Serialized as: "Replacement in path:line pos encoding"
    pos,
    encoding,
    change,              // Old content (deletion)
    replacement,         // New content (addition)
    change_contents,     // "-" prefixed
    replacement_contents,// "+" prefixed
} => {
    writeln!(w, "Replacement in {}:{} {} {}", 
        Escaped(&path),
        line,      // This is local.line (NEW file line number)
        pos,
        Escaped(encoding_label(encoding))
    )?;
    print_contents(w, "-", change_contents, encoding)?;      // Old
    print_contents(w, "+", replacement_contents, encoding)?; // New
}
```

**Verification**: The serialized format shows a single `line` value, confirming that both deletion and addition reference the same NEW file position.

## 6. Common Misconceptions and Corrections

### ❌ Misconception 1: "Line numbers refer to old file positions"

**Correction**: By Axiom 2.1 and Theorem 2.1, `H.line` always refers to the NEW file line number after applying previous hunks. The old file positions are used only for computing context dependencies, not for the target position.

### ❌ Misconception 2: "Replacements have separate positions for deletion and addition"

**Correction**: By Theorem 2.2 and the Replacement creation logic, both operations target the same `line_new` position. The Replacement is a grouping of two operations at the same position, not two operations at different positions.

### ❌ Misconception 3: "Line numbers are computed from old file state"

**Correction**: From `replace.rs:112`, `line = from_new + 1` where `from_new` is an index into `lines_b` (the NEW file). This is computed from the diff algorithm's result, which produces indices into the new file array.

## 7. Summary: Mathematical Foundations

The mathematical model of hunks rests on these foundations:

1. **Position Semantics**: `H.line` represents the NEW file line number (Axiom 2.1)
2. **Replacement Invariant**: Replacements target a single NEW file position for both deletion and addition (Theorem 2.2)
3. **Context Dependencies**: Up/down context positions ensure correct ordering in the DAG (Definitions 1.4, 1.5)
4. **Correctness**: Valid hunks preserve DAG consistency properties (Theorems 4.1, 4.2, 4.3)

These properties ensure that:
- Changes can be applied in any order that respects dependencies
- The DAG remains acyclic and consistent
- Replacements correctly model atomic "replace at position" operations
- The mathematical model is sound and implementable

## 8. Concrete Example: Hello World Diff

To illustrate the mathematical concepts, we present a complete example showing how Edit and Replacement hunks represent file changes.

### 8.1 Original File State

**File: `hello.ts`**
```typescript
1: function greet(name: string): string {
2:   return `Hello, ${name}!`;
3: }
4: 
5: function main(): void {
6:   const message = greet("World");
7:   console.log(message);
8: }
```

**DAG State**: The file consists of vertices representing each line:
- `V₁ = (change₀, 0, len(line1))` - "function greet..."
- `V₂ = (change₀, len(line1), len(line1)+len(line2))` - "  return..."
- `V₃ = (change₀, ...)` - "}"
- ... and so on

### 8.2 Modified File State

**File: `hello.ts` (after changes)**
```typescript
1: function greet(name: string): string {
2:   const redName = `\x1b[31m${name}\x1b[0m`;
3:   return `Hello, ${redName}!`;
4: }
5: 
6: function main(): void {
7:   const name = getName();
8:   const message = greet(name);
9:   console.log(message);
10: }
11: 
12: function getName(): string {
13:   const args = process.argv.slice(2);
14:   const name = args.join(" ").trim();
15:   return name || "World";
16: }
```

### 8.3 Diff Analysis

The diff algorithm compares the old file (`lines_a`) and new file (`lines_b`) and produces the following hunks:

#### Hunk 1: Edit (Addition)

**Operation**: Add a new line after line 1

**Hunk Structure**:
```
Edit in "hello.ts":2 1.234 "UTF-8"
+ const redName = `\x1b[31m${name}\x1b[0m`;
```

**Mathematical Interpretation**:
- `line = 2`: This is the **NEW file line number** where the addition occurs
- After applying this hunk, the new file will have the added line at position 2
- **Up Context**: Position pointing to the end of line 1 (`function greet...`)
- **Down Context**: Position pointing to the start of the old line 2 (`return...`)

**DAG Operation**:
- Creates new vertex `V_new = (change₁, start, end)` containing the new line
- Creates edge from `V₁` (line 1) to `V_new` (new line 2)
- Creates edge from `V_new` to the vertex that was at old line 2

**Resulting File State** (after Hunk 1):
```
1: function greet(name: string): string {
2:   const redName = `\x1b[31m${name}\x1b[0m`;  ← NEW
3:   return `Hello, ${name}!`;  ← OLD line 2, now at NEW line 3
4: }
```

#### Hunk 2: Replacement

**Operation**: Replace line 3 (old line 2) with a modified version

**Hunk Structure**:
```
Replacement in "hello.ts":3 2.473 "UTF-8"
- return `Hello, ${name}!`;
+ return `Hello, ${redName}!`;
```

**Mathematical Interpretation**:
- `line = 3`: This is the **NEW file line number** where BOTH operations occur
- The deletion removes the old content that is now at NEW line 3
- The addition inserts new content starting at NEW line 3
- **Critical**: Both operations target the same NEW file position (line 3)

**Why it's a Replacement**:
- The diff algorithm found old content to remove (`old_len > 0`)
- The previous Edit hunk was at `line = 2`
- The new operation would be at `line = 3` (after the addition)
- But there's old content at the position that maps to NEW line 3
- Since `local.line == from_new + 1` (both reference NEW line 3), they're combined into a Replacement

**DAG Operation**:
- **Deletion**: Removes vertex containing the code: return `Hello, ${name}!`;
- **Addition**: Creates new vertex `V_replacement = (change₁, start, end)` containing the code: return `Hello, ${redName}!`;
- Both operations use the same up_context (end of line 2) and down_context (start of line 4)
- The new vertex is inserted at the same position where the old vertex was removed

**Resulting File State** (after Hunk 2):
```
1: function greet(name: string): string {
2:   const redName = `\x1b[31m${name}\x1b[0m`;
3:   return `Hello, ${redName}!`;  ← REPLACED (was: return `Hello, ${name}!`;)
4: }
```

#### Hunk 3: Replacement

**Operation**: Replace the `main()` function body

**Hunk Structure**:
```
Replacement in "hello.ts":7 3.891 "UTF-8"
- const message = greet("World");
+ const name = getName();
+ const message = greet(name);
```

**Mathematical Interpretation**:
- `line = 7`: Both deletion and addition occur at NEW file line 7
- The old line `const message = greet("World");` is removed
- Two new lines are added starting at NEW line 7
- **Note**: Even though multiple lines are added, they all start at the same NEW file position (line 7)

**DAG Operation**:
- **Deletion**: Removes vertex containing the old line
- **Addition**: Creates new vertices for the two new lines
- All new vertices share the same up_context (end of line 6) and down_context (start of line 9)

**Resulting File State** (after Hunk 3):
```
6: function main(): void {
7:   const name = getName();        ← NEW (first addition)
8:   const message = greet(name);  ← NEW (second addition)
9:   console.log(message);
10: }
```

#### Hunk 4: Edit (Addition)

**Operation**: Add a new function at the end

**Hunk Structure**:
```
Edit in "hello.ts":12 4.567 "UTF-8"
+ function getName(): string {
+ const args = process.argv.slice(2);
+ const name = args.join(" ").trim();
+ return name || "World";
+ }
```

**Mathematical Interpretation**:
- `line = 12`: NEW file line number where the addition starts
- Multiple lines are added, but they all start at position 12 in the NEW file
- **Up Context**: Position pointing to the end of line 11 (empty line)
- **Down Context**: None (end of file)

### 8.4 Complete Transformation

**Step-by-step application**:

1. **Initial State**: Original file with 8 lines
2. **After Hunk 1 (Edit)**: 9 lines (added line 2)
3. **After Hunk 2 (Replacement)**: Still 9 lines (replaced line 3)
4. **After Hunk 3 (Replacement)**: 10 lines (replaced 1 line with 2 lines)
5. **After Hunk 4 (Edit)**: 16 lines (added 5 lines)

**Key Observations**:

1. **Line numbers are cumulative**: Each hunk's `line` field refers to the NEW file state after all previous hunks have been applied.

2. **Replacements preserve position**: In Hunk 2, the replacement occurs at NEW line 3. The old content was at old line 2, but after Hunk 1 added a line, it moved to NEW line 3. The replacement correctly targets this NEW position.

3. **Context dependencies**: Each hunk's up_context and down_context ensure the new vertices are inserted in the correct position in the DAG, maintaining the file's logical structure.

4. **Mathematical correctness**: The DAG remains acyclic and consistent throughout all operations. Each new vertex has well-defined ordering relationships with existing vertices.

### 8.5 DAG Structure Visualization

**After all hunks are applied**, the DAG structure looks like:

```
V₁ (line 1: function greet...) 
  → V₂ (line 2: const redName...) [NEW from Hunk 1]
    → V₃ (line 3: return Hello...) [REPLACED in Hunk 2]
      → V₄ (line 4: })
        → V₅ (line 5: empty)
          → V₆ (line 6: function main...)
            → V₇ (line 7: const name...) [NEW from Hunk 3]
              → V₈ (line 8: const message...) [NEW from Hunk 3]
                → V₉ (line 9: console.log...)
                  → V₁₀ (line 10: })
                    → V₁₁ (line 11: empty)
                      → V₁₂ (line 12: function getName...) [NEW from Hunk 4]
                        → ... (rest of getName function)
```

Each edge represents an ordering constraint: the source vertex must appear before the target vertex in the linear file ordering.

### 8.6 Why This Model is Correct

**Theorem 8.1** (Example Correctness): The hunks in this example correctly transform the file because:

1. **Position Accuracy**: Each `line` field correctly identifies the NEW file position after previous hunks
2. **Context Validity**: All up_context and down_context positions exist in the DAG at the time of application
3. **Ordering Consistency**: The DAG edges create a valid linear ordering matching the file structure
4. **Replacement Correctness**: Replacements target the same NEW file position for both deletion and addition

**Proof**: By inspection:
- Hunk 1 adds at line 2, correctly placing it between lines 1 and 3
- Hunk 2 replaces at line 3, correctly removing the old line 3 and inserting the new line 3
- Hunk 3 replaces at line 7, correctly expanding one line into two
- Hunk 4 adds at line 12, correctly appending to the end of the file

All operations maintain DAG consistency and produce the expected final file state.

## References

- `atomic-core/src/diff/replace.rs` - Replacement creation and position calculation
- `atomic-core/src/change/printable.rs` - Hunk serialization format
- `atomic-core/src/change/parse.rs` - Hunk parsing logic
- `atomic-core/src/pristine/vertex.rs` - Vertex and Position definitions
- `atomic-core/src/apply/vertex.rs` - DAG application logic with context validation
