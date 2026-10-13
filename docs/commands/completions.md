---
sidebar_position: 1
title: Shell Completions
---

# atomic completions

Enable tab-completion for the `atomic` CLI in your shell. Completion works in
two layers:

- **Static completion** — completes **subcommands and flags** from a generated
  script. Stable and self-contained.
- **Dynamic completion** — additionally completes **live values** such as view
  names and change hashes by querying your repository at completion time. This
  is what makes `atomic insert view <TAB>` and `atomic insert change <TAB>`
  suggest real names and hashes.

The dynamic engine also completes subcommands and flags, so if you enable it you
get everything in one step. zsh is the primary target below; other shells are
covered at the end.

## Quick start (zsh)

Add this line to your `~/.zshrc` to enable the **dynamic** completer:

```bash
source <(COMPLETE=zsh atomic)
```

Reload your shell:

```bash
source ~/.zshrc
```

That's it. Now, inside an Atomic repository:

```bash
atomic insert view <TAB>      # → your view names (dev, feature-auth, …)
atomic insert change <TAB>    # → recent change hashes, annotated with messages
atomic <TAB>                  # → subcommands
atomic insert --<TAB>         # → flags (--to, --dry-run, --allow-conflicts, …)
```

## What completes

| Context | Completions |
|---------|-------------|
| `atomic <TAB>` | Top-level subcommands |
| `atomic insert <TAB>` | `view`, `change`, `tag`, `preview` |
| `atomic insert view <TAB>` | Live **view names** |
| `atomic insert change <TAB>` | Recent **change hashes** (with commit messages as hints) |
| `atomic insert --to <TAB>` | Live **view names** |
| `atomic <cmd> --<TAB>` | That command's flags |

Value completion (view names, change hashes) is only available with the
**dynamic** engine, and only when you run it inside a repository.

## Static script (alternative)

If you prefer a checked-in completion script — or your environment can't use the
dynamic engine — generate one with the `completions` command:

```bash
atomic completions zsh > ~/.zfunc/_atomic
```

Then make sure `~/.zfunc` is on your `fpath` and completion is initialized.
Add this to `~/.zshrc` **before** any `compinit` call:

```bash
fpath=(~/.zfunc $fpath)
autoload -Uz compinit && compinit
```

Reload your shell. The static script completes subcommands and flags, but does
**not** complete live view names or change hashes — use the dynamic engine for
that.

## Synopsis

```bash
atomic completions <SHELL>
```

### `<SHELL>`

The shell to generate a static completion script for. Supported values:
`bash`, `zsh`, `fish`, `elvish`, `powershell`.

```bash
atomic completions zsh
atomic completions bash
atomic completions fish
```

## Other shells

The commands below assume the dynamic engine where the shell supports it, and
fall back to the static script otherwise.

### bash

Dynamic:

```bash
echo 'source <(COMPLETE=bash atomic)' >> ~/.bashrc
```

Static:

```bash
atomic completions bash | sudo tee /etc/bash_completion.d/atomic > /dev/null
```

### fish

Dynamic:

```fish
echo 'COMPLETE=fish atomic | source' >> ~/.config/fish/config.fish
```

Static:

```fish
atomic completions fish > ~/.config/fish/completions/atomic.fish
```

### PowerShell

Static:

```powershell
atomic completions powershell | Out-String | Invoke-Expression
```

(Add the line above to your PowerShell profile to make it persistent.)

## Verify

Confirm the static generator works:

```bash
atomic completions zsh | head -1
# → #compdef atomic
```

Then open a **new** shell and press `<TAB>` after `atomic insert view ` inside a
repository — you should see your view names.

## Troubleshooting

**No view names or change hashes appear.**
Value completion needs the **dynamic** engine (`source <(COMPLETE=zsh atomic)`)
and a current directory inside an Atomic repository. The static script only
completes subcommands and flags. Outside a repository, value completion
returns nothing by design (it never errors).

**Nothing completes at all in zsh.**
Ensure `autoload -Uz compinit && compinit` runs in your `~/.zshrc`, and that you
started a fresh shell after editing it. If you use a framework (oh-my-zsh,
prezto), it usually calls `compinit` for you — put the `source <(…)` line after
that.

**Completions look stale after upgrading Atomic.**
The dynamic engine always reflects the installed binary, so just reload your
shell. If you used the static script, regenerate it:
`atomic completions zsh > ~/.zfunc/_atomic`.

## See Also

- [`atomic insert`](./insert.md) — the command whose `view`/`change` arguments
  benefit most from value completion
- [`atomic view`](./view.md) — manage the views that complete under `insert view`
- [Installation](../getting-started/installation.md) — install the CLI
