---
sidebar_position: 6
title: Train Tracks Demo
---

# Train Tracks: A Guided Tour You Build Yourself

This walkthrough builds a small **Train Tracks** puzzle solver end to end and
tours what Atomic captures along the way that Git cannot: signed identities,
views, intents, an agent session ledger, durable memories, and one queryable
knowledge graph.

It is fully **self-contained and local**: no hosted server, no clone from
Atomic Storage. Every command was executed against Atomic CLI 0.20.0 and the
outputs you see are the real ones.

- **Time:** about 15 minutes.
- **As a demo script.** Run the commands in order to show the story.
- **As a hands-on tour.** Type along; you end with a working project *and* its
  entire provenance chain.

Everything is read-only until section 10, so you can explore freely without
changing anything.

## 1. Build the demo project

Create a tiny TypeScript puzzle-solver: a classic "tents and trees" variant
with three modules. Nothing here is Atomic-specific; it is just a project worth
recording the history of.

```bash
mkdir -p train-tracks/src && cd train-tracks
```

**`src/types.ts`**: the data model:

```ts
export type Cell = {
  row: number;
  col: number;
  hasTree: boolean;
};

export type Puzzle = {
  size: number;
  rows: number[]; // required tents per row
  cols: number[]; // required tents per column
  trees: Cell[];
};
```

**`src/parser.ts`**: parse a grid of text into a `Puzzle` (plus a renderer):

```ts
import { Puzzle, Cell } from "./types";

export function parsePuzzle(input: string): Puzzle {
  const lines = input.trim().split("\n");
  const size = lines.length;
  const rows = lines[lines.length - 1].trim().split(/\s+/).map(Number);
  const cols = lines[lines.length - 2].trim().split(/\s+/).map(Number);
  const trees: Cell[] = [];
  for (let r = 0; r < size - 2; r++) {
    const chars = lines[r].trim().split(/\s+/);
    for (let c = 0; c < chars.length; c++) {
      if (chars[c] === "T") trees.push({ row: r, col: c, hasTree: true });
    }
  }
  return { size: size - 2, rows, cols, trees };
}
// ... renderPuzzle() omitted for brevity
```

**`src/solver.ts`**: a greedy first-fit solver:

```ts
import { Puzzle, Cell } from "./types";

export function adjacentCells(p: Puzzle, tree: Cell): Cell[] { /* ... */ }

export function canPlaceTent(p: Puzzle, row: number, col: number, placed: Cell[]): boolean {
  if (p.trees.some((t) => t.row === row && t.col === col)) return false;
  if (placed.some((c) => Math.abs(c.row - row) <= 1 && Math.abs(c.col - col) <= 1)) return false;
  const rowCount = placed.filter((c) => c.row === row).length;
  const colCount = placed.filter((c) => c.col === col).length;
  return rowCount < p.rows[row] && colCount < p.cols[col];
}

export function solve(p: Puzzle): Cell[] | null { /* ... */ }
```

**`src/main.ts`**: a CLI entry point that solves a default puzzle.

Now put the project under Atomic version control:

```bash
$ atomic init
✓ Initialized empty Atomic repository in /tmp/opencode/demo-train/train-tracks/.atomic
Created view: dev
Initialized vault at /tmp/opencode/demo-train/train-tracks/.vault
Recorded vault defaults (4 files)

Next steps:
  atomic add <files>      Add files to track
  atomic record -m "..."  Record your first change
  atomic status           See what's changed

$ atomic add .
Adding: .
✓ Added 4 file(s)

$ atomic record -m "initial commit: train tracks puzzle types, parser, greedy solver, CLI entry point"
[dev 1/LIXOUZNS3RRH] initial commit: train tracks puzzle types, parser, greedy solver, CLI entry point
```

Note the change hash: `LIXOUZNS3RRH`. Change hashes are short, unambiguous
Base32 prefixes; you only ever need enough characters to be unique.

## 2. Confirm it's an Atomic project

```bash
$ ls -la | grep atomic
drwxr-xr-x  .atomic
drwxr-xr-x  .vault
```

Two directories Git does not have:

- `.atomic/`: the content-addressed change graph (the code and its history).
- `.vault/`: the **why** (intents, memories, and durable project knowledge).

```bash
$ ls .vault
goals  intents  memory  prompts  scratch  skills
```

```bash
$ atomic vault init
ℹ Vault is already initialized
```

:::note
`atomic init` creates and initializes the vault in one step. If you are
adopting Atomic in an existing project, `atomic vault init` hydrates the vault
from the working copy without touching your files.
:::

```bash
$ atomic --help
```

Note the commands a Git user has never seen: `intent`, `memory`, `session`,
`view`, `insert`, `query`, and `provenance`. The rest of this tour is built
around them.

## 3. Identity: who is signing all of this

Git records authorship on the honor system: a name and email string anyone can
type. Atomic identities are **Ed25519 keypairs**, and every change, intent, and
memory is cryptographically signed.

```bash
$ atomic identity new demo --email demo@example.com --set-default
✓ Created identity: demo

  ID:         EKFWIGU5
  Email:      demo@example.com
  Type:       user
  Usage:      personal
  Public Key: VN5UXBZNY5FIQWK5...

This identity is now your default

$ atomic identity list
NAME          TYPE      USAGE       EMAIL                 DEFAULT
────────────  ────────  ──────────  ────────────────────  ───────
demo          user      personal    demo@example.com         *

ℹ 1 identity found

$ atomic identity whoami
Current identity: demo

  Email:       demo@example.com
  Type:        user
  Usage:       personal
  Public Key:  VN5UXBZNY5FIQWK5BN475Y63...
```

Identities have a **type** and a **usage context**:

| Type | Meaning |
| --- | --- |
| `user` | A human |
| `agent` | An automated actor (CI, a bot, an AI coding agent) |
| `delegated` | An agent acting on behalf of a human, under a signed delegation |

The third type is the interesting one. When an AI agent works in your project
with Atomic's agent integration, history does not show a fake human name. It
shows something like `opencode+ses0 <lee@atomic.dev>`: the agent, its session,
*and* the human who delegated authority to it, recorded automatically. The
human never loses accountability, and the AI's contribution is never hidden.

Show the keypair behind the identity and note its `did:atomic:…` identifier;
you will see the same DID again on the intents:

```bash
$ atomic identity show demo
Identity: demo

  ID:          EKFWIGU5E5E5GX5OU6JN5R6YD7OGCKJKL2DJH4OKHLJXEG3CZI5Q
  Email:       demo@example.com
  Type:        user
  Usage:       personal
  Created:     2026-10-28 03:20:07 UTC

  Public Key:  VN5UXBZNY5FIQWK5BN475Y63... (use --show-public-key for full key)

ℹ This is your default identity
```

Signatures are real and checkable. `identity sign` reads bytes from stdin and
emits a JSON signature object:

```bash
$ echo -n "hello atomic" | atomic identity sign
{
  "alg": "ed25519",
  "identity": "demo",
  "public_key": "VN5UXBZNY5FIQWK5BN475Y63SHURZE7HCI6JBOSMT2YJ32SB5MFA",
  "signature": "fmf8s3K7qdipt329jYWq5Q+naAVd6hTQYK/twAEaDVFjAqhA5m1xD4yFwH9nPW7UjDHr9YTYRy9qdKOpunTiDQ=="
}
```

Every change you recorded above was signed the same way, invisibly.

## 4. Views: how the work is broken up

Atomic has no branches. It has **views**: filtered perspectives on a single
graph.

```bash
$ atomic view create hint-flag --draft --switch
✓ Switched to view: hint-flag (0 files updated)
✓ Created view: hint-flag

$ atomic view list
dev        [shared]    (3 changes)  state: O53UX5IDZTBY
  - * hint-flag  [draft]     (0 changes, 3 inherited)  state: AAAAAAAAAAAA  parent: dev
```

- The `*` marks the current view.
- `dev` is **shared**: the collaborative baseline.
- `hint-flag` is a **draft** built on top of `dev` (`parent: dev`).
- "0 changes, 3 inherited" means the empty draft already sees `dev`'s three
changes. Nothing was copied. A view is a **filter** over one canonical
graph, not a copy of the working tree.

```text
  dev  (shared, 3 changes)
   │
   └── hint-flag  (draft, parent=dev)
         sees: dev's 3 changes + its own N  =  3 + N visible
```

Record a change on the draft view:

```bash
# add a prefersEdge() helper to src/solver.ts, then:
$ atomic status
On view hint-flag
State: AAAAAAAAAAAA...

Changes to be recorded:
  (use "atomic restore <file>..." to discard changes)

	modified:   src/solver.ts

$ atomic record -m "add prefersEdge helper: edge cells make better tent candidates"
[hint-flag 1/YRB6GECEWBZ3] add prefersEdge helper: edge cells make better tent candidates

$ atomic view list
dev        [shared]    (3 changes)  state: O53UX5IDZTBY
  - * hint-flag  [draft]     (1 change, 3 inherited)  state: AK66AZOHVAW2  parent: dev
```

The draft now sees "1 change, 3 inherited": its own change stacked on top of
the shared baseline it was created from.

:::warning
Views are not Git branches, and they share **one working copy**. Switching
views rewrites the files in your checkout to match that view's filter. There
is no per-view stash of half-finished work: if you edit files while on view A
and switch to view B, those edits travel with you (or block operations, as you
will see in section 10). Record or restore before switching.
:::

## 5. History and the provenance behind a change

```bash
$ atomic view switch dev
✓ Switched to view: dev (1 files updated)

$ atomic log
#2 === LIXOUZNS3RRH ===
Author: demo <demo@example.com>
Date:   2026-10-27 23:20:14

    initial commit: train tracks puzzle types, parser, greedy solver, CLI entry point

#1 === CVQV77TZZAKP ===
Date:   2026-10-27 23:20:07

    Initialize vault

#0 === 2ZOSO7QXM6C5 ===
Date:   2026-10-27 23:20:07

    Initialize repository

$ atomic log --short
#2 === LIXOUZNS3RRH ===
...
```

Now drill into a single change. This is where Atomic goes beyond a Git
commit: `atomic change` renders the change plus (when an AI agent produced
it) its attestation and the causal decision graph that led there.

```bash
$ atomic change YRB6GECEWBZ3
change YRB6GECEWBZ3
Author: demo <demo@example.com>
Date:   2026-10-27 23:20:52

    add prefersEdge helper: edge cells make better tent candidates

Dependencies: 1
  LIXOUZNS3RRH...

Graph: +5 vertices, ~0 edges, 172 bytes
Files changed: 1
  ~ src/solver.ts (5 hunks: 5x +1 span: new content)
No provenance graph found for this change.
```

For a change authored by an AI agent, the default output has three parts:

1. **The change itself**: hash, author, date, message, dependencies, and the
   files it touched (as above).
2. **`=== Attestation ===`**: the AI provenance recorded inline in the change
   header: which vendor and model produced it, the tool, token usage
   (input / output / total), cost in USD, temperature, and the request and
   session IDs. This shows how a change was made and who committed it.
3. **`=== Change Ledger ===`**: the causal decision DAG: the session and
   agent, node/edge/change counts, and each step the agent took (goals, tool
   executions, explorations, commitments, and patch proposals) that led to
   this change.

In this tour *you* are the author, so there is no attestation to render. The
CLI says so honestly: `No provenance graph found for this change.` The same
metadata is still queryable:

```bash
$ atomic change YRB6GECEWBZ3 -f json
{
  "hash": "YRB6GECEWBZ3WIOZ24PN3OVOY5LZUGMHIMLC2XBBDCR5SLIJL3DQ",
  "message": "add prefersEdge helper: edge cells make better tent candidates",
  "authors": [
    { "name": "demo", "email": "demo@example.com" }
  ],
  "dependencies": [
    "LIXOUZNS3RRHSLRM6WYEZ54CMULVZI34VPOXBFZYCZ6GVBABONOQ"
  ],
  "has_provenance": false
}
```

:::tip
The JSON includes a `provenance` object and a `has_provenance` flag: the
machine-readable form to feed a dashboard or audit tool.
:::

Provenance can also be traced as a W3C PROV graph:

```bash
$ atomic provenance trace LIXOUZNS3RRH
✗ atomic:INVALID_ARGUMENT: no provenance graph explains change LIXOUZNS3RRHSLRM6WYEZ54CMULVZI34VPOXBFZYCZ6GVBABONOQ
```

Again, no agent session ran in this tour, so there is nothing to trace. On an
agent-built project the same command walks the full PROV chain backward from
the change: the turn, the model call, the tool executions that produced it.

The current status shows something else Git does not have:

```bash
$ atomic status
On view dev
State: O53UX5IDZTBY...

nothing to record, working tree clean
```

That `State:` value is a **Merkle hash**: it *is* the identity of this view's
entire history. Change one thing and the hash changes. It is how Atomic syncs
and verifies integrity.

## 6. Intents: the "why" behind the work

Every unit of work should start as an **intent**: a signed, validated
statement of the problem being solved.

```bash
$ atomic intent new "Prefer edge cells when placing tents"
Created intent: TRAI::demo::1
  file: .vault/intents/01M608E9JBW7ZWD93EYHDJFM8C/intent.md
  template: feature
  kind: feature
```

Two names matter here:

- **`TRAI::demo::1`**: the *human key*, assigned by the vault. This is what
  you read and type.
- **`01M608E9JBW7ZWD93EYHDJFM8C`**: the *UID* (a ULID). This is what the
  graph and the canonical store use. Remember it for section 9.

The scaffolded `.vault/intents/…/intent.md` is a directive file with stubs to
fill in. Edit it:

```markdown
:::why
The greedy solver places tents on the first candidate spot it finds, which
often blocks later trees and makes puzzles unsolvable. Cells on the board
edge have fewer neighbours, so preferring them keeps more options open for
the trees processed after.
:::

:::acceptance-criterion{#01M608E9JBW7ZWD93EYHDJFM8C-ac-1 status=unmet verifiedBy="bun run main"}
:::bullet{kind=criterion}
`solve()` places each tent on an edge cell when one is available among the
tree's adjacent cells, and the demo puzzle still solves.
:::
:::

:::task{#01M608E9JBW7ZWD93EYHDJFM8C-1 status=open criteria=01M608E9JBW7ZWD93EYHDJFM8C-ac-1}
:::file-ref{path=src/solver.ts}
Sort the adjacent candidate cells by `prefersEdge` before picking one.
:::
```

Sync the vault, then make it conform:

```bash
$ atomic vault sync
Synced 1 vault file(s).

$ atomic intent validate TRAI::demo::1
conforms: no (2 violation(s))
  ✗ [IntentShape] urn:atomic:intent:01M608E9JBW7ZWD93EYHDJFM8C (attributedTo): author (attributedTo) must be present as a DID
  ✗ [IntentShape] urn:atomic:intent:01M608E9JBW7ZWD93EYHDJFM8C (proof): intent must carry a Data Integrity proof

$ atomic intent attest TRAI::demo::1
Attested intent: TRAI::demo::1
  vault:     .vault/attestations/TRAI__demo__1/attested.md
  sidecar:   …/.atomic/canonical/intents/TRAI__demo__1/attested.jsonld
  author:    did:atomic:EKFWIGU5E5E5GX5OU6JN5R6YD7OGCKJKL2DJH4OKHLJXEG3CZI5Q

$ atomic intent validate TRAI::demo::1
conforms: yes

$ atomic intent list
  humanKey       status   kind       attested  verifies
  TRAI::demo::1  backlog  [feature]  –         –
```

`attest` converts the plain-text author into your **DID** and attaches a Data
Integrity proof: the same Ed25519 identity from section 3, now binding the
intent itself.

Open one in full:

```bash
$ atomic intent show TRAI::demo::1
TRAI::demo::1  Prefer edge cells when placing tents
────────────────────────────────────────────────
Status:    backlog
Priority:  medium
View:      dev

Why
The greedy solver places tents on the first candidate spot it finds, which
often blocks later trees and makes puzzles unsolvable. Cells on the board
edge have fewer neighbours, so preferring them keeps more options open for
the trees processed after.

Acceptance Criteria
  [ ] :::bullet{kind=criterion}
`solve()` places each tent on an edge cell when one is available among the
tree's adjacent cells, and the demo puzzle still solves.

Tasks
  [ ] :::file-ref{path=src/solver.ts}
Sort the adjacent candidate cells by `prefersEdge` before picking one.
        satisfies: urn:atomic:ac:01M608E9JBW7ZWD93EYHDJFM8C-ac-1

In Scope
  • :::file-ref{path=src/solver.ts}

Out of Scope
  • :::file-ref{path=src/parser.ts}
The puzzle parser and CLI entry point stay untouched.

Constraints
  1. Keep the existing function signatures in `src/solver.ts` unchanged.

id:        urn:atomic:intent:01M608E9JBW7ZWD93EYHDJFM8C
author:    did:atomic:EKFWIGU5E5E5GX5OU6JN5R6YD7OGCKJKL2DJH4OKHLJXEG3CZI5Q
hash:      blake3:c9aa7e8ccaba5a0edb653983c457d10b712e7f4050505e97939c49445c2bd01a
signed:    yes
Kind:      feature
```

Walk through its structure:

- **Why**: the problem, not the solution.
- **Acceptance Criteria**: each with a *verified by* line naming the command
  that proves it.
- **Tasks**: each links to the criterion it satisfies and names the exact
  files it touches.
- **In / Out of Scope + Constraints**: including what is deliberately
  deferred.
- `author: did:atomic:…` and `signed: yes`: the same identity from
  `atomic identity show`, cryptographically attested.

An intent is a pull-request description, a spec, and an audit trail. It is
enforced *before* the work counts as done.

Finally, record the intent into history like any other file:

```bash
$ atomic add . && atomic record -m "record intent TRAI::demo::1 and the edge-placement lesson"
[dev 1/OMXA4WMC4Y3J] record intent TRAI::demo::1 and the edge-placement lesson
```

## 7. The session: what the agent actually did

In section 5 you saw provenance for a *single* change. `atomic session show`
zooms out to the whole session: the ordered ledger of every turn an AI agent
took across all its changes.

This tour was driven by a human, and no agent integration recorded turns, so
the honest output is:

```bash
$ atomic session show -n 5
No sessions recorded.

$ atomic agent status
Agent Integration Status
=======================

  Identity: none — hooks record as the plus-tag of the default identity

  ✓ OpenCode — hooks installed

  Sessions: none

  Start using your AI agent — turns will be recorded automatically.
```

On an agent-built project, the same command shows the ledger: one entry per
turn, each with the turn number, the change(s) it produced, the model, token
usage and cost, and the attestation reference, stitched into one timeline
that backs the `opencode+ses0` author you would see in `atomic log`. All of it
is recorded automatically when each turn ends; nothing is added by hand.

:::tip
To make your own agent sessions appear here, run `atomic agent enable
--agent <name>` (OpenCode, Claude Code, Codex, Copilot and more are supported)
and then work inside any project with a `.atomic/` directory. Every turn is
recorded automatically.
:::

## 8. Memories: durable knowledge

Intents capture the *why* of a task. **Memories** capture durable lessons and
decisions that outlive any single task.

```bash
$ atomic memory kinds
Allowed memory kinds (pick the best fit; create one memory per durable insight):

  constraint  A hard rule or limit the work must respect — an invariant, boundary, or requirement that constrains future changes.
  preference  A soft or stylistic default the team leans toward — a convention, not a hard rule.
  lesson      A corrective learning from something that went wrong or surprised you — the failure and the takeaway.
  context     Durable background or domain knowledge that explains how or why something is — not a rule, not a decision.
  decision    A deliberate choice between real options — what was chosen, why, over which alternatives, and the outcome.
```

Five kinds, each answering a different question: what rule binds us, what we
default to, what we learned the hard way, what background explains this, and
what we chose and why.

Record one, linked to the intent that produced it:

```bash
$ atomic memory new --kind lesson \
    --text "Greedy first-fit tent placement dead-ends on dense puzzles; preferring edge cells among a tree's adjacent spots keeps later trees solvable." \
    --derived-from urn:atomic:intent:01M608E9JBW7ZWD93EYHDJFM8C
Created memory: 01m608gs2jy8k993peq213kseq
  file: .vault/memory/01m608gs2jy8k993peq213kseq.md
  kind: lesson
  status: active

$ atomic memory list
  id                          kind    status  about  attested  verifies
  01m608gs2jy8k993peq213kseq  lesson  active      0  –         –

$ atomic memory show 01m608gs2jy8k993peq213kseq
Memory (lesson)  urn:atomic:memory:01m608gs2jy8k993peq213kseq
────────────────────────────────────────────────
Status:    active

Derived From
  • urn:atomic:intent:01M608E9JBW7ZWD93EYHDJFM8C

Greedy first-fit tent placement dead-ends on dense puzzles; preferring edge cells among a tree's adjacent spots keeps later trees solvable.

id:        urn:atomic:memory:01m608gs2jy8k993peq213kseq
signed:    no
```

Notice the **Derived From** section: the memory links back to the exact
intent that produced it (`wasDerivedFrom` edges, in graph terms). Six months
from now, the reasoning is still recoverable, so no tribal knowledge is lost.

## 9. The knowledge graph is queryable

Everything above (changes, files, entities, intents, memories, views) is one
connected graph. `atomic query` is how you interrogate it.

```text
  change:YRB6GECEWBZ3 ──MODIFIES──▶ file:src/solver.ts ──DEFINES──▶ entity:…:solve:29
        │                                                        │
     ON_VIEW                                                   CALLS
        ▼                                                        ▼
   view:hint-flag                                    entity:…:canPlaceTent:21

  intent / memory ──REFERENCES──▶ file:src/solver.ts
```

The subcommands group by purpose:

| Purpose | Subcommands |
| --- | --- |
| Find things | `search`, `code`, `entities` |
| Follow relationships | `neighbors`, `callers` |
| Visualize | `graph` |
| Ask in English | `ask`, `plan` |
| Maintain the index (mostly automatic) | `index`, `enrich`, `reindex`, `embed` |

### Node IDs

Every node has an ID of the form `kind:identifier`. The identifier is **not**
the human-facing name. It is derived from where the node lives:

| Node | ID format | Example (from this tour) |
| --- | --- | --- |
| File | `file:<path>` | `file:src/solver.ts` |
| Entity | `entity:<path>:<name>:<line>` | `entity:src/solver.ts:solve:29` |
| Change | `change:<hash-prefix>` | `change:LIXOUZNS3RRH` |
| View | `view:<name>` | `view:dev` |
| Intent | `intent:<ULID>` (upper-cased) | `intent:01M608E9JBW7ZWD93EYHDJFM8C` |
| Memory | `memory:<ulid>` (as stored) | `memory:01m608gs2jy8k993peq213kseq` |

:::warning
These IDs must match **exactly**, and they are not the names you would guess:

- An intent's node ID is its **ULID**, not its human key. We tried the human
  key in this very project:

  ```bash
  $ atomic query neighbors "intent:TRAI::demo::1" -d 1
  No neighbors found for 'intent:TRAI::demo::1'.
  ```

  `intent:TRAI::demo::1` silently resolves to nothing; the real ID is
  `intent:01M608E9JBW7ZWD93EYHDJFM8C`.
- An entity's node ID includes the **line number** where it is defined.
  `entity:src/solver.ts:solve:1` will not resolve, because `solve` is defined
  on line 29, not line 1.

Because these IDs are not memorable, always **discover the exact ID first**
(with `atomic query search` for intents/memories, or `atomic query entities`
for code entities), then copy it verbatim into `neighbors` or `callers`.
:::

A demo flow with this project's real outputs:

```bash
$ atomic query enrich
Enriched knowledge graph: 42 item(s) processed.

$ atomic query search "edge" -k 10
  [change] change:YRB6GECEWBZ3  add prefersEdge helper: edge cells make better tent candi...
  [acceptance_criterion] ac:01M608E9JBW7ZWD93EYHDJFM8C-AC-1  :::bullet{kind=criterion}
`solve()` places each tent on a...
  [intent] intent:01M608E9JBW7ZWD93EYHDJFM8C  Prefer edge cells when placing tents

3 result(s).

$ atomic query code "tent" -t ts -n 5
src/main.ts:14: const tents = solve(puzzle);
src/main.ts:15: if (!tents) {
src/main.ts:19: for (const t of tents) {
src/main.ts:20:   console.log(`tent at (${t.row}, ${t.col})`);

4 match(es) in 1 file(s).

# List code entities (functions, consts, types) in a file.
# Copy the exact ids it prints — they include line numbers.
$ atomic query entities src/solver.ts
  function     adjacentCells                  L3-19  [exported]  function adjacentCells(p: Puzzle, tree: Cell): Cell[]
  ...
  function     canPlaceTent                   L21-27 [exported]  function canPlaceTent(p: Puzzle, row: number, col: number, placed: Cell[]): boolean
  function     solve                          L29-37 [exported]  function solve(p: Puzzle): Cell[] | null
  ...

11 entity(ies) in src/solver.ts

# Follow relationships around a file node
$ atomic query neighbors "file:src/solver.ts" -d 2
Nodes (53):
  [constraint] constraint:01M608E9JBW7ZWD93EYHDJFM8C-CONSTRAINT-1  Keep the existing function signatures in `src/s...
  [entity] entity:src/solver.ts:adjacentCells:3  function adjacentCells(p: Puzzle, tree: Cell): ...
  [intent] intent:01M608E9JBW7ZWD93EYHDJFM8C  Prefer edge cells when placing tents
  [memory] memory:01m608gs2jy8k993peq213kseq
  [change] change:LIXOUZNS3RRH  initial commit: train tracks puzzle types, pars...
  [file] file:src/types.ts
  ...

# The intent node resolves only by ULID:
$ atomic query neighbors "intent:01M608E9JBW7ZWD93EYHDJFM8C" -d 2
Nodes (30):
  [scope] scope:01M608E9JBW7ZWD93EYHDJFM8C-SCOPE-IN-1  :::file-ref{path=src/solver.ts}
  [entity] entity:src/solver.ts:solve:29  function solve(p: Puzzle): Cell[] | null
  [change] change:YRB6GECEWBZ3  add prefersEdge helper: edge cells make better ...
  [task] task:01M608E9JBW7ZWD93EYHDJFM8C-1  :::file-ref{path=src/solver.ts}
Sort the adjace...
  ...

# Blast radius: who calls this entity? Use a real id from `entities` above.
$ atomic query callers "entity:src/solver.ts:canPlaceTent:21"
1 caller(s) of entity:src/solver.ts:canPlaceTent:21:

  src/solver.ts:solve  [function solve(p: Puzzle): Cell[] | null]

# Visualize a subgraph — opens an interactive HTML view by default
$ atomic query graph "tents" -k 10 --depth 2
Opening graph (52 nodes, 93 edges) in browser...
```

`graph` can also emit Graphviz:

```bash
$ atomic query graph "tents" -k 10 --depth 2 --dot | dot -Tsvg -o graph.svg
digraph query {
  rankdir=LR;
  node [shape=box, style="filled,rounded", fontname="Helvetica", fontsize=10];
  "change:LIXOUZNS3RRH" [label="LIXOUZNS3RRH\ninitial commit: train tracks p", fillcolor="#fadbd8", shape=note];
  "entity:src/solver.ts:solve:29" [label="solve" ...];
  ...
}
```

:::note
`atomic query ask` asks a question in plain English (RAG over the graph) but
needs `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set. Without a key it fails
honestly (in this tour, with no keys configured):

```text
✗ atomic:INVALID_ARGUMENT: No API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.
```

Set one of those variables and retry if you want the prose answers.
:::

## 10. The view lifecycle: triage, insert, switch, delete

Everything so far was read-only. This final section modifies the repository, so
run it only on a copy you are comfortable changing. (Everything below was
actually executed in the tour repository.)

**Triage** computes the candidate set a draft view would promote into its
parent, and narrates what the promotion contains:

```bash
$ atomic view switch hint-flag
✓ Switched to view: hint-flag (1 files updated)

$ atomic triage candidates
Triage candidates: hint-flag → dev
  only in hint-flag: 1
    YRB6GECEWBZ3WIOZ24PN3OVOY5LZUGMHIMLC2XBBDCR5SLIJL3DQ
  closure additions: 0
  baggage: 0

$ atomic triage review --walkthrough
walkthrough hint-flag → dev   BLOCKED   (1 layer, 1 change)

1. src
   1 file(s) in src modified by 1 change(s). No intent task touches this layer's files.
   files: src/solver.ts
   YRB6GECEWBZ3  atomic change YRB6GECEWBZ3WIOZ24PN3OVOY5LZUGMHIMLC2XBBDCR5SLIJL3DQ --show-hunks

ref urn:atomic:triage:2bef24cc2548048cd13bef27549d3843b7f116f56dd3f05881fac9a04f16b3ff
```

The walkthrough says **BLOCKED**. That is an honest gate: no intent task
claims the change being promoted. On a properly linked project, each layer is
narrated against the intents that explain it, and the walkthrough becomes the
review record. Either way, in Atomic, *work is not done until something
explains it*.

**Insert** promotes a draft view's changes up into its parent. It is not a
cherry-pick: it adds a change reference plus its full dependency closure, an
O(1) metadata operation, because the edges already live in the shared graph.

```bash
# Switch back to the parent view first
$ atomic view switch dev
✓ Switched to view: dev (1 files updated)

# If the working copy is dirty, insert refuses — shared working copy, remember:
$ atomic insert view hint-flag --to-view dev
✗ atomic:PRECONDITION_FAILED: insert would refresh a working copy with unrecorded changes; record, stash, or move those files aside before inserting

# Record the pending vault files, then insert succeeds:
$ atomic add . && atomic record -m "record intent TRAI::demo::1 and the edge-placement lesson"
[dev 1/OMXA4WMC4Y3J] record intent TRAI::demo::1 and the edge-placement lesson

$ atomic insert view hint-flag --to-view dev
ℹ Inserting changes from 'hint-flag' to 'dev'...

✓ Inserted 1 change(s)
  New state: CUR75V5AQOPNPZZW4WNDRSBFUOQMB43GSXJJZNXCONCL7EUNRKJA
✓ 1 files updated, 1 directories

$ atomic view list -a
* dev  [shared]    (5 changes)  state: CUR75V5AQOPN
  - hint-flag  [draft]     (0 changes, 5 inherited)  state: AK66AZOHVAW2  parent: dev

$ atomic log -n 3
#4 === YRB6GECEWBZ3 ===
Author: demo <demo@example.com>
Date:   2026-10-27 23:20:52

    add prefersEdge helper: edge cells make better tent candidates

#3 === OMXA4WMC4Y3J ===
Author: demo <demo@example.com>
Date:   2026-10-27 23:25:44

    record intent TRAI::demo::1 and the edge-placement lesson
...
```

`dev` went from 3 changes to 5, and `hint-flag` now reports "0 changes,
5 inherited". The draft has nothing of its own left; everything it contained
is visible through `dev`.

**Switch** moves your working copy to another view:

```bash
$ atomic view switch dev
✓ Switched to view: dev (1 files updated)

$ atomic view list -a
* dev  [shared]    (5 changes)  state: CUR75V5AQOPN
  - hint-flag  [draft]     (0 changes, 5 inherited)  state: AK66AZOHVAW2  parent: dev

$ atomic status
On view dev
State: CUR75V5AQOPN...
nothing to record, working tree clean
```

**Delete** tears down the draft safely, because its work now lives in `dev`:

```bash
$ atomic view delete hint-flag
✓ Deleted view: hint-flag

$ atomic view list -a
* dev  [shared]    (5 changes)  state: CUR75V5AQOPN
```

The change survives the delete: `atomic log` still shows it, and the file it
touched is still in the working copy:

```bash
$ atomic query entities src/solver.ts | grep prefersEdge
  function     prefersEdge                    L21-24  [exported]  function prefersEdge(p: Puzzle, c: Cell): boolean
```

Deleting a draft removes only its view metadata and change-filter entries
(the view's bookkeeping). The work you inserted into `dev` is untouched.
There is no garbage collection to run. Edges are content-addressed and
shared in the single canonical graph, so an edge that is no longer referenced
by any view simply stops being visible through a filter. Nothing needs to be
swept up, and there are no dangling records or reflog archaeology.

## What to read next

- [Querying the Graph](/getting-started/querying-the-graph)
- [AI agent workflows](/getting-started/ai-agent-workflows)
- [Atomic Vault](/getting-started/atomic-vault)
- [Intent & Memory commands](/commands/intent)
- [Views](/commands/view)
