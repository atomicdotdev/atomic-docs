---
sidebar_position: 3
title: Stacked Diffs
---

# Stacked Diffs with Atomic

Stacked diffs are a workflow pattern where you build multiple focused changes, each representing a reviewable unit of work. In Atomic, this workflow emerges naturally from the underlying patch theory — changes are algebraic operations on a directed acyclic graph (DAG), and their dependencies are computed automatically from the graph structure.

## The Model: Patches on a DAG

Every file in Atomic is a DAG of vertices and edges. A **change** is a set of operations that adds or removes vertices and edges in this graph. When you record a change, Atomic examines which existing vertices your edits touch and computes the dependency set automatically.

```
Your code is a graph:

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ "fn main" │────▶│ "()  {"  │────▶│ "}"      │
  └──────────┘     └──────────┘     └──────────┘
  (Change A)        (Change A)        (Change A)

Recording a new change that inserts a line between "{" and "}":

  ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
  │ "fn main" │────▶│ "()  {"  │────▶│ "println!(…)" │────▶│ "}"      │
  └──────────┘     └──────────┘     └──────────────┘     └──────────┘
  (Change A)        (Change A)        (Change B)           (Change A)

  Change B depends on Change A because it spliced into A's vertices.
  This dependency is computed, not declared.
```

Because changes are algebraic operations with well-defined composition rules, two changes that touch independent parts of the graph **commute** — their order doesn't matter. This is the foundation that makes stacked workflows friction-free.

## Why Stacked Changes?

### Better Code Review
- **Focused changes**: Each change does one logical thing and is reviewable in minutes
- **Clear progression**: Reviewers see the dependency chain and understand the build-up
- **Faster approval**: Small, focused changes get approved quickly

### Parallel Development
- **Don't block on review**: Continue building dependent changes while earlier ones are under review
- **Independent iteration**: Update any change in the chain without disrupting others
- **Team coordination**: Multiple people can build on the same base changes simultaneously

### Precise Debugging
- **Bisect by change**: Each change is a semantic unit, so finding which one introduced a bug is straightforward
- **Selective rollback**: Remove a single change from a view's history without affecting unrelated work
- **Independent testing**: Test each layer of the stack on its own

## How It Works in Practice

### Record a Chain of Changes

All work happens on a **view** — a filtered perspective on the single canonical graph. Every change you record goes into the global GRAPH immediately; the view tracks which changes are visible through its `VIEW_CHANGES` filter.

```bash
# Create a view for your feature
atomic view create feature-user-auth --switch

# Record focused changes — dependencies are computed automatically
atomic record src/types/user.rs -m "Define User and Session types"
# Recorded: change A (no dependencies — first change)

atomic record migrations/001_users.sql -m "Add users table schema"
# Recorded: change B (depends on A — references types from A)

atomic record src/auth/login.rs -m "Implement login with JWT validation"
# Recorded: change C (depends on B — references schema from B)

atomic record src/api/auth.rs -m "Add /login and /logout endpoints"
# Recorded: change D (depends on C — calls functions from C)
```

### Inspect the Dependency DAG

```bash
atomic log --deps

# D — Add /login and /logout endpoints
#   └─ C — Implement login with JWT validation
#      └─ B — Add users table schema
#         └─ A — Define User and Session types
```

This isn't a linear stack — it's a DAG. If change D touched only types from A (not functions from C), the graph would show `D → A` directly, skipping B and C. The structure reflects actual code dependencies, not recording order.

### Push to Remote

```bash
# Push everything on this view to the remote
atomic push

# Or push specific changes
atomic push A B
```

### Update a Change

When change B needs to be revised — whether flagged by an agent, a CI pipeline, or a human reviewer — you don't rebase anything:

```bash
# Remove B from this view's history
atomic unrecord B

# Edit the file and re-record
vi migrations/001_users.sql
atomic record migrations/001_users.sql -m "Add users table schema (addressed review)"
# Recorded: change B' (new hash — this is a new change)

# B' introduces the same vertices that C and D depended on,
# so they continue to apply cleanly. If B' changed the graph
# structure that C depends on, Atomic detects the conflict
# at insert time — no silent corruption.
```

The key insight: there is no rebase step. Changes C and D reference specific graph positions. If B' preserves those positions, everything composes. If it doesn't, Atomic tells you exactly where the conflict is.

## Cross-View Operations with Insert

Views are filtered perspectives on the same graph. The `insert` command adds change references (and their transitive dependencies) to a view's filter. Because all edges already exist in the single canonical GRAPH, insert is an **O(1) metadata operation** — no data is copied.

### Insert Changes Between Views

```bash
# Insert all changes from feature view into dev
atomic insert from-view feature-user-auth --to-view dev

# Cherry-pick specific changes (dependencies pulled automatically)
atomic insert pick D --to-view dev
# Atomic computes: deps(D) = {A, B, C}
# dev already has: {A}
# Missing: {B, C, D} → inserted in dependency order
```

### Preview Before Inserting

```bash
# See what would be inserted without doing it
atomic insert preview --from feature-user-auth --to-view dev
```

### Create Parallel Views from the Same Base

Both views see the shared graph through their parent chain — no need to copy changes:

```bash
atomic view create feature-frontend --parent dev
atomic view create feature-backend --parent dev

# Both views already see everything in dev.
# Changes recorded on feature-frontend are invisible to feature-backend
# (and vice versa) until explicitly inserted.
```

## Reordering and Restructuring

Because changes are algebraic operations, independent changes commute — you can reorder them freely:

```bash
# Current view history: A → B → C
# B and C are independent (touch different files)
# Want: A → C → B

atomic unrecord B C
atomic insert C    # Insert in new order
atomic insert B
```

If B and C are NOT independent (they touch overlapping graph positions), Atomic will tell you — no silent reordering of dependent changes.

## Real-World Workflow: Building a Feature Over Multiple Days

```bash
# Day 1: Foundation
atomic view create feature-payment-system --switch
atomic record types.rs -m "Payment types and error hierarchy"
atomic record schema.sql -m "Payment and transaction tables"
atomic push
# Agents validate the change immediately — type-checking,
# schema linting, dependency analysis all happen automatically.

# Day 2: Core logic (don't wait — agents already validated Day 1)
atomic record processor.rs -m "Payment processor with retry logic"
atomic record validation.rs -m "Card and amount validation rules"
atomic push

# Day 3: Integration
atomic record api.rs -m "Payment API endpoints"
atomic record webhooks.rs -m "Stripe webhook handlers"
atomic push

# Day 4: Agent flags a type mismatch introduced in Day 1
atomic unrecord <types-hash>
vi types.rs
atomic record types.rs -m "Payment types (v2 — added refund support)"
atomic push

# Days 2-3 changes compose with the updated types.
# If the type changes broke an interface that processor.rs depends on,
# Atomic flags the conflict explicitly.
```

## Experimental Work

Views are cheap (they're just filter metadata). Use them freely:

```bash
# Try a new approach
atomic view create experiment-new-algorithm --switch
atomic record algorithm.rs -m "Alternative sort implementation"

# If successful — insert the change into dev
atomic view switch dev
atomic insert <algorithm-hash>

# If failed — delete the view
atomic view delete experiment-new-algorithm
# The change's edges remain in the global GRAPH (immutable).
# They're invisible to all views and cleaned up by GC.
```

## How This Differs from Branch-Based Workflows

In branch-based systems, "stacked diffs" are a workflow discipline imposed on top of a model that doesn't natively support it. The base abstraction is a snapshot, and relating snapshots requires rebasing, cherry-picking, and conflict resolution at every step.

In Atomic, stacked changes are a **natural consequence of the model**:

| Concept | Branch-Based Systems | Atomic |
|---------|---------------------|--------|
| **Fundamental unit** | Snapshot (full tree state) | Change (algebraic graph operation) |
| **Dependencies** | Implicit (parent commit pointer) | Explicit (computed from graph structure) |
| **Identity** | Commit hash (changes on rebase) | Content hash (immutable) |
| **Sharing changes** | Cherry-pick (copies data, new hash) | Insert (O(1) metadata reference) |
| **Updating a change** | Amend + rebase all dependents | Unrecord + re-record; dependents checked automatically |
| **Storage** | Each branch stores full history | Single GRAPH; views are filters |
| **Independent changes** | May still conflict during rebase | Commute by definition (patch theory) |

The critical difference: in Atomic, whether two changes can coexist isn't determined by textual diffing at merge time — it's determined by their algebraic properties in the graph. Two changes that touch independent vertices commute regardless of how close they are in a file. Two changes that modify the same vertex conflict regardless of how far apart they are.

## Troubleshooting

### Insert Reports a Conflict

```bash
atomic insert C
# Error: Conflict in src/auth/login.rs
#   Change C references vertex V[42:58] which was modified by change B'

# This means B' changed the graph structure that C depends on.
# Fix: unrecord C, update the code, re-record.
atomic unrecord C
vi src/auth/login.rs
atomic record src/auth/login.rs -m "Login logic (updated for new types)"
```

### Dependency Chain Feels Wrong

```bash
# Inspect what a change actually depends on
atomic change <HASH> --deps

# If your change has unexpected dependencies, you may have
# edited a file that shares vertices with another change.
# Split your edits into separate records to get cleaner deps.
```

### View History Got Tangled

```bash
# See the current state
atomic log --deps

# Option 1: Reorder
atomic unrecord --all
atomic insert A B C D  # Re-insert in the order you want

# Option 2: Start fresh
atomic view create feature-v2 --switch
atomic insert pick A C D  # Pull only the changes you want
```

## Best Practices

### Record Semantically, Not Chronologically

Each `atomic record` should capture one logical change. Don't record "end of day" snapshots — record "added input validation" or "extracted database layer."

```bash
# Good: semantic units
atomic record src/validation.rs -m "Add card number validation (Luhn check)"
atomic record src/processor.rs -m "Add idempotency key to payment requests"

# Avoid: chronological dumps
atomic record . -m "Tuesday work"
atomic record . -m "More progress"
```

### Use the Dependency DAG as a Design Tool

If `atomic log --deps` shows a tangled web, that's a signal your code changes are too coupled. Clean dependency chains often reflect clean architecture:

```
# Clean: linear chain with clear layers
D (API) → C (logic) → B (schema) → A (types)

# Messy: everything depends on everything
D → A, B, C
C → A, B
B → A
```

### Push Continuously for Validation

Push after every logical change. Agents and CI pipelines validate each change as it lands — type-checking, linting, test execution, and dependency analysis happen automatically. Don't batch work waiting for a human to look at it.

```bash
atomic record types.rs -m "Core types"
atomic push  # Agents validate immediately; keep building

atomic record logic.rs -m "Business rules"
atomic push  # Each push is independently validated
```

### Name Views for Intent

```bash
# Clear intent
atomic view create feature-user-authentication
atomic view create bugfix-memory-leak-in-parser
atomic view create refactor-extract-database-layer

# Unclear
atomic view create stuff
atomic view create wip
```

## Next Steps

- **[AI Agent Workflows](ai-agent-workflows.md)** — How agents use views for isolated, auditable work
- **[Views Command Reference](../commands/view.md)** — Full view lifecycle: create, switch, list, delete
- **[Insert Command Reference](../commands/insert.md)** — Cross-view change operations
- **[Change Identity](../concepts/change-identity)** — How content-addressing and immutability work
- **[The Graph Model](../concepts/graph-model-explained.md)** — Deep dive into vertices, edges, and patch composition