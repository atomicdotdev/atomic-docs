---
sidebar_position: 5
---

# Remote Operations

Remote operations in Atomic enable distributed collaboration by synchronizing changes between repositories. Unlike traditional version control systems, Atomic's remote operations are **change-centric** rather than branch-centric, providing fine-grained control over what gets shared.

## Overview

Atomic's remote operations consist of two primary commands:

- **`atomic push`**: Send changes from your local repository to a remote
- **`atomic pull`**: Fetch changes from a remote repository to your local repository

These operations work with Atomic's **stack-based architecture**, allowing you to selectively synchronize specific stacks and changes between repositories.

## Key Concepts

### Change-Based Synchronization

Atomic synchronizes **individual changes** (patches), not entire repository snapshots:

```
Traditional VCS:               Atomic VCS:
┌──────────────┐              ┌──────────────┐
│ Push Branch  │              │ Push Changes │
│   (All or    │              │  (Selective  │
│   Nothing)   │              │   Patches)   │
└──────────────┘              └──────────────┘
```

### Benefits

1. **Selective Synchronization**: Push or pull specific changes, not entire branches
2. **Independent Stacks**: Each stack can be synchronized independently
3. **Conflict-Free Merging**: Atomic's patch theory handles most conflicts automatically
4. **Efficient Transfer**: Only transfer changes that are missing
5. **Mathematical Consistency**: Change dependencies are preserved automatically

## Remote Configuration

### Configuring Remotes

Remotes in Atomic are configured in the `.atomic/config.toml` file. You can set a default remote and manage remote repositories through the configuration.

### Remote URL Formats

Atomic supports multiple remote protocols:

**SSH** (recommended for authentication):
```bash
atomic remote add origin ssh://user@server.com:2222/path/to/repo
atomic remote add origin user@server.com:path/to/repo
```

**HTTP/HTTPS** (good for public repositories):
```bash
atomic remote add origin https://example.com/repos/project
atomic remote add origin http://localhost:8080/repos/project
```

**Local Path** (for local synchronization):
```bash
atomic remote add origin /path/to/local/repo
atomic remote add origin file:///absolute/path/to/repo
```

### Remote Configuration File

Remotes are stored in `.atomic/config.toml`:

```toml
[[remotes]]
name = "origin"
ssh = "ssh://user@example.com/path/to/repo"

[[remotes]]
name = "backup"
ssh = "ssh://backup.example.com/repos/project"

[[remotes]]
name = "public"
http = "https://public-repos.example.com/project"

[remotes.public.headers]
Authorization = { value = "Bearer $ATOMIC_TOKEN", env = "ATOMIC_TOKEN" }
```

You can also use `atomic remote` to manage remotes:

```bash
# Set the default remote
atomic remote default origin

# Delete a remote
atomic remote delete old-remote
```

## Push Operations

### Basic Push

Push changes from your local stack to a remote:

```bash
# Push current stack to default remote
atomic push

# Push to named remote
atomic push origin

# Push from specific stack
atomic push --from-stack feature-xyz
```

### Advanced Push Options

```bash
# Push to different remote stack
atomic push --to-stack develop

# Push all changes
atomic push --all

# Push only changes relating to specific paths
atomic push --path src/

# Force cache update
atomic push --force-cache

# Push with attribution metadata
atomic push --with-attribution
```

## Pull Operations

### Basic Pull

Fetch changes from a remote repository:

```bash
# Pull from default remote
atomic pull

# Pull from named remote
atomic pull origin

# Pull from specific remote stack
atomic pull --from-stack main
```

### Advanced Pull Options

```bash
# Pull into different stack
atomic pull --to-stack develop

# Pull all changes
atomic pull --all

# Pull only changes for specific paths
atomic pull --path src/

# Download full changes
atomic pull --full

# Force cache update
atomic pull --force-cache

# Pull with attribution metadata
atomic pull --with-attribution
```

## Common Workflows

### Basic Collaboration Workflow

```bash
# Start work on feature
atomic stack new feature-login
atomic record -m "Add login form"
atomic record -m "Add authentication logic"

# Push feature to remote
atomic push --from-stack feature-login

# Collaborate: teammate makes changes
# Pull updates
atomic pull --from-stack feature-login --to-stack feature-login

# Continue work
atomic record -m "Add password validation"

# Push updates
atomic push --from-stack feature-login
```

### Integration Workflow

```bash
# Work on main stack
atomic stack switch main

# Pull latest from remote
atomic pull

# Create feature stack
atomic stack new feature-api
atomic record -m "Implement new API"

# Push feature
atomic push --from-stack feature-api --to-stack feature-api

# After review, merge to main
atomic stack switch main
atomic pull . feature-api

# Push integrated changes
atomic push
```

### Selective Synchronization

```bash
# Pull only changes relating to specific paths
atomic stack switch main
atomic pull --from-stack feature-xyz --path src/module.rs

# Push only changes relating to specific paths to production
atomic push production --path src/stable/
```

### Multi-Remote Workflow

Configure multiple remotes in `.atomic/config.toml`:

```toml
[[remotes]]
name = "origin"
ssh = "ssh://git@github.com/user/repo"

[[remotes]]
name = "backup"
ssh = "ssh://backup.example.com/repo"

[[remotes]]
name = "staging"
ssh = "ssh://staging.example.com/repo"
```

```bash
# Push to multiple remotes
atomic push origin
atomic push backup

# Pull from staging to test
atomic pull staging

# Set default remote
atomic remote default origin
```

## Remote Stack Management

### Working with Remote Stacks

```bash
# Create and push new stack to remote
atomic stack new experiment
atomic stack switch experiment
atomic push --to-stack experiment

# Pull from remote stack
atomic pull --from-stack experiment --to-stack experiment

# Push from local stack to remote stack
atomic push --from-stack local-branch --to-stack remote-branch
```

## Conflict Resolution

### Understanding Conflicts

Atomic's patch theory handles most conflicts automatically, but some require manual resolution:

```bash
# Pull changes that conflict
atomic pull origin main

# Atomic marks conflicts in files:
# <<<<<<< local
# Your changes
# =======
# Remote changes
# >>>>>>> remote
```

### Resolving Conflicts

```bash
# 1. Edit conflicting files manually
nano conflicting-file.txt

# 2. Record the resolution
atomic record -m "Resolve conflicts from origin/main"

# 3. Push the resolution
atomic push origin main
```

### Conflict Prevention

```bash
# Pull frequently to stay in sync
atomic pull origin main

# Use atomic reset to update working copy
atomic reset

# Communicate with team about changes
atomic log --stack main --remote origin
```

## Authentication

### SSH Authentication

**Recommended method** for secure remote access:

```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519

# Configure remote with SSH
atomic remote add origin ssh://git@example.com/repo

# Push/pull with SSH
atomic push origin main
```

### HTTP Authentication

For HTTP remotes, authentication can be configured:

**Token-Based** (recommended):
```toml
# .atomic/config.toml
[[remotes]]
name = "origin"
http = "https://example.com/repos/project"

[remotes.origin.headers]
Authorization = { value = "Bearer $ATOMIC_TOKEN", env = "ATOMIC_TOKEN" }
```

**Basic Auth**:
```bash
# Set credentials in environment
export ATOMIC_USERNAME=your-username
export ATOMIC_PASSWORD=your-token

# Or use .netrc file
# ~/.netrc
machine example.com
login your-username
password your-token
```

### Credential Management

Atomic uses SSH keys for authentication. Identity management is handled through the `atomic identity` command, which manages cryptographic keys and credentials securely.

## Performance Optimization

### Efficient Transfers

Atomic optimizes remote operations automatically:

- **Incremental Sync**: Only transfer missing changes
- **Compression**: Changes are compressed during transfer
- **Caching**: Remote state cached locally with `--force-cache` option

### Large Repository Strategies

```bash
# Pull specific paths only
atomic pull --path src/

# Pull specific paths from multiple directories
atomic pull --path src/ --path docs/

# Use force-cache to update remote state
atomic pull --force-cache
```

## Troubleshooting

### Push Issues

**Problem**: Remote has changes you don't have locally

```bash
# Solution: Pull first, then push
atomic pull
atomic push
```

### Pull Conflicts

**Problem**: Local changes conflict with remote

```bash
# Solution: Resolve conflicts manually
atomic pull
# Atomic will mark conflicts in files
# Edit conflicting files
atomic record -m "Resolve conflicts"
```

### Authentication Failures

**Problem**: Cannot authenticate with remote

```bash
# SSH: Check SSH keys
ssh -vT git@example.com

# Check your Atomic identity
atomic identity list

# Ensure your SSH keys are set up correctly
atomic identity show default
```

### Connection Timeouts

**Problem**: Remote operations timeout

```bash
# Use --no-cert-check for HTTPS issues (use with caution)
atomic push -k

# Check remote configuration in .atomic/config.toml
cat .atomic/config.toml
```

### Remote Configuration Issues

**Problem**: Remote repository doesn't exist or is misconfigured

```bash
# Check remote configuration
atomic remote

# Set default remote
atomic remote default origin

# Delete problematic remote
atomic remote delete old-remote

# Edit .atomic/config.toml to add/update remotes
```

## Best Practices

### 1. Record Before Push/Pull

Always record local changes before remote operations:

```bash
# Good practice
atomic record -m "Work in progress"
atomic pull

# Avoid uncommitted changes during sync
```

### 2. Pull Frequently

Stay synchronized with remote changes:

```bash
# Pull at start of work session
atomic pull

# Pull before pushing
atomic pull
atomic push
```

### 3. Use Descriptive Stack Names

Make remote stacks easy to identify:

```bash
# Good names
atomic push --to-stack feature-user-authentication
atomic push --to-stack bugfix-memory-leak
atomic push --to-stack release-2.1

# Avoid generic names
atomic push --to-stack temp
atomic push --to-stack test
```

### 4. Protect Production Stacks

Use selective pushing to production:

```bash
# Only push specific paths to production
atomic push production --path src/stable/

# Be careful with production deployments
```

### 5. Use Multiple Remotes

Configure backups and staging environments in `.atomic/config.toml`:

```toml
[[remotes]]
name = "origin"
ssh = "ssh://git@example.com/repo"

[[remotes]]
name = "backup"
ssh = "ssh://backup.example.com/repo"
```

```bash
# Push to both
atomic push origin
atomic push backup

# Set default remote
atomic remote default origin
```

### 6. Document Remote Configuration

Keep remote setup documented in your repository's documentation to help team members understand the remote structure and access patterns.

## Command Reference

For detailed information about remote operation commands:

- [**`atomic push`**](./push.md) - Push changes to remote repositories
- [**`atomic pull`**](./pull.md) - Pull changes from remote repositories

## See Also

- [Stacks](./stacks.md) - Understanding stack-based development
- [Working with Changes](./working-with-changes.md) - Recording and managing changes
- [Repository Management](./repository-management.md) - Setting up repositories
- [Tags](./tags.md) - Tagging releases for deployment

---

**Next Steps:**
- Learn about [push command](./push.md) for detailed push options
- Explore [pull command](./pull.md) for advanced pulling techniques
- Understand [stacks](./stacks.md) for effective remote workflows