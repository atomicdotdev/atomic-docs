---
sidebar_position: 24
title: query
---

# atomic query

Query the knowledge graph.

## Synopsis

```bash
atomic query <SUBCOMMAND>
atomic query search <QUERY> [-k <LIMIT>] [-t <KIND>] [--json]
atomic query neighbors <NODE_ID> [-d <DEPTH>] [--json]
atomic query callers <ENTITY_ID> [--json]
atomic query entities <PATH> [--json]
atomic query code <PATTERN> [-g <PATH_FILTER>] [-t <FILE_TYPE>] [-n <MAX>] [-i] [--json]
atomic query graph <QUERY> [--depth <DEPTH>] [-o <FILE>] [--json | --dot]
atomic query index [--rebuild] [--stats]
atomic query embed [-p <PATH>]
atomic query enrich [--change <FULL_HASH>] [--rebuild]
atomic query reindex
atomic query plan [--json]
atomic query ask <QUESTION> [-t <MAX_TURNS>] [--json]
```

## Description

`atomic query` is the read surface of Atomic's **knowledge graph (KG)**, a graph that connects code entities, files, changes, views, and vault content (memories, intents, goals) into one searchable structure. The graph is fed from three directions:

- **VCS data** — recorded changes, files, and views (via [`enrich`](#query-enrich---enrich-the-graph-from-vcs-data))
- **Code structure** — tree-sitter entities (functions, classes, types) and the syntext content index
- **Vault content** — memories, intents, and goals ([`atomic vault`](vault.md))

### Identifier Requirements

Several subcommands take node or entity IDs. IDs are **namespaced** — use the right namespace and the right discovery command:

| ID type | Format | Where to find it |
|---------|--------|------------------|
| KG node ID | `change:abc123`, `file:src/auth.rs`, `intent:PIMO-1`, `memory:…`, `view:…` | [`query search`](#query-search---search-the-graph) |
| Entity ID | `entity:src/auth.rs:verify:42` (file : name : line) | [`query entities <PATH>`](#query-entities---list-entities-in-a-file) or `query search --kind entity` |
| Change hash | full hash only for `enrich --change` | `atomic log --full-hash` |

## Subcommands

### Search & Exploration

### `query search` — Search the Graph

Keyword search over node IDs, labels, and summaries.

#### Synopsis

```bash
atomic query search <QUERY> [OPTIONS]
```

#### Arguments

**`<QUERY>`** — Search query text.

#### Options

| Option | Description |
|--------|-------------|
| `-k, --limit <LIMIT>` | Maximum results (default: 10) |
| `-t, --kind <KIND>` | Filter by node kind (`change`, `entity`, `file`, `view`, `memory`, `intent`, `goal`) |
| `-p, --pool <POOL>` | Candidate pool size |
| `--json` | Output as JSON |

#### Examples

```bash
# Find nodes related to authentication
atomic query search "authentication tokens"

# Find entity nodes only, as JSON
atomic query search "verify" --kind entity --json
```

### `query neighbors` — Get a Node's Neighborhood

#### Synopsis

```bash
atomic query neighbors <NODE_ID> [OPTIONS]
```

#### Arguments

**`<NODE_ID>`** — A namespaced KG node ID, e.g. `change:abc123`, `file:src/auth.rs`, `intent:PIMO-1` (see [Identifier Requirements](#identifier-requirements)).

#### Options

| Option | Description |
|--------|-------------|
| `-d, --depth <DEPTH>` | Traversal depth (1 or 2) (default: 1) |
| `--json` | Output as JSON |

#### Examples

```bash
# What is connected to this intent?
atomic query neighbors intent:PIMO-1

# Two hops out, machine-readable
atomic query neighbors file:src/auth.rs --depth 2 --json
```

### `query callers` — Find Callers of an Entity

#### Synopsis

```bash
atomic query callers <ENTITY_ID> [OPTIONS]
```

#### Arguments

**`<ENTITY_ID>`** — Full entity node ID, e.g. `entity:src/auth.rs:verify:42`. Get entity IDs with `atomic query entities <path>`.

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

#### Examples

```bash
atomic query entities src/auth.rs        # list entities and their IDs
atomic query callers entity:src/auth.rs:verify:42
```

### `query entities` — List Entities in a File

List tree-sitter entities (functions, classes, types) in a source file.

#### Synopsis

```bash
atomic query entities <PATH> [OPTIONS]
```

#### Arguments

**`<PATH>`** — File path, relative to the repository root.

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

#### Examples

```bash
atomic query entities src/auth.rs
```

### `query code` — Search Source Code Content

Search source code content using the syntext index (regex supported).

#### Synopsis

```bash
atomic query code <PATTERN> [OPTIONS]
```

#### Arguments

**`<PATTERN>`** — Search pattern (regex supported).

#### Options

| Option | Description |
|--------|-------------|
| `-g, --path-filter <PATH_FILTER>` | Restrict to files matching this path pattern |
| `-t, --file-type <FILE_TYPE>` | Restrict to a file type (e.g. `rs`, `cpp`, `py`) |
| `-n, --max-results <MAX_RESULTS>` | Maximum results (default: 30) |
| `-i, --case-insensitive` | Case-insensitive search |
| `--json` | Output as JSON |

#### Examples

```bash
# Find token-issuing code in Rust files
atomic query code "issue_token" -t rs -g "src/"

# Case-insensitive, first 5 hits
atomic query code "BearerAuth" -i -n 5
```

### `query graph` — Visualize a Query

Build a visual graph seeded by a search query.

#### Synopsis

```bash
atomic query graph <QUERY> [OPTIONS]
```

#### Arguments

**`<QUERY>`** — Search query to seed the graph.

#### Options

| Option | Description |
|--------|-------------|
| `-k, --limit <LIMIT>` | Maximum seed nodes from search (default: 10) |
| `--depth <DEPTH>` | Neighbor expansion depth (1 or 2) (default: 1) |
| `-o, --output <FILE>` | Write output to a file. For HTML output (default), use an `.html` extension. If omitted, writes to stdout (DOT or JSON) or a temp file (HTML) and opens it |
| `--json` | Output as JSON (`nodes` + `edges` arrays) |
| `--dot` | Output as DOT (Graphviz) format instead of HTML |
| `--max-nodes <MAX_NODES>` | Maximum nodes in the graph (default: 5000 for HTML, 200 for DOT) |
| `--kinds <KINDS>` | Node kinds to include, comma-separated (default: all). e.g. `module,file,entity` for structure only, `change,file` for history |
| `--changes-per-seed <N>` | Maximum change nodes per seed during expansion (default: 5; `0` for unlimited). Prevents change history from flooding the graph |

#### Examples

```bash
# Interactive HTML graph of everything around "auth"
atomic query graph "authentication"

# Structure-only DOT graph for Graphviz
atomic query graph "auth" --kinds module,file,entity --dot > auth.dot
```

### `query ask` — Ask the Knowledge Graph (RAG)

Ask a natural-language question. The command runs a small agentic loop over KG tools (default 5 turns) and answers using graph content.

#### Synopsis

```bash
atomic query ask <QUESTION> [OPTIONS]
```

#### Arguments

**`<QUESTION>`** — Natural language question.

#### Options

| Option | Description |
|--------|-------------|
| `-t, --max-turns <MAX_TURNS>` | Maximum agentic tool-use turns (default: 5) |
| `--json` | Output as JSON (includes tool trace) |
| `-v, --verbose` | Show live tool calls as they execute |

#### Examples

```bash
atomic query ask "which changes touched the token refresh flow?"
atomic query ask "what does intent PIMO-1 cover?" --json
```

## Index Maintenance

### `query index` — Build the Content Search Index

Build or update the content search index used by [`query code`](#query-code---search-source-code-content).

#### Synopsis

```bash
atomic query index [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--rebuild` | Full rebuild instead of incremental update |
| `--stats` | Show index statistics after building |

### `query embed` — Rebuild Embeddings

Rebuild embeddings for vault content (used by semantic queries).

#### Synopsis

```bash
atomic query embed [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `-p, --path <PATH>` | Embed only this specific path |

### `query enrich` — Enrich the Graph from VCS Data

Derive KG nodes and edges from VCS data: changes, files, views. Run after recording work to make new changes searchable.

#### Synopsis

```bash
atomic query enrich [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--change <FULL_HASH>` | Enrich only this exact recorded change (repeat for multiple). Requires the **full hash** — no prefixes. Get it with `atomic log --full-hash`. Without this option, all VCS-derived KG data is rebuilt |
| `--rebuild` | Force a clean rebuild: drop all previously enriched VCS/AST-derived KG nodes (files, modules, views, changes, entities) before re-deriving them |

#### Examples

```bash
# Enrich everything new
atomic query enrich

# Enrich one change (full hash required — no prefixes)
atomic query enrich --change 3f9c2ab1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### `query reindex` — Rebuild the KG Index

Rebuild the KG index from all vault entries.

#### Synopsis

```bash
atomic query reindex
```

## Advanced

### `query plan` — Execute a Query Plan

Execute a structured query plan as JSON on stdin. Intended for programmatic use — compose one from `query search --json` output or write by hand.

#### Synopsis

```bash
atomic query plan [--json]
```

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

#### Examples

```bash
echo '{"query": "..."}' | atomic query plan
```

## See Also

- [vault](vault.md) — The shared knowledge store feeding the graph
- [log](log.md) — Change history (source of change hashes)
- [querying-the-graph guide](/getting-started/querying-the-graph) — Getting-started walkthrough
