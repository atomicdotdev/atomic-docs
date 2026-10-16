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
| `atomic status --git` | Git-style staging status for the supported subset of Git semantics (`--json` available). Not full porcelain compatibility. |

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

`disable` records `[git.shim] enabled = false` and stops automatic shim telemetry. Installed hooks and existing checkpoints remain in place; a previously anchored workspace still checks for a stale baseline. Run `atomic git shim enable` again to re-enroll. (`atomic git hooks uninstall` currently removes only the post-checkout hook; remove the other dispatchers separately when decommissioning.)

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

## Known limits

- Creating a new Git branch and committing there after Atomic records a rename can make `reconcile` fail with `view '<branch>' not found`. Check `atomic git shim status` for the affected view and remediation.
- `atomic git shim enable --adopt-git` (adopting a foreign Git state without an Atomic-origin projection) is not yet available.
- `atomic status --git` covers a supported subset of Git porcelain semantics, not all of it.
- Local hooks prove nothing about a remote that accepts unchecked pushes — deploy `verify-receive` where provenance must be enforced.

## Next Steps

- [Git Import and Push](./git-import-push) — the manual import/push commands in detail
- [Migrating from Git](./migrating-from-git) — going Atomic-only
- [AI Agent Workflows](./ai-agent-workflows) — provenance tracking with agents
