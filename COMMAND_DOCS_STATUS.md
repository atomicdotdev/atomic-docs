# Command Documentation Status

This document tracks the CLI command reference coverage in `docs/commands/` against the `atomic` binary (verified against CLI **0.17.1** `--help` output).

## Documentation Progress

### ✅ Completed (Comprehensive Documentation)

Every top-level command of the CLI has a reference page in `docs/commands/`:

| Page | Command | Notes |
|------|---------|-------|
| overview.md | — | Command reference overview with categories |
| completions.md | `completions` | Shell completion scripts |
| init.md | `init` | Initialize a new repository |
| status.md | `status` | Working copy status (incl. `--reindex`, `--no-untracked`) |
| conflicts.md | `conflicts` | Conflicted files |
| add.md | `add` | Track files (incl. `-A/--all`, `-d/--directory`) |
| remove.md | `remove` / `rm` | Remove from tracking |
| move.md | `move` / `mv` | Move/rename tracked files |
| restore.md | `restore` | Restore working copy |
| record.md | `record` | Record changes (incl. `--allow-conflict-markers`) |
| revise.md | `revise` | Revise a change in-place |
| unrecord.md | `unrecord` | Remove a change from the current view |
| diff.md | `diff` | Working-copy diffs (incl. `-c/--change`, `--word-diff`, `--name-status`) |
| log.md | `log` | History (incl. `-f/--format`, `--full-hash`) |
| change.md | `change` | Change details (incl. `--format`, `--show-hunks`, `--full-hash`) |
| insert.md | `insert` | Insert changes into a view |
| split.md | `split` | Create a view from an existing one |
| view.md | `view` | Views: create, split, switch, list, delete, **promote** |
| stash.md | `stash` | Rewritten to 0.17.x interface (`push` + `-u`/`-k`, 7 subcommands) |
| tag.md | `tag` | create, delete, list, show |
| clone.md | `clone` | Remote clone (incl. `--into-existing`, `--all-views`) |
| push.md | `push` | Remote push (incl. `--to-view`/`--from-view`, `--insecure`, `--timeout`) |
| pull.md | `pull` | Remote pull (incl. `--to-view`/`--from-view`, `--insecure`, `--timeout`) |
| remote.md | `remote` | add, remove, set-url, rename, default |
| identity.md | `identity` | Identities and signing keys |
| server.md | `server` | Server profiles, incl. **set-identity** |
| workspace.md | `workspace` / `ws` | Hosted workspaces, incl. **grant** (list/add/remove) |
| project.md | `project` / `proj` | Hosted projects |
| org.md | `org` | Organizations, incl. **upgrade** and **member** (list/add/update/remove) |
| team.md | `team` | Teams, incl. **member** (list/add/update/remove) |
| agent.md | `agent` | enable, disable, status, explain, attest |
| agent-lifecycle.md | `agent lifecycle` | Managed runs: begin, renew, end, status |
| session.md | `session` | Session ledger: show, fork, rebuild |
| sandbox.md | `sandbox` | Agent sandboxes: create, stage, seal |
| doctor.md | `doctor` | Diagnose and repair indexes |
| git.md | `git` | Git interop: import, push, hooks (install/uninstall/status) |
| query.md | `query` | Knowledge graph: search, neighbors, callers, entities, code, graph, index, embed, enrich, reindex, plan, ask |
| vault.md | `vault` | Knowledge store: init, show, list, materialize, sync, goal, context, summaries |
| intent.md | `intent` | Directive-based intents |
| memory.md | `memory` | Durable memories |
| provenance.md | `provenance` | W3C PROV trace/show |
| update.md | `update` | CLI upgrade checks |
| triage.md | `triage` | Review candidate sets: candidates, review |

### Verification

- Options, subcommands, and arguments were transcribed from `atomic <command> --help`
  (CLI 0.17.1) and cross-checked against the live binary.
- Identifier requirements (change hashes, KG node/entity IDs, session IDs, run IDs,
  stash refs) are documented on the pages that need them, with pointers to the
  discovery command (`log`, `query search`, `query entities`, `session show`,
  `agent lifecycle status`, `stash list`, `tag list`, `view list`).

## Source Code References

### Primary Source Locations

- **Command Definitions**: `atomic/atomic/src/commands/*.rs`
- **Core Library**: `atomic/atomic-core/src/*.rs`
- **Command Structure**: `atomic/atomic/src/commands/mod.rs`

### Authoritative Help Text

Run `atomic <command> --help` locally for the authoritative, version-specific help text.
