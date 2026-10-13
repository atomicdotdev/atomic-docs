---
title: conflicts
---

# atomic conflicts

List the files in a conflicted state on the current view.

## Synopsis

```bash
atomic conflicts [OPTIONS]
```

## Description

When a merge (`atomic insert`, a view switch, or a pull) produces a real conflict, Atomic writes conflict markers into the affected file and persists that conflict state per view. `atomic conflicts` is the detail view of that state: it lists each conflicted file on the current view, the kind of conflict, the line where it begins, and the changes that contend.

This complements [`atomic status`](./status.md), which flags conflicted files with a `C` code. Use `status` for the overall picture and `conflicts` when you want the specifics.

A file is listed **only while its on-disk content still carries conflict markers** — the same honesty rule `status` follows. Once you resolve the markers and [`record`](./record.md), the file disappears from both. This is part of Atomic's guarantee that a conflict is never hidden (see [Merging & Conflicts](../concepts/merging-and-conflicts.md)).

This command is read-only.

## Options

### `-s, --short`

Machine-readable output: one line per conflict as `<path>:<line>:<kind>`. Ideal for scripts and editor integrations.

```bash
atomic conflicts --short
```

```
src/config.rs:12:order
```

If the starting line is unknown, it is printed as `-`.

### Global Options

- `-v, --verbose` — Emit extra diagnostic output
- `--no-color` — Disable ANSI color in output
- `-h, --help` — Print help
- `-V, --version` — Print version

## Examples

### List conflicts (default)

```bash
atomic conflicts
```

```
1 conflicted file:

	src/config.rs
	    order conflict at line 12 between 7K3XSCZ3F7CF, 2OLBY4JBQ9AA

Resolve the markers (>>>>>>> / ======= / <<<<<<<), then run 'atomic record'.
```

### No conflicts

```bash
atomic conflicts
```

```
✓ No conflicts.
```

### Script-friendly form

```bash
# Fail a pre-commit check if anything is conflicted
if atomic conflicts --short | grep -q .; then
  echo "Resolve conflicts before recording" >&2
  exit 1
fi
```

## Conflict kinds

The `<kind>` field reports why the region is conflicted:

| Kind | Meaning |
|------|---------|
| `order` | Concurrent inserts at the same position — the order of the two sides is ambiguous |
| `cyclic` | A cyclic dependency between regions (a strongly-connected component with more than one vertex) |
| `zombie` | Content that one side deleted while another side still connects to it |
| `name` | Two changes assigned different names to the same path |

## Resolving a conflict

1. Open each listed file and edit the marked region to the intended result, removing the `>>>>>>>` / `=======` / `<<<<<<<` markers.
2. Record the resolution:

   ```bash
   atomic record -m "resolve config conflict"
   ```

`atomic record` refuses to record a file that still contains markers (unless you pass `--allow-conflict-markers`), so an unresolved conflict can't be baked into history by accident. After a clean record, the file leaves both `conflicts` and `status`.

## See Also

- [Merging & Conflicts](../concepts/merging-and-conflicts.md) — how conflicts arise, are surfaced, and resolved
- [`atomic status`](./status.md) — see conflicted files (`C`) alongside other changes
- [`atomic record`](./record.md) — record a resolution
- [`atomic insert`](./insert.md) — the merge operation that can produce conflicts
- [`atomic doctor`](./doctor.md) — audit that conflict state is consistent with the graph
