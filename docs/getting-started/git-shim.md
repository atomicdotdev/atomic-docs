---
sidebar_position: 4
title: Git Shim
---

# Git Shim

The Git Shim lets Atomic and Git share a single working copy and a single history. You get Atomic's patch theory, AI provenance, and conflict-free views for daily development, while your team keeps reviewing PRs on GitHub or GitLab exactly as before — and every transition between the two is verified, journaled, and recoverable.

The shim is **opt-in per repository**. Having both `.git/` and `.atomic/` does not enable it: until you explicitly run `atomic git shim enable`, import history, or enroll through a verified checkpoint, ordinary Atomic commands stay native.

:::info
Platform support: Linux and macOS. Windows shim support has not been validated.
:::

## How it works

The shim keeps three representations in agreement:

1. **The Atomic graph** — the canonical store of changes, views, and provenance
2. **Git objects and refs** — a projection of that graph that ordinary Git tooling can read
3. **The working copy on disk** — one shared checkout both systems observe

Atomic records project into Git as commits, and Git commits import into Atomic as changes. Commands verify that both sides agree at every step, and every Git ref move the shim performs is journaled *before* it happens, with a receipt recorded after — so an interrupted operation recovers on the next writable open instead of leaving things half-done.

Git hooks and an optional watcher make changes visible quickly, but they are **advisory**: correctness never depends on them having run. Commands always check the current state.

## Setting up

### 1. Import existing Git history

```bash
cd /path/to/your/git/repo
atomic git import
```

This converts the Git branch's history into Atomic changes, preserving author, timestamp, message, file operations, and the original commit SHA. Branch names become Atomic views. See [Git Import and Push](./git-import-push) for all import flags.

:::note
Import reads what Git stored. Agent attribution and other Atomic-native provenance that Git never captured cannot be recovered from Git history alone.
:::

### 2. Enable the shim

```bash
# Create a signing key for the Anchor binding (keep it outside tracked files)
python3 -c 'import secrets; print(secrets.token_hex(32))' > ~/.atomic/binding.key

atomic git shim enable --binding-key-file ~/.atomic/binding.key
atomic git shim reconcile
atomic git shim verify
```

`enable`:

- Installs Atomic's advisory Git hook dispatchers (see [Hooks](#hooks-are-advisory) below)
- Sets `[git.shim] enabled = true` in `.atomic/config.toml`
- Proves Git and Atomic agree (repository, index, and working copy), then creates a **signed Anchor binding** and a verified working-copy checkpoint
- Configures fetch refspecs for `refs/atomic/bindings/*` and `refs/atomic/views/*` on the selected remote (default `origin`), so bindings transfer with every `git fetch`

Flags:

| Flag | Description |
|------|-------------|
| `--binding-key-file <path>` | File with a hex-encoded 32-byte Ed25519 secret key. Required to create the Anchor binding. |
| `--mirror-ignores` | Mirror `.atomicignore` patterns into a managed `.git/info/exclude` block (explicit consent). Without it, ignore-policy differences are reported as a divergence instead. |
| `--adopt-atomic` | Explicit remediation: project the current Atomic state onto Git HEAD before anchoring. Refuses a dirty working copy; never silently merges. |
| `--with-changes-pack` | Attach the bounded `changes.pack` fallback to the Anchor binding, for receivers that cannot reach an Atomic remote. |
| `--remote <name>` | Remote to configure fetch refspecs on (default `origin`). |
| `--no-refspecs` | Skip refspec configuration (local-only repositories). |

A notice that automatic rollout is blocked is expected. Atomic leaves custom `core.hooksPath` setups, existing hook binaries, and symlinks untouched, and prints integration instructions instead.

If the Git branch has no commits yet, create its first commit before reconciling.

### 3. Verify

```bash
atomic git shim verify
```

Read-only comparison of Git HEAD against the current Atomic view. Clean output plus empty `atomic status --short` and `git status --porcelain` means both systems agree.

## The development workflow

After enablement and a successful reconcile, day-to-day work looks like this:

```bash
# Work in Atomic as usual
atomic view create feature-auth --draft --parent dev
atomic view switch feature-auth
atomic record -m "feat: add OAuth2 provider"

# The record is projected into Git; confirm both sides agree
atomic git shim verify
git log --oneline -3
```

Your teammate on GitHub sees ordinary commits and reviews ordinary PRs. You keep Atomic's views, provenance, and conflict-free merging locally.

### Keeping both sides in sync

| Command | What it does |
|---------|--------------|
| `atomic git shim reconcile` | Incrementally import Git HEAD, verify it, and record shim metadata. Use this after commits arrive from Git (a pulled branch, a teammate's push). |
| `atomic git shim verify` | Read-only comparison of Git HEAD and the current Atomic view. Changes nothing. |
| `atomic git shim status` | Per-view ref-mapping status: `Synchronized`, `GitAhead`, `AtomicAhead`, `Diverged`, or `Unrepresentable`, with explicit remediation for each. |
| `atomic git shim switch <view>` | Switch Git and Atomic together to an existing view. Requires an already-mapped branch; it does not create one. |
| `atomic status --git` | Git-style staging status for the supported subset of Git semantics (`--json` available, but not together with `--no-reconcile`). Not full porcelain compatibility. |

### Publishing a Draft view

Switching to a Draft view can leave Git at a detached HEAD — that is expected when HEAD points at the view's projection commit. To give the work a real branch:

```bash
atomic view switch feature-auth
atomic git shim reconcile
atomic git shim publish feature-auth --branch feature-auth
```

`publish` creates the Git branch at the draft's projection commit and records the branch-backed mapping. The view stays a Draft in Atomic; HEAD stays detached. Publishing is never implicit, and it requires a projection commit — record or reconcile first.

## Hooks are advisory

`enable` installs five Atomic-owned Git hook dispatchers:

| Git event | Hook | What it records |
|-----------|------|-----------------|
| `git checkout` / `git switch` | `post-checkout` | Checkout evidence; schedules reconciliation |
| `git commit` | `pre-commit` | Authenticated commit-time capture for managed agent sessions |
| `git rebase` / rewrites | `post-rewrite` | Rewrite evidence (operation linkage) |
| Ref movements | `reference-transaction` | Which refs moved |
| `git push` | `pre-push` | Local advisory provenance verification |

What they **don't** do:

- They never run an import or rewrite history behind your back
- They never block a Git operation — a hook failure stays advisory (`|| true`), with one deliberate exception: a `pre-push` refusal blocks *this machine's* push only
- They are not the guarantee. `git push --no-verify`, a removed hook, or another client bypasses them entirely; the receiving side must enforce its own checks

Atomic only writes a hook file when it is missing or already an exact Atomic-owned dispatcher. Anything else — custom hooks, symlinks, foreign scripts — is reported and left byte-for-byte untouched.

Inside a linked `git worktree` (`git worktree add`) the dispatchers pass through with one advisory line and record nothing; see [Known limits](#known-limits).

## Verifiable identity: bindings

Git history alone can't prove that two commits represent the same change — squash merges and rebases rewrite history. **Bindings** close that gap: signed, immutable records of "Git state X corresponds exactly to Atomic state Y."

```bash
# Sign and publish a binding for current Git HEAD and the Atomic view
atomic git shim binding publish --key-file ~/.atomic/binding.key

# Verify a published binding (signature, bound fields, Git content)
atomic git shim binding verify <id>

# Fetch a binding's change closure (Atomic remote first, changes.pack fallback)
atomic git shim binding fetch <id> --remote origin

# Restore a binding's exact original state into a view
atomic git shim binding resurrect <id>

# Publish stored bindings that lack their create-only ref (bounded, idempotent)
atomic git shim binding queue --remote origin
```

Bindings publish to `refs/atomic/bindings/<shard>/<id>` and view refs to `refs/atomic/views/*` — create-only, never force-updated. For servers that reject that namespace, `binding queue --degraded-head-fallback` uses `refs/heads/atomic/bindings/*` instead. Those refs look like ordinary branches and can be disturbed by ordinary branch tools; the fallback is never selected automatically. Check what actually published with `git ls-remote`.

### Trust

A valid signature does not make an unknown signer trusted. Repository trust settings live under `[git.trust]` in `.atomic/config.toml`: explicitly revoked signers stay revoked, and unknown signers' provenance is not trusted for publication.

### Enforcing on the receiving side

```bash
atomic git shim verify-receive
```

Deploy on an Atomic-controlled remote as a server `pre-receive`/`update` hook, or behind a required CI status check. It reads Git's ref-update lines from stdin and refuses protected updates whose ingested state carries managed-session changes with missing, tampered, untrusted, or incomplete evidence. Everything is protected unless explicitly exempted with `--unprotected <prefix>`.

## Optional watcher

The shim watcher is a daemon that notices Git metadata changes and reconciles reactively. It's an accelerator, never the guarantee. It is disabled by default; enable it after `git shim enable` by editing `.atomic/config.toml` (edit the existing tables — don't append duplicates):

```toml
[git]
watch = "auto"

[git.shim]
enabled = true

[git.shim.watch]
enabled = true
```

```bash
atomic git shim watch --once   # exactly one reactive pass, then exit
atomic git shim watch          # foreground loop until Ctrl-C
```

The watcher waits for a quiet moment (no Git index/ref locks, no in-flight operations), then reconciles **metadata only** — it never writes working files and never moves Git refs. `git.watch = "off"` overrides watcher consent; disabling the shim stops the loop.

## Migrating from the legacy shadow sync

If you used the earlier hook-based sync (hooks running `atomic git import --incremental` automatically), the `cutover` command migrates the repository to the colocated shim and ends the two-writer window:

```bash
atomic git shim enable            # explicit opt-in first
atomic git shim cutover           # readiness-checked, journaled transition
atomic git shim cutover --rollback  # roll back the most recent verified cutover
```

Cutover requires shim consent and passing readiness checks; it reports and refuses on foreign hooks, remotes, or unsupported state rather than migrating partially. Rollback works only while the shared repository head still denotes that cutover.

:::warning
A known limit: a `record` can save its Atomic change and then fail with `git-bridge-cutover` when legacy shadow projection runs. Check `atomic log`, `atomic op log`, and both statuses before retrying — do not delete anything.
:::

## Disabling and recovery

```bash
atomic git shim disable
```

`disable` records `[git.shim] enabled = false`, stops automatic shim telemetry, and removes every Atomic-owned hook dispatcher that `enable` installed (post-checkout, pre-commit, pre-push, post-rewrite, reference-transaction) — so a plain `git push` is never refused by a shim you opted out of. Existing checkpoints remain in place; a previously anchored workspace still checks for a stale baseline. Run `atomic git shim enable` again to re-enroll. `atomic git hooks uninstall` removes the same dispatchers without changing the consent flag; both leave custom hooks, symlinks, and `core.hooksPath` setups untouched and report what they kept.

Operations that move refs journal their plans and outcomes. Inspect and undo them:

```bash
atomic op log
atomic op show <id>
atomic op undo <id>     # apply a supported inverse, with state checks
atomic op restore <id>  # replay a supported operation
```

:::danger
Never delete `.atomic/`, `.vault/`, shelves, or Git objects to "fix" a shim failure. They can hold the only copy of pending work or recovery data. Use `reconcile`, `verify`, and the `op` commands instead.
:::

Shim events are also appended to `.atomic/bridge/events.jsonl` (capped at 4 MiB). It's diagnostic telemetry — not fsynced, and never a substitute for the durable operation journal.

## Day-to-day Git usage

These ordinary Git actions are handled (fixed in atomicdotdev/atomic#281):

- Creating a branch from an imported tip and committing there, then reconciling; fast-forward and `--no-ff` merges back.
- Untracked files, gitignored or not (`node_modules/`, `target/`, `.DS_Store`, scratch files): `reconcile` and `verify` ignore them.
- Paths with spaces, Unicode or raw non-UTF-8 bytes are tracked under their on-disk spelling; a name containing a literal `%` keeps its reversible escaped identity, so `a%41.txt` and `aA.txt` stay distinct.
- `git checkout <sha>` / `git bisect` on an imported commit, then back to the branch.
- `git reset --hard` (or a rebase / force-pull) onto an imported ancestor: the view rewinds on the next `reconcile`.
- A stale `.git/REBASE_HEAD` after an interactive rebase no longer blocks commands.
- `git push origin <other-branch>` / `git push --all` for reconciled branches.
- `atomic git import` refuses to materialize a branch that is not checked out over uncommitted edits or untracked files it would overwrite.
- `atomic git shim switch <view>` refuses a branch whose tip the view has not imported (reconcile the branch first) instead of silently reverting those commits.
- Repositories whose tree holds symlinks (the `.claude/skills/<name>` layout) switch and reconcile normally.
- A native `atomic record` that deletes or rewrites lines in a file Git already holds keeps every later `git commit` reconcilable. The same holds for a native rename (`mv` plus `atomic record -a`) of a file whose last line has no newline.
- `atomic git shim switch` handles a directory that later became a symlink (the `.claude/commands -> ../.agents/commands` agents layout).
- Deleting a branch whose view was adopted (`git switch -c topic`, `git switch main`, `git branch -D topic`) retires its ref mapping instead of refusing every later reconcile; a renamed branch (`git branch -m`) still refuses with the explicit remediation.
- A branch created after a no-ff merge is seeded from the source view's own log, so the merged line renders once.
- An edit of a file whose graph vertices no longer line up with its lines (seen on pallets/markupsafe after a maintenance-branch merge) is recorded as a whole-file rewrite in both layers instead of losing content; the import used to refuse at that commit.
- A new branch's first `reconcile` imports only the commits above the nearest already-interpreted ancestor (`Seeded view 'topic' from interpreted ancestor ...`) instead of replaying the whole history, and an incremental commit's staged check replays the semantic closure only for the paths it touches.
- A commit (or native record) that truncates one file to zero bytes and extends another no longer captures the next edit of the extended file; this showed up as `atomic status` reporting a file modified right after a clean record and as the import of stretchr/objx refusing at the commit that deleted the truncated `go.sum`.
- An empty lockfile or checksum file (`package-lock.json`, `Cargo.lock`, `go.sum`) that later gains content, or one truncated and regenerated, imports and reconciles; the staged semantic closure used to render it as zero bytes.
- `atomic record` of a moved directory whose first entry is an empty file next to a non-empty sibling (a Python package with an empty `__init__.py`) applies instead of failing with `ambiguous source ... for prior FOLDER edge`.
- Deleting a file that an earlier commit truncated to zero bytes beside a wholesale-rewritten neighbour (stretchr/objx: `go.sum` next to `map_test.go`) imports and records cleanly; the truncation no longer leaves a zero-length vertex that the deletion mistook for the neighbour's first line.
- A commit that moves a file into a subdirectory while a symlink to it takes the old path (srid/emanote: `README.md -> emanote/README.md`), and a symlink replaced by the file it pointed to, import; the importer used to refuse with `prospective import tree mismatch`.
- A repository whose committed tree already contains conflict markers (a `Cargo.lock` merged by hand upstream) records through the shim; markers Git HEAD already holds at the same path no longer refuse every later record. A record that writes new markers is still refused.
- Importing a history with a large tree (hundreds of MB of committed binaries) no longer needs a copy of the whole tree per commit in memory.
- A first import into a fresh repository runs the rolling stream — first-parent, graph-only changes, live dashboard — instead of the ordinary importer; `--no-stream` selects the ordinary importer. See [Git Import and Push](./git-import-push#the-rolling-stream-default-for-fresh-imports).
- `git mv` of the last file out of a directory leaves the emptied directory on disk; it no longer shows up as a `new dir` that blocks `reconcile` and `verify` (an empty directory you do mean to track is added with `atomic add --directory <path>`).
- A CRLF file committed before the repository adopted `* text=auto eol=lf` imports and stays clean in `atomic status`; the importer used to refuse it and status reported it modified forever.
- **Repositories imported with a build before this change must be re-imported**: the old importer tracked paths with spaces or non-ASCII characters under escaped names, which the fixed build reports as deleted plus untracked. Remove `.atomic` and import again.

## Known limits

- Linked `git worktree`s are not managed by the shim yet. In a worktree that was never registered with the repository (plain `git worktree add`, no `.atomic/repository` pointer) Atomic's hooks pass through with one advisory line (`Atomic shim: linked worktree '...' is not managed; hooks pass through`), so `git commit` and `git push` work normally, and `atomic status` / `atomic git shim reconcile` refuse with `linked git worktrees are not supported by the shim yet; run from the main worktree '<path>'` instead of creating a second repository there.
- A native `atomic record -a` of a moved directory that directly follows another native record (no `atomic status` in between) can refuse with `unresolved path claims: <new directory>, ...`; run `atomic status` first, or move with `git mv` + `git commit` + `atomic git shim reconcile`.
- Keep `.atomicignore` out of Git: a tracked `.atomicignore` makes `verify`/`reconcile` report `GitIndex/ExclusionPolicy`.
- Interrupting an import between a change write and its Git SHA index write can leave that commit unable to re-import; the recovery is a fresh import.
- Performance: `atomic record` and `reconcile` still take minutes on repositories with a few hundred files. A fresh import now runs the rolling stream (see [Git Import and Push](./git-import-push#the-rolling-stream-default-for-fresh-imports)); the ordinary importer behind `--no-stream`, `--with-crdt`, `--all`, and `--incremental` still takes hours on a thousand-commit history.
- `atomic git shim enable --adopt-git` (adopting a foreign Git state without an Atomic-origin projection) is not yet available.
- `atomic status --git` covers a supported subset of Git porcelain semantics, not all of it.
- Local hooks prove nothing about a remote that accepts unchecked pushes — deploy `verify-receive` where provenance must be enforced.

## Next Steps

- [Git Import and Push](./git-import-push) — the manual import/push commands in detail
- [Migrating from Git](./migrating-from-git) — going Atomic-only
- [AI Agent Workflows](./ai-agent-workflows) — provenance tracking with agents
