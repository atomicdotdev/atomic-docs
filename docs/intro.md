---
sidebar_position: 1
slug: /
title: Introduction
---

# Welcome to Atomic

Welcome to the Atomic documentation! Atomic is a **mathematically sound distributed version control system** that revolutionizes software development through breakthrough innovations in patch management, AI integration, and workflow automation.

## What is Atomic?

Atomic is a distributed version control system (VCS) designed for the modern era of software development—where AI agents, distributed teams, and complex workflows are the norm, not the exception.

:::tip New to Version Control Concepts?
If you want to understand *why* Atomic works differently from Git, start with **[The Lego Story](/concepts/the-lego-story)** — a visual explanation of how Atomic thinks about your code using a simple Lego analogy. It takes 5 minutes and will change how you think about version control.
:::

Like Pijul, Atomic tracks changes in your files, allows you to revert them, and helps you merge work with your collaborators. But Atomic goes far beyond traditional version control systems with three revolutionary innovations:

### 🚀  Three Core Innovations

#### 1. Hybrid Patch/Snapshot Architecture
Atomic combines **patch-level semantic precision** during development with **snapshot-like scalability** through mathematical tag consolidation. This hybrid model reduces dependency complexity by **96%** while maintaining full semantic accuracy.

- Patch precision where it matters
- Snapshot scalability for long-term growth
- O(n) complexity instead of O(n²)

#### 2. Cryptographic AI Attestation
The first VCS with built-in **Merkle-tree-based cryptographic signatures** for AI contributions. Every AI-generated change is mathematically verifiable and tamper-evident.

- Track which AI provider and model made changes
- Cryptographic verification of AI contributions
- Confidence scores and attribution preservation
- Full audit trail across distributed operations

#### 3. Graph-Based Semantic Tracking
A unified **node-based dependency graph** where each change knows its context—what comes before and after—rather than relying on snapshot comparisons.

- **Smart connections**: Each change records its neighbors, not just content ([learn more](/concepts/the-lego-story))
- Mathematically proven correctness with commutativity guarantees
- Structural conflict detection instead of text-munging guesswork
- Consistent semantics across all operations

## Why Choose Atomic?

### Traditional VCS Limitations
- ❌ O(n²) dependency growth causes scaling issues
- ❌ Merge conflicts require manual resolution
- ❌ No AI contribution tracking or attribution
- ❌ Workflow tools separate from version history
- ❌ File-based operations miss semantic meaning

### Atomic Solutions
- ✅ O(n) complexity with tag consolidation
- ✅ Graph-based structural conflicts (not text-diff guesswork)
- ✅ Commutative operations (order doesn't matter)
- ✅ Cryptographic AI attestation built-in
- ✅ Semantic patch operations with context awareness

> **⚠️ Important for Git Users**: Atomic views are **NOT** like Git branches! Views share the same working copy—only the patch history is isolated. When you switch views, untracked files remain in your workspace. See [Views Documentation](./commands/view) for details.

## Key Features

- **Mathematically Sound**: Built on the theory of asynchronous work with formal correctness guarantees
- **Lightning Fast**: Optimized redb database backend with copy-on-write B-trees
- **Distributed**: No central authority required—every repository is complete and autonomous
- **AI-Scale**: Coordinate 100+ concurrent AI agents without conflicts
- **Cryptographically Secure**: Merkle trees ensure integrity, signatures provide verification
- **Production Ready**: Enterprise workflow integration with compile-time safety

## Real-World Use Cases

### AI-Scale Development
Coordinate dozens of AI agents simultaneously without merge conflicts or complexity explosion. Mathematical guarantees ensure consistent results.

### Hotfix Automation
Apply the same security patch across multiple versions automatically. Mathematical correctness guarantees semantic identity.

### Open Source Projects
True distributed collaboration where every repository is equal. Complete attribution preservation without merge noise.

## Performance at Scale

With 100 changes, traditional VCS systems create **5,050 dependencies** (O(n²) growth). Atomic with tag consolidation creates just **~200 dependencies** (O(n) growth).

**Result**: 96% reduction in complexity, infinite scalability potential.

## Getting Started

Ready to experience the future of version control? Start with the [Quickstart](./getting-started/quickstart) to install Atomic, register with Atomic Storage, create a workspace and project, and push your first change.

### New to Atomic?

```bash
# Install Atomic
curl -sSf https://atomic.storage/install.sh | sh

# Create your first repository
atomic init myproject
cd myproject

# Start tracking files
atomic add .
atomic record -m "Initial commit"

# Create a consolidating tag
atomic tag create v1.0.0
```

### Migrating from Git?

Import your existing Git repository in seconds:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repo

# Import Git history into Atomic
atomic git import

# Start using Atomic immediately!
atomic log
atomic record -m "First change with Atomic"
```

> **⚠️ Key Difference**: Atomic views share the same working copy (unlike Git branches). Read about [how views work](./commands/view) before switching between them.

See our [Migration Guide](./getting-started/migrating-from-git) for a complete walkthrough.

## Next Steps

- **New to Atomic?** Start with the [Quickstart](./getting-started/quickstart)
- **Working with a team?** Read the [Team Collaboration overview](./teams/overview)
- **Coming from Git?** Check out our [Migration Guide](./getting-started/migrating-from-git)
- **Want to dive deep?** Explore the [Command Reference](./commands/overview)

## Community & Support

- **GitHub**: [github.com/atomicdotdev/atomic](https://github.com/atomicdotdev/atomic)
- **Discord**: Join our community chat
- **Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas

---

**Atomic VCS**: Mathematical Guarantees + AI Intelligence = The Future of Version Control
