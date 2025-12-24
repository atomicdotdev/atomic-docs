---
sidebar_position: 1
title: Installation
---

# Installing Atomic

This guide will help you install Atomic VCS on your system. Atomic can be installed from source using Cargo, or through various package managers depending on your platform.

## Requirements

Before installing Atomic, ensure you have the following prerequisites:

### Required Dependencies

- **Rust toolchain** (1.70 or later) via [rustup](https://rustup.rs/)
- **Clang compiler**
- **libsodium** - Cryptographic library
- **libssl** - SSL/TLS support
- **xxhash** - Fast hashing library
- **zstd** - Compression library

## Installation Methods

### From Source (Recommended)

The primary way to install Atomic is through Cargo, Rust's package manager.

#### 1. Install Rust

If you don't have Rust installed, download and install rustup:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Choose the **stable** toolchain as your default:

```bash
rustup default stable
```

If you already have rustup installed, make sure to update it:

```bash
rustup update
```

#### 2. Install System Dependencies

Install the required libraries and header files for your operating system:

**On Debian/Ubuntu:**

```bash
sudo apt update
sudo apt install make libsodium-dev libclang-dev pkg-config \
                 libssl-dev libxxhash-dev libzstd-dev clang
```

**On macOS:**

```bash
brew install llvm libsodium openssl xxhash zstd
```

**On Arch Linux:**

```bash
sudo pacman -S clang libsodium gcc-libs rustup pkgconf \
               diffutils make xxhash zstd
```

**On openSUSE Tumbleweed:**

```bash
sudo zypper in clang-devel libopenssl-devel libsodium-devel \
               libzstd-devel pkgconfig xxhash-devel
```

**On Fedora:**

```bash
sudo dnf install clang-devel openssl-devel libsodium-devel \
                 libzstd-devel pkgconfig xxhash-devel
```

**On Void Linux:**

```bash
sudo xbps-install libgcc-devel libressl-devel libsodium-devel \
                  libzstd-devel xxHash-devel
```

#### 3. Build and Install Atomic

Clone the repository and build from source:

```bash
# Clone the repository
git clone https://github.com/atomic-vcs/atomic.git
cd atomic

# Build in release mode
cargo build --release

# Install to your system
cargo install --path atomic
```

Or install directly from crates.io (when published):

```bash
cargo install atomic
```

**Note**: The package is not yet published to crates.io. Install from source for now.

#### 4. Verify Installation

Check that Atomic is installed correctly:

```bash
atomic --version
```

You should see output similar to:

```
atomic 1.0.0
```

#### 5. Add to PATH (if needed)

If the `atomic` command is not found, you may need to add Cargo's bin directory to your PATH.

**On Linux/macOS**, add to your `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
export PATH="$PATH:$HOME/.cargo/bin"
```

**On Linux with systemd**, you can also add to `~/.config/environment.d/envvars.conf`:

```bash
PATH=$PATH:$HOME/.cargo/bin
```

Then reload your shell configuration:

```bash
source ~/.bashrc  # or source ~/.zshrc
```

## Distribution Packages

### Nix / NixOS

Nix is a package manager available on any Linux distribution and macOS:

```bash
# Install Nix (if not already installed)
curl -L https://nixos.org/nix/install | sh

# Install Atomic
nix-env --upgrade
nix-env -iA nixpkgs.atomic
```

### Arch Linux (AUR)

Atomic will be available in the Arch User Repository (coming soon):

```bash
# Using yay (when available)
yay -S atomic

# Using paru (when available)
paru -S atomic
```

For now, install from source.

### FreeBSD

```bash
# Binary package
pkg install atomic

# Or build from ports
cd /usr/ports/devel/atomic/ && make install clean
```

### Windows

Windows binaries are available from the [releases page](https://github.com/atomic-vcs/atomic/releases).

#### Using Chocolatey (coming soon):

```powershell
choco install atomic
```

#### Manual Installation:

1. Download the Windows binary from the releases page
2. Extract the archive
3. Add the directory containing `atomic.exe` to your PATH
4. Open a new command prompt or PowerShell window
5. Verify with `atomic --version`

## Docker

Run Atomic in a Docker container:

```bash
# Pull the official image
docker pull atomicvcs/atomic:latest

# Run Atomic
docker run --rm -it -v $(pwd):/workspace atomicvcs/atomic:latest atomic --version
```

Create an alias for convenience:

```bash
alias atomic='docker run --rm -it -v $(pwd):/workspace atomicvcs/atomic:latest atomic'
```

## Building from Git (Development)

To build the latest development version:

```bash
# Clone the repository
git clone https://github.com/atomic-vcs/atomic.git
cd atomic

# Build with all features
cargo build --release --all-features

# Run tests
cargo test

# Install locally
cargo install --path atomic
```

## Troubleshooting

### "Package not found" errors

Make sure you've installed all required system dependencies for your platform. The build process requires development headers for several libraries.

### Linker errors on macOS

If you encounter linker errors on macOS, ensure you have the Xcode Command Line Tools installed:

```bash
xcode-select --install
```

You may also need to set the following environment variables:

```bash
export LIBRARY_PATH="$LIBRARY_PATH:$(brew --prefix)/lib"
export CPATH="$CPATH:$(brew --prefix)/include"
```

### Permission denied errors

If you get permission errors during installation, ensure your user has write access to the Cargo installation directory, or use `sudo` (not recommended) or install to a user-writable location.

### Rust version too old

Atomic requires Rust 1.70 or later. Update your Rust installation:

```bash
rustup update stable
```

## Next Steps

Now that you have Atomic installed, you're ready to:

1. Create your first repository
2. Learn the basic workflow
3. Configure Atomic

## Uninstalling

To remove Atomic installed via Cargo:

```bash
cargo uninstall atomic
```

For distribution packages, use your package manager's remove command.

---

**Need help?** Join our [Discord community](https://discord.gg/atomic-vcs) or [open an issue](https://github.com/atomic-vcs/atomic/issues) on GitHub.