---
sidebar_position: 11
title: push
---

# atomic push

Push changes and tags to a remote repository.

## Synopsis

```bash
atomic push [OPTIONS] [REMOTE]
```

## Description

The `push` command uploads changes, tags, and view information to a remote repository, enabling collaboration and backup. This is one of the core commands for distributed collaboration in Atomic VCS.

When you push, Atomic:

1. Compares your local view state with the remote
2. Determines which changes need to be uploaded
3. Uploads missing changes to the remote
4. Updates the remote view to reflect your changes
5. Optionally syncs AI attribution metadata

Unlike some VCS systems, Atomic's push operation is **conflict-free** due to the mathematical properties of the patch theory. The remote can accept pushes from multiple sources simultaneously without merge conflicts.

## Arguments

### `[REMOTE]`

The remote name or URL to push to. If not specified, uses the default remote configured in the repository.

```bash
# Push to default remote
atomic push

# Push to named remote
atomic push origin

# Push to specific URL
atomic push ssh://user@host/path/to/repo
```

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic push --repository /path/to/repo
```

### `--from-view <VIEW>`

Push from a specific view instead of the current view.

```bash
# Push feature branch to remote
atomic push --from-view feature-new-ui
```

### `--to-view <VIEW>`

Push to a specific remote view instead of the remote's default view.

```bash
# Push to remote develop branch
atomic push --to-view develop

# Push to different remote view name
atomic push --to-view origin:main
```

The format can be `remote_stack` or `remote_stack:push_stack` for advanced routing.

### `-a, --all`

Push all changes in the view, not just those selected interactively.

```bash
atomic push --all
```

### `--path <PATH>...`

Push only changes relating to specific paths. Can be specified multiple times.

```bash
# Push only changes affecting src/
atomic push --path src/

# Push changes to multiple paths
atomic push --path src/ --path docs/
```

### `-f, --force-cache`

Force an update of the local remote cache. This may affect reporting of unrecords or concurrent changes in the remote.

```bash
atomic push --force-cache
```

### `-k, --no-cert-check`

Do not check SSL certificates (HTTPS remotes only). **Warning**: This option can be dangerous and should only be used in trusted environments.

```bash
atomic push -k https://insecure-server/repo
```

### `--with-attribution`

Push AI attribution metadata along with changes. Enables tracking of AI contributions across repositories.

```bash
atomic push --with-attribution
```

### `--skip-attribution`

Skip attribution synchronization even if configured globally.

```bash
atomic push --skip-attribution
```

### `[CHANGES]...`

Push only specific changes by hash. Changes are specified as positional arguments at the end.

```bash
# Push specific changes
atomic push origin ABCD1234... EFGH5678...

# Push single change
atomic push MNYNGT2V...
```

## Examples

### Basic Push

```bash
# Push current view to default remote
atomic push

# Push to named remote
atomic push origin

# Push different view
atomic push --from-view feature-auth
```

### Pushing to Different Remote Views

```bash
# Push to remote's develop view
atomic push --to-view develop

# Push local feature to remote main
atomic push --from-view feature-ready --to-view main
```

### Selective Push

```bash
# Push only changes to documentation
atomic push --path docs/

# Push specific changes
atomic push --all --path src/core/

# Push just one change
atomic push origin ABCD1234...
```

### AI Attribution Sync

```bash
# Push with attribution metadata
atomic push --with-attribution

# Push without attribution even if configured
atomic push --skip-attribution
```

### Advanced Scenarios

```bash
# Force refresh remote state
atomic push --force-cache --all

# Push to custom remote URL
atomic push ssh://backup@server/repos/project.git

# Push multiple specific changes
atomic push origin CHANGE1... CHANGE2... CHANGE3...
```

## Push Process

### 1. State Comparison

Atomic compares local and remote view states:

```
Local State:  [A] -> [B] -> [C] -> [D]
Remote State: [A] -> [B]

Changes to push: C, D
```

### 2. Change Upload

Missing changes are uploaded to the remote:

```
Uploading changes...
  ABCD1234... ✓
  EFGH5678... ✓
2/2 changes uploaded
```

### 3. View Update

The remote view is updated to include the pushed changes.

### 4. Attribution Sync

If enabled, AI attribution metadata is synchronized.

## Interactive Push

When pushing without `--all`, Atomic may open an editor for you to select which changes to push:

```
# Please select the changes to push. The lines that contain just a
# valid hash, and no other character (except possibly a newline), will
# be pushed.

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

Keep the hash lines for changes you want to push. Delete or comment out others.

## Remote Types

Atomic supports multiple remote protocols:

### SSH

```bash
# Standard SSH syntax
atomic push ssh://user@host/path/to/repo

# Short SSH syntax
atomic push user@host:path/to/repo
```

### HTTPS

```bash
# HTTPS with authentication
atomic push https://user:token@github.com/org/repo.git

# HTTPS (will prompt for credentials)
atomic push https://github.com/org/repo.git
```

### Local

```bash
# Local filesystem path
atomic push /path/to/other/repo

# File URL
atomic push file:///path/to/other/repo
```

## Conflict-Free Push

Atomic's mathematical patch theory ensures conflict-free pushing:

- **Multiple pushers**: Multiple people can push simultaneously
- **No merge commits**: Pushes don't create merge artifacts
- **Semantic correctness**: Mathematical guarantees of consistency
- **Order independence**: Push order doesn't affect final state

## Push Failures

### Authentication Failures

```bash
# Ensure SSH key is loaded
ssh-add ~/.ssh/id_ed25519

# Test SSH connection
ssh -T git@github.com

# For HTTPS, use token authentication
atomic push https://user:token@host/repo.git
```

### Remote Changes

If the remote has changes you don't have:

```
Remote has changes not in local repository.
Pull first: atomic pull
```

Solution:
```bash
atomic pull
atomic push
```

### Permission Denied

```
Error: Permission denied
```

Verify you have write access to the remote repository.

## Performance

Push performance depends on:

- **Number of changes**: More changes = longer upload
- **Change size**: Larger changes take more time
- **Network speed**: Bandwidth affects upload time
- **Protocol**: SSH is typically faster than HTTPS

Typical push times:

- **Small push** (&lt; 10 changes): 1-5 seconds
- **Medium push** (10-50 changes): 5-30 seconds
- **Large push** (50+ changes): 30 seconds - 5 minutes

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

[remote "backup"]
ssh = "ssh://backup@server/repos/project.git"

# Attribution sync
[attribution]
auto_sync = true  # Automatically push attribution
```

## Pushing Tags

To push tags along with changes, use the tag command:

```bash
# Push a specific tag
atomic tag push v1.0.0

# Tags are included in normal push for referenced changes
atomic push --all
```

## Unrecorded Changes

If you have unrecorded changes in your working copy, push will warn you:

```
Warning: Uncommitted changes in working copy
Record or discard changes before pushing
```

Record them first:
```bash
atomic record -m "Work in progress"
atomic push
```

Or push from a clean state:
```bash
atomic restore
atomic push
```

## Notes

- **Atomic Operation**: Push is atomic - all changes succeed or none do
- **No Force Push**: Atomic doesn't need force push due to conflict-free merging
- **Bandwidth Efficient**: Only missing changes are uploaded
- **Cryptographic Integrity**: All changes are cryptographically verified
- **Attribution Sync**: Optional metadata sync for AI tracking

## Exit Codes

- `0` - Success
- `1` - Error (authentication failure, network error, etc.)
- `2` - Invalid arguments

## See Also

- [`atomic pull`](./pull.md) - Pull changes from a remote
- [`atomic clone`](./clone.md) - Clone a remote repository
- [`atomic tag`](./tag.md) - Manage tags
- [`atomic view`](./view.md) - Manage views
- [`atomic record`](./record.md) - Record changes before pushing

## Related Concepts

- **Remotes** - Remote repository locations
- **Views** - Independent lines of development
- **Changes** - Atomic units of modification
- **Attribution** - AI contribution metadata
- **Conflict-Free** - Mathematical guarantees of merge correctness