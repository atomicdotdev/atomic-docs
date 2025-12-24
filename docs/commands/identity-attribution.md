---
sidebar_position: 8
---

# Identity & Attribution

Identity and attribution in Atomic provide cryptographic signing of changes and tracking of authorship, including AI assistance. This system ensures authenticity, enables verification, and provides transparency about how code was created.

## Overview

Atomic's identity and attribution system consists of three main components:

- **`atomic identity`**: Manage cryptographic identities for signing changes
- **`atomic credit`**: Show line-by-line attribution for files
- **`atomic attribution`**: Display AI contribution statistics

These tools work together to provide a complete picture of who created what, and how (human-authored vs. AI-assisted).

## Key Concepts

### Cryptographic Identities

Each Atomic user has one or more **identities** consisting of:

- **Name**: Unique identifier (e.g., "work", "personal", "default")
- **Author Information**: Username, display name, email
- **Public/Private Key Pair**: Ed25519 cryptographic keys
- **Credentials**: Optional password-protected private key storage

Identities are stored in `~/.config/atomic/identities/` and are used to cryptographically sign all changes you create.

### Change Signing

Every change you record is automatically signed with your active identity:

```bash
# Your identity signs this change
atomic record -m "Add new feature"

# The change includes:
# - Your username and display name
# - Cryptographic signature
# - Timestamp
# - Public key identifier
```

This ensures:
- **Authenticity**: Verify the change came from you
- **Non-repudiation**: You can't deny authoring the change
- **Integrity**: Detect if the change was tampered with

### AI Attribution

Atomic tracks AI assistance at the patch level, recording:

- **AI Provider**: Which AI system was used (e.g., GitHub Copilot, Claude)
- **AI Model**: Specific model version (e.g., "claude-3-opus")
- **Suggestion Type**: Complete, partial, or collaborative
- **Confidence**: How much of the change was AI-generated

This metadata is embedded in changes and can be aggregated across the repository.

## Identity Management

### Creating Identities

Create a new identity for signing changes:

```bash
# Interactive creation
atomic identity new

# Specify details upfront
atomic identity new work \
  --username alice \
  --display-name "Alice Smith" \
  --email alice@example.com

# Create with password protection
atomic identity new secure-key
# Will prompt for password to encrypt private key
```

### Multiple Identities

Use different identities for different contexts:

```bash
# Create work identity
atomic identity new work \
  --username alice \
  --email alice@company.com

# Create personal identity
atomic identity new personal \
  --username alice-personal \
  --email alice@personal.com

# Switch between them
atomic identity use work
atomic identity use personal
```

### Listing Identities

View all configured identities:

```bash
# List all identities
atomic identity list

# Shows:
# - Identity name
# - Username
# - Email
# - Last modified date
# - Whether it's the default
```

### Editing Identities

Modify existing identity details:

```bash
# Edit identity interactively
atomic identity edit work

# Change specific fields
atomic identity edit work --email newemail@example.com
atomic identity edit work --display-name "Alice Johnson"
```

### Proving Identities

Verify identity with remote server:

```bash
# Prove identity to remote
atomic identity prove work

# This cryptographically verifies you own the private key
# associated with your public identity
```

## Attribution Tracking

### Line-by-Line Attribution

Use `atomic credit` to see who last modified each line of a file:

```bash
# Show attribution for file
atomic credit src/main.rs

# Output format:
# <author> <change-hash> <line-number> <line-content>
```

Example output:
```
alice ABCDEF123 1 fn main() {
alice ABCDEF123 2     println!("Hello");
bob   XYZ789ABC 3     println!("World");
alice ABCDEF123 4 }
```

### AI Attribution Statistics

View AI contribution statistics for the repository:

```bash
# Show AI attribution summary
atomic attribution

# Displays:
# - Total changes
# - AI-assisted changes
# - AI contribution percentage
# - Breakdown by provider/model
# - Suggestion type distribution
```

### Recording AI-Assisted Changes

When recording changes created with AI assistance, use attribution flags:

```bash
# Mark change as AI-assisted
atomic record --ai-assisted -m "Add feature (AI-assisted)"

# Specify AI provider
atomic record --ai-provider "GitHub Copilot" -m "Implement parser"

# Specify AI model
atomic record --ai-model "claude-3-opus" -m "Refactor code"

# Full AI attribution
atomic record \
  --ai-assisted \
  --ai-provider "Claude" \
  --ai-model "claude-3-opus" \
  -m "AI-generated test suite"
```

### Environment-Based Detection

Atomic can automatically detect AI assistance from environment variables:

```bash
# Set AI environment variables
export ATOMIC_AI_ENABLED=true
export ATOMIC_AI_PROVIDER="GitHub Copilot"
export ATOMIC_AI_MODEL="gpt-4"

# Now all records automatically include AI attribution
atomic record -m "Add feature"
# This change will be marked as AI-assisted
```

Common environment variables:
- `ATOMIC_AI_ENABLED`: Enable AI attribution tracking
- `ATOMIC_AI_PROVIDER`: Name of AI service
- `ATOMIC_AI_MODEL`: Model identifier
- `ATOMIC_AI_CONFIDENCE`: Confidence score (0.0-1.0)

## Identity & Attribution Workflows

### Initial Setup

Configure your identity when first using Atomic:

```bash
# Create default identity
atomic identity new default \
  --username alice \
  --display-name "Alice Smith" \
  --email alice@example.com

# This identity will be used for all changes
atomic record -m "First change"
```

### Work vs. Personal

Separate work and personal contributions:

```bash
# Work identity
atomic identity new work \
  --username alice.smith \
  --email alice.smith@company.com

# Personal identity  
atomic identity new personal \
  --username alice \
  --email alice@personal.com

# Use work identity for work projects
cd ~/work/company-project
atomic identity use work
atomic record -m "Implement work feature"

# Use personal identity for personal projects
cd ~/personal/hobby-project
atomic identity use personal
atomic record -m "Add personal project feature"
```

### AI-Assisted Development

Track AI contributions transparently:

```bash
# Start AI-assisted session
export ATOMIC_AI_ENABLED=true
export ATOMIC_AI_PROVIDER="Claude"
export ATOMIC_AI_MODEL="claude-3-opus"

# Record AI-generated code
atomic record -m "Implement parser with AI assistance"

# View AI contribution stats
atomic attribution

# Output:
# Total Changes: 50
# AI-Assisted: 12 (24%)
# Providers:
#   - Claude: 8 changes
#   - GitHub Copilot: 4 changes
```

### Verifying Contributions

Verify authorship and integrity:

```bash
# See who contributed to a file
atomic credit src/main.rs

# Verify a change's signature
atomic change <change-hash> --verify

# Show all changes by an author
atomic log --author alice
```

## Best Practices

### 1. Use Strong Passwords for Identities

Protect your private keys with passwords:

```bash
# Create password-protected identity
atomic identity new secure
# Enter strong password when prompted

# Password required for signing
atomic record -m "Change requires password"
```

### 2. Separate Identities by Context

Use different identities for different purposes:

```bash
# Work identity with company email
atomic identity new work --email alice@company.com

# Personal identity with personal email
atomic identity new personal --email alice@personal.com

# Open source identity
atomic identity new oss --email alice@users.noreply.github.com
```

### 3. Be Transparent About AI Usage

Always mark AI-assisted changes:

```bash
# Good: Transparent about AI usage
atomic record --ai-assisted -m "Implement algorithm (Claude-assisted)"

# Avoid: Not disclosing AI assistance
atomic record -m "Implement algorithm"
```

### 4. Verify Identities with Remotes

Prove your identity to remote repositories:

```bash
# After creating identity, prove it
atomic identity prove default

# This establishes trust with remote servers
```

### 5. Regular Identity Backups

Backup your identity credentials:

```bash
# Identity files are in ~/.config/atomic/identities/
cp -r ~/.config/atomic/identities/ ~/backups/atomic-identities-$(date +%Y%m%d)

# Or use encrypted backup
tar czf - ~/.config/atomic/identities/ | gpg -e -r alice@example.com > atomic-identities.tar.gz.gpg
```

### 6. Review Attribution Regularly

Check contribution statistics periodically:

```bash
# View overall attribution
atomic attribution

# See per-file attribution
atomic credit src/*.rs

# Review AI contribution trends
atomic log --with-attribution
```

## Security Considerations

### Private Key Protection

Your private key should never be shared:

- Stored in `~/.config/atomic/identities/<name>/key`
- Optionally encrypted with password
- Required for signing changes
- Cannot be recovered if lost

### Public Key Distribution

Your public key is safe to share:

- Embedded in every change you create
- Used by others to verify your signatures
- Proves authenticity without revealing private key

### Identity Verification

Verify identities before trusting changes:

```bash
# Verify change signature
atomic change <hash> --verify

# Check who signed a change
atomic change <hash> --show-author

# Verify identity proof with remote
atomic identity prove --verify <identity-name>
```

## Troubleshooting

### Identity Not Found

**Problem**: Atomic can't find your identity

```bash
# List available identities
atomic identity list

# Create if missing
atomic identity new default

# Set as default
atomic identity use default
```

### Private Key Password Issues

**Problem**: Forgot password for encrypted key

```bash
# Unfortunately, encrypted keys can't be recovered
# You'll need to create a new identity
atomic identity new new-identity

# Remove old identity
atomic identity remove old-identity
```

### AI Attribution Not Detected

**Problem**: AI environment variables not working

```bash
# Verify environment variables are set
echo $ATOMIC_AI_ENABLED
echo $ATOMIC_AI_PROVIDER

# Set them properly
export ATOMIC_AI_ENABLED=true
export ATOMIC_AI_PROVIDER="Claude"

# Or use flags explicitly
atomic record --ai-assisted --ai-provider "Claude" -m "Message"
```

### Wrong Identity Used

**Problem**: Recorded change with wrong identity

```bash
# Unrecord the change
atomic unrecord

# Switch to correct identity
atomic identity use correct-identity

# Record again
atomic record -m "Same change with correct identity"
```

## Command Reference

For detailed information about identity and attribution commands:

- [**`atomic identity`**](./identity.md) - Complete identity management reference
- [**`atomic credit`**](./credit.md) - Line-by-line attribution
- [**`atomic attribution`**](./attribution.md) - AI contribution statistics

## See Also

- [Recording Changes](./record.md) - Recording changes with identity signatures
- [Working with Changes](./working-with-changes.md) - Understanding signed changes
- [Remote Operations](./remote-operations.md) - Authentication with identities

---

**Next Steps:**
- Learn the [identity command](./identity.md) for detailed identity management
- Use `--ai-assisted` flags when recording AI-generated code for transparency
- Protect your private keys with strong passwords