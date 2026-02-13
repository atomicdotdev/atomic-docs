---
sidebar_position: 13
title: identity
---

# atomic identity

Manage user identities and cryptographic keys for signing changes.

## Synopsis

```bash
atomic identity [OPTIONS]
atomic identity new [NAME] [OPTIONS]
atomic identity list
atomic identity edit [NAME] [OPTIONS]
atomic identity remove [NAME] [OPTIONS]
atomic identity prove [OPTIONS]
atomic identity repair
```

## Description

The `identity` command manages cryptographic identities used to sign changes in Atomic. Each identity consists of:

- **Name**: Unique identifier for the identity
- **Author Info**: Username, display name, and email
- **Cryptographic Keys**: Public/private key pair for signing
- **Credentials**: Optional password-protected storage
- **Remote Settings**: Default remote configuration

Identities enable:
- **Cryptographic Signing**: Changes are cryptographically signed
- **Author Attribution**: Clear tracking of who made changes
- **Verification**: Others can verify your changes
- **Multiple Identities**: Separate identities for work, personal, etc.

## Subcommands

### `identity new` - Create a New Identity

Create a new cryptographic identity for signing changes.

#### Synopsis

```bash
atomic identity new [NAME] [OPTIONS]
```

#### Arguments

**`[NAME]`**

Optional name for the identity. If not provided, you'll be prompted.

```bash
# Specify name
atomic identity new work-key

# Will prompt for name
atomic identity new
```

#### Options

**`--username <USERNAME>`**

Set the username for this identity.

```bash
atomic identity new work --username alice
```

**`--display-name <NAME>`**

Set the display name (full name).

```bash
atomic identity new work --display-name "Alice Smith"
```

**`--email <EMAIL>`**

Set the email address. Must be a valid email format.

```bash
atomic identity new work --email alice@example.com
```

**`--remote <REMOTE>`**

Set the default remote for this identity.

```bash
atomic identity new work --remote origin
```

**`--expiry <DATE>`**

Set an expiration date for the identity. Accepts various date formats.

```bash
atomic identity new temp --expiry "2025-12-31"
atomic identity new temp --expiry "next month"
```

**`--no-link`**

Do not automatically link keys with the remote server.

```bash
atomic identity new personal --no-link
```

**`--no-prompt`**

Abort rather than prompt for missing information. Requires all data to be provided via options.

```bash
atomic identity new work \
  --no-prompt \
  --username alice \
  --display-name "Alice Smith" \
  --email alice@example.com
```

**`--read-password`**

Encrypt the identity using a password from standard input. Requires `--no-prompt`.

```bash
echo "mysecurepassword" | atomic identity new secure --read-password --no-prompt
```

#### Examples

```bash
# Interactive creation (prompts for details)
atomic identity new

# Create with all details
atomic identity new work \
  --username alice \
  --display-name "Alice Smith" \
  --email alice@work.com

# Create temporary identity
atomic identity new temp --expiry "2025-12-31"

# Create password-protected identity
atomic identity new secure --read-password --no-prompt < password.txt
```

### `identity list` - List All Identities

Display all valid identities configured on the system.

#### Synopsis

```bash
atomic identity list
```

#### Examples

```bash
# List all identities
atomic identity list
```

#### Output

The output shows a tree structure of all identities:

```
Identities
├── default
│   ├── Username: alice
│   ├── Display Name: Alice
│   ├── Email: alice@example.com
│   ├── Public Key: ABCD1234...
│   └── Last Modified: 2025-01-15 10:30:00 UTC
└── work
    ├── Username: alice.smith
    ├── Display Name: Alice Smith
    ├── Email: alice@company.com
    ├── Public Key: EFGH5678...
    ├── Remote: origin
    └── Last Modified: 2025-01-14 09:15:00 UTC
```

### `identity edit` - Edit an Existing Identity

Modify properties of an existing identity.

#### Synopsis

```bash
atomic identity edit [NAME] [OPTIONS]
```

#### Arguments

**`[NAME]`**

Name of the identity to edit. If not provided, you'll be prompted to choose.

```bash
# Specify identity to edit
atomic identity edit work

# Will prompt for identity
atomic identity edit
```

#### Options

**`--new-name <NAME>`**

Rename the identity.

```bash
atomic identity edit old-name --new-name new-name
```

**`--username <USERNAME>`**

Update the username.

```bash
atomic identity edit work --username alice.smith
```

**`--display-name <NAME>`**

Update the display name.

```bash
atomic identity edit work --display-name "Alice M. Smith"
```

**`--email <EMAIL>`**

Update the email address.

```bash
atomic identity edit work --email alice.smith@company.com
```

**`--remote <REMOTE>`**

Update the default remote.

```bash
atomic identity edit work --remote upstream
```

**`--expiry <DATE>`**

Update the expiration date.

```bash
atomic identity edit temp --expiry "2026-01-01"
```

**`--no-link`**

Do not automatically link keys with the remote.

**`--no-prompt`**

Abort rather than prompt for confirmation. Requires specifying the identity name.

**`--read-password`**

Update password encryption from standard input.

#### Examples

```bash
# Interactive edit
atomic identity edit work

# Update email
atomic identity edit work --email new.email@company.com

# Rename identity
atomic identity edit old --new-name new

# Update multiple fields
atomic identity edit work \
  --username alice.smith \
  --email alice.smith@company.com \
  --display-name "Alice Smith"
```

### `identity remove` - Remove an Identity

Delete an existing identity from the system.

#### Synopsis

```bash
atomic identity remove [NAME] [OPTIONS]
```

Alias: `atomic identity rm`

#### Arguments

**`[NAME]`**

Name of the identity to remove. If not provided via `--name`, you'll be prompted.

#### Options

**`--name <NAME>`**

Specify the identity name to remove.

```bash
atomic identity remove --name old-identity
```

**`--no-confirm`**

Remove the identity without confirmation prompt.

```bash
atomic identity remove temp --no-confirm
```

#### Examples

```bash
# Remove with confirmation
atomic identity remove old-identity

# Remove without confirmation
atomic identity remove temp --no-confirm

# Using --name option
atomic identity remove --name unused-key --no-confirm
```

**Warning**: Removing an identity cannot be undone. Changes signed with that identity will still be verifiable, but you won't be able to sign new changes with it.

### `identity prove` - Prove Identity to Server

Prove your identity to a remote server for authentication.

#### Synopsis

```bash
atomic identity prove [SERVER] [OPTIONS]
```

#### Arguments

**`[SERVER]`**

The target server URL to prove identity to.

#### Options

**`--name <NAME>`**

Specify which identity to use for proof.

```bash
atomic identity prove https://atomic.example.com --name work
```

#### Examples

```bash
# Prove identity to server
atomic identity prove https://atomic.example.com

# Use specific identity
atomic identity prove https://server.com --name work-key
```

### `identity repair` - Repair Identity State

Repair the identity state on disk, including migration from older versions of Atomic.

#### Synopsis

```bash
atomic identity repair
```

#### Description

This command:
- Validates all identities on disk
- Repairs corrupted identity files
- Migrates from older Atomic versions
- Fixes permissions and file structure

#### Examples

```bash
# Repair identity state
atomic identity repair
```

Use this command if you encounter identity-related errors or after upgrading Atomic.

## Complete Examples

### Setting Up Your First Identity

```bash
# Create your default identity
atomic identity new default

# You'll be prompted for:
# - Username: alice
# - Display Name: Alice
# - Email: alice@example.com

# Verify it was created
atomic identity list
```

### Work and Personal Identities

```bash
# Create work identity
atomic identity new work \
  --username alice.smith \
  --display-name "Alice Smith" \
  --email alice@company.com \
  --remote origin

# Create personal identity
atomic identity new personal \
  --username alice \
  --display-name "Alice" \
  --email alice@personal.com

# List all identities
atomic identity list

# Use specific identity when recording
atomic record -m "Work changes" --identity work
```

### Temporary Identity for Collaboration

```bash
# Create temporary identity that expires
atomic identity new contractor \
  --username contractor \
  --display-name "External Contractor" \
  --email contractor@vendor.com \
  --expiry "2025-06-30"

# Use it for changes
atomic record -m "Contract work" --identity contractor
```

### Password-Protected Identity

```bash
# Create password-protected identity
cat > password.txt << EOF
my-secure-password-123
EOF

atomic identity new secure \
  --no-prompt \
  --username alice \
  --display-name "Alice" \
  --email alice@example.com \
  --read-password < password.txt

rm password.txt
```

## Identity Storage

Identities are stored in `~/.config/atomic/identities/`:

```
~/.config/atomic/identities/
├── default.toml          # Default identity
├── work.toml             # Work identity
└── personal.toml         # Personal identity
```

Each file contains:
- Author information (username, display name, email)
- Public key (for verification)
- Private key (encrypted if password-protected)
- Metadata (creation date, expiry, etc.)

## Key Management

### Cryptographic Keys

Atomic generates Ed25519 cryptographic keys for each identity:

- **Public Key**: Shared with others for verification (53-character Base32)
- **Private Key**: Kept secure, used for signing changes

Example public key:
```
MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
```

### Key Security

- Private keys are stored securely
- Optional password encryption for sensitive identities
- Keys never leave your machine unless explicitly exported
- Each change is cryptographically signed

## Using Identities

### Recording with Specific Identity

```bash
# Use work identity
atomic record -m "Work changes" --identity work

# Use personal identity
atomic record -m "Personal project" --identity personal
```

### Default Identity

The first identity created (or one named "default") is used by default:

```bash
# Uses default identity
atomic record -m "Changes"

# Equivalent to:
atomic record -m "Changes" --identity default
```

## Configuration Integration

Identities integrate with repository configuration:

```toml
# In .atomic/config.toml
[author]
username = "alice"
display_name = "Alice Smith"

# Default identity
[identity]
default = "work"
```

## Keyring Integration

Atomic can optionally store credentials in the system keyring:

- **macOS**: Keychain
- **Linux**: Secret Service (GNOME Keyring, KWallet)
- **Windows**: Credential Manager

This provides additional security for password-protected identities.

## Verification

Others can verify your changes using your public key:

```bash
# View change author and signature
atomic log --attribution

# Verify a specific change
atomic change ABCD1234... --verify
```

## Migration

When upgrading Atomic versions, identities may need migration:

```bash
# Migrate identities from older versions
atomic identity repair

# Verify migration
atomic identity list
```

## Best Practices

### Identity Separation

```bash
# Work identity for professional projects
atomic identity new work --email work@company.com

# Personal identity for open source
atomic identity new personal --email personal@example.com

# Use appropriate identity per repository
```

### Security

- Use password protection for sensitive identities
- Set expiration dates for temporary access
- Regularly audit identities with `atomic identity list`
- Remove unused identities promptly

### Organization

- Use descriptive names (work, personal, client-name)
- Keep display names consistent
- Use proper email addresses for each context
- Document which identity to use in team guidelines

## Troubleshooting

### Identity Not Found

```
Error: Identity 'work' not found
```

Solution:
```bash
# List available identities
atomic identity list

# Create missing identity
atomic identity new work
```

### Corrupted Identity

```
Error: Failed to load identity
```

Solution:
```bash
# Repair identities
atomic identity repair

# If repair fails, recreate
atomic identity remove broken-identity --no-confirm
atomic identity new new-identity
```

### Permission Issues

```
Error: Permission denied reading identity
```

Solution:
```bash
# Fix permissions
chmod 600 ~/.config/atomic/identities/*.toml

# Repair if needed
atomic identity repair
```

## Notes

- **Multiple Identities**: You can have unlimited identities
- **Cryptographic Security**: All keys use Ed25519 elliptic curve cryptography
- **Immutable Changes**: Once signed, changes are cryptographically bound to the identity
- **Verification**: Public keys enable anyone to verify your signatures
- **Privacy**: Private keys never leave your machine
- **Portability**: Identity files can be backed up and restored

## Configuration

Relevant configuration options:

```toml
# In ~/.config/atomic/config.toml

# Default identity
[identity]
default = "work"

# Keyring integration
[security]
use_keyring = true

# Author fallback (if no identity)
[author]
username = "alice"
display_name = "Alice Smith"
```

## See Also

- [`atomic record`](./record.md) - Record changes with identity

## Related Concepts

- **Cryptographic Keys** - Ed25519 public/private key pairs
- **Signing** - Cryptographic signatures on changes
- **Verification** - Validating signatures with public keys
- **Author Attribution** - Tracking who made changes
- **Identity Management** - Multiple identities for different contexts