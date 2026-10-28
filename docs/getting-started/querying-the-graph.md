---
sidebar_position: 4
title: Querying the Graph
---

# Querying the Knowledge Graph

After you import or create a repository, Atomic can project a **knowledge graph** (KG) over your codebase. The KG maps out your files, changes, views, identities, and workflow resources (intents, goals, sessions, and more) — who changed what, which view a change is on, and how changes depend on each other.

Code structure (functions, structs, classes, imports, calls) is **parsed live from source** rather than persisted in the KG. The KG classifies changes, files, views, and workflow resources using class IRIs from the Atomic workflow ontology (`https://atomic.dev/ns/workflow#`).

This isn't just metadata. It's a queryable model of your entire project that powers:

- **Code search** — find source text across your repo with content indexing
- **Structural search** — find KG nodes by class, label, or summary
- **Dependency exploration** — trace how files, changes, and views connect
- **AI agent workflows** — agents use the KG instead of grep/find for faster, more accurate code discovery

All of these capabilities live under a single command: `atomic query`.

:::info
The knowledge graph is especially important for [AI Agent Workflows](/getting-started/ai-agent-workflows). Agent integrations install a code-intelligence skill that teaches agents to query the KG instead of scanning the filesystem. If you're setting up Atomic for agent use, this page is essential reading.
:::

## Building the Knowledge Graph

Before you can query anything, you need to project the KG. Run:

```bash
atomic query reindex --full
```

This projects the workflow ontology over your repository's changes and views:

```
Projecting workflow graph... ✓
Views: 3
Changes: 15
Identities: 2

KG generation: 2
```

You can re-run `reindex --full` at any time to reproject the graph. It's idempotent and replaces the derived KG tables atomically — the core VCS graph is never touched.

:::warning Ignored files and folders are not included
Anything your ignore patterns exclude is **intentionally excluded** from code intelligence too — not indexed, not searchable, not graphed. See [What's Indexed — and What's Intentionally Excluded](#whats-indexed--and-whats-intentionally-excluded) below before you conclude a search is broken.
:::

## What's Indexed — and What's Intentionally Excluded

**Ignored files and folders are not included in the knowledge graph or the content index. They are intentionally excluded.** Ignore patterns define what is not part of your project; code intelligence follows the same policy that `status` and `add` already follow.

With this `.gitignore`:

```bash
node_modules/
target/
dist/
*.log
```

…`node_modules/`, `target/`, `dist/`, and every `*.log` file are:

- **Not** in the content index — `atomic query code "…"` never returns a match from them
- **Not** tracked, and therefore never appear as `file:` nodes or in `search` results
- **Not** visualized by `atomic query graph`

This is deliberate, not a stale or incomplete index. If a search doesn't find text you know exists, check whether the file matches an ignore pattern before debugging anything else.

### Which ignore rules apply

| Rule source | Honored by code intelligence |
|-------------|------------------------------|
| `.gitignore` | Yes |
| `.ignore` | Yes |
| `.atomicignore` | Yes — and it wins on conflicting patterns, so a `!pattern` there re-includes something `.gitignore` excludes |
| Global ignore file (`~/.atomic/ignore`) | Yes |
| Nested ignore files inside subdirectories | No — only the ignore files at the repository root are read |

### Atomic-internal paths are also excluded

`.atomic/`, `.git/`, `.vault/`, and `.atomic-sandbox*` are never reprojected or indexed. Vault content is already queryable through its own KG nodes (`intent:`, `memory:`, `goal:`), so a `file:.vault/…` node would only duplicate it.

### Size and binary limits

The content index also skips files larger than **10 MiB** and files whose contents are detected as binary.

### What happens when a file becomes ignored

Ignore rules govern the *discovery* of new paths, so the effect depends on the surface:

| Query surface | Behavior for ignored paths |
|---------------|----------------------------|
| Content search (`query code`) | Excluded. A pattern that starts matching a file removes it from the index at the next `reindex --full` or `index --rebuild` — even if the file was already recorded |
| VCS-derived KG nodes (`file:`, `change:`) | A recorded change is an immutable fact: the nodes it created remain until `atomic query reindex --full` reconciles stale entries |
| Structure queries (`query entities`, `query callers`) | Parsed on demand from tracked file contents, so a file that is tracked but currently ignored still parses |

### Making an ignored file searchable

Remove the pattern (or re-include the path with `!` in `.atomicignore`), then rebuild:

```bash
atomic query index --rebuild    # rebuild the content index
atomic query reindex --full     # reproject the graph's file/change nodes
```

:::tip Why not index everything?
Ignored directories are where build output and dependencies live. Indexing them multiplies index size and slows every search without adding signal — the same reason `atomic status` skips them. If you genuinely want a file in code intelligence, stop ignoring it.
:::

:::tip
Run `reindex --full` after importing a Git repository or after a large pull. The KG doesn't update automatically — you control when it reprojects. Lightweight and read-only opens do not run the migration; KG reads on an old generation report `KgNeedsRebuild`.
:::

## Searching Source Code

The `code` subcommand searches the content index built by `reindex --full`. Think of it as a faster, KG-aware alternative to grep:

```bash
atomic query code "verify_token" -t rs
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
atomic query code "replication" -t cpp
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

The `search` subcommand searches across all node types in the KG — files, changes, views, identities, and workflow resources — by keyword:

```bash
atomic query search "authentication"
```

```
  [file] file:src/auth.rs  Authentication module
  [change] change:R4YQUAS2UZV5  fix: token validation edge case
  [view] view:main  Shared view, 42 changes

3 result(s).
```

### Options

| Flag | Description |
|------|-------------|
| `<query>` | Search query text |
| `-k, --limit <N>` | Maximum results (default: 10) |
| `-t, --kind <KIND>` | Filter by class IRI suffix: `Change`, `File`, `View`, `Identity`, `WorkIntent`, `Goal`, etc. |
| `--json` | Output as JSON |

### Filtering by Kind

Use `-t` to narrow results to a specific node class:

```bash
# Only changes
atomic query search "authentication" -t Change

# Only files
atomic query search "auth" -t File

# Only views
atomic query search "main" -t View
```

:::tip
`search` is structural — it finds nodes in the KG by their class, descriptions, and names. For finding text *inside* files, use `code` instead. Code entities (functions, structs, classes) are parsed live from source and are not KG nodes; use `entities` for file outlines.
:::

## Exploring Relationships

The `neighbors` subcommand is where the graph really shines. Give it a node ID, and it shows you everything connected to that node:

```bash
atomic query neighbors "file:src/auth.rs"
```

```
Nodes (4):
  [change] change:R4YQUAS2UZV5  fix: token validation edge case
  [change] change:ABC12345DEF6  feat: add session management
  [view] view:main  Shared view, 42 changes
  [file] file:src/auth.rs  Authentication module

Edges (4):
  change:R4YQUAS2UZV5 →[https://atomic.dev/ns/workflow#modifiesFile]→ file:src/auth.rs
  change:ABC12345DEF6 →[https://atomic.dev/ns/workflow#modifiesFile]→ file:src/auth.rs
  change:R4YQUAS2UZV5 →[https://atomic.dev/ns/workflow#directlyOnView]→ view:main
  change:ABC12345DEF6 →[https://atomic.dev/ns/workflow#directlyOnView]→ view:main
```

From this single query, you can see:
- Which changes touched the file (`modifiesFile` edges)
- Which view each change is on (`directlyOnView` edges)
- The full neighborhood of related nodes

Code entities (functions, structs, classes) are not KG nodes — they're parsed live from source. Use the `entities` subcommand for file outlines.

### Options

| Flag | Description |
|------|-------------|
| `<node_id>` | Node ID to explore (see [Node ID Reference](#node-id-reference) below) |
| `-d, --depth <N>` | Traversal depth: `1` (direct neighbors) or `2` (neighbors of neighbors). Default: 1 |
| `--json` | Output as JSON |

### Deeper Traversal

Use `--depth 2` to see two hops out from a node. This is useful for understanding indirect relationships — for example, which *other files* were modified by the same changes that touched your file:

```bash
atomic query neighbors "file:src/auth.rs" --depth 2
```

### Exploring Changes

You can also start from a change to see what it affected:

```bash
atomic query neighbors "change:R4YQUAS2UZV5"
```

This shows you the files modified, which view the change is on, and who authored it. Code entities touched by the change are parsed live from source — use `entities <path>` for file outlines.

## Listing File Entities

The `entities` subcommand parses a file with tree-sitter and lists all the structural entities it finds — functions, structs, classes, constants, traits, and more. Code entities are **parsed live from source** and are not persisted in the KG:

```bash
atomic query entities src/auth.rs
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
atomic query graph "authentication" -o auth.html
```

```
Wrote 23 nodes, 31 edges to auth.html
```

Open `auth.html` in a browser to explore the graph interactively — drag nodes, zoom, click to inspect.

### Output Formats

**HTML** (default) — interactive D3 force-directed graph:
```bash
atomic query graph "authentication" -o auth.html
```

**DOT** — Graphviz format, pipe to `dot` for SVG/PNG:
```bash
atomic query graph "authentication" --dot | dot -Tsvg -o auth-graph.svg
```

**JSON** — machine-readable nodes and edges:
```bash
atomic query graph "authentication" --json
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
| `--kinds <KINDS>` | Comma-separated class IRI suffixes to include (e.g. `Change,File,View`) |
| `--changes-per-seed <N>` | Max change nodes per seed during expansion (default: 5, 0 = unlimited) |

:::tip
For large codebases, use `--kinds` to filter the visualization. For example, `--kinds Change,File` hides workflow nodes and shows only changes and files. Code entities are not KG nodes and won't appear in the graph.
:::

## Managing the Index

Three subcommands help you maintain the search index and KG:

### `index` — Update the content search index

```bash
atomic query index --stats
```

```
Updating content index... done.
  files: 42, segments: 3, index size: 1.2 MB
```

| Flag | Description |
|------|-------------|
| `--rebuild` | Full rebuild instead of incremental update |
| `--stats` | Show index statistics after building |

### `reindex` — Rebuild the KG projection

```bash
atomic query reindex --full
```

```
Projecting workflow graph... ✓
Views: 3
Changes: 15
Identities: 2

KG generation: 2
```

The first full writable open mints an unsigned upgrade identity if needed and reprojects the derived graph once. Lightweight, repair, and read-only opens do not run the migration. KG reads on an old generation report `KgNeedsRebuild`; ordinary repository reads remain available.

:::warning
Once a repository is reprojected to KG generation 2, older Atomic builds cannot open it — they lack the `kg-semweb-v1` required capability. This is a one-way cutover.
:::

### `validate` — Evaluate SHACL shapes

Run builtin or local enterprise SHACL shapes over the workflow snapshot:

```bash
atomic query validate --format json
atomic query validate --profile publication --format json
atomic query validate --shape <shape-iri> --node <resource-iri>
```

Validation runs locally in the CLI using PurRDF 3.0.1. Exit codes are **0** for conformance, **1** for violations, and **3** for shape or engine errors.

### `embed` — Rebuild embeddings for vault content

```bash
atomic query embed
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
echo '{"steps":[{"type":"kg_search","query":"auth","limit":5}]}' | atomic query plan
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
atomic query ask "what does the authentication module depend on?"
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

When you install an agent integration like `atomic-claude` or `atomic-codex`, it includes a **code-intelligence skill** that teaches the agent to use `atomic query` commands instead of raw filesystem tools like grep and find.

The mapping works like this:

| Agent goal | Query command |
|-----------|---------------|
| Find text in source code | `atomic query code "pattern"` |
| Find where something is defined | `atomic query search` or `entities` |
| See what a file contains | `atomic query entities <path>` |
| Understand dependencies | `atomic query neighbors <node_id>` |
| See what a change affected | `atomic query neighbors "change:HASH"` |
| Visual exploration | `atomic query graph "topic"` |

The recommended agent workflow is:

1. **`code`** — find relevant source text (replaces grep)
2. **`search`** — find structural relationships (replaces find + grep)
3. **`neighbors`** — explore connections from any node
4. **`entities`** — get a file outline without reading the whole file
5. **Read file** — read only the specific lines you need

This approach is faster and more accurate than scanning the filesystem because the KG already knows the structure. An agent doesn't need to guess file paths or parse import statements — the relationships are pre-computed.

:::info Empty results vs. ignored files
Ignored files and folders are intentionally excluded from the KG and the content index, so `code` and `search` return nothing for them. An agent should treat that as an answer, not a failure — and should not fall back to grep/find to read them. If the file genuinely matters, remove the ignore pattern and rebuild the index.
:::

:::tip
If your KG results seem sparse after a fresh import, run `atomic query reindex --full` to populate it. The agent skill instructions tell agents to do this automatically if queries return empty results.
:::

→ [Installing Agent Integrations](/agents/installing-agent-integrations)

## Node ID Reference

Every node in the knowledge graph has a typed ID. You'll use these with `neighbors` and anywhere a node ID is expected:

| Prefix | Format | Example |
|--------|--------|---------|
| `file:` | `file:<path>` | `file:src/auth.rs` |
| `change:` | `change:<hash>` | `change:R4YQUAS2UZV5` |
| `view:` | `view:<name>` | `view:main` |
| `identity:` | `did:atomic:<base32>` | `did:atomic:R4YQUAS2UZV5...` |

Code entities (functions, structs, classes) are not KG nodes — they're parsed live from source and don't have stable KG IDs.

## Edge Types

KG edges use absolute predicate IRIs from the Atomic workflow ontology (`https://atomic.dev/ns/workflow#`). In output, they're often shown in compact form (`atomic:predicateName`):

| Edge (IRI) | Compact | From → To | Meaning |
|------------|---------|-----------|---------|
| `https://atomic.dev/ns/workflow#modifiesFile` | `atomic:modifiesFile` | change → file | This change touched this file |
| `https://atomic.dev/ns/workflow#authoredBy` | `atomic:authoredBy` | change → identity | Who authored this change |
| `https://atomic.dev/ns/workflow#directlyDependsOnChange` | `atomic:directlyDependsOnChange` | change → change | This change directly depends on another |
| `https://atomic.dev/ns/workflow#directlyOnView` | `atomic:directlyOnView` | change → view | This change is on this view |
| `https://atomic.dev/ns/workflow#references` | `atomic:references` | thing → thing | Generic reference relationship |

Class assertions (e.g. `rdf:type`) are stored in `kg_types`, not as neighborhood edges. Use `-t <Class>` with `search` or `neighbors` to filter by class.

## What's Next

- [AI Agent Workflows](/getting-started/ai-agent-workflows) — How agents use Atomic for provenance, isolation, and automated recording
- [Installing Agent Integrations](/agents/installing-agent-integrations) — Set up `atomic-claude`, `atomic-codex`, and other agent packages
- [Command Reference](/commands/overview) — Full CLI documentation for all Atomic commands
