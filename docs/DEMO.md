# Atomic Demo Walkthrough

> **Repo:** tokio — imported from Git  
> **Theme:** Code intelligence → Agent-powered development → Provenance & attribution

---

## Part 1: Code Intelligence from the CLI

### Build the knowledge graph

After importing a project from Git, enrich the knowledge graph. This extracts
files, modules, changes, tree-sitter entities, include relationships, and builds
a full-text content index.

```
$ atomic query enrich

Enriching views... ✓ 2 view(s)
Enriching files... ✓ 483 file(s)
Enriching modules... ✓ 64 module(s)
Enriching changes... ✓ 4511 change(s)
Extracting entities (tree-sitter)... ✓ 12,847 entit(ies)
Resolving includes... ✓ 1,203 include(s)
Building content index... ✓ 483 file(s) indexed (4.7 MB)

Enriched: 2 views, 483 files, 64 modules, 4511 changes, 12847 entities, 1203 includes
```

One command. The entire project is now queryable.

---

### Search the knowledge graph

Search returns a diverse mix of files, modules, entities, and changes.
Use `-p` (pool) for broader diversity, `-k` for more results.

```
$ atomic query search "sync" -p 5000

  [file] file:tokio/src/sync/broadcast.rs
  [file] file:tokio/src/sync/mpsc/bounded.rs
  [file] file:tokio/src/io/async_fd.rs
  [file] file:tokio/src/fs/file.rs
  [module] module:tokio/src/sync/tests  tokio/src/sync/tests
  [module] module:tokio-util/src/sync/cancellation_token  tokio-util/src/sync/cancellation_token
  [entity] entity:tokio-util/src/sync/cancellation_token/tree_node.rs:is_cancelled:82  ...
  [entity] entity:tokio/src/sync/broadcast.rs:Receiver<T>:1695  impl fmt::Debug for Receiver<T>
  [change] change:4U2YL4HU3EY3  sync: notify receivers in mpsc `OwnedPermit::release()` m...
  [change] change:2SCURCPZQW5B  sync: fix typos in `OnceCell` docs (#7047)

10 result(s).
```

Files, modules, entities, **and changes** — all from one query. Filter by kind:

```
$ atomic vault query search "sync" -t change -k 5

  [change] change:2OJECPXPLQHL  doc: sync interval.rs and time/mod.rs docs (#3533)
  [change] change:44XWBJBZRONM  sync: fix warnings in benches and tests (#912)
  [change] change:54OZTYACCEP4  sync: add `spin_loop_hint` to atomic waker (#1608)
  [change] change:GGJPZ2MX5IM6  sync: add same_channel method to mpsc Senders (#3532)
  [change] change:6C7MCMDCC62Q  sync: add back RwLockWriteGuard::map and RwLockWriteGuard...

5 result(s).
```

---

### Search source code

`code` is the grep replacement — it searches file contents using the indexed
content. Supports regex, path filtering (`-g`), and file type filtering (`-t`).

```
$ atomic query code "Semaphore" -t rs -n 10

tokio/src/sync/semaphore.rs:398: pub struct Semaphore {
tokio/src/sync/semaphore.rs:456: pub fn new(permits: usize) -> Self {
tokio/src/sync/semaphore.rs:504: pub fn const_new(permits: usize) -> Self {
tokio/src/sync/batch_semaphore.rs:35: pub(crate) struct Semaphore {
tokio/src/sync/batch_semaphore.rs:79: impl Semaphore {
tokio/src/sync/mod.rs:488: pub use semaphore::Semaphore;
benches/sync_semaphore.rs:3: use tokio::{sync::Semaphore, task};
benches/sync_semaphore.rs:24: let s = Arc::new(Semaphore::new(10));
benches/sync_semaphore.rs:38: async fn task(s: Arc<Semaphore>) {
benches/sync_semaphore.rs:46: let s = Arc::new(Semaphore::new(10));

10 match(es) in 4 file(s).
  (50 total matches — showing top 10. Narrow with -g or -t.)

  Top directories:
    -g "tokio/src"                           43 matches
    -g "benches/sync_semaphore.rs"           7 matches
```

Faceted results tell you exactly how to narrow down.

---

### Explore relationships

Pick a node from the search results and follow its edges. This shows every
entity defined in a file AND every change that touched it:

```
$ atomic query neighbors "file:tokio/src/sync/semaphore.rs"

Nodes (99):
  [entity] entity:tokio/src/sync/semaphore.rs:close:963  pub fn close(&self)
  [entity] entity:tokio/src/sync/semaphore.rs:acquire:585  pub fn acquire(...)
  [entity] entity:tokio/src/sync/semaphore.rs:Semaphore:398  pub struct Semaphore
  [change] change:6VJNKUDTWHYX  sync: add Semaphore (#1973)
  [change] change:G4SXCOK523DV  sync: add `Semaphore::close` (#3065)
  [change] change:XOSH4M7UXO2W  sync: add `merge()` to semaphore permits (#4948)
  [change] change:KCJ3DZW7VLGR  sync: add `Semaphore::MAX_PERMITS` (#5144)
  [module] module:tokio/src/sync  tokio/src/sync
  ...

Edges (98):
  file:tokio/src/sync/semaphore.rs →[DEFINES]→ entity:...:Semaphore:398
  file:tokio/src/sync/semaphore.rs →[DEFINES]→ entity:...:acquire:585
  file:tokio/src/sync/semaphore.rs →[PART_OF]→ module:tokio/src/sync
  change:6VJNKUDTWHYX →[MODIFIES]→ file:tokio/src/sync/semaphore.rs
  change:G4SXCOK523DV →[MODIFIES]→ file:tokio/src/sync/semaphore.rs
  ...
```

98 edges — the full provenance of this file: who created it, what was added,
which module it belongs to, every function it defines.

---

### Get a file outline

`entities` parses a file with tree-sitter and shows every function, struct,
trait, and constant with line ranges and signatures:

```
$ atomic query entities tokio/src/sync/semaphore.rs

  class        Semaphore                      L398-403  [exported]  pub struct Semaphore
  class        SemaphorePermit                L413-416  [exported]  pub struct SemaphorePermit<'a>
  class        OwnedSemaphorePermit           L426-429  [exported]  pub struct OwnedSemaphorePermit
  const        MAX_PERMITS                    L450-450  [exported]  pub const MAX_PERMITS: usize = ...
  function     new                            L456-484  [exported]  pub fn new(permits: usize) -> Self
  function     const_new                      L504-510  [exported]  pub fn const_new(permits: usize) -> Self
  method       acquire                        L585-602  [exported]  pub fn acquire(&self) -> Result<...>
  method       acquire_many                   L632-650  [exported]  pub fn acquire_many(&self, n: u32) -> ...
  method       try_acquire                    L680-688  [exported]  pub fn try_acquire(&self) -> Result<...>
  method       close                          L963-965  [exported]  pub fn close(&self)
  method       is_closed                      L968-970  [exported]  pub fn is_closed(&self) -> bool
  ...

45 entity(ies) in tokio/src/sync/semaphore.rs
```

This is how agents understand a file without reading all 1,200 lines.

---

### Ask a question (RAG)

Natural language over the knowledge graph. The LLM queries the KG, reads
source, and synthesizes an answer:

```
$ atomic query ask "how does the Semaphore handle permit acquisition?"

The Semaphore uses a two-layer implementation:

1. The public `Semaphore` in `tokio/src/sync/semaphore.rs` (L398) wraps a
   low-level `batch_semaphore::Semaphore` in `tokio/src/sync/batch_semaphore.rs`.

2. `acquire()` (L585) calls `ll::Semaphore::acquire(1)` which uses an
   intrusive linked list of waiters. When permits are available, it returns
   immediately. Otherwise, the current task is added to the wait queue.

3. `add_permits()` (L539) wakes waiters in FIFO order, maintaining fairness.

4. The `SemaphorePermit` destructor (L1197) returns permits on drop via
   `ll.release()`, which then wakes the next waiter.

  — claude-sonnet-4-5 (3 turns, 6.1s, 2140 in + 489 out tokens)
```

---

### Visualize the graph

Generate an interactive HTML graph from any search query:

```
$ atomic vault query graph "sync" -o sync-graph.html

Opening graph (156 nodes, 243 edges) in browser...
```

Or produce Graphviz DOT for static renders:

```
$ atomic query graph "Semaphore" --dot -k 5 | dot -Tsvg -o semaphore.svg
```

---

## Part 2: Agent-Powered Development

### Open Claude Code with the Atomic integration

The `atomic-claude` package installs:
- **Hooks** — fire on session start, tool calls, turn end
- **Skills** — `/atomic-vault` and `/code-intelligence`
- **CLAUDE.md** — project instructions for the intent workflow

```
$ cd ~/Runnables/tokio
$ claude
```

### The agent creates an intent

> **User prompt:** "The Semaphore should support a try_acquire_many_owned
> that returns an error instead of panicking when requesting more than
> MAX_PERMITS"

The intent agent:

1. Creates an intent: `atomic vault intent create --title "Semaphore: non-panicking try_acquire_many_owned"`
2. **Uses code intelligence to search** — not grep, not find:

```
atomic vault query search "Semaphore"
atomic vault query entities tokio/src/sync/semaphore.rs
atomic vault query code "try_acquire_many_owned" -t rs
atomic vault query neighbors "entity:tokio/src/sync/semaphore.rs:try_acquire_many_owned:921"
```

3. Asks clarifying questions based on what it found
4. Writes the intent file with problem statement, acceptance criteria, and TODOs
5. Each TODO names **specific files and line ranges** found via the KG

The agent never uses `Grep` or `Glob` — those tools are not in its tool list.
It has `Bash` (for `atomic vault query` commands) and `Read` (for intent files).
The `code-intelligence` skill teaches it the query patterns.

### The build agent executes

A build agent picks up the TODOs, makes edits, runs tests. Each turn is
automatically recorded as an Atomic change with full provenance:

- Session ID and turn number
- Model name and token usage
- Causal decision graph (goal → exploration → commitment → verification)

---

## Part 3: Provenance & Attribution

### View the project state

```
$ atomic view list --verbose

  dev     [shared]    (0 changes)  state: AAAAAAAAAAAA
* master  [shared]    (4511 changes)  state: KJRM7HJVZNX2
```

When an agent session runs, it creates a draft view:

```
$ atomic view list --verbose

  dev                            [shared]  (0 changes)  state: AAAAAAAAAAAA
  agent-ses_a7f3bc12...          [draft]   (3 changes)  parent: master
* master                         [shared]  (4511 changes)  state: KJRM7HJVZNX2
```

### Inspect a change with embedded AI provenance

For agent-recorded changes, the default view renders the first embedded provenance entry as `=== Attestation ===`, then renders the associated Change Ledger:

```
$ atomic change <hash>

change XMJZ3IPF (#4512)
Author: claude+60f5 <lee@atomic.dev>
Date:   2026-06-14 15:23:41

    feat: add non-panicking try_acquire_many_owned to Semaphore

Dependencies: 1
  JET66XFVS5TR...

Graph: +3 vertices, ~5 edges, 2,341 bytes
Files changed: 2
  ± tokio/src/sync/semaphore.rs (+1 span, ~2 edges: insert, replace)
  ± tokio/src/sync/batch_semaphore.rs (+1 span, ~1 edge: insert)

=== Attestation ===
  Vendor:  Anthropic
  Model:   claude-sonnet-4-5
  Tool:    Cli("claude-code")
  Type:    Complete
  Tokens:
    Input:  3412
    Output: 891
    Total:  4303
  Cost:    $0.018000 USD
  Session: ses_a7f3bc12...
```

This provenance is in the **hashed section** — it's part of the change's cryptographic identity. Tamper with the attribution, and the hash changes. Despite the display heading, it is not the separate session-level attestation artifact listed by `atomic agent attest`.

### Inspect the provenance decision graph

The same default output continues with the causal DAG — not just what changed, but the observed activity associated with **why** it changed:

```
=== Change Ledger ===
  Session: ses_a7f3bc12...
  Agent:   Claude Code (anthropic)
  Nodes:   7  Edges: 6  Changes: 1

  goal » Fix Semaphore try_acquire_many_owned to return error instead of panicking
  exploration » atomic vault query entities tokio/src/sync/semaphore.rs [bash] (120ms)
  exploration » atomic vault query code "try_acquire_many_owned" -t rs [bash] (85ms)
  exploration » Read tokio/src/sync/batch_semaphore.rs L79-120 [read] (12ms)
  commitment » Edit tokio/src/sync/semaphore.rs L921-932 [edit] (45ms)
  commitment » Edit tokio/src/sync/batch_semaphore.rs L95-98 [edit] (32ms)
  verification » cargo test --lib sync::semaphore [bash] (3200ms)
```

Every tool call is classified: exploration (read-only), commitment (file edit), or verification (test run). Inferred causal edges connect the observations — the exploration preceded the commitment, and the commitment was followed by the test.

This graph is content-addressed and pushes to remotes alongside the change.
Your team reviews not just the code, but the observed workflow and inferred decision links associated with it.

---

## The Full Loop

```
atomic vault query enrich          # Build the knowledge graph
atomic vault query search "X"      # Find structure
atomic vault query code "X"        # Find source text
atomic vault query neighbors N     # Follow relationships
atomic vault query entities F      # Get file outline
atomic vault query ask "Q"         # Ask a question (RAG + LLM)
atomic vault query graph "X"       # Visualize

claude                             # Agent uses code-intelligence skill
                                   # → queries the KG instead of grep/find
                                   # → creates intents with real file paths
                                   # → changes recorded with full provenance

atomic view list --verbose         # See agent views
atomic change <hash>               # Code, AI metadata, and Change Ledger
```

One connected toolchain, from code intelligence to agent development to tamper-evident attribution and review.
