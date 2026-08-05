---
sidebar_position: 1
title: Installation
---

# Installing Atomic

This guide will help you install Atomic on your system. The recommended installation path is the hosted installer script from Atomic Storage. Development builds can still be installed from source.

## Installation Methods

### Hosted Installer (Recommended)

Install the latest Atomic CLI release with the installer hosted by Atomic Storage:

```bash
curl -sSf https://atomic.storage/install.sh | sh
```

Install a specific version:

```bash
curl -sSf https://atomic.storage/install.sh | ATOMIC_VERSION=0.5.1 sh
```

Install to a user-writable directory:

```bash
curl -sSf https://atomic.storage/install.sh | ATOMIC_INSTALL="$HOME/.local/bin" sh
```

The installer detects your platform, downloads the matching GitHub release
archive, verifies checksums when available, and installs the `atomic` binary.

### Verify Installation

```bash
atomic --version
```

### Enable Shell Completions (optional)

Turn on tab-completion for subcommands, flags, and live values like view names
and change hashes. For zsh, add this to your `~/.zshrc`:

```bash
source <(COMPLETE=zsh atomic)
```

See [Shell Completions](../commands/completions) for other shells, the static
`atomic completions <shell>` script, and troubleshooting.

### Source Install (Development)

Use a source install when you need to test unreleased changes.

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

Clone the repository and install the CLI crate:

```bash
git clone https://github.com/atomicdotdev/atomic.git
cd atomic
cargo install --path atomic-cli
```

#### 4. Add to PATH (if needed)

If the `atomic` command is not found, you may need to add Cargo's bin directory or your chosen installer directory to your PATH.

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

**COMING SOON**

## Building from Git (Development)

To build the latest development version:

```bash
git clone https://github.com/atomicdotdev/atomic.git
cd atomic
cargo build --release --all-features
cargo test
cargo install --path atomic-cli
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

1. Follow the [Quickstart](./quickstart) to register with Atomic Storage and push a hosted project
2. Create [your first local repository](./first-repository)
3. Learn the [team collaboration model](../teams/overview)
4. Explore the [command reference](../commands/overview)

## Uninstalling

To remove Atomic installed by the hosted installer:

```bash
rm /usr/local/bin/atomic
```

If you installed to a custom `ATOMIC_INSTALL` directory, remove the binary from
that directory instead.

To remove Atomic installed via Cargo:

```bash
cargo uninstall atomic-cli
```

---

**Need help?** [open an issue](https://github.com/atomicdotdev/atomic/issues) on GitHub.
