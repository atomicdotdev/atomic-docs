# Atomic Setup (Agent Skill)

You are the operator of Atomic setup. There is no helper script — this file is
the single source of truth. You execute the phases yourself, deterministically:
same state in, same steps out, always in the same order. The only
non-deterministic part is the user's answers, and the only time you improvise
is when the user explicitly asks for troubleshooting help.

The same protocol runs on every harness — opencode, Claude Code, Codex, and
Copilot. Only the consent ask-mechanism differs; see **Harness compatibility**
below and apply it throughout.

## Determinism contract

- **Fixed phase order:** `preflight → deps → install → path → identity →
  account → agent → verify → completions`. Never reorder, never invent phases.
- **Check-before-act:** before every step, run its "already done?" check.
  Skip completed steps with a one-line note — do not re-ask about them.
- **Consent before mutation:** read-only checks run freely. Every mutating
  command needs an explicit yes first, asked with your harness's ask
  mechanism (opencode: `question` tool; Claude Code: `AskUserQuestion`;
  Codex and Copilot: plain-text numbered options with end-turn-and-wait —
  see Harness compatibility). Never mutate on silence or ambiguity.
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

## Harness compatibility

The same consent protocol runs on every harness — only the ask mechanism
differs. Pick the row for the agent the user actually uses and apply it to
every gated step below.

| Harness | Ask mechanism | Skill/config location | Hooks installed by `atomic agent enable` | Integration package |
|---------|---------------|----------------------|------------------------------------------|---------------------|
| opencode | `question` tool | `~/.config/opencode/skills` or `.opencode/skills` | `.opencode/` plugin + skills | `atomic-opencode` |
| Claude Code | `AskUserQuestion` tool | `~/.claude/skills` or `.claude/skills` | `.claude/` hooks (global: `~/.claude/settings.json` with `-g`) | `atomic-claude` |
| Codex | none — plain-text fallback | `AGENTS.md` (frontmatter is ignored) | `~/.codex/hooks.json` | `atomic-codex` |
| Copilot | none — plain-text fallback | none | `~/.copilot/hooks/atomic.json` (cloud agent: `.github/` manifest on the default branch) | `atomic-copilot` |

**Package vs. agent name:** `--agent` takes the CLI name (`claude-code`,
`codex`, `copilot`, `opencode`), **not** the integration package name
(`atomic-claude`, ...). The package is what `atomic agent enable` syncs from
Atomic storage behind the scenes; you pass it explicitly only with
`--hooks <manifest-file>` or `--from <path>` (offline or development
installs). If `--agent <name>` is rejected, the error message lists every
valid agent.

- **opencode** — native ask flow: use the `question` tool for consent,
  batched per phase. After enabling, the user switches to the Atomic agent;
  recording happens when a session goes idle or a turn ends.
- **Claude Code** — use `AskUserQuestion` for consent, batching one phase's
  inputs per call. No agent switching: hooks record automatically on every
  session. Repo hooks land in `.claude/settings.json`; add `-g/--global` to
  install user-level hooks in `~/.claude/settings.json` instead.
- **Codex** — Codex reads `AGENTS.md`, not skill frontmatter, and has no ask
  tool: consent always uses the plain-text numbered-options fallback (end
  turn and wait). `atomic agent enable --agent codex` writes global hooks to
  `~/.codex/hooks.json`; `--agents-md` also installs an always-on
  `AGENTS.md` at the repository root.
- **Copilot** — no skill system and no ask tool: same consent fallback as
  Codex. Copilot detects via the `.github/` directory. **Limitation:** there
  are no TurnEnd hooks — recording happens only when the session ends, so
  turns arrive in one batch. Say this during the agent phase or the user
  will report a false failure.

## Phases

| Phase | What it does | Consent gate |
|-------|--------------|--------------|
| `preflight` | Read-only: OS, package manager, core deps, existing Atomic/identities | none — always safe |
| `deps` | Install missing core deps (curl, git, ca-certificates) via the system package manager | per-package y/n |
| `install` | Hosted installer first (`https://atomic.storage/install.sh`), source build only as fallback | y/n |
| `path` | Add the install dir to the shell rc file | y/n |
| `identity` | `atomic identity new <name> --email <email> --set-default` | y/n (batch name+email) |
| `account` | `atomic identity register https://atomic.storage` + optional org/workspace/project | y/n each |
| `agent` | `atomic agent enable [--agent <name>] [--all] [-g] [--agents-md]` + `atomic agent status --verbose` | y/n |
| `verify` | Prove the agent integration records turns with AI provenance | y/n (one real model turn, tiny cost) |
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
  `.cursor` (cursor), `.opencode` (opencode), `.codex` (codex), `.github`
  (copilot), `.grok` (grok), `.cline` (cline), `.kilo` (kilo), `.kiro`
  (kiro), `.devin` (devin).
- **`agent enable` must run from inside an Atomic repository.** Run
  `atomic init` first — a fresh throwaway repo per run, never one reused from
  an earlier run:
  ```bash
  TEST_DIR=$(mktemp -d /tmp/test-atomic.XXXXXX) && cd "$TEST_DIR" && atomic init
  ```
  (or use the user's project). A reused repo lets an earlier run's recorded
  changes satisfy Phase 7's verification checks, reporting a false pass when
  this run's recording actually failed. Run from a non-repo directory it
  fails with "Not in an Atomic repository".
- Enable (gated): `atomic agent enable --agent <name>` — or plain
  `atomic agent enable` for auto-detection. This pulls the agent integration
  package from Atomic storage (no account needed) and links the plugin, agent
  prompt, and skills into the agent's config directory. Role: this links
  recording hooks into your coding agent so every AI turn is captured as a
  signed change with AI provenance (model, vendor, tokens) automatically.
  The verify phase proves this mechanism.
- Multi-agent or global options: `--all` installs for every detected agent;
  `-g/--global` installs user-level hooks (Claude Code:
  `~/.claude/settings.json`; Codex: `~/.codex/hooks.json`); `--agents-md`
  installs an always-on `AGENTS.md` at the repository root (useful for
  Codex).
- Copilot caveat: no TurnEnd hooks — recording happens only on session end,
  in one batch. Say so before enabling.
- Verify: `atomic agent status --verbose` — also from inside a repo. Each
  enabled agent's line should read `✓ <Agent> — hooks installed` (before
  enabling it reads `○ <Agent> — detected but hooks not installed`). For
  scripted checks use `atomic agent status --json` and assert the agent's
  `agents[].hooks_installed` is `true`.

## Phase 7 — Verify: the agent integration records provenance

Please refer to the [atomic-validation-skill](https://github.com/atomicdotdev/atomic-skills/tree/main/skills/setup/atomic-validation-skill.md) to verify provenance is working as intended.

After enabling the integration, prove end-to-end that turns record
**automatically with AI provenance** — no manual `atomic record`. One real
model turn runs, so ask consent once for the whole phase. Role: this proves
the whole chain end to end, meaning your identity signed a change, the
integration recorded it with zero manual commands, and the attestation names
the model. In short, provenance works.

Run the subsection below that matches the agent enabled in Phase 6. If
several agents were enabled (`--all`), verify each one.

### Shared freshness rules (apply to every subsection)

- **Fresh test repo per run (gated).** Always create a NEW test repo — never
  reuse one from an earlier run:
  ```bash
  TEST_DIR=$(mktemp -d /tmp/test-atomic.XXXXXX) && cd "$TEST_DIR" && atomic init
  ```
  A reused directory lets an earlier run's recorded change and attestation
  satisfy the success checks below, reporting a false pass when this run's
  recording actually failed. A fresh repo is also the baseline: `atomic log`
  shows only the two init changes (`Initialize repository`, `Initialize
  vault`), so any change beyond those came from this run's turn.
- **Assert a new change was recorded (read-only, immediately after the
  turn).** As soon as a verification run is initiated — fresh repo created
  and the marker turn triggered — assert from inside the fresh test repo
  that this run actually recorded something:
  ```bash
  atomic log -n 3   # a change beyond the two init changes; its message contains hello-
  ```
  The fresh repo's baseline is exactly the two init changes, so a third
  change whose message contains this run's `hello-` marker proves this run
  recorded. If only the two init changes appear, the run recorded nothing —
  go straight to the repair path below / the matching subsection's
  troubleshooting table; do **not** proceed to the success template, which
  only confirms provenance details of a change this step must establish
  first.
- **Run-unique prompt marker.** The test prompt must **lead** with a marker no
  earlier run has used, e.g. `hello-$(date +%s): Create a file called …` when
  the prompt is built in a shell command. If you are typing the prompt into an
  interactive session instead, substitute a unique literal (e.g.
  `hello-1719320000: Create a file called …`). The marker lands in the
  recorded change's message, so a match can only ever come from this run's
  turn — never from a previous run with the same prompt. It must sit at the
  FRONT: `atomic log` and `atomic change` truncate the message to ~60
  characters with no full-message option, so an end-placed marker is invisible
  to the grep assertion below.
- **Hook scope: user-level vs repo-local.** All integration hooks gate on
  `test -d .atomic`, but where they live decides which repos they cover:
  user-level hooks (OpenCode plugin in `~/.config/opencode/`, Codex
  `~/.codex/hooks.json`, Copilot `~/.copilot/hooks/atomic.json`, Claude Code
  with `-g`) apply in every repo, including the fresh test repo. Repo-local
  Claude Code hooks (enabled **without** `-g`, written to the repo where
  `enable` ran) do **not** carry into the fresh test repo — either run
  `atomic agent enable --agent claude-code` once from inside the fresh test
  repo before the turn (idempotent, uses the local package cache, works
  offline, no account needed), or prefer `-g/--global` at enable time. If
  you verified with repo-local hooks and plan to `disable` later, re-run
  `enable` from the user's project first so its receipt is current.
- **Other integrations.** For any agent beyond the four subsections below
  (cursor, cline, kilo, grok, kiro, pi, devin, agy): run one real session in
  the fresh test repo with the marker prompt, then apply the success
  template below. Per-agent install behavior is in the Integration Matrix
  and Per-Agent Notes: https://docs.atomic.dev/agents/installing-agent-integrations
- **Success template (read-only).** Run this only after the assertion above
  established that a new change was recorded — it confirms that change's
  provenance details. From inside the test repo:
  ```bash
  atomic status -s                # clean — HELLO.md is already recorded
  atomic log -n 3                 # newest change's message contains hello-
  atomic change                   # shows an Attestation block
  atomic agent status --verbose   # a session row for this run appears
  ```
  Success = the newest recorded change's message contains the `hello-`
  marker, and its `Attestation` block names the vendor and token counts
  (model may read `unknown` for some providers) with a session (`ses_…`)
  created by this run — recorded with zero manual commands. Report this to
  the user as the receipt that the integration works.
- **If nothing recorded**, repair with
  `atomic agent enable --agent <name> -f` (force reinstall), or remove the
  hooks first with `atomic agent disable --agent <name>` and re-enable —
  then rerun the turn.

### 7.1 OpenCode

- **Confirm the integration landed (read-only):**

  ```bash
  atomic agent status --verbose  # ✓ OpenCode — hooks installed
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

- **Trigger one real turn (gated).** Prepare the fresh test repo with the
  shared freshness rules (`TEST_DIR`, marker prompt), then pick the first
  path that applies:

  - **You are running inside OpenCode v2 and the current working directory is
    an Atomic repo** (`test -d .atomic`): use the fresh test repo from the
    shared rules and start the subagent's work from there — but remember the
    *session's* directory is what the plugin gates on, so the subagent must do
    its file work inside an Atomic repo for the change to record.

  - **Otherwise** (you are not OpenCode, the cwd is not an Atomic repo, or the
    subagent turn did not record): run opencode standalone against the test
    repo — a fresh process always loads the plugin fresh:
    ```bash
    # OpenCode v1 (no --standalone flag):
    cd "$TEST_DIR" && opencode run --auto \
      "hello-$(date +%s): Create a file called HELLO.md in the current directory containing exactly the text: hello"
    # OpenCode v2:
    cd "$TEST_DIR" && opencode run --standalone --auto \
      "hello-$(date +%s): Create a file called HELLO.md in the current directory containing exactly the text: hello"
    ```

    `opencode run` needs a working model connection:
    - **OpenCode v2 ships free built-in models** (listed as `opencode/*` by
      `opencode models`) — the verification works with no login at all.
    - **OpenCode v1 needs a provider** — if the run fails with a provider/model
      error, have the user connect one (`opencode auth login` or a provider API
      key), or pass a known-good `--model provider/model`, then rerun.

- **Check:** the shared success template. For the subagent path, also confirm
  `.atomic/sessions/ses_*.json` exists and its `turn_count` grew.

- **Troubleshoot if nothing recorded** (deterministic fixes first; only
  improvise when the user asks for troubleshooting help):

  | Symptom | Diagnosis | Fix |
  |---------|-----------|-----|
  | `opencode run` fails with a provider/model error | No model connection | v1: connect a model (`opencode auth login` or provider API key) or pass `--model provider/model`; v2: pick a free built-in model (no login needed) |
  | No `.atomic/sessions/ses_*.json` after the turn | Plugin never loaded | v1: check the `"plugin"` key in `~/.config/opencode/opencode.json` (written by `atomic agent enable`); v2: confirm the file sits in `~/.config/opencode/plugins/`. Check `~/.local/share/opencode/log/opencode.log` for `loading plugin` |
  | Plugin loaded, turn ran, still nothing | Session directory is not an Atomic repo — the plugin records only sessions whose directory has `.atomic` | Re-run from inside the fresh test repo (shared freshness rules), or `atomic init` the current project |
  | `.atomic/hook-errors.log` exists (in the project) | A hook shell-out failed | Read it; most common: `atomic` not on the PATH that OpenCode spawned with — restart OpenCode after the path phase, or reinstall so hooks find it |
  | `.atomic/hook-errors.log` shows `exit 143` on `stop` after a v2 `--standalone` run | Pre-fix plugin (integration < 1.1.1): `opencode run --standalone` tore down the process tree and killed the in-flight Stop recording. Fresh installs from storage already include the fix, so hitting this means an old install — or a different teardown bug | Re-run `atomic agent enable` (from a repo) to pull the fixed integration package (>= 1.1.1), confirm the plugin file changed, then rerun the turn |
  | Session file shows the turn (`turn_count` grew) but `atomic log` is empty | Rare deferred-publication race in the Atomic CLI: the change recorded but its publication to the view log was deferred | Run one more tiny turn (or any `atomic agent hooks` call) — the deferred change then publishes and both turns appear in `atomic log`. Do not re-init or delete anything |
  | Every turn recorded twice | OpenCode v1 older than 1.18.29 | Upgrade OpenCode — old v1 builds register the plugin through both export styles |
  | `opencode` was already running when the plugin was installed | Current session may predate the plugin | v2 hot-reloads; v1 needs a restart. The standalone run (above) sidesteps this entirely |

### 7.2 Claude Code

- **Confirm the integration landed (read-only):**
  `atomic agent status --verbose` shows `✓ Claude Code — hooks installed`.
  On disk, the hooks live in the repo's `.claude/settings.json`, or in
  `~/.claude/settings.json` if you enabled with `-g/--global`:
  ```bash
  grep -l "atomic agent hooks" .claude/settings.json ~/.claude/settings.json 2>/dev/null
  ```
  No output means enable did not complete — repair with
  `atomic agent enable --agent claude-code -f`.

- **Trigger one real turn (gated).** Prepare the fresh test repo with the
  shared freshness rules — including the hook-scope bullet: repo-local
  Claude Code hooks need a second enable from inside the test repo, or
  user-level hooks from `-g`. Start `claude` in the test repo and give it
  the marker prompt ("Create a file called HELLO.md in the current directory
  containing exactly the text: `<marker>`"). No agent switching — hooks
  record automatically. If your harness cannot drive an interactive Claude
  session, hand the command and the marker prompt to the user for their
  terminal. End the session — Claude Code records at turn end / session end.

- **Check:** the shared success template; additionally confirm the session
  row in `atomic agent status --verbose` names Claude Code.

- **Troubleshoot:**

  | Symptom | Diagnosis | Fix |
  |---------|-----------|-----|
  | No Atomic hook entries in `.claude/settings.json` (or `~/.claude/settings.json` with `-g`) | Enable did not complete | `atomic agent enable --agent claude-code -f` |
  | Session ran, nothing recorded, hooks present | The session was still running when you checked | End the session, then re-check — recording happens at turn end / session end |

### 7.3 Codex

- **Confirm the integration landed (read-only):**
  `atomic agent status --verbose` shows `✓ Codex — hooks installed`. On
  disk, the hooks are global:
  ```bash
  grep -l "atomic agent hooks" ~/.codex/hooks.json
  ```
  No output means enable did not complete — repair with
  `atomic agent enable --agent codex -f`.

- **Trigger one real turn (gated).** Prepare the fresh test repo with the
  shared freshness rules. Start `codex` in the test repo and give it the
  marker prompt, then **end the session** — Codex hooks are global, and the
  session row appears once the session has closed. If your harness cannot
  drive an interactive Codex session, hand the command and the marker prompt
  to the user for their terminal. (If you installed with `--agents-md`, the
  test repo also has an always-on `AGENTS.md` at its root.)

- **Known limitation:** Codex hook support is experimental — shell-command
  provenance may be richer than edit-tool provenance until Codex publishes
  complete hook events. A sparse Change Ledger on the recorded change is
  expected, not a failure.

- **Check:** the shared success template.

- **Troubleshoot:**

  | Symptom | Diagnosis | Fix |
  |---------|-----------|-----|
  | No Atomic hooks in `~/.codex/hooks.json` | Enable did not complete | `atomic agent enable --agent codex -f` |
  | Session ran, nothing recorded | The session had not closed when you checked | End the session, then re-check — the row appears only after session close |

### 7.4 Copilot

- **Read this first — most common false alarm:** Copilot has no TurnEnd
  hooks — recording happens **only when the session ends**, in one batch. A
  session that is still open shows nothing, by design; the session row
  appears only after exit. Tell the user before the turn or they will report
  a false failure.

- **Confirm the integration landed (read-only):**
  `atomic agent status --verbose` shows `✓ GitHub Copilot — hooks installed`.
  On disk, the local Copilot integration installs user-level files:
  ```bash
  grep -l "atomic agent hooks" ~/.copilot/hooks/atomic.json
  ```
  No output means enable did not complete — repair with
  `atomic agent enable --agent copilot -f`. The `.github/` directory matters
  only for the Copilot **cloud** agent: its hook manifest must be on the
  repository's default branch before the cloud agent starts (record and push
  the installed files with your normal workflow).

- **Trigger one real turn (gated).** Prepare the fresh test repo with the
  shared freshness rules. Run one Copilot session in the test repo with the
  marker prompt and **end it completely** — user-level hooks mean the fresh
  repo needs no extra enable step.

- **Check:** the shared success template. Copilot records one change per
  session (its hook lifecycle exposes no turn-level stop event), so one
  recorded change covering the whole session is the expected shape.

- **Troubleshoot:**

  | Symptom | Diagnosis | Fix |
  |---------|-----------|-----|
  | Nothing recorded while the session is still open | No TurnEnd hooks — by design | End the session, then re-check |
  | No `~/.copilot/hooks/atomic.json` | Enable did not complete (local agent) | `atomic agent enable --agent copilot -f` |
  | Cloud agent records nothing | Hook manifest not on the default branch | Record and push the installed `.github/` files to the default branch, then restart the cloud agent |

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
| `agent enable` fails | CLI must be >= 0.12.0 — apply the stale-version rule first; must also run from inside an Atomic repository (`atomic init` a fresh throwaway repo if needed — never reuse one from an earlier run) |
| Registration fails | Check the server URL and network, then retry the `account` phase |
| Verification records nothing | Walk the table in the matching Phase 7 subsection, and repair with `atomic agent enable --agent <name> -f` (force reinstall) or `atomic agent disable --agent <name>` followed by re-enable |
| `atomic identity register https://atomic.storage` fails while the identity and network are fine — error text says the name is already registered / taken / "409" / "conflict" | Name collision — the name exists server-side bound to a different signing key | Do not retry — a retry can never succeed. Explain the collision, then offer remediation and wait for the user's choice: (1) skip registration and continue setup — the remaining phases don't require it (receipt `skipped`, `retry: atomic identity register https://atomic.storage`); (2) create a fresh local identity under a different name and register that (gated, y/n; receipt `done` with the new name); (3) clear the stale server-side registration via the server's admin/console, then retry (gated, y/n; receipt `refused` with the retry command if unresolved). Continue setup normally after the choice |

## Hard rules

- **Never mutate without recorded consent.**
- **Every outcome is logged** to `~/.atomic/setup-receipt.txt` (done /
  skipped / declined / refused) with the exact command to run later for
  declined steps. Check it after a run to report what was skipped.
- **Idempotency:** re-running any phase is safe; completed steps are skipped.
- **Scope is setup plus the agent-integration verification** — no `atomic
  init` of the user's real projects, no first-change walkthrough, no Git
  shadow hooks. If the user asks, point them to https://docs.atomic.dev/
  instead.
- Stale installs: explain that old versions may be missing functionality
  (agent integrations need CLI >= 0.12.0 for the storage-based install flow)
  and offer the upgrade — y/n, never automatic.
