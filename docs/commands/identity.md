---
sidebar_position: 13
title: identity
---

# atomic identity

Manage identities for signing changes.

## Synopsis

```bash
atomic identity <COMMAND> [OPTIONS]

atomic identity new <NAME> [OPTIONS]
atomic identity list [OPTIONS]
atomic identity show <NAME> [OPTIONS]
atomic identity default [NAME] [OPTIONS]
atomic identity delete <NAME> [OPTIONS]
atomic identity whoami [OPTIONS]
atomic identity register <SERVER_URL> [OPTIONS]
atomic identity sign [OPTIONS]
atomic identity verify --signature <SIGNATURE> --public-key <PUBLIC_KEY>
```

## Description

The `identity` command manages the Ed25519 identities used to sign changes in
Atomic. Each identity has a name, an optional email, a type, and a usage
context, along with a public/private key pair.

Identities can be created, listed, inspected, set as default, deleted, and
registered with a remote atomic-storage server. The `sign` and `verify`
subcommands provide low-level access to the underlying Ed25519 signing
primitives.

Every subcommand accepts the global flags `-v, --verbose` (emit extra
diagnostic output) and `--no-color` (disable ANSI color in output).

## Subcommands

### `identity new` — Create a new identity

```bash
atomic identity new <NAME> [OPTIONS]
```

#### Arguments

- **`<NAME>`** — Name for the new identity.

#### Options

- **`-e, --email <EMAIL>`** — Email address for the identity.
- **`-t, --type <IDENTITY_TYPE>`** — Identity type. [default: `user`]
- **`-u, --usage <USAGE>`** — Usage context for this identity. [default: `personal`]
- **`-d, --description <DESCRIPTION>`** — Description of the identity.
- **`--set-default`** — Set this identity as the default.
- **`--set-default-for-usage`** — Set this identity as the default for its usage context.

#### Examples

```bash
# Create a basic identity
atomic identity new alice

# Create an identity with an email and set it as the default
atomic identity new alice --email alice@example.com --set-default

# Create an identity with a description and usage context
atomic identity new work \
  --email alice@company.com \
  --usage work \
  --description "Work identity" \
  --set-default-for-usage
```

### `identity list` — List all identities

```bash
atomic identity list [OPTIONS]
```

#### Options

- **`-u, --usage <USAGE>`** — Filter by usage context.
- **`-t, --type <IDENTITY_TYPE>`** — Filter by identity type.
- **`-v, --verbose`** — Show additional details.
- **`-f, --format <FORMAT>`** — Output format. [default: `table`]

#### Examples

```bash
# List all identities
atomic identity list

# List identities filtered by usage context
atomic identity list --usage work

# List with extra detail
atomic identity list --verbose
```

### `identity show` — Show identity details

```bash
atomic identity show <NAME> [OPTIONS]
```

#### Arguments

- **`<NAME>`** — Name of the identity to show.

#### Options

- **`-f, --format <FORMAT>`** — Output format. [default: `default`]
- **`--show-public-key`** — Show the full public key.

#### Examples

```bash
# Show details for an identity
atomic identity show alice

# Include the full public key
atomic identity show alice --show-public-key
```

### `identity default` — Set the default identity

```bash
atomic identity default [NAME] [OPTIONS]
```

#### Arguments

- **`[NAME]`** — Name of the identity to set as default.

#### Options

- **`-u, --usage <USAGE>`** — Usage context to set the default for.
- **`--clear`** — Clear the default identity instead of setting one.

#### Examples

```bash
# Set the default identity
atomic identity default alice

# Set the default for a specific usage context
atomic identity default work --usage work

# Clear the default identity
atomic identity default --clear
```

### `identity delete` — Delete an identity

```bash
atomic identity delete <NAME> [OPTIONS]
```

#### Arguments

- **`<NAME>`** — Name of the identity to delete.

#### Options

- **`-f, --force`** — Delete without confirmation.

#### Examples

```bash
# Delete an identity (with confirmation)
atomic identity delete old-identity

# Delete without confirmation
atomic identity delete old-identity --force
```

### `identity whoami` — Show the current default identity

```bash
atomic identity whoami [OPTIONS]
```

#### Options

- **`-u, --usage <USAGE>`** — Show identity for a specific usage context.
- **`-f, --format <FORMAT>`** — Output format. [default: `default`]

#### Examples

```bash
# Show the current default identity
atomic identity whoami

# Show the default identity for a usage context
atomic identity whoami --usage work
```

### `identity register` — Register with a remote server

Register an identity with a remote atomic-storage server.

```bash
atomic identity register <SERVER_URL> [OPTIONS]
```

#### Arguments

- **`<SERVER_URL>`** — URL of the atomic-storage server.

#### Options

- **`-i, --identity <IDENTITY>`** — Name of the identity to register.
- **`--server-name <SERVER_NAME>`** — Custom name for the auto-created server profile.

#### Examples

```bash
# Register the default identity with a server
atomic identity register https://atomic.storage

# Register a specific identity
atomic identity register https://atomic.storage --identity alice

# Register and name the auto-created server profile
atomic identity register https://atomic.storage \
  --identity alice \
  --server-name production
```

### `identity sign` — Sign bytes from stdin

Sign bytes from stdin and output a JSON signature object.

```bash
atomic identity sign [OPTIONS]
```

#### Options

- **`-i, --identity <IDENTITY>`** — Identity to sign with. Defaults to the current default identity.

#### Examples

```bash
# Sign data with the default identity
echo -n "hello" | atomic identity sign

# Sign data with a specific identity
echo -n "hello" | atomic identity sign --identity alice
```

### `identity verify` — Verify a signature

Verify an Ed25519 signature against bytes from stdin.

```bash
atomic identity verify --signature <SIGNATURE> --public-key <PUBLIC_KEY>
```

#### Options

- **`--signature <SIGNATURE>`** — Base64-encoded signature to verify.
- **`--public-key <PUBLIC_KEY>`** — Base32-encoded public key to verify against.

#### Examples

```bash
# Verify a signature against bytes from stdin
echo -n "hello" | atomic identity verify \
  --signature "BASE64_SIGNATURE" \
  --public-key "BASE32_PUBLIC_KEY"
```

## Examples

### Set up your first identity

```bash
# Create an identity and make it the default
atomic identity new alice --email alice@example.com --set-default

# Confirm it is the current default
atomic identity whoami

# List all identities
atomic identity list
```

### Register an identity with a server

```bash
atomic identity new alice --email alice@example.com --set-default
atomic identity register https://atomic.storage
```

### Sign and verify data

```bash
# Produce a JSON signature object
echo -n "hello" | atomic identity sign --identity alice

# Verify a signature against a known public key
echo -n "hello" | atomic identity verify \
  --signature "BASE64_SIGNATURE" \
  --public-key "BASE32_PUBLIC_KEY"
```

## See Also

- [`atomic server`](./server.md) — Manage remote server configuration
