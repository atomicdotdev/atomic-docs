# Atomic Setup (Agent Skill)

You are the operator of Atomic setup. There is no helper script — this file is
the single source of truth. You execute the phases yourself, deterministically:
same state in, same steps out, always in the same order. The only
non-deterministic part is the user's answers, and the only time you improvise
is when the user explicitly asks for troubleshooting help.

## Determinism contract

- **Fixed phase order:** `preflight → deps → install → path → identity →
  account → agent → verify → completions`. Never reorder, never invent phases.
- **Check-before-act:** before every step, run its "already done?" check.
  Skip completed steps with a one-line note — do not re-ask about them.
- **Consent before mutation:** read-only checks run freely. Every mutating
  command needs an explicit yes first (question tool, or plain-text numbered
  options with end-turn-and-wait). Never mutate on silence or ambiguity.
- **Batch inputs per phase** (e.g. identity name + email + "register with
  atomic.storage?" in one question set). Show the exact command before asking.
- **Piped downloads:** never rely on `curl | sh` alone — without `pipefail` a
  failed download is masked. Either run
  `set -o pipefail; curl -sSf https://atomic.storage/install.sh | sh`, or
  download to a file first
  (`curl -sSf https://atomic.storage/install.sh -o /tmp/atomic-install.sh && bash /tmp/atomic-install.sh`).
  Also note `curl | sh` starves stdin of prompts — interactive installs belong
  in the user's terminal, not your tool calls.
- **Receipt:** append every outcome to `~/.atomic/setup-receipt.txt` (format
  below) so an interrupted run can resume.
- **Version comparison:** `[ "$(printf '%s\n%s\n' "$a" "$b" | sort -V | head -n1)" = "$b" ]`
  is true when `a >= b`. Example: `[ "$(printf '%s\n%s\n' "$atomic_version" "0.12.0" | sort -V | head -n1)" = "0.12.0" ]`
  is true when the installed CLI is 0.12.0 or newer. Agent integrations
  require CLI >= **0.12.0**.
- **Email validation:** `^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$`

## Phases

| Phase | What it does | Consent gate |
|-------|--------------|--------------|
| `preflight` | Read-only: OS, package manager, core deps, existing Atomic/identities | none — always safe |
| `deps` | Install missing core deps (curl, git, ca-certificates) via the system package manager | per-package y/n |
| `install` | Hosted installer first (`https://atomic.storage/install.sh`), source build only as fallback | y/n |
| `path` | Add the install dir to the shell rc file | y/n |
| `identity` | `atomic identity new <name> --email <email> --set-default` | y/n (batch name+email) |
| `account` | `atomic identity register https://atomic.storage` + optional org/workspace/project | y/n each |
| `agent` | `atomic agent enable [--agent <name>]` + `atomic agent status --verbose` | y/n |
| `verify` | Prove the OpenCode plugin records turns with AI provenance | y/n (one real model turn, tiny cost) |
| `completions` | Completions line added to the rc file | y/n |

**Stale-version rule:** if `atomic update --check` exits `1`, explain that old
versions may be missing functionality (agent integrations need >= 0.12.0 for
the storage-based install flow), then offer the upgrade — y/n, never
automatic. Run `atomic update` and it prints the exact upgrade command for
the install method; run that.

## Phase 0 — Preflight (read-only, always run first)

```bash
uname -s                                   # OS (Darwin / Linux)
. /etc/os-release; echo "$ID $ID_LIKE"     # distro (Linux)
command -v apt-get brew pacman dnf zypper xbps-install   # package manager
command -v bash curl git                   # core deps
atomic --version                           # installed? version?
atomic update --check; echo $?             # 0 up-to-date, 1 update available, 4 network/parse issue
atomic identity list                       # existing identities
test -d .atomic -o -d .vault               # already an Atomic project?
```

## Phase 1 — Deps (only if preflight found a missing core dep)

- Install with the detected package manager (gated). Full command per
  detected manager:
  - Debian/Ubuntu: `sudo apt-get update && sudo apt-get install -y curl git ca-certificates`
  - macOS: `brew install curl git ca-certificates`
  - Arch: `sudo pacman -S curl git ca-certificates`
  - Fedora: `sudo dnf install curl git ca-certificates`
  - openSUSE: `sudo zypper in curl git ca-certificates`
  - Void: `sudo xbps-install curl git ca-certificates`
- Unknown manager: stop and tell the user what to install rather than
  guessing.

## Phase 2 — Install (hosted first)

**Primary path — hosted installer** (gated, y/n first):

```bash
curl -sSf https://atomic.storage/install.sh | sh
```

- Pin a version: `curl -sSf https://atomic.storage/install.sh | ATOMIC_VERSION=0.5.1 sh`
- Custom dir: `curl -sSf https://atomic.storage/install.sh | ATOMIC_INSTALL="$HOME/.local/bin" sh`
  (the env var must sit on the `sh` side of the pipe — the script reads it,
  not `curl`; `ATOMIC_INSTALL=… curl … | sh` silently ignores it)
- Already-installed check: `command -v atomic` — skip the phase if present.
- Piped downloads: see the Determinism contract — run
  `set -o pipefail; curl -sSf https://atomic.storage/install.sh | sh`, or
  download to a file first
  (`curl -sSf https://atomic.storage/install.sh -o /tmp/atomic-install.sh && bash /tmp/atomic-install.sh`).
- `curl | sh` starves stdin of prompts — if the install needs interaction,
  hand the command to the user for their terminal instead.

**Fallback path — source build** (only if the user declines hosted, has no
network access to atomic.storage, or the hosted install fails twice):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh   # rustup
rustup default stable
# dev libraries — pick the line for the detected distro:
sudo apt-get update && sudo apt-get install -y make libsodium-dev libclang-dev pkg-config libssl-dev libxxhash-dev libzstd-dev clang   # Debian/Ubuntu
sudo pacman -S clang libsodium gcc-libs rustup pkgconf diffutils make xxhash zstd                                          # Arch
sudo dnf install clang-devel openssl-devel libsodium-devel libzstd-devel pkgconfig xxhash-devel                            # Fedora
sudo zypper in clang-devel libopenssl-devel libsodium-devel libzstd-devel pkgconfig xxhash-devel                           # openSUSE
sudo xbps-install libgcc-devel libressl-devel libsodium-devel libzstd-devel xxHash-devel                                   # Void
brew install llvm libsodium openssl xxhash zstd                                                                            # macOS
git clone https://github.com/atomicdotdev/atomic.git "$HOME/atomic"
cd "$HOME/atomic" && cargo install --path atomic-cli
```

- Unknown distro: no package list — point the user to https://docs.atomic.dev/
  (Installing Atomic) rather than guessing.
- Rust must be 1.70+.

## Phase 3 — Path

- Check `command -v atomic` first — skip if found.
- Candidate dirs: `$HOME/.cargo/bin`, `$HOME/.local/bin`, `/usr/local/bin`.
- rc file: `~/.zshrc` if `$SHELL` ends in `zsh`, else `~/.bashrc`.
- Line (gated): `export PATH="$PATH:$HOME/.local/bin"` (adjust the dir to the
  one Atomic actually installed into). Check two things first —
  `case ":$PATH:" in *":$dir:"*)` (current session) and
  `grep -qF "export PATH=" ~/.bashrc` (rc file, pattern including `$dir`);
  already present in either = skip. If a stale copy of `atomic` exists in an
  earlier PATH dir (e.g. `/usr/local/bin`), prepend instead —
  `export PATH="$HOME/.local/bin:$PATH"` — so the fresh binary wins.

## Phase 4 — Identity

- Check `atomic identity show <name>` — exists = offer
  `atomic identity default <name>` (gated) and skip creation.
- Create (gated): `atomic identity new <name> --email <email> --set-default`
  Role: your identity is the keypair that cryptographically signs every
  change you record. Without it, nothing in a repository can be attributed
  or verified.
- Validate the email against the regex above before running; re-prompt on
  invalid input; empty input = declined, not an error.

## Phase 5 — Account

- Check `atomic org show` — success = already registered, skip register.
- Register (gated): `atomic identity register https://atomic.storage`
  - Creates the personal org and stores the server URL + default org in the
    global config. Role: registration links your signing identity to Atomic
    storage, which is what lets changes be published and shared beyond your
    machine.
- Optional (each separately gated):
  ```bash
  atomic org create <name> && atomic org set <name>
  atomic workspace create <name> --visibility private && atomic workspace set <name>
  atomic project create <name> --kind <rust|…>
  ```
  - **Org:** an org is the top-level container on Atomic storage that owns
    your workspaces and projects. Registration already creates a personal
    one; extra orgs are for teams, or for separating personal from work.
  - **Workspace:** a workspace groups repositories and collaborators under
    an org and controls visibility. It is the sharing boundary for who can
    see and pull your work.
  - **Project:** a project tracks a single codebase inside a workspace, so
    views, changes, and provenance stay organized per codebase.
- Verify: `atomic identity whoami` + `atomic org show`.

## Phase 6 — Agent

- Version gate: only proceed if CLI >= 0.12.0; otherwise run the
  stale-version rule first.
- Detect an agent dir for a sensible default: `.claude` (claude-code),
  `.cursor` (cursor), `.opencode` (opencode), `.codex` (codex), `.grok`
  (grok), `.cline` (cline), `.kilo` (kilo), `.kiro` (kiro), `.devin` (devin).
- **`agent enable` must run from inside an Atomic repository.** Run
  `atomic init` first — a scratch repo like `/tmp/atomic-setup` is fine
  (`mkdir -p /tmp/atomic-setup && cd /tmp/atomic-setup && atomic init`) — or
  use the user's project. Run from a non-repo directory it fails with
  "Not in an Atomic repository".
- Enable (gated): `atomic agent enable --agent <name>` — or plain
  `atomic agent enable` for auto-detection. This pulls the agent integration
  package from Atomic storage (no account needed) and links the plugin, agent
  prompt, and skills into the agent's config directory. Role: this links
  recording hooks into your coding agent so every AI turn is captured as a
  signed change with AI provenance (model, vendor, tokens) automatically.
  The verify phase proves this mechanism.
- Verify: `atomic agent status --verbose` — also from inside a repo.

## Phase 7 — Verify: the OpenCode plugin records provenance

Please refer to the [atomic-validation-skill](https://github.com/atomicdotdev/atomic-skills/tree/main/skills/setup/atomic-validation-skill.md) to verify provenance is working as intended.

After enabling the OpenCode integration, prove end-to-end that turns record
**automatically with AI provenance** — no manual `atomic record`. One real
model turn runs, so ask consent once for the whole phase. Role: this proves
the whole chain end to end, meaning your identity signed a change, the
plugin recorded it with zero manual commands, and the attestation names the
model. In short, provenance works.

**1. Confirm the integration landed (read-only):**

```bash
atomic agent status --verbose
test -f ~/.config/opencode/plugins/atomic-hooks.ts && echo plugin-present
opencode --version          # note the major version: 1.x or 2.x
command -v opencode          # must resolve; if not, PATH first
```

Version gates:
- **OpenCode v1 must be >= 1.18.29.** Older v1 builds register the plugin
  twice (legacy function export + object entrypoint) and double-record every
  turn — tell the user to upgrade OpenCode before continuing.
- **OpenCode v2** (any 2.0.x) auto-discovers `~/.config/opencode/plugins/*.ts`;
  the v1-era `"plugin"` config key is normalized, so no extra config is needed.

**2. Prepare the test project (gated):**

```bash
mkdir -p /tmp/test-atomic && cd /tmp/test-atomic && atomic init
```

**3. Trigger one real turn.** Pick the first path that applies:

- **You are running inside OpenCode v2 and the current working directory is
  an Atomic repo** (`test -d .atomic`): prepare a test project first
  (`mkdir -p /tmp/test-atomic && cd /tmp/test-atomic && atomic init`) and
  start the subagent's work from there — but remember the *session's*
  directory is what the plugin gates on, so the subagent must do its file
  work inside an Atomic repo for the change to record.

- **Otherwise** (you are not OpenCode, the cwd is not an Atomic repo, or the
  subagent turn did not record): run opencode standalone against the test
  project — a fresh process always loads the plugin fresh:
  ```bash
  # OpenCode v1 (no --standalone flag):
  cd /tmp/test-atomic && opencode run --auto \
    "Create a file called HELLO.md in the current directory containing exactly the text: hello"
  # OpenCode v2:
  cd /tmp/test-atomic && opencode run --standalone --auto \
    "Create a file called HELLO.md in the current directory containing exactly the text: hello"
  ```

  `opencode run` needs a working model connection:
  - **OpenCode v2 ships free built-in models** (listed as `opencode/*` by
    `opencode models`) — the verification works with no login at all.
  - **OpenCode v1 needs a provider** — if the run fails with a provider/model
    error, have the user connect one (`opencode auth login` or a provider API
    key), or pass a known-good `--model provider/model`, then rerun.

**4. Check the provenance (read-only):**

```bash
cd /tmp/test-atomic
atomic status -s           # clean — HELLO.md is already recorded
atomic log -n 2            # newest change's message is the test prompt
atomic change              # shows an Attestation block
```

**Success** = the newest recorded change's message is the test prompt and its
`Attestation` block names the vendor and token counts (model may read
`unknown` for some providers) and an opencode session (`ses_…`) — recorded
with zero manual commands. For the subagent path, also confirm
`.atomic/sessions/ses_*.json` exists and its `turn_count` grew. Report this
to the user as the receipt that the plugin works.

**5. Troubleshoot if nothing recorded** (deterministic fixes first; only
improvise when the user asks for troubleshooting help):

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| `opencode run` fails with a provider/model error | No model connection | v1: connect a model (`opencode auth login` or provider API key) or pass `--model provider/model`; v2: pick a free built-in model (no login needed) |
| No `.atomic/sessions/ses_*.json` after the turn | Plugin never loaded | v1: check the `"plugin"` key in `~/.config/opencode/opencode.json` (written by `atomic agent enable`); v2: confirm the file sits in `~/.config/opencode/plugins/`. Check `~/.local/share/opencode/log/opencode.log` for `loading plugin` |
| Plugin loaded, turn ran, still nothing | Session directory is not an Atomic repo — the plugin records only sessions whose directory has `.atomic` | Re-run from inside the test project (step 3), or `atomic init` the current project |
| `~/.config/opencode/…/.atomic/hook-errors.log` exists (in the project) | A hook shell-out failed | Read it; most common: `atomic` not on the PATH that OpenCode spawned with — restart OpenCode after the path phase, or reinstall so hooks find it |
| `.atomic/hook-errors.log` shows `exit 143` on `stop` after a v2 `--standalone` run | Pre-fix plugin (integration < 1.1.1): `opencode run --standalone` tore down the process tree and killed the in-flight Stop recording. Fresh installs from storage already include the fix, so hitting this means an old install — or a different teardown bug | Re-run `atomic agent enable` (from a repo) to pull the fixed integration package (>= 1.1.1), confirm the plugin file changed, then rerun the turn |
| Session file shows the turn (`turn_count` grew) but `atomic log` is empty | Rare deferred-publication race in the Atomic CLI: the change recorded but its publication to the view log was deferred | Run one more tiny turn (or any `atomic agent hooks` call) — the deferred change then publishes and both turns appear in `atomic log`. Do not re-init or delete anything |
| Every turn recorded twice | OpenCode v1 older than 1.18.29 | Upgrade OpenCode — old v1 builds register the plugin through both export styles |
| `opencode` was already running when the plugin was installed | Current session may predate the plugin | v2 hot-reloads; v1 needs a restart. The standalone run (step 3) sidesteps this entirely |
| `atomic agent enable` failed | CLI < 0.12.0, or it was run outside an Atomic repository | Apply the stale-version rule; run `atomic init` (scratch repo is fine) and retry from inside it — the storage pull itself needs no account |

## Phase 8 — Completions

- Shell from `$SHELL`: `zsh` → `~/.zshrc`, `bash` → `~/.bashrc`.
- Already-configured check (rc file follows `$SHELL`): bash:
  `grep -qF 'source <(COMPLETE=bash atomic)' ~/.bashrc`; zsh:
  `grep -qF 'source <(COMPLETE=zsh atomic)' ~/.zshrc`
- Line (gated): `source <(COMPLETE=zsh atomic)` (zsh, dynamic — completes
  subcommands, flags, view names, change hashes) or
  `source <(COMPLETE=bash atomic)` (bash). Append, then suggest
  `source ~/.zshrc` (zsh) or `source ~/.bashrc` (bash), matching `$SHELL`.

## Receipt format

Append one line per outcome to `~/.atomic/setup-receipt.txt`:

```
[2026-10-01T00:15:31Z] done      install      Atomic 0.18.3 installed
[2026-10-01T00:15:31Z] declined  account      registration declined
           retry: atomic identity register https://atomic.storage
```

Statuses: `done` | `skipped` | `declined` | `refused`. For declined/refused
steps always include the exact `retry:` command.

## Error handling

Deterministic fixes first; only improvise when the user asks for
troubleshooting help.

| Symptom | Fix |
|---------|-----|
| Hosted installer fails / permission denied | Re-run with `curl -sSf https://atomic.storage/install.sh \| ATOMIC_INSTALL="$HOME/.local/bin" sh` (env var on the `sh` side of the pipe) |
| `atomic` not found after install | Run the `path` phase |
| Hosted installer download fails | Download to a file first and inspect (`curl -sSf https://atomic.storage/install.sh -o /tmp/atomic-install.sh && bash /tmp/atomic-install.sh`), or check network/DNS; never retry `curl \| sh` blindly |
| Rust too old (source build) | `rustup update stable` |
| macOS linker errors | `xcode-select --install`; set `LIBRARY_PATH`/`CPATH` to brew prefix |
| `agent enable` fails | CLI must be >= 0.12.0 — apply the stale-version rule first; must also run from inside an Atomic repository (`atomic init` a scratch repo if needed) |
| Registration fails | Check the server URL and network, then retry the `account` phase |
| Verification records nothing | Walk the table in the `verify` phase (step 5) |
| `atomic identity register https://atomic.storage` fails while the identity and network are fine — error text says the name is already registered / taken / "409" / "conflict" | Name collision — the name exists server-side bound to a different signing key | Do not retry — a retry can never succeed. Explain the collision, then offer remediation and wait for the user's choice: (1) skip registration and continue setup — the remaining phases don't require it (receipt `skipped`, `retry: atomic identity register https://atomic.storage`); (2) create a fresh local identity under a different name and register that (gated, y/n; receipt `done` with the new name); (3) clear the stale server-side registration via the server's admin/console, then retry (gated, y/n; receipt `refused` with the retry command if unresolved). Continue setup normally after the choice |

## Hard rules

- **Never mutate without recorded consent.**
- **Every outcome is logged** to `~/.atomic/setup-receipt.txt` (done /
  skipped / declined / refused) with the exact command to run later for
  declined steps. Check it after a run to report what was skipped.
- **Idempotency:** re-running any phase is safe; completed steps are skipped.
- **Scope is setup plus the plugin verification** — no `atomic init` of the
  user's real projects, no first-change walkthrough, no Git shadow hooks.
  If the user asks, point them to https://docs.atomic.dev/ instead.
- Stale installs: explain that old versions may be missing functionality
  (agent integrations need CLI >= 0.12.0 for the storage-based install flow)
  and offer the upgrade — y/n, never automatic.
