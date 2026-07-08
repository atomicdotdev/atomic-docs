---
sidebar_position: 5
title: clone
---

# atomic clone

Clone a repository from a remote location.

## Synopsis

```bash
atomic clone [OPTIONS] <REMOTE> [PATH]
```

## Description

The `clone` command creates a local copy of a remote Atomic repository. It downloads all changes, tags, and view information from the remote, setting up a complete, independent repository on your local machine.

Unlike centralized version control systems, cloned Atomic repositories are **fully autonomous**. They contain the complete history and can operate independently, with the ability to push and pull changes to/from remotes as needed.

When you clone a repository, Atomic:

1. Creates a new directory (or uses the specified path)
2. Initializes a new repository structure
3. Downloads all changes and tags from the remote
4. Sets up the remote configuration
5. Checks out the working copy for the default view

## Arguments

### `<REMOTE>`

The remote repository URL to clone from. Atomic supports multiple protocols:

- **SSH**: `ssh://user@host/path/to/repo` or `user@host:path/to/repo`
- **HTTP/HTTPS**: `http://host/path/to/repo` or `https://host/path/to/repo`
- **Local**: `/absolute/path/to/repo` or `file:///path/to/repo`

```bash
# SSH with full URL
atomic clone ssh://git@github.com/user/repo.git

# SSH with short syntax
atomic clone git@github.com:user/repo.git

# HTTPS
atomic clone https://github.com/user/repo.git

# Local path
atomic clone /path/to/local/repo
atomic clone file:///path/to/local/repo
```

### `[PATH]`

Optional destination directory for the cloned repository. If not specified, Atomic creates a directory based on the repository name from the remote URL.

```bash
# Clone into default directory (repo name from URL)
atomic clone ssh://host/path/to/myrepo.git
# Creates: ./myrepo/

# Clone into specific directory
atomic clone ssh://host/path/to/myrepo.git custom-name
# Creates: ./custom-name/
```

## Options

### `--view <VIEW>`

Clone and checkout a specific view instead of the default view.

```bash
atomic clone --view develop ssh://host/repo.git
```

### `--change <HASH>`

Clone up to and including a specific change, rather than cloning the entire history.

```bash
atomic clone --change ABCD1234... ssh://host/repo.git
```

### `--state <STATE>`

Clone to a specific repository state (Merkle tree hash).

```bash
atomic clone --state XYZABC... ssh://host/repo.git
```

### `--path <PATH>`

Alternative way to specify the destination path (equivalent to the positional `[PATH]` argument).

```bash
atomic clone --path ./my-project ssh://host/repo.git
```

### `--lazy`

Perform a lazy clone, downloading only the minimal necessary data. Additional changes are downloaded on-demand when needed.

```bash
atomic clone --lazy ssh://host/large-repo.git
```

**Note**: Lazy clones reduce initial clone time and disk usage but require network access for some operations.

## Examples

### Basic Cloning

```bash
# Clone from SSH remote
atomic clone ssh://git@github.com/user/repo.git

# Clone from HTTPS
atomic clone https://github.com/user/repo.git

# Clone into specific directory
atomic clone ssh://host/repo.git my-project
```

### Clone Specific View

```bash
# Clone and checkout the 'develop' view
atomic clone --view develop ssh://host/repo.git

# Clone and checkout a feature branch
atomic clone --view feature-new-ui ssh://host/repo.git
```

### Partial Clone

```bash
# Clone only up to a specific change
atomic clone --change MNYNGT2V... ssh://host/repo.git

# Lazy clone for large repositories
atomic clone --lazy ssh://host/huge-repo.git
```

### Local Clone

```bash
# Clone from local filesystem
atomic clone /home/user/projects/original-repo new-repo

# Clone using file:// protocol
atomic clone file:///home/user/projects/original-repo new-repo
```

## Repository Structure After Clone

After cloning, your directory will contain:

```
my-project/
├── .atomic/
│   ├── pristine/          # Repository database
│   ├── config.toml        # Local configuration (includes remote)
│   └── changes/           # Change files
├── .ignore                # Ignore patterns
└── [working copy files]   # Checked out files
```

## Remote Configuration

The clone command automatically configures the remote in `.atomic/config.toml`:

```toml
[remote "origin"]
ssh = "ssh://git@github.com/user/repo.git"

# Or for HTTP remotes:
[remote "origin"]
http = "https://github.com/user/repo.git"
```

You can verify the remote configuration:

```bash
# After cloning
cd my-project
cat .atomic/config.toml
```

## Authentication

### SSH Authentication

For SSH remotes, Atomic uses standard SSH authentication:

- **SSH keys**: Uses keys from `~/.ssh/` (id_rsa, id_ed25519, etc.)
- **SSH agent**: Supports ssh-agent for key management
- **SSH config**: Respects settings in `~/.ssh/config`

```bash
# Ensure your SSH key is loaded
ssh-add ~/.ssh/id_ed25519

# Clone with SSH
atomic clone git@github.com:user/repo.git
```

### HTTP Authentication

For HTTP/HTTPS remotes, authentication can be provided via:

- **URL embedded credentials**: `https://user:token@host/repo.git`
- **Credential helpers**: Configured in git credential helpers
- **Interactive prompt**: Atomic will prompt for credentials if needed

```bash
# With embedded token
atomic clone https://user:ghp_token123@github.com/user/repo.git

# Or let Atomic prompt
atomic clone https://github.com/user/private-repo.git
# Username: user
# Password: [token]
```

## Clone Progress

During cloning, Atomic shows progress information:

```
Cloning into 'repo'...
Downloading changes: 100/100 [========================================] 100%
Applying changes: 100/100 [==========================================] 100%
Checking out working copy...
Clone complete.
```

## Lazy Cloning

Lazy clones download minimal data initially:

```bash
atomic clone --lazy ssh://host/large-repo.git
```

**Benefits**:
- Faster initial clone
- Reduced disk usage
- Suitable for CI/CD or temporary work

**Limitations**:
- Requires network for some operations
- May have latency when accessing historical changes
- Not ideal for offline work

## Performance

Clone performance depends on several factors:

- **Repository size**: Number of changes and total data
- **Network speed**: Bandwidth and latency to remote
- **Protocol**: SSH typically faster than HTTPS
- **Clone type**: Lazy clones are much faster initially

Typical clone times:

- **Small repo** (&lt; 100 changes): &lt; 10 seconds
- **Medium repo** (100-1000 changes): 10-60 seconds
- **Large repo** (1000+ changes): 1-10 minutes
- **Lazy clone**: Usually &lt; 30 seconds regardless of size

## Shallow vs. Full Clone

Atomic supports partial cloning through options:

```bash
# Full clone (default) - complete history
atomic clone ssh://host/repo.git

# Partial clone - up to specific change
atomic clone --change ABCD1234... ssh://host/repo.git

# Lazy clone - minimal initial download
atomic clone --lazy ssh://host/repo.git
```

## Post-Clone Steps

After cloning, you typically want to:

```bash
# Navigate into the repository
cd repo

# Verify the clone
atomic log --limit 5

# Check current view
atomic view

# Make changes and work normally
atomic add .
atomic record -m "My changes"
```

## Troubleshooting

### Authentication Failures

```bash
# SSH: Verify key is loaded
ssh-add -l

# SSH: Test connection
ssh -T git@github.com

# HTTPS: Check credentials
# Use token instead of password for GitHub/GitLab
```

### Network Issues

```bash
# For slow networks, consider lazy clone
atomic clone --lazy ssh://host/repo.git

# For interrupted clones, remove partial directory and retry
rm -rf repo
atomic clone ssh://host/repo.git
```

### Permission Errors

```bash
# Ensure directory is writable
ls -ld .

# Check remote access
ssh git@github.com  # Should show "Hi username!"
```

## Notes

- **Full Repositories**: Clones are complete, independent repositories
- **No Central Authority**: Cloned repositories can work offline
- **Remote Tracking**: The origin remote is configured automatically
- **Working Copy**: The working copy is checked out automatically
- **Views**: All views are cloned, but only one is checked out
- **Tags**: All tags are downloaded during clone

## Configuration

Relevant global configuration options:

```toml
# In ~/.config/atomic/config.toml

# SSH settings
[ssh]
key_path = "~/.ssh/id_ed25519"

# HTTP settings
[http]
timeout = 300  # seconds
```

## Environment Variables

- `SSH_AUTH_SOCK` - SSH agent socket for key authentication
- `GIT_SSH_COMMAND` - Custom SSH command (for advanced usage)
- `ATOMIC_HTTP_TIMEOUT` - HTTP request timeout in seconds

## Exit Codes

- `0` - Success
- `1` - Error (network failure, authentication error, etc.)
- `2` - Invalid arguments

## See Also

- [`atomic init`](./init.md) - Initialize a new repository
- [`atomic pull`](./pull.md) - Pull changes from a remote
- [`atomic push`](./push.md) - Push changes to a remote
- [`atomic view`](./view.md) - Manage views
- [`atomic log`](./log.md) - View repository history

## Related Concepts

- **Remotes** - Remote repository locations
- **Views** - Independent lines of development
- **Working Copy** - Your editable files
- **Lazy Clone** - On-demand change downloading
- **Distributed Architecture** - Every repository is complete and autonomous