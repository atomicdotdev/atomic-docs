# Agentic Agile Discussions

## Overview

We are introducing a portfolio-level **discussion** model that treats planning as an ongoing conversation between humans and agents rather than a queue of tickets. Each discussion aggregates intent, Atomic vocabulary, and live context so that `atomic-ui`, `atomic-api`, `atomic-workflows`, and external agents can coordinate through a real-time channel. The goal is to support “agentic agile++” workflows without polluting the pristine VCS database while still honoring the Atomic principles of change-based development and immutable records.

## Terminology Alignment

- **Discussion** – Portfolio-scoped initiative that owns the high-level goal, owner, status, and links to underlying projects.
- **Conversation record** – Project-scoped snapshot that captures the current spec, intent, acceptance criteria, and decision log for that discussion within a project. Records are append-only; revisions produce new records and reference the previous record they supersede.
- **Conversation tag** – Label applied to a record when it represents a notable state (for example `in_discovery`, `ready_for_agents`, `landed`). Tags make it easy to navigate discussions and align with Atomic’s existing tag semantics.
- **Linked patch** – Change hashes produced by Atomic operations and associated with a conversation record once the code lands. The pristine database remains the source of truth for patches; the planning layer only stores references.
- **Threads** – Real-time conversational streams (human and agent messages, slash commands, bot summaries) scoped to a project inside the discussion. Threads provide the conversational context that leads to new records and tags.

## Architecture Summary

1. **Persistence** – All conversation data lives in the `atomic-ui` control-plane database under a dedicated schema (for example `agentic_agile`). Tables include `conversation_stacks`, `conversation_records`, `conversation_tags`, `conversation_threads`, and `conversation_messages`, each keyed by tenant, portfolio, and project. The pristine redb store remains untouched.
2. **Transport** – `atomic-api` exposes both REST and WebSocket interfaces for discussions. WebSockets broadcast record/tag updates and thread messages using channel names derived from tenant/portfolio/project identifiers. REST endpoints support querying history, diffing records, and tagging.
3. **Workflow integration** – `atomic-workflows` subscribes to the same WebSocket channels to apply its type-safe DSL transitions. Workflow outcomes are published back as conversation actions and tagged records. Human approval gates stay in place through the DSL.
4. **Agent tooling** – A forked `atomic-opencode` (OpenCode-based) terminal agent connects via the APIs above. It reads discussion context, proposes new records, posts summaries, and links Atomic patch hashes once code lands. Agents operate with the same vocabulary and protocols as humans.
5. **Future back-pressure** – NATS (or JetStream) can sit behind the WebSocket layer for durable streams and back-pressure control. WebSocket clients act as NATS consumers, ensuring events remain reliable even as agent traffic grows.

## Roadmap & Milestones

1. **Schema foundation**
   - Design `agentic_agile` tables in the `atomic-ui` database with strict tenant/portfolio/project foreign keys.
   - Ensure records are append-only and tags support efficient lookups.
2. **API & WebSocket contract**
   - Extend `atomic-api` with REST endpoints for discussions, records, tags, and thread messages.
   - Publish event schemas and channel conventions; add replay cursors for late subscribers.
3. **Workflow bridge**
   - Implement a subscriber in `atomic-workflows` that translates WebSocket events into DSL transitions and emits results back as conversation tags/actions.
   - Enforce human-in-the-loop checkpoints through workflow configuration.
4. **Agent client**
   - Fork OpenCode into `atomic-opencode`, add REST/WebSocket adapters, and package default memory bank files (AGENTS, tenant context, vocabulary).
   - Support `/commands` inside threads for summarization, next-steps, and patch linking.
5. **UI integration**
   - Surface discussions in `atomic-ui` with portfolio-level dashboards, project threads, record diff viewers, and tag filters.
   - Highlight linked Atomic patches and workflow status for each record.
6. **Observability & scale**
   - Add audit logging, metrics on discussion activities, and optional NATS integration for durable back-pressure handling.
   - Validate agent/human collaboration flows with design partners and adjust terminology before public launch.

## References

- [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)


