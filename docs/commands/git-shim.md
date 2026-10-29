---
sidebar_position: 30
title: git shim
---

# atomic git shim

The colocated Git shim: reconcile, verify, and publish between a Git checkout and the current Atomic view. Introduced in Atomic 0.20.0.

> **Verified against CLI 0.20.0.**

The shim lets Atomic and Git share a single working copy and a single history. You get Atomic's patch theory, AI provenance, and conflict-free views for daily development, while your team keeps reviewing PRs on GitHub or GitLab exactly as before — and every transition between the two is verified, journaled, and recoverable.

The shim is **opt-in per repository**. Having both `.git/` and `.atomic/` does not enable it: until you explicitly run `atomic git shim enable`, import history, or enroll through a verified checkpoint, ordinary Atomic commands stay native.

:::note Platform support

Linux and macOS. Windows shim support has not been validated.

:::

## Synopsis

```bash
# Setup
atomic git shim enable [OPTIONS]
atomic git shim mirror-ignores

# Day-to-day workflow
atomic git shim reconcile
atomic git shim verify
atomic git shim status
atomic git shim switch <VIEW>
atomic git shim publish <VIEW> --branch <BRANCH>

# Bindings
atomic git shim binding <SUBCOMMAND>

# Enforcement
atomic git shim verify-receive [--unprotected <REF>...]

# Watcher
atomic git shim watch [--once] [--poll-ms <MS>]

# Migration & recovery
atomic git shim cutover [--rollback]
atomic git shim review [--view <VIEW>]
atomic git shim disable
```

## Description

The shim manages the relationship between a Git checkout and Atomic's graph when both live in the same directory. It is **advisory by design**: nothing syncs silently. Every operation is explicit, verified, and recorded. Git never becomes the system of record, and Atomic state is never projected onto Git without a stated adoption path.

The shim keeps three representations in agreement:

1. **The Atomic graph** — the canonical store of changes, views, and provenance
2. **Git objects and refs** — a projection of that graph that ordinary Git tooling can read
3. **The working copy on disk** — one shared checkout both systems observe

Atomic records project into Git as commits, and Git commits import into Atomic as changes. Commands verify that both sides agree at every step, and every Git ref move the shim performs is journaled *before* it happens, with a receipt recorded after — so an interrupted operation recovers on the next writable open instead of leaving things half-done.

Git hooks and an optional watcher make changes visible quickly, but they are **advisory**: correctness never depends on them having run. Commands always check the current state.

Enabling the shim anchors its state in the repository configuration (`[git.shim]`). Disabling it is the documented, tested rollback path.

## Setting up

### 1. Import existing Git history

```bash
cd /path/to/your/git/repo
atomic git import
```

This converts the Git branch's history into Atomic changes, preserving author, timestamp, message, file operations, and the original commit SHA. Branch names become Atomic views. See [git](git.md) for all import flags.

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

- Installs Atomic's advisory Git hook dispatchers (see [Hooks are advisory](#hooks-are-advisory) below)
- Sets `[git.shim] enabled = true` in `.atomic/config.toml`
- Proves Git and Atomic agree (repository, index, and working copy), then creates a **signed Anchor binding** and a verified working-copy checkpoint
- Configures fetch refspecs for `refs/atomic/bindings/*` and `refs/atomic/views/*` on the selected remote (default `origin`), so bindings transfer with every `git fetch`

| Option | Description |
|--------|-------------|
| `--binding-key-file <FILE>` | File holding the hex-encoded 32-byte Ed25519 secret key that signs the Anchor binding. Required to create the Anchor binding |
| `--mirror-ignores` | Consent to mirroring `.atomicignore` into a managed `.git/info/exclude` block. Without it, ignore-policy differences are reported as a divergence instead |
| `--adopt-atomic` | Explicit remediation: project the current Atomic state onto Git HEAD through the safe Atomic-origin path before anchoring. Refuses dirty worktrees; never silently merges |
| `--adopt-git` | Explicitly unavailable until Phase 9 foreign synthesis (CB-9B/9C) |
| `--with-changes-pack` | Attach the bounded `changes.pack` fallback to the Anchor binding's tree (RFC §8.6, CB-10B): the hash-verified V3 change files of the effective closure, for receivers that cannot reach an Atomic remote. Private sidecars and unhashed bodies never enter the pack; assembly refuses them closed |
| `--remote <REMOTE>` | Remote to configure the RFC §8.6 fetch refspecs on (default: `origin`) |
| `--no-refspecs` | Skip the RFC §8.6 fetch-refspec configuration (local-only repos) |

:::note Automatic rollout blocked is expected

A notice that automatic rollout is blocked is expected. Atomic leaves custom `core.hooksPath` setups, existing hook binaries, and symlinks untouched, and prints integration instructions instead.

:::

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
| `atomic git shim reconcile` | Incrementally import Git HEAD, verify it, and record shim metadata. Use this after commits arrive from Git (a pulled branch, a teammate's push) |
| `atomic git shim verify` | Read-only comparison of Git HEAD and the current Atomic view. Changes nothing |
| `atomic git shim status` | Per-view ref-mapping status: `Synchronized`, `GitAhead`, `AtomicAhead`, `Diverged`, or `Unrepresentable`, with explicit remediation for each |
| `atomic git shim switch <view>` | Switch Git and Atomic together to an existing view. Requires an already-mapped branch; it does not create one |
| `atomic status --git` | Git-style staging status for the supported subset of Git semantics (`--json` available). Not full porcelain compatibility |

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

## Subcommands

### `git shim reconcile` — Import Git HEAD and Record Shim Metadata

```bash
atomic git shim reconcile
```

Incrementally import Git HEAD, verify it, and record shim metadata. Run this whenever the Git side has moved (new commits, a reset, a checkout) and you want Atomic to catch up deliberately rather than reactively.

### `git shim verify` — Read-Only Comparison

```bash
atomic git shim verify
```

Read-only comparison of Git HEAD and the current Atomic view. Safe to run at any time; reports divergence without changing anything.

### `git shim switch` — Coordinated View Switch

```bash
atomic git shim switch <VIEW>
```

Switch Git and Atomic together to an existing view, so the Git checkout and the Atomic view never disagree about what is checked out. Requires an already-mapped branch; it does not create one.

### `git shim status` — Reconciliation Status

```bash
atomic git shim status
```

Report per-view ref-mapping reconciliation status (CB-10A). Use this to answer "is the shim's view of Git HEADs current?"

Each view reports one of: `Synchronized`, `GitAhead`, `AtomicAhead`, `Diverged`, or `Unrepresentable`, with explicit remediation for each state.

### `git shim publish` — Publish a Draft View to a Git Branch

```bash
atomic git shim publish <VIEW> --branch <BRANCH>
```

Explicitly publish a Draft view to a Git branch (RFC §8.1). The view is published as-is on the named branch; publishing is explicit, never implied by a commit. It requires a projection commit — record or reconcile first.

#### Examples

```bash
# Publish the feature-auth draft view to a Git branch for review
atomic git shim publish feature-auth --branch atomic/feature-auth
```

### `git shim enable` — Enable the Advisory Checkout Shim

```bash
atomic git shim enable [OPTIONS]
```

Enable the advisory Git checkout event shim and anchor shim state. See [Setting up](#2-enable-the-shim) for the full workflow, option table, and hook-dispatcher details.

### `git shim mirror-ignores` — Mirror Ignore Rules

```bash
atomic git shim mirror-ignores
```

Mirror `.atomicignore` into the managed `.git/info/exclude` block. Explicit consent is required because it writes to Git's own configuration area. The same consent is available at enable time via `--mirror-ignores`; without it, ignore-policy differences are reported as a divergence.

### `git shim binding` — Immutable Git State Bindings

```bash
atomic git shim binding <SUBCOMMAND>
```

Bindings are signed, immutable claims that tie a Git HEAD to an Atomic view state. They are how a receiver can prove that a Git commit and an Atomic graph state belong together.

Git history alone can't prove that two commits represent the same change — squash merges and rebases rewrite history. Bindings close that gap: signed, immutable records of "Git state X corresponds exactly to Atomic state Y."

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

| Subcommand | Description |
|------------|-------------|
| `publish` | Sign and publish a binding for the current Git HEAD and Atomic view (`--key-file <KEY_FILE>` required; hex-encoded 32-byte Ed25519 secret key). Optional: `--with-changes-pack` (RFC §8.6 bounded `changes.pack` fallback), `--with-conflicts-pack` (RFC §8.3, CB-8B — complete conflict-object pack, identity-verified against the conflict snapshot's `atomic-conflict <hash>` header at restore time) |
| `verify` | Verify a published binding: signature, bound fields, and Git content |
| `fetch` | Fetch a published binding's change closure: Atomic remote first, bounded `changes.pack` fallback (RFC §8.6, CB-6B) |
| `resurrect` | Resurrect a published binding's exact original state into a view (RFC §5.2, CB-6C): closure fetch (remote first, pack fallback), isolated projection proof against the bound Git tree and SetId, then exact membership restoration in binding Merkle order |
| `queue` | Bounded create-only publication queue (RFC §8.6, §8.5, CB-10B). Options: `--remote <REMOTE>`, `--degraded-head-fallback` |

Bindings publish to `refs/atomic/bindings/<shard>/<id>` and view refs to `refs/atomic/views/*` — create-only, never force-updated. For servers that reject that namespace, `binding queue --degraded-head-fallback` uses `refs/heads/atomic/bindings/*` instead. Those refs look like ordinary branches and can be disturbed by ordinary branch tools; the fallback is never selected automatically. Check what actually published with `git ls-remote`.

#### Trust

A valid signature does not make an unknown signer trusted. Repository trust settings live under `[git.trust]` in `.atomic/config.toml`: explicitly revoked signers stay revoked, and unknown signers' provenance is not trusted for publication.

### `git shim review` — Squash/Rewrite Candidates

```bash
atomic git shim review [--view <VIEW>]
```

Review squash/rewrite candidates with their evidence and identity limits (CB-9B). Use this after an upstream history rewrite to see what the shim believes was squashed or rewritten, and which identities vouch for it.

### `git shim verify-receive` — Receiving-Side Verifier

```bash
atomic git shim verify-receive [--unprotected <REF>...]
```

Trusted receiving-side verifier (CB-12B, RFC §10.4/§12.10). Run on a remote/receiver to check pushed refs against managed provenance. Deploy it as a server `pre-receive`/`update` hook, or behind a required CI status check.

It reads Git's ref-update lines from stdin and refuses protected updates whose ingested state carries managed-session changes with missing, tampered, untrusted, or incomplete evidence. Everything fails closed by default; `--unprotected` exempts named ref prefixes from verification as an explicit deployment choice.

### `git shim watch` — Reactive Reconciliation

```bash
atomic git shim watch [--once] [--poll-ms <MS>]
```

The shim watcher is a daemon that notices Git metadata changes and reconciles reactively (CB-13D, optional). It's an accelerator, never the guarantee. It is disabled by default; enable it after `git shim enable` by editing `.atomic/config.toml` (edit the existing tables — don't append duplicates):

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

| Option | Description |
|--------|-------------|
| `--once` | Run exactly one reactive pass and exit (test/equivalence mode) |
| `--poll-ms <POLL_MS>` | Metadata re-observation interval in milliseconds (default: 500) |

### `git shim cutover` — Switch to the Colocated Shim

```bash
atomic git shim cutover [--rollback]
```

Cut the repository over to the colocated shim (CB-13B). Verified and shared-head gated. `--rollback` rolls the verified cutover back.

If you used the earlier hook-based shadow sync (hooks running `atomic git import --incremental` automatically), `cutover` migrates the repository to the colocated shim and ends the two-writer window:

```bash
atomic git shim enable               # explicit opt-in first
atomic git shim cutover              # readiness-checked, journaled transition
atomic git shim cutover --rollback   # roll back the most recent verified cutover
```

Cutover requires shim consent and passing readiness checks; it reports and refuses on foreign hooks, remotes, or unsupported state rather than migrating partially. Rollback works only while the shared repository head still denotes that cutover.

:::warning Record failure with `git-bridge-cutover`

A known limit: a `record` can save its Atomic change and then fail with `git-bridge-cutover` when legacy shadow projection runs. Check `atomic log`, `atomic op log`, and both statuses before retrying — do not delete anything.

:::

## Colocated Mode: `atomic stage` / `atomic unstage`

In colocated mode (after `git shim cutover`), the Git index is projected from Atomic state:

```bash
atomic stage [PATH]...     # Stage worktree content into the Git index (colocated mode)
atomic unstage [PATH]...   # Move Git index entries back to the baseline without touching the worktree
```

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be staged/unstaged without writing the index |

`unstage` never touches the worktree: it only moves index entries back to the baseline, mirroring how Atomic records content rather than index state.

## Disabling and recovery

### `git shim disable` — Roll the Shim Back

```bash
atomic git shim disable
```

Record `[git.shim] enabled = false` in the repository configuration. This is the tested rollback path (review R4): the shim's state is disabled, not deleted.

`disable` also stops automatic shim telemetry. Installed hooks and existing checkpoints remain in place; a previously anchored workspace still checks for a stale baseline. Run `atomic git shim enable` again to re-enroll. (`atomic git hooks uninstall` currently removes only the post-checkout hook; remove the other dispatchers separately when decommissioning.)

### Recovery operations

Operations that move refs journal their plans and outcomes. Inspect and undo them:

```bash
atomic op log
atomic op show <id>
atomic op undo <id>     # apply a supported inverse, with state checks
atomic op restore <id>  # replay a supported operation
```

:::warning Never delete state to "fix" the shim

Never delete `.atomic/`, `.vault/`, shelves, or Git objects to "fix" a shim failure. They can hold the only copy of pending work or recovery data. Use `reconcile`, `verify`, and the `op` commands instead.

:::

Shim events are also appended to `.atomic/bridge/events.jsonl` (capped at 4 MiB). It's diagnostic telemetry — not fsynced, and never a substitute for the durable operation journal.

## Known limits

- Creating a new Git branch and committing there after Atomic records a rename can make `reconcile` fail with `view '<branch>' not found`. Check `atomic git shim status` for the affected view and remediation.
- `atomic git shim enable --adopt-git` (adopting a foreign Git state without an Atomic-origin projection) is not yet available.
- `atomic status --git` covers a supported subset of Git porcelain semantics, not all of it.
- Local hooks prove nothing about a remote that accepts unchecked pushes — deploy `verify-receive` where provenance must be enforced.

## See Also

- [git](git.md) — `git import`, `git push` (including the conflict-export refusal), and hook management
- [op](op.md) — the journal where the shim records its metadata, and the `undo`/`restore` recovery path
- [status](status.md) — `atomic status --git` staging status
- [migrating-from-git guide](/getting-started/migrating-from-git) — Import walkthrough and going Atomic-only
- [AI Agent Workflows](/getting-started/ai-agent-workflows) — provenance tracking with agents
