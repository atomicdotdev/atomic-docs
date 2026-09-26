# Commands Docs Audit

**Date:** 2026-09-18
**Scope:** All 47 `.md` files in `docs/commands/`
**Method:** Full read of every file by four parallel analysis passes, followed by verification of every claimed CLI discrepancy against the shipped `atomic` binary via `--help` output. Each finding below carries an exact `file:line` reference and, where relevant, a CLI verification verdict.

---

## 1. Scope & Method

| | |
|---|---|
| Files audited | 47 (`add.md` … `workspace.md`) |
| Command pages | 43 (`# atomic <command>` pattern) |
| Index/guide pages | 4 (`overview.md`, `working-with-changes.md`, `remote-operations.md`, `repository-management.md`) |
| Binary verification | `atomic <cmd> --help` inspected for: `insert`, `insert view/change/tag`, `restore`, `remove`, `unrecord`, `record`, `triage review`, `server set`, `log` |

**Confirmed conventions (healthy baseline):**

- Every command page opens with `## Synopsis` + a ```bash fenced block.
- Value flags are **always space-separated** (`--format json`); `--flag=value` never appears.
- `-m, --message`, `-v, --verbose`, `-f, --force` are stable within their primary meanings.
- See Also is (almost always) the final section.

---

## 2. Summary of Findings

| # | Issue family | Severity | Binary-verified? |
|---|---|---|---|
| A1 | `atomic insert` target-flag inconsistency across docs | High | Yes — docs mostly match binary; alias usage and one wrong flag found |
| A2 | Machine-readable output split: `--json` vs `--format json` vs `--short` | High | Partial (vault documents both) |
| A3 | Short-flag collisions (`-n`, `-f`, `-s`, `-t`, `-k`, `-p`, `-v`) | High | Yes — collision lives in the binary |
| A4 | Semantic drift on shared flags (`--force`, `server set --default`, `record --usage`) | High | Yes — CLI-side |
| A5 | Contradictions & undocumented flags between docs | High | Yes — 2 doc errors confirmed |
| B1 | `sidebar_position` collisions & missing frontmatter | Medium | n/a |
| B2 | Frontmatter/H1 mismatches | Medium | n/a |
| B3 | Four option-presentation styles | Medium | n/a |
| B4 | Subcommand documentation depth patterns | Medium | n/a |
| B5 | Global Options section gaps & drift | Medium | n/a |
| B6 | Trailing sections, See Also naming, link styles | Medium | n/a |
| B7 | Stubs and misplaced sections | Medium | n/a |

---

## 3. High Priority — CLI Discrepancies

### A1. `atomic insert` target-view flag

**Binary behavior (verified):**

| Form | Canonical flag | Alias |
|---|---|---|
| `atomic insert [CHANGE]` (bare) | `--view <VIEW>` | `--to` |
| `atomic insert view/change/tag` (subcommands) | `--to-view <TO_VIEW>` | `--to` |

The docs largely match the binary; the problem is inconsistent use of the **alias** instead of the canonical form, plus one doc that reads as if `--view` is valid on subcommand forms.

**All occurrences (27):**

| File:line | Command as written | Verdict |
|---|---|---|
| insert.md:68 | `atomic insert --to release` | Uses alias — change to `--view` |
| insert.md:86 | `atomic insert --view feature-auth MNYNGT2V` | Correct (canonical, bare form) |
| insert.md:115 | `atomic insert view feature --to dev` | Uses alias — change to `--to-view` |
| insert.md:118 | `atomic insert view feature --to dev --dry-run` | Uses alias — change to `--to-view` |
| insert.md:121 | `atomic insert from-view feature --to-view dev` | `--to-view` correct; `from-view` is alias for `view` subcommand |
| insert.md:148 | `atomic insert change ABCD1234 --to dev` | Uses alias — change to `--to-view` |
| insert.md:151 | `atomic insert pick ABCD1234 --to-view dev` | `--to-view` correct; `pick` is alias for `change` |
| insert.md:174, 224, 230 | `atomic insert tag … --to …` | Uses alias — change to `--to-view` |
| insert.md:193, 216–217 | `atomic insert preview … --to dev` | Uses alias — change to `--to-view` |
| view.md:381, 382, 426, 443, 456, 457 | `atomic insert <hash> --view dev` | Correct (canonical, bare form) |
| view.md:471 | `atomic insert C5 --view dev` | Correct |
| view.md:487 | `atomic insert view feature --to-view dev --dry-run` | Correct |
| working-with-changes.md:148, 151, 154 | `insert from-view/pick/preview … --to-view main` | `--to-view` correct; subcommand names are aliases |
| agent.md:315 | `atomic insert <change-hash> --to dev` | **Wrong** — bare form takes `--view`, `--to` is alias |
| completions.md:53 | `atomic insert --to <TAB>` | Alias shown — change to `--view` |

**Recommended doc fix:** always show canonical long flags; keep aliases only in insert.md's alias table.

### A2. Machine-readable output — three competing conventions

| Convention | Commands |
|---|---|
| `--json` (boolean) | intent, memory, query, provenance trace, session, triage, agent-lifecycle |
| `--format json` / `--format table\|json` | log, change, identity, org, project, workspace, team |
| `--short` (pseudo-machine) | status, conflicts, diff |

Special cases:

- **vault.md:189** documents `--json` as "shorthand for `--format json`" — both conventions coexist on the same subcommand (`vault context`).
- **provenance.md** — `trace` has `--json`, sibling `show` emits JSON-LD but has **no** `--json` flag.
- log.md `--format json` is legitimate: `--format` there selects *human* layouts too (`default|short|oneline|json`).

**Recommended standard (approved):** `--json` everywhere as the machine-output flag; keep `--format` only where it selects human layouts. Requires verifying the binary before editing docs.

### A3. Short-flag collision matrix

| Short | Meaning 1 | Meaning 2 | Meaning 3 |
|---|---|---|---|
| `-n` | `--dry-run` (pull, push, remove, unrecord, insert, restore, view split) | `--count` (log) | `--limit` (memory, session show) |
| `-f` | `--force` (push, remove, stash, intent update) | `--format` (log, change, identity) | — (both meanings within identity.md, different subcommands) |
| `-s` | `--short` (status, view list) | `--switch` (view create/split) | `--view` (tag create) |
| `-t` | `--kind` (query search) | `--file-type` (query code) | `--max-turns` (query ask) |
| `-k` | `--insecure` (pull, push, clone) | `--limit` (query search, query graph) | — |
| `-p` | `--path` (vault materialize, query embed) | `--prefix` (vault list) | `--pool` (query search) |
| `-v` | `--verbose` (global) | "show additional details" (tag list) | — |

Also: `query ask` defines a local `-v, --verbose` shadowing the global flag; query `graph` has bare `--depth` while sibling `neighbors` has `-d, --depth`.

**Binary verdict:** these collisions exist in the binary itself (e.g. `record --dry-run` has no short form while `remove --dry-run` is `-n`). Docs are individually faithful; the fix belongs to the CLI. See §7.

### A4. Semantic drift on shared flags

| Flag | Contexts | Issue |
|---|---|---|
| `--force` | remove/restore: bypass safety refusal · stash clear/identity delete: skip confirmation · org/project/workspace/team delete: required consent | Three different semantics; acceptable but should be stated uniformly in docs |
| `server set --default` | Binary (verified): "Revert to the legacy `[server]` block (clear `default_server`)" | Flag name suggests "set default" but reverts it — suggest `--reset`/`--clear-default` (CLI change). server.md documents it faithfully |
| `record --usage` | Binary (verified): help text says "Use the default identity for a specific usage context" | Wording duplicates `--identity`'s description — CLI help-text issue, faithfully copied into record.md |

### A5. Contradictions & undocumented flags between docs

| Finding | Reference | Binary verdict |
|---|---|---|
| restore.md claims `--dry-run` has no short form and "works for a single file only" | restore.md (Options) | **Doc is wrong** — binary: `-n, --dry-run  Dry run - show what would be restored without doing it` (no file restriction) |
| repository-management.md shows `atomic restore --dry-run` as whole-tree preview | repository-management.md | Correct — matches binary; restore.md must change instead |
| triage.md example uses `-o report.html` but only `--output <FILE>` is documented | triage.md:154 | **Doc is wrong** — binary has no `-o`; change example to `--output report.html` |
| record.md `--dry-run` has no short form | record.md | Correct — binary confirms no short form |
| org.md references `atomic org list` in an error message but never documents it | org.md | Undocumented subcommand |

---

## 4. Medium Priority — Structural Issues

### B1. `sidebar_position` collisions & missing frontmatter

| Value | Collision |
|---|---|
| `1` | overview.md, intent.md |
| `6` | status.md, tag.md |
| `14` | remote-operations.md, restore.md |
| `19` | server.md, stash.md |

**Missing `sidebar_position` entirely:** remove.md, split.md, move.md, change.md, conflicts.md, doctor.md.

### B2. Frontmatter/H1 mismatches

| File | Issue |
|---|---|
| completions.md | `title: Shell Completions` ≠ H1 `atomic completions` |
| change.md | H1 is backtick-wrapped (`` # `atomic change` ``); adds `description`/`keywords` fields no other doc has |
| overview.md | H1 "Command Reference" (acceptable for index, but `title:` style differs from all command pages) |

### B3. Option-presentation styles (four in use)

1. **H3-per-flag with example** — add, diff, init, clone, log, pull, push, record, remove, restore, split, status
2. **Markdown tables** — agent, change, git, agent-lifecycle, triage, unrecord, update, vault, view, workspace, revise
3. **Bold inline-code bullets** — identity, tag
4. **Plain bullets** — doctor, conflicts

### B4. Subcommand documentation depth patterns

1. **H4 `Synopsis`/`Arguments`/`Options`/`Examples` under H3 subcommand** — sandbox, session, query, provenance, git, identity, agent-lifecycle
2. **Bold-label tables, no per-subcommand synopsis** — remote, server, stash, workspace, team
3. **Prose only** — vault `goal` subcommands (start/stop/resume/list/show) documented in bold paragraphs

### B5. Global Options section

Present in only ~5 of 47 docs (add, conflicts, doctor, record, remove, log, pull, push), with **different contents**:

- log.md: `-v/--verbose, --no-color, -h/--help, -V/--version`
- pull.md/push.md: omit `-V, --version`
- overview.md: lists long-only (`--version`, `--help`)
- diff.md: documents `-h/--help` and `-V/--version` as per-command options instead
- Remaining ~37 docs: no Global Options section at all

Also: separator style drift — add.md uses ` - `, conflicts/doctor use ` — `.

### B6. Trailing sections, See Also naming, link styles

- **Trailing sections after See Also:** restore.md ("Related Concepts"), split.md ("Documentation Status" with ⚠️)
- **See Also naming:** "See Also" (majority) vs "See also" (intent, memory, change) vs "Related commands" (team, workspace, org, project)
- **Link styles:** `` [`atomic x`](./x.md) `` (record, remove, restore, split) vs `[x](x.md)` bare (revise, remote-operations, sandbox, session, stash) vs `/commands/diff` path-style (change.md)

### B7. Stubs and misplaced sections

| File | Issue |
|---|---|
| move.md | Explicit stub ("⚠️ Needs expansion from source code"); no Options, no See Also; only doc without `sidebar_position` besides remove/split |
| completions.md | Synopsis placed ~60% down the document (all others open with it) |
| Synopsis style drift | server.md embeds `#` comments; stash.md uses `pop\|apply\|show\|drop` pipes; team/workspace/update/unrecord inline all flags instead of `[OPTIONS]` |
| Placeholder casing | lowercase `<n>` (sandbox.md); `<MAX_SIZE>` underscore (record.md); `<NAME>`/`<VIEW>`/`<VIEW_NAME>` interchangeable for `--view` |
| Misc | identity.md `-f` collision (`--format` vs `--force` across subcommands); intent.md `-f, --force` on update but bare `--force` on delete; session.md typo "an session ledger"; unrecord.md synopsis shows `[-n]` only while examples show `--dry-run` |

---

## 5. CLI Verification Log

| Claim from doc audit | Binary behavior (`--help`) | Verdict |
|---|---|---|
| `insert` bare-form target flag unclear | `--view <VIEW>  Target view [aliases: --to]` | Docs using `--view` correct; alias usage should be normalized |
| `insert` subcommand target flag unclear | `--to-view <TO_VIEW> … [aliases: --to]` on view/change/tag | Docs using `--to-view` correct |
| restore.md: `--dry-run` has no short form, single-file only | `-n, --dry-run  Dry run - show what would be restored without doing it` | **Doc wrong** — add `-n`, drop file restriction |
| repository-management.md: whole-tree `restore --dry-run` | Same as above | Correct |
| triage.md: `-o` short for `--output` | Only `--output <OUTPUT>` exists | **Doc wrong** — use long form in example |
| record.md: `--dry-run` no short form | `--dry-run` (no short) | Correct |
| record.md: `--usage` description suspicious | Binary help text identical ("Use the default identity for a specific usage context") | CLI help-text issue, doc faithful |
| server.md: `set --default` reverts to legacy | `--default  Revert to the legacy \`[server]\` block (clear default_server)` | Confirmed — CLI naming issue, doc faithful |
| `record --dry-run` vs `remove -n` divergence | Confirmed in both help outputs | CLI design issue (§7) |
| `log --format json` exists | `-f, --format <FORMAT>` with `json` value documented | Confirmed |

---

## 6. Remediation Plan

### Phase 1 — CLI accuracy (approved; ~5 files, ~8 line-level edits)

1. **restore.md** — `--dry-run` heading → `-n, --dry-run`; remove "single file only" claim; align description with binary ("show what would be restored")
2. **triage.md:154** — `-o report.html` → `--output report.html`
3. **agent.md:315** — `atomic insert <change-hash> --to dev` → `--view dev`
4. **completions.md:53** — `atomic insert --to <TAB>` → `--view <TAB>`
5. **insert.md** — normalize examples to canonical flags (`--view` bare / `--to-view` subcommands); mark aliases explicitly in the alias table

### Phase 2 — Machine output (queued)

Standardize `--json` as the machine-output flag; add it to change, log, identity, org, project, workspace, team, provenance show. Verify against the binary before each edit; keep `--format` where it selects human layouts.

### Phase 3 — Short flags (queued)

De-duplicate `-n/-f/-s/-t/-k/-p/-v`. Requires CLI changes first (see §7); docs follow the binary.

### Phase 4 — Structure (queued)

Normalize `sidebar_position` (fix 4 collisions, add 6 missing), fix frontmatter/H1 mismatches, pick one option-presentation style (tables recommended), one subcommand-depth pattern, add missing Global Options sections with uniform content, normalize See Also naming/ordering, expand move.md stub, relocate completions.md Synopsis.

---

## 7. Flagged for CLI Team

Issues that live in the binary, not the docs (docs are faithful; no doc change will fix these):

1. **`-n` collision** — `--dry-run` (remove, unrecord, insert, restore, pull, push, view split) vs `--count` (log) vs `--limit` (memory, session show)
2. **`-f` collision** — `--force` vs `--format` (within identity.md, across subcommands)
3. **`-s` collision** — `--short` vs `--switch` vs `--view`
4. **`query` internal collisions** — `-t` (kind / file-type / max-turns), `-k` (limit vs pull's insecure), `-p` (pool vs path); `graph` lacks the `-d` short that `neighbors` has; `ask` shadows global `-v`
5. **`record --usage` help text** — reads as a copy of `--identity`'s description
6. **`server set --default`** — flag name contradicts its revert-to-legacy behavior; suggest `--reset` or `--clear-default`
7. **`record --dry-run`** lacks the `-n` short form its siblings have
8. **`provenance show`** emits JSON-LD without a `--json` flag while `trace` has one
