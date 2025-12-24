# Command Documentation Status

This document tracks the progress of documenting Atomic VCS commands from the `libatomic` source code.

## Documentation Progress

### ✅ Completed (Comprehensive Documentation)

These commands have full, detailed documentation with examples, options, and use cases:

- **overview.md** - Command reference overview with categories
- **init.md** - Initialize a new Atomic repository
- **record.md** - Record changes with AI attribution support
- **log.md** - Display change history with filtering and formatting
- **clone.md** - Clone remote repositories
- **tag.md** - Create and manage consolidating tags (Atomic's unique feature)
- **add.md** - Add files to tracking
- **diff.md** - Show differences between working copy and pristine
- **channel.md** - Manage channels (branches)
- **push.md** - Push changes and tags to remotes (430+ lines)
- **pull.md** - Pull changes from remotes (549+ lines)
- **identity.md** - Manage user identities and cryptographic keys (712+ lines)
- **reset.md** - Reset working copy to pristine state (430+ lines)
- **git.md** - Import Git repositories into Atomic (536+ lines)

### 🟡 Partial Documentation

These commands have basic documentation but need expansion:

- **apply.md** - Apply changes to channels (basic structure complete)
- **unrecord.md** - Remove changes from history (basic structure complete)
- **remove.md** - Remove files from tracking (basic structure complete)
- **move.md** - Move/rename files (basic placeholder)
- **fork.md** - Fork channels (basic placeholder)

### ❌ Needs Documentation

These commands need complete documentation from source code:

- **credit.md** - Show contribution credits
- **attribution.md** - Display AI attribution information
- **archive.md** - Create repository archives
- **change.md** - Inspect and manipulate change files
- **dependents.md** - Show change dependencies
- **completions.md** - Generate shell completions

**Note**: The `git` command for importing Git repositories is now fully documented.

## Source Code References

### Primary Source Locations

- **Command Definitions**: `atomic/atomic/src/commands/*.rs`
- **Core Library**: `atomic/libatomic/src/*.rs`
- **Command Structure**: `atomic/atomic/src/commands/mod.rs`

### Key Files for Each Command

| Command | Source File | Notes |
|---------|-------------|-------|
| init | `atomic/atomic/src/commands/init.rs` | ✅ Documented |
| record | `atomic/atomic/src/commands/record.rs` | ✅ Documented with AI attribution |
| log | `atomic/atomic/src/commands/log.rs` | ✅ Documented |
| clone | `atomic/atomic/src/commands/clone.rs` | ✅ Documented |
| tag | `atomic/atomic/src/commands/tag.rs` | ✅ Documented (consolidating tags) |
| add | `atomic/atomic/src/commands/file_operations.rs` | ✅ Documented |
| remove | `atomic/atomic/src/commands/file_operations.rs` | 🟡 Needs expansion |
| move | `atomic/atomic/src/commands/file_operations.rs` | 🟡 Needs expansion |
| diff | `atomic/atomic/src/commands/diff.rs` | ✅ Documented |
| apply | `atomic/atomic/src/commands/apply.rs` | 🟡 Needs expansion |
| unrecord | `atomic/atomic/src/commands/unrecord.rs` | 🟡 Needs expansion |
| channel | `atomic/atomic/src/commands/channel.rs` | ✅ Documented |
| push | `atomic/atomic/src/commands/pushpull.rs` | ✅ Documented (430+ lines) |
| pull | `atomic/atomic/src/commands/pushpull.rs` | ✅ Documented (549+ lines) |
| fork | `atomic/atomic/src/commands/fork.rs` | 🟡 Needs expansion |
| reset | `atomic/atomic/src/commands/reset.rs` | ✅ Documented (430+ lines) |
| identity | `atomic/atomic/src/commands/identity.rs` | ✅ Documented (712+ lines) |
| git | `atomic/atomic/src/commands/git.rs` | ✅ Documented (536+ lines) - Git import |
| credit | `atomic/atomic/src/commands/credit.rs` | ❌ Needs documentation |
| attribution | `atomic/atomic/src/commands/attribution.rs` | ❌ Needs documentation |
| archive | `atomic/atomic/src/commands/archive.rs` | ❌ Needs documentation |
| change | `atomic/atomic/src/commands/change.rs` | ❌ Needs documentation |
| dependents | `atomic/atomic/src/commands/dependents.rs` | ❌ Needs documentation |
| completions | `atomic/atomic/src/commands/completions.rs` | ❌ Needs documentation |

## Documentation Standards

Each command documentation should include:

1. **Frontmatter** - YAML metadata (title, sidebar_position)
2. **Synopsis** - Command syntax
3. **Description** - What the command does and why
4. **Arguments** - Positional arguments with examples
5. **Options** - Flags and their effects
6. **Examples** - Practical usage examples
7. **Output Formats** - What users should expect to see
8. **Notes** - Important considerations
9. **Configuration** - Relevant config file options
10. **See Also** - Related commands
11. **Related Concepts** - Atomic VCS concepts

## Unique Atomic Features to Highlight

When documenting, emphasize these unique aspects:

### 1. Consolidating Tags
- Tags reduce O(n²) to O(n) complexity
- Mathematical guarantees of semantic equivalence
- First-class nodes in the dependency graph

### 2. AI Attribution
- Cryptographic attestation of AI contributions
- Provider, model, confidence tracking
- Merkle-tree-based verification

### 3. Conflict-Free Merging
- Mathematical patch theory guarantees
- No merge commits needed
- Semantic operations vs. line-based diffs

### 4. Channel Independence
- Patch-based sharing between channels
- No merge conflicts
- True distributed autonomy

## Next Steps

### High Priority
1. ~~**push/pull**~~ - ✅ **COMPLETED** - Core collaboration commands
2. ~~**identity**~~ - ✅ **COMPLETED** - User and key management
3. **attribution** - AI contribution tracking (HIGH PRIORITY)
4. ~~**reset**~~ - ✅ **COMPLETED** - Common workflow operation

### Medium Priority
5. **change** - Inspecting change files (NEXT TARGET)
6. **credit** - Contribution analysis (related to attribution)
7. **archive** - Repository export
8. **dependents** - Dependency analysis

### Low Priority
9. **completions** - Shell integration
10. **fork** (expand) - Advanced channel operations

## Contributing

To document a command:

1. Read the source file in `atomic/atomic/src/commands/`
2. Study the `clap` Parser definition for options
3. Understand the command's purpose and workflow
4. Review examples in `atomic/examples/` if available
5. Write comprehensive documentation following the standards above
6. Update this status document

## Documentation Philosophy

- **User-First**: Write for users, not just developers
- **Example-Driven**: Show practical usage
- **Complete**: Cover all options and edge cases
- **Accurate**: Match actual implementation
- **Clear**: Simple language, good formatting
- **Contextual**: Explain why, not just what

---

**Last Updated**: 2025-01-15

**Total Commands**: 24
**Documented**: 14 (58%) ⬆️ +5 commands
**Partial**: 5 (21%)
**Remaining**: 5 (21%)

**Recent Progress**:
- ✅ Completed **push** command (430+ lines) - Core collaboration
- ✅ Completed **pull** command (549+ lines) - Core collaboration  
- ✅ Completed **identity** command (712+ lines) - User & key management
- ✅ Completed **reset** command (430+ lines) - Working copy management
- ✅ Completed **git** command (536+ lines) - Git repository import (CRITICAL for migration!)

**Migration Support Complete**:
- ✅ Created comprehensive [Migrating from Git](../getting-started/migrating-from-git.md) guide (632 lines)
- ✅ Full `atomic git` command documentation
- ✅ Command translation guide (Git → Atomic)
- ✅ Updated intro page with Git import quickstart

**Next Targets**:
1. **attribution** - AI contribution tracking (complements existing AI docs)
2. **change** - Inspecting change files (core workflow)
3. **credit** - Contribution analysis (related to attribution)