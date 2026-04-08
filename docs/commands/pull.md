---
sidebar_position: 12
title: pull
---

# atomic pull

Pull changes from a remote repository and apply them to a local view.

## Synopsis

```bash
atomic pull [OPTIONS] [REMOTE]
```

## Description

The `pull` command downloads changes and tags from a remote repository and applies them to your local view. This is the primary way to synchronize work from collaborators and integrate changes from remote sources.

When you pull, Atomic:

1. Connects to the remote repository
2. Downloads the changelist to see what's new
3. Downloads missing change files
4. Applies changes to your local view
5. Optionally updates the working copy
6. Syncs AI attribution metadata if enabled

Unlike traditional VCS systems, Atomic's pull operation is **mathematically guaranteed to be conflict-free**. The patch theory ensures that changes can be applied in any order with consistent results.

## Arguments

### `[REMOTE]`

The remote name or URL to pull from. If not specified, uses the default remote configured in the repository.

```bash
# Pull from default remote
atomic pull

# Pull from named remote
atomic pull origin

# Pull from specific URL
atomic pull ssh://user@host/path/to/repo
```

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic pull --repository /path/to/repo
```

### `--to-view <VIEW>`

Pull into a specific view instead of the current view.

```bash
# Pull into feature branch
atomic pull --to-view feature-new-ui
```

### `--from-view <VIEW>`

Pull from a specific remote view instead of the remote's default view.

```bash
# Pull from remote develop branch
atomic pull --from-view develop

# Pull from specific remote and view
atomic pull origin --from-view experimental
```

### `-a, --all`

Pull all available changes from the remote.

```bash
atomic pull --all
```

### `--path <PATH>...`

Only pull changes relating to specific paths. Can be specified multiple times.

```bash
# Pull only changes affecting src/
atomic pull --path src/

# Pull changes to multiple paths
atomic pull --path src/ --path docs/
```

### `-f, --force-cache`

Force an update of the local remote cache. This may affect reporting of unrecords or concurrent changes in the remote.

```bash
atomic pull --force-cache
```

### `-k, --no-cert-check`

Do not check SSL certificates (HTTPS remotes only). **Warning**: This option can be dangerous and should only be used in trusted environments.

```bash
atomic pull -k https://insecure-server/repo
```

### `--full`

Download full changes, even when not necessary. This ensures complete change files are downloaded rather than minimal diffs.

```bash
atomic pull --full
```

### `--with-attribution`

Pull AI attribution metadata along with changes. Enables tracking of AI contributions across repositories.

```bash
atomic pull --with-attribution
```

### `--skip-attribution`

Skip attribution synchronization even if configured globally.

```bash
atomic pull --skip-attribution
```

### `[CHANGES]...`

Pull specific changes from the local repository (not necessarily from a view). This is for local change application.

```bash
# Apply local changes to current view
atomic pull . ABCD1234... EFGH5678...
```

## Examples

### Basic Pull

```bash
# Pull from default remote
atomic pull

# Pull from named remote
atomic pull origin

# Pull from upstream
atomic pull upstream
```

### Pull from Different Remote Views

```bash
# Pull from remote's develop view
atomic pull --from-view develop

# Pull remote feature into local feature
atomic pull --from-view feature-auth --to-view feature-auth

# Pull main into current view
atomic pull origin --from-view main
```

### Selective Pull

```bash
# Pull only changes to documentation
atomic pull --path docs/

# Pull all changes to source code
atomic pull --all --path src/

# Pull with path filter
atomic pull origin --path src/core/
```

### AI Attribution Sync

```bash
# Pull with attribution metadata
atomic pull --with-attribution

# Pull without attribution even if configured
atomic pull --skip-attribution
```

### Local View Pull

```bash
# Pull changes from another local view
atomic pull . --from-view feature-completed

# Apply specific local changes
atomic pull . ABCD1234... EFGH5678...
```

### Advanced Scenarios

```bash
# Force refresh remote state
atomic pull --force-cache --all

# Pull from custom remote URL
atomic pull ssh://contributor@server/split.git

# Full download of all changes
atomic pull --full --all
```

## Pull Process

### 1. Remote Connection

Atomic connects to the remote and retrieves the changelist:

```
Connecting to remote...
Fetching changelist...
Found 5 new changes
```

### 2. Change Download

Missing changes are downloaded:

```
Downloading changes...
  ABCD1234... ✓
  EFGH5678... ✓
  MNOP9012... ✓
3/3 changes downloaded
```

### 3. Change Application

Changes are applied to the local view:

```
Applying changes...
  ABCD1234... ✓
  EFGH5678... ✓
  MNOP9012... ✓
3/3 changes applied
```

### 4. Working Copy Update

The working copy is updated to reflect the new view state:

```
Updating working copy...
  Modified: 5 files
  Added: 2 files
  Deleted: 1 file
Done.
```

## Interactive Pull

When pulling without `--all`, Atomic may open an editor for you to select which changes to pull:

```
# Please select the changes to pull. The lines that contain just a
# valid hash, and no other character (except possibly a newline), will
# be pulled.

MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

  Dependencies: ABCD1234...
  Author: [Alice]
  Date: 2025-01-15 10:30:00 +0000

    Add authentication system

ABCD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABCDE

  Author: [Bob]
  Date: 2025-01-14 15:20:00 +0000

    Update configuration
```

Keep the hash lines for changes you want to pull. Delete or comment out others.

## Remote Types

Atomic supports multiple remote protocols:

### SSH

```bash
# Standard SSH syntax
atomic pull ssh://user@host/path/to/repo

# Short SSH syntax
atomic pull user@host:path/to/repo
```

### HTTPS

```bash
# HTTPS with authentication
atomic pull https://user:token@github.com/org/repo.git

# HTTPS (will prompt for credentials)
atomic pull https://github.com/org/repo.git
```

### Local

```bash
# Local filesystem path
atomic pull /path/to/other/repo

# File URL
atomic pull file:///path/to/other/repo

# Current repository (different view)
atomic pull . --from-view other-branch
```

## Conflict-Free Pull

Atomic's mathematical patch theory ensures conflict-free pulling:

- **Order independence**: Changes can be applied in any order
- **No merge conflicts**: Mathematical guarantees prevent conflicts
- **Semantic correctness**: Operations are semantically sound
- **Commutative**: Pull order doesn't affect final state

Example:
```bash
# Alice and Bob both pull
# Repository A: [X] -> [Y]
# Alice adds [A], Bob adds [B]

# Alice pulls Bob's work: [X] -> [Y] -> [A] -> [B]
# Bob pulls Alice's work: [X] -> [Y] -> [B] -> [A]

# Both end up in equivalent states (mathematically proven)
```

## Pull from Multiple Remotes

```bash
# Pull from origin
atomic pull origin

# Pull from upstream
atomic pull upstream

# Merge work from both remotes
# No conflicts due to patch theory!
```

## Working Copy Considerations

### Uncommitted Changes

If you have uncommitted changes, pull will handle them intelligently:

```bash
# You have local modifications
atomic pull
# Atomic applies remote changes
# Your modifications remain intact
```

To be safe, record first:
```bash
atomic record -m "Work in progress"
atomic pull
```

### File Conflicts

While Atomic doesn't have merge conflicts, file-level conflicts may appear in the working copy:

```
Warning: Conflicts detected in working copy
  - src/main.rs

Run 'atomic diff' to review conflicts
```

Resolve conflicts manually and record:
```bash
# Edit conflicted files
vim src/main.rs

# Record resolution
atomic record -m "Resolve conflicts"
```

## Performance

Pull performance depends on:

- **Number of changes**: More changes = longer download
- **Change size**: Larger changes take more time
- **Network speed**: Bandwidth affects download time
- **Protocol**: SSH is typically faster than HTTPS

Typical pull times:

- **Small pull** (&lt; 10 changes): 1-5 seconds
- **Medium pull** (10-50 changes): 5-30 seconds
- **Large pull** (50+ changes): 30 seconds - 5 minutes

## Pulling Tags

Tags are automatically pulled when pulling changes:

```bash
# Pull includes associated tags
atomic pull --all

# List pulled tags
atomic tag list
```

## Common Workflows

### Feature Integration

```bash
# Pull latest main
atomic view switch main
atomic pull

# Merge into feature branch
atomic view switch feature-my-work
atomic pull . --from-view main
```

### Staying Up to Date

```bash
# Regular sync
atomic pull
atomic record -m "Sync with remote"
atomic push
```

### Multi-Remote Workflow

```bash
# Pull from upstream (original repo)
atomic pull upstream --from-view main

# Pull from origin (your split)
atomic pull origin --from-view develop

# Push to your split
atomic push origin
```

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml

# Default remote
[repository]
default_remote = "origin"

# Remote definitions
[remote "origin"]
ssh = "ssh://git@github.com/user/repo.git"

[remote "upstream"]
ssh = "ssh://git@github.com/original/repo.git"

# Attribution sync
[attribution]
auto_sync = true  # Automatically pull attribution
```

## Troubleshooting

### Authentication Failures

```bash
# Ensure SSH key is loaded
ssh-add ~/.ssh/id_ed25519

# Test SSH connection
ssh -T git@github.com

# For HTTPS, use token authentication
atomic pull https://user:token@host/repo.git
```

### Network Errors

```bash
# For slow networks, try incremental pull
atomic pull --path src/

# Or use full download
atomic pull --full
```

### Remote Not Found

```
Error: Remote 'origin' not found
```

Solution:
```bash
# List configured remotes
atomic remote

# Add remote
# Edit .atomic/config.toml to add remote configuration
```

## Notes

- **Atomic Operation**: Pull is atomic - all changes apply or none do
- **Conflict-Free**: Mathematical guarantees prevent merge conflicts
- **Bandwidth Efficient**: Only missing changes are downloaded
- **Cryptographic Integrity**: All changes are cryptographically verified
- **Attribution Sync**: Optional metadata sync for AI tracking
- **Working Copy Safe**: Local modifications are preserved

## Exit Codes

- `0` - Success
- `1` - Error (authentication failure, network error, etc.)
- `2` - Invalid arguments

## See Also

- [`atomic push`](./push.md) - Push changes to a remote
- [`atomic clone`](./clone.md) - Clone a remote repository
- [`atomic insert`](./insert.md) - Insert changes into views
- [`atomic view`](./view.md) - Manage views
- [`atomic record`](./record.md) - Record changes after pulling

## Related Concepts

- **Remotes** - Remote repository locations
- **Views** - Independent lines of development
- **Changes** - Atomic units of modification
- **Attribution** - AI contribution metadata
- **Conflict-Free** - Mathematical guarantees of merge correctness
- **Patch Theory** - Mathematical foundation ensuring consistency