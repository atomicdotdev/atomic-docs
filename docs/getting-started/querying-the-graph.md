---
sidebar_position: 4
title: Querying the Graph
---

# Querying the Knowledge Graph

After you import or create a repository, Atomic can build a **knowledge graph** (KG) from your codebase. The knowledge graph maps out your files, functions, structs, classes, changes, views, modules, and the relationships between them — who changed what, which file defines which entity, what depends on what.

This isn't just metadata. It's a queryable model of your entire project that powers:

- **Code search** — find source text across your repo with content indexing
- **Structural search** — find entities by name, kind, or relationship
- **Dependency exploration** — trace how files, changes, and entities connect
- **AI agent workflows** — agents use the KG instead of grep/find for faster, more accurate code discovery

All of these capabilities live under a single command: `atomic vault query`.

:::info
The knowledge graph is especially important for [AI Agent Workflows](/getting-started/ai-agent-workflows). Agent integrations install a code-intelligence skill that teaches agents to query the KG instead of scanning the filesystem. If you're setting up Atomic for agent use, this page is essential reading.
:::

## Building the Knowledge Graph

Before you can query anything, you need to populate the knowledge graph. Run:

```bash
atomic vault query enrich
```

This walks your repository and extracts everything it can find:

```
Enriching views... ✓ 3 view(s)
Enriching files... ✓ 42 file(s)
Enriching modules... ✓ 8 module(s)
Enriching changes... ✓ 15 change(s)
Extracting entities (tree-sitter)... ✓ 217 entit(ies)
Resolving includes... ✓ 31 include(s)
Building content index... ✓ 42 file(s) indexed (1.2 MB)

Enriched: 3 views, 42 files, 8 modules, 15 changes, 217 entities, 31 includes
```

Here's what each phase does:

| Phase | What it extracts |
|-------|-----------------|
| **Views** | All views in the repository (main, dev, feature branches) |
| **Files** | Every tracked file, with path and metadata |
| **Modules** | Logical groupings of files (crates, packages, directories) |
| **Changes** | Every recorded change, with author and message |
| **Entities** | Functions, structs, classes, constants — parsed with tree-sitter AST |
| **Includes** | Import/include relationships between files |
| **Content index** | Full-text search index over file contents |

You can re-run `enrich` at any time to pick up new changes. It's idempotent.

:::tip
Run `enrich` after importing a Git repository or after a large pull. The KG doesn't update automatically — you control when it rebuilds.
:::

## Searching Source Code

The `code` subcommand searches the content index built by `enrich`. Think of it as a faster, KG-aware alternative to grep:

```bash
atomic vault query code "verify_token" -t rs
```

```
src/auth.rs:42: pub fn verify_token(token: &str) -> Result<Claims> {
src/auth.rs:55:     let decoded = verify_token_signature(&token)?;
src/middleware.rs:23:     let claims = auth::verify_token(&bearer)?;

3 match(es) in 2 file(s).
```

### Options

| Flag | Description |
|------|-------------|
| `<pattern>` | Search pattern (supports regex) |
| `-t, --file-type <TYPE>` | Restrict to file type: `rs`, `py`, `cpp`, `ts`, etc. |
| `-g, --path-filter <GLOB>` | Restrict to files matching a path glob |
| `-n, --max-results <N>` | Maximum results (default: 30) |
| `-i, --case-insensitive` | Case-insensitive search |
| `--json` | Output as JSON |

### Faceted Results

When there are more matches than the limit, `code` shows you how to narrow down:

```bash
atomic vault query code "replication" -t cpp
```

```
src/db/repl/coordinator.cpp:42: void ReplicationCoordinator::start() {
src/db/repl/coordinator.cpp:87: bool ReplicationCoordinator::replicate(OpLog& log) {
...

30 match(es) in 8 file(s).
  (142 total matches — showing top 30. Narrow with -g or -t.)

  Top directories:
    -g "src/db/repl/"                            87 matches
    -g "src/db/storage/"                         31 matches
    -g "src/db/catalog/"                         24 matches
```

This tells you exactly which `-g` filter to add to drill into the results you care about.

## Searching the Knowledge Graph

The `search` subcommand searches across all node types in the KG — entities, files, changes, and views — by keyword:

```bash
atomic vault query search "authentication"
```

```
  [entity] entity:src/auth.rs:verify_token:42  Verifies JWT token signature
  [file] file:src/auth.rs  Authentication module
  [change] change:R4YQUAS2UZV5  fix: token validation edge case

3 result(s).
```

### Options

| Flag | Description |
|------|-------------|
| `<query>` | Search query text |
| `-k, --limit <N>` | Maximum results (default: 10) |
| `-t, --kind <KIND>` | Filter by node kind: `change`, `entity`, `file`, `view` |
| `--json` | Output as JSON |

### Filtering by Kind

Use `-t` to narrow results to a specific node type:

```bash
# Only entities (functions, structs, etc.)
atomic vault query search "session" -t entity

# Only changes
atomic vault query search "authentication" -t change

# Only files
atomic vault query search "auth" -t file
```

:::tip
`search` is structural — it finds nodes in the KG by their descriptions and names. For finding text *inside* files, use `code` instead.
:::

## Exploring Relationships

The `neighbors` subcommand is where the graph really shines. Give it a node ID, and it shows you everything connected to that node:

```bash
atomic vault query neighbors "file:src/auth.rs"
```

```
Nodes (5):
  [entity] entity:src/auth.rs:verify_token:42  Verifies JWT token signature
  [entity] entity:src/auth.rs:create_session:78  Creates a new user session
  [change] change:R4YQUAS2UZV5  fix: token validation edge case
  [change] change:ABC12345DEF6  feat: add session management
  [file] file:src/auth.rs  Authentication module

Edges (4):
  file:src/auth.rs →[DEFINES]→ entity:src/auth.rs:verify_token:42
  file:src/auth.rs →[DEFINES]→ entity:src/auth.rs:create_session:78
  change:R4YQUAS2UZV5 →[MODIFIES]→ file:src/auth.rs
  change:ABC12345DEF6 →[MODIFIES]→ file:src/auth.rs
```

From this single query, you can see:
- What entities the file defines (`DEFINES` edges)
- Which changes touched the file (`MODIFIES` edges)
- The full neighborhood of related nodes

### Options

| Flag | Description |
|------|-------------|
| `<node_id>` | Node ID to explore (see [Node ID Reference](#node-id-reference) below) |
| `-d, --depth <N>` | Traversal depth: `1` (direct neighbors) or `2` (neighbors of neighbors). Default: 1 |
| `--json` | Output as JSON |

### Deeper Traversal

Use `--depth 2` to see two hops out from a node. This is useful for understanding indirect relationships — for example, which *other files* were modified by the same changes that touched your file:

```bash
atomic vault query neighbors "file:src/auth.rs" --depth 2
```

### Exploring Changes

You can also start from a change to see what it affected:

```bash
atomic vault query neighbors "change:R4YQUAS2UZV5"
```

This shows you the files modified, the entities touched, which view the change is on, and who authored it.

## Listing File Entities

The `entities` subcommand parses a file with tree-sitter and lists all the structural entities it finds — functions, structs, classes, constants, traits, and more:

```bash
atomic vault query entities src/auth.rs
```

```
  function     verify_token                   L42-67   [exported]  pub fn verify_token(token: &str) -> Result<Claims>
  function     create_session                 L78-95   [exported]  pub fn create_session(user: &User) -> Session
  struct       Claims                         L10-16   [exported]  pub struct Claims
  struct       Session                        L18-25   [exported]  pub struct Session
  constant     TOKEN_EXPIRY                   L8-8     [exported]

5 entity(ies) in src/auth.rs
```

This gives you a file outline with:
- Entity kind (function, struct, constant, etc.)
- Name and line range
- Visibility (`[exported]` for public items)
- Signature preview

### Options

| Flag | Description |
|------|-------------|
| `<path>` | File path relative to repo root |
| `--json` | Output as JSON |

:::note
The `entities` subcommand requires tree-sitter support for the file's language. Rust, Python, TypeScript, JavaScript, C, C++, Go, Java, and many other languages are supported.
:::

## Visualizing the Graph

The `graph` subcommand generates a visual representation of the knowledge graph seeded from a search query. By default, it produces an interactive HTML page with a D3 force-directed layout:

```bash
atomic vault query graph "authentication" -o auth.html
```

```
Wrote 23 nodes, 31 edges to auth.html
```

Open `auth.html` in a browser to explore the graph interactively — drag nodes, zoom, click to inspect.

### Output Formats

**HTML** (default) — interactive D3 force-directed graph:
```bash
atomic vault query graph "authentication" -o auth.html
```

**DOT** — Graphviz format, pipe to `dot` for SVG/PNG:
```bash
atomic vault query graph "authentication" --dot | dot -Tsvg -o auth-graph.svg
```

**JSON** — machine-readable nodes and edges:
```bash
atomic vault query graph "authentication" --json
```

### Options

| Flag | Description |
|------|-------------|
| `<query>` | Search query to seed the graph |
| `-k, --limit <N>` | Maximum seed nodes from search (default: 10) |
| `--depth <N>` | Neighbor expansion depth: 1 or 2 (default: 1) |
| `-o, --output <PATH>` | Write to file (`.html`, `.dot`, or `.json`) |
| `--json` | Output JSON to stdout |
| `--dot` | Output DOT to stdout |
| `--max-nodes <N>` | Maximum nodes (default: 5000 for HTML, 200 for DOT) |
| `--kinds <KINDS>` | Comma-separated node kinds to include |
| `--changes-per-seed <N>` | Max change nodes per seed during expansion (default: 5, 0 = unlimited) |

:::tip
For large codebases, use `--kinds` to filter the visualization. For example, `--kinds entity,file` hides change nodes and shows only code structure.
:::

## Managing the Index

Three subcommands help you maintain the search index and KG:

### `index` — Update the content search index

```bash
atomic vault query index --stats
```

```
Updating content index... done.
  files: 42, segments: 3, index size: 1.2 MB
```

| Flag | Description |
|------|-------------|
| `--rebuild` | Full rebuild instead of incremental update |
| `--stats` | Show index statistics after building |

### `reindex` — Rebuild the KG index from vault entries

```bash
atomic vault query reindex
```

```
Indexed 342 nodes + edges.
```

### `embed` — Rebuild embeddings for vault content

```bash
atomic vault query embed
```

```
Using embedding provider: text-embedding-3-small (1536d)
Embedded 47 total chunks.
```

| Flag | Description |
|------|-------------|
| `-p, --path <PATH>` | Embed only a specific vault entry path |

:::info
`embed` requires an API key for an embedding provider (`OPENAI_API_KEY` or similar). Embeddings power semantic search in the `ask` subcommand.
:::

## Structured Query Plans

The `plan` subcommand executes a multi-step query plan from JSON on stdin. This is primarily used by tooling and agents that need to chain KG operations programmatically:

```bash
echo '{"steps":[{"type":"kg_search","query":"auth","limit":5}]}' | atomic vault query plan
```

```
Plan executed in 12ms (1 steps)

  Step 1: kg_search → 5 results (12ms)

Nodes (5):
  [entity] verify_token: Verifies JWT token signature
  [file] src/auth.rs: Authentication module
  ...
```

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable output |

Each step in the plan corresponds to a KG operation (search, neighbors, code search, etc.), and steps can reference results from previous steps.

## Asking Questions with AI

The `ask` subcommand combines the knowledge graph with an LLM to answer natural language questions about your codebase. It uses retrieval-augmented generation (RAG) — querying the KG first, then passing relevant context to the model:

```bash
atomic vault query ask "what does the authentication module depend on?"
```

```
The authentication module (src/auth.rs) depends on:
- `jsonwebtoken` for JWT verification (verify_token_signature)
- `chrono` for token expiry validation
- The `Session` struct from the same module for session creation

  — claude-sonnet-4-5 (3 turns, 4.2s, 1240 in + 312 out tokens)
```

### Options

| Flag | Description |
|------|-------------|
| `<question>` | Natural language question |
| `-t, --max-turns <N>` | Maximum agentic tool-use turns (default: 5) |
| `--json` | Output as JSON (includes tool trace) |
| `-v, --verbose` | Show live tool calls as they execute |

The agent behind `ask` can use all the KG query tools (`code`, `search`, `neighbors`, `entities`) in a loop to find the answer, similar to how an AI coding agent explores a codebase.

:::note
Requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set in your environment.
:::

## How Agents Use Code Intelligence

When you install an agent integration like `atomic-claude` or `atomic-codex`, it includes a **code-intelligence skill** that teaches the agent to use `atomic vault query` commands instead of raw filesystem tools like grep and find.

The mapping works like this:

| Agent goal | Query command |
|-----------|---------------|
| Find text in source code | `atomic vault query code "pattern"` |
| Find where something is defined | `atomic vault query search` or `entities` |
| See what a file contains | `atomic vault query entities <path>` |
| Understand dependencies | `atomic vault query neighbors <node_id>` |
| See what a change affected | `atomic vault query neighbors "change:HASH"` |
| Visual exploration | `atomic vault query graph "topic"` |

The recommended agent workflow is:

1. **`code`** — find relevant source text (replaces grep)
2. **`search`** — find structural relationships (replaces find + grep)
3. **`neighbors`** — explore connections from any node
4. **`entities`** — get a file outline without reading the whole file
5. **Read file** — read only the specific lines you need

This approach is faster and more accurate than scanning the filesystem because the KG already knows the structure. An agent doesn't need to guess file paths or parse import statements — the relationships are pre-computed.

:::tip
If your KG results seem sparse after a fresh import, run `atomic vault query enrich` to populate it. The agent skill instructions tell agents to do this automatically if queries return empty results.
:::

→ [Installing Agent Integrations](/agents/installing-agent-integrations)

## Node ID Reference

Every node in the knowledge graph has a typed ID. You'll use these with `neighbors` and anywhere a node ID is expected:

| Prefix | Format | Example |
|--------|--------|---------|
| `entity:` | `entity:<file>:<name>:<line>` | `entity:src/auth.rs:verify_token:42` |
| `file:` | `file:<path>` | `file:src/auth.rs` |
| `change:` | `change:<hash>` | `change:R4YQUAS2UZV5` |
| `view:` | `view:<name>` | `view:main` |
| `intent:` | `intent:<id>` | `intent:ATOM-42` |
| `goal:` | `goal:<name>` | `goal:ambient-graph-phase-9` |

## Edge Types

These are the relationship types in the knowledge graph:

| Edge | From → To | Meaning |
|------|-----------|---------|
| `MODIFIES` | change → file | This change touched this file |
| `DEFINES` | file → entity | This file defines this function/struct/class |
| `AUTHORED_BY` | change → identity | Who authored this change |
| `DEPENDS_ON` | change → change | This change depends on another |
| `REFERENCES` | entity → entity | Code reference between entities |
| `ON_VIEW` | change → view | This change is on this view |
| `PART_OF` | file → module | This file belongs to this module |
| `INCLUDES` | file → file | This file includes/imports another |

## What's Next

- [AI Agent Workflows](/getting-started/ai-agent-workflows) — How agents use Atomic for provenance, isolation, and automated recording
- [Installing Agent Integrations](/agents/installing-agent-integrations) — Set up `atomic-claude`, `atomic-codex`, and other agent packages
- [Command Reference](/commands/overview) — Full CLI documentation for all Atomic commands
