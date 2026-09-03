---
title: Guides
description: Task-oriented guides for using Atomic with AI coding agents, provenance, attestations, intents, and views.
keywords:
  - Atomic guides
  - AI coding agents
  - agentic development
  - AI code review
  - version control
sidebar_position: 1
slug: /guides
---

# Guides

These guides explain how to plan, isolate, inspect, and promote AI-generated code with Atomic. Choose the question closest to your task, then follow the linked conceptual or command reference when you need implementation detail.

## Which guide should you read?

| Question | Guide |
|---|---|
| How do I prevent repeated corrections and context loss? | [How to Reduce Rework from AI Coding Agents](/guides/reduce-ai-agent-rework) |
| What does version control need to support AI agents? | [Version Control for AI Agents: A Technical Guide](/guides/version-control-for-ai-agents) |
| How can I track what my AI agents are actually doing? | [How to Trace What Your AI Coding Agent Changed and Why](/guides/track-ai-agent-changes-and-reasoning) |
| How do I review a large agent-generated change set efficiently? | [How to Review a Large AI-Generated Pull Request](/guides/review-large-ai-generated-pull-request) |
| How do I preserve evidence for AI-generated code? | [How to Build an Audit Trail for AI-Generated Code](/guides/audit-trail-for-ai-generated-code) |
| How do I investigate a regression introduced during an agent session? | [How to Find the Root Cause of a Bug an AI Agent Introduced](/guides/root-cause-ai-agent-bug) |
| How do I coordinate concurrent agents while reducing merge conflicts? | [How to Run Multiple AI Coding Agents Without Merge Conflicts](/guides/multiple-ai-agents-without-merge-conflicts) |

## What do the guides cover?

- Define verifiable work before an agent edits code.
- Retrieve relevant code, entity, and dependency context.
- Review line, token, path, and change-level evidence.
- Trace observed agent activity and inferred causal links.
- Inspect captured agent attribution and available model-usage attestations.
- Promote only the reviewed changes into a target view.

## Where are the underlying concepts explained?

### AI agent recording and evidence

- [How Atomic Records What Your AI Coding Agent Did](/agents/overview) explains the hook lifecycle, isolated agent views, and automatic turn recording.
- [How to See Why an AI Agent Changed Your Code](/agents/provenance) explains observed activity, typed nodes, and inferred causal edges.
- [AI Agent Session Audit Trails: Cost, Tokens, and Model Attribution](/agents/attestations) explains session coverage, model identity, token usage, and cost fields.

### Change graphs and scale

- [Is Git Good Enough for AI Coding Agents?](/getting-started/comparison-with-git) compares Git and Atomic as operational choices.
- [Why Changes Compose: The Atomic Data Model](/concepts/the-lego-story) explains graph operations, semantic operations, dependencies, and views.
- [Atomic Performance: Benchmarks at Agent Scale](/concepts/performance-at-scale) separates published measurements from architecture and benchmark gaps.

### Adoption and daily workflow

- [AI Agent Workflows](/getting-started/ai-agent-workflows) covers integration setup and the session lifecycle.
- [Migrating from Git](/getting-started/migrating-from-git) maps Git concepts and workflows to Atomic.
