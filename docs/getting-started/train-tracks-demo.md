---
sidebar_position: 6
title: Train Tracks Demo
---

# Train Tracks: A Guided Tour of a Live Atomic Project

This walkthrough tours a real Atomic project — a web-based **Train Tracks**
puzzle game — that was built end-to-end by an AI agent. It is designed to be
used two ways:

- **As a demo script.** Run the commands in order to show what Atomic captures
  that Git cannot: identities, views, intents, an agent session ledger, durable
  memories, and one queryable knowledge graph.
- **As a hands-on tour.** Clone the project yourself and follow along.

Every command below is read-only until the final section, so you can explore
freely without changing anything.

## Get the project

The demo project is hosted on Atomic Storage. Clone it and step inside:

```bash
atomic clone https://continuouslee.atomic.storage/workspaces/demos/projects/train-tracks/code
cd train-tracks
```

:::info
The project is public, but cloning requires an identity. If you
are running your own copy, substitute your own VCS URL — you can find it with
`atomic project show <workspace>/<project>`:

```
Name       : train-tracks
Slug       : train-tracks
Workspace  : 0636fea6-fbe4-4282-8232-e6b3873f99df
View       : dev
Visibility : public
Description: —
VCS URL    : https://continuouslee.atomic.storage/workspaces/demos/projects/train-tracks/code
Created    : 2026-08-07 09:48:26
Updated    : 2026-08-07 14:22:54
```
:::

## 1. Confirm this is an Atomic project

```bash
atomic --version
ls -la
```

Look for two directories that Git does not have:

- `.atomic/` — the content-addressed change graph (the code and its history).
- `.vault/` — the **why**: intents, memories, and durable project knowledge.

```bash
atomic --help
```

Note the commands a Git user has never seen: `intent`, `memory`, `session`,
`view`, `insert`, `query`, and `provenance`. The rest of this tour is built
around them.

## 2. Identity: who is signing all of this

Git records authorship on the honor system — a name and email string anyone can
type. Atomic identities are **Ed25519 keypairs**, and every change, intent, and
memory is cryptographically signed.

```bash
atomic identity whoami
atomic identity list -v
```

Identities have a **type** and a **usage context**:

| Type | Meaning |
| --- | --- |
| `user` | A human |
| `agent` | An automated actor (CI, a bot, an AI coding agent) |
| `delegated` | An agent acting on behalf of a human, under a signed delegation |

Show the keypair behind an identity and note its `did:atomic:…` identifier —
you will see the same DID again on the intents:

```bash
atomic identity show <name>
```

Now connect it to the history:

```bash
atomic log
```

The author line reads something like `opencode+ses0 <lee@atomic.dev>`. That is
**delegation in action**: the OpenCode agent, session 0, acting as a delegated
identity on behalf of the human `lee`. Atomic recorded that an AI agent did the
work *and* that a human delegated the authority — automatically. The human never
loses accountability, and the AI's contribution is never hidden.

_(Optional)_ Signatures are real and checkable:

```bash
echo -n "hello atomic" | atomic identity sign
```

## 3. Views: how the work is broken up

Atomic has no branches. It has **views** — filtered perspectives on one single
graph.

```bash
atomic view list
```

You will see something like:

```
dev                  [shared]   (2 changes)
* orange-night-44fb   [draft]    (4 changes, 2 inherited)  parent: dev
```

- The `*` marks the current view.
- `dev` is **shared** — the collaborative baseline.
- `orange-night-44fb` is a **draft** built on top of `dev` (`parent: dev`).
- "4 changes, 2 inherited" means the draft sees `dev`'s changes plus its own.
  Nothing was copied — a view is a filter over one canonical graph.

```text
  dev  (shared, 2 changes)
   │
   └── orange-night-44fb  (draft, parent=dev)
         sees: dev's 2 changes + its own 2  =  4 visible
```

## 4. The current history — and the provenance behind a change

```bash
atomic log
```

The change messages tell the story of the game being built up incrementally —
starting from "i want to build a train tracks puzzle game" and refining the
rules turn by turn.

Now drill into a single change. This is where Atomic goes far beyond a Git
commit: `atomic change` renders the change *plus* its AI attestation and the
causal decision graph that produced it — no extra flags required.

```bash
atomic change <hash>
```

The default output has three parts:

1. **The change itself** — hash, author, date, message, dependencies, and the
   files it touched.
2. **`=== Attestation ===`** — the AI provenance recorded inline in the change
   header: which vendor and model produced it, the tool, token usage
   (input / output / total), cost in USD, temperature, and the request and
   session IDs. This is how you prove *how* a change was made, not just who
   committed it.
3. **`=== Change Ledger ===`** — the causal decision DAG: the session and agent,
   node/edge/change counts, and each step the agent took — goals, tool
   executions, explorations, commitments, and patch proposals — that led to
   this change.

```text
change <hash>
Author: opencode+ses0 <lee@atomic.dev>
Date:   2026-08-07 10:22:47

    so you will need to do some math...

=== Attestation ===
  Vendor:  Anthropic
  Model:   claude-...
  Tool:    OpenCode
  Type:    ...
  Tokens:
    Input:  ...
    Output: ...
    Total:  ...
  Cost:    $0.00... USD
  Session: ...

=== Change Ledger ===
  Session: ...
  Agent:   OpenCode (anthropic)
  Nodes:   N  Edges: M  Changes: K

  goal      » ...
  tool_exec » ...  [read_file]  (12ms)
  commit    » ...
```

Git records *who* typed `git commit`. Atomic records *how* the change came to
exist — the model, the cost, and the chain of decisions — and signs it. In the
short log format, AI-assisted changes are even flagged with a 🤖 marker.

:::tip
For machine-readable provenance (to feed a dashboard or audit tool), use
`atomic change <hash> -f json` — the JSON includes a `provenance` object and a
`has_provenance` flag.
:::

## 5. The current status

```bash
atomic status
```

```
On view orange-night-44fb
State: BZQKAZLEFBGO...
nothing to record, working tree clean
```

That `State:` value is a Merkle hash — it *is* the identity of this view's
entire history. Change one thing and the hash changes. It is how Atomic syncs
and verifies integrity.

## 6. Intents: the "why" behind the work

Every unit of work started as an **intent** — a signed, validated statement of
the problem being solved.

```bash
atomic intent list
```

Every intent should show `done`, `fresh`, and attested `✓`. Open one in full:

```bash
atomic intent show TRAI::continuouslee::1
```

Walk through its structure:

- **Why** — the problem, not the solution.
- **Acceptance Criteria** — each `[x]` with a *verified by* line (e.g.
  `bun run build`).
- **Tasks** — each links to the criterion it satisfies and lists the exact files
  it touched.
- **In / Out of Scope + Constraints** — including honest notes about what was
  deliberately deferred.
- `author: did:atomic:…` and `signed: yes` — the same identity from
  `atomic identity show`, cryptographically attested.

An intent is a pull-request description, a spec, and an audit trail — enforced
*before* the work counts as done.

## 7. The session: what the agent actually did

In section 4 you saw provenance for a *single* change. `atomic session show`
zooms out to the whole session — the ordered ledger of every turn the agent
took across all its changes.

```bash
atomic session show
```

Where `atomic change` shows the decision graph for one change, the session
ledger stitches those graphs into one timeline: the full story behind the
`opencode+ses0` author you saw in the log. All of it was recorded automatically
when each turn ended — nothing was added by hand.

## 8. Memories: durable knowledge

Intents capture the *why* of a task. **Memories** capture durable lessons and
decisions that outlive any single task.

```bash
atomic memory list
atomic memory kinds
```

Memory kinds: `decision`, `lesson`, `constraint`, `preference`, `context`.
Open one:

```bash
atomic memory show <id>
```

Notice the **Derived From** section — each memory links back to the exact
acceptance criterion and intent that produced it (`wasDerivedFrom` edges). Six
months from now, the reasoning is still recoverable — no tribal knowledge lost.

## 9. The knowledge graph is queryable

Everything above — changes, files, entities, intents, memories, views — is one
connected graph. `atomic query` is how you interrogate it.

```text
  change:<hash> ──MODIFIES──▶ file:src/App.tsx ──DEFINES──▶ entity:file:name:line
       │                                                          │
    ON_VIEW                                                     CALLS
       ▼                                                          ▼
   view:dev                                            entity:file:name:line

  intent / memory ──REFERENCES──▶ file:src/App.tsx
```

The twelve subcommands group by purpose:

| Purpose | Subcommands |
| --- | --- |
| Find things | `search`, `code`, `entities` |
| Follow relationships | `neighbors`, `callers` |
| Visualize | `graph` |
| Ask in English | `ask`, `plan` |
| Maintain the index (mostly automatic) | `index`, `enrich`, `reindex`, `embed` |

### Node IDs

Every node has an ID of the form `kind:identifier`. The identifier is **not**
the human-facing name — it is derived from where the node lives:

| Node | ID format | Example |
| --- | --- | --- |
| File | `file:<path>` | `file:src/App.tsx` |
| Entity | `entity:<path>:<name>:<line>` | `entity:src/App.tsx:directionBetween:17` |
| Change | `change:<hash-prefix>` | `change:GT2RCG5W2WRI` |
| View | `view:<name>` | `view:dev` |
| Intent | `intent:<ULID>` (upper-cased) | `intent:01KZE7Y9M6V0GJ8EC94558MHAK` |
| Memory | `memory:<ulid>` (as stored) | `memory:01kze82jaq8b4akzagvqpqpswj` |

:::warning
These IDs must match **exactly**, and they are not the names you would guess:

- An intent's node ID is its **ULID**, not its human key.
  `intent:TRAI::continuouslee::1` will not resolve; the real ID is
  `intent:01KZE7Y9M6V0GJ8EC94558MHAK`.
- An entity's node ID includes the **line number** where it is defined.
  `entity:src/App.tsx:App:1` will not resolve, because `App` is defined lower
  in the file, not on line 1.

Because these IDs are not memorable, always **discover the exact ID first** —
with `atomic query search` for intents/memories, or `atomic query entities`
for code entities — then copy it verbatim into `neighbors` or `callers`.
:::

A demo flow:

```bash
# Keyword search across the whole graph (code AND reasoning)
atomic query search "track"
atomic query search "artwork" -k 20

# Search source content with path/type filters
atomic query code "routeTile" -t tsx

# List code entities (functions, components, types) in a file.
# Copy the exact ids it prints — they include line numbers.
atomic query entities src/App.tsx

# Follow relationships around a node
atomic query neighbors "file:src/App.tsx"

# Intents are keyed by ULID, not their human key. Discover the ID first...
atomic query search "train tracks framework"
# ...then pass the real node ID into neighbors:
atomic query neighbors "intent:01KZE7Y9M6V0GJ8EC94558MHAK" -d 2

# Blast radius: who calls this entity? Use a real id from `entities` above.
# Pick a helper that others call (e.g. directionBetween), not the root `App`
# component — nothing calls App, so it reports as an entry point.
# The line number must match what `entities` printed.
atomic query callers "entity:src/App.tsx:directionBetween:17"

# Callers reads CALLS edges. If it says none exist, populate them first:
#   atomic query enrich

# Visualize a subgraph — opens an interactive HTML view by default
atomic query graph "track" -k 10 --depth 2
atomic query graph "track" --dot | dot -Tsvg -o graph.svg

# Ask a question in plain English (RAG over the graph)
atomic query ask "why does the game use hand-drawn SVG track art?"
```

:::note
`atomic query ask` needs `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set for LLM
answers. Without a key it falls back to search-only mode — it still shows
relevant nodes, just no prose answer.
:::

## 10. The view lifecycle: insert, switch, delete

Everything so far was read-only. This final section modifies the repository, so
run it only on a copy you are comfortable changing.

**Insert** promotes a draft view's changes up into its parent. It is not a
cherry-pick — it adds a change reference plus its full dependency closure, an
O(1) metadata operation, because the edges already live in the shared graph.

```bash
# Preview the exact subcommand and flags first
atomic insert --help

# Promote the draft's changes up into dev
atomic insert

# Confirm dev's change count grew
atomic view list --verbose
```

**Switch** moves your working copy to another view:

```bash
atomic view switch dev
atomic view list --verbose
atomic status
```

**Delete** tears down the draft — safely, because its work now lives in `dev`:

```bash
# Confirm the delete subcommand name for your version
atomic view --help

atomic view delete orange-night-44fb
atomic view list --verbose
```

Deleting a draft removes only its view metadata and change-filter entries
(the view's `VIEW_CHANGES` and related bookkeeping). The work you inserted into
`dev` is untouched. There is no garbage collection to run — edges are
content-addressed and shared in the single canonical graph, so an edge that is
no longer referenced by any view simply stops being visible through a filter.
Nothing needs to be swept up, and there are no dangling records or reflog
archaeology.

## What to read next

- [Querying the Graph](/getting-started/querying-the-graph)
- [AI agent workflows](/getting-started/ai-agent-workflows)
- [Intent & Memory commands](/commands/intent)
- [Views](/commands/view)
