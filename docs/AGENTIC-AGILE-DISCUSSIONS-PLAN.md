# Agentic Agile Discussions Delivery Plan

| ID | Workstream | Objective | Key Tasks | Owner | Status | Exit Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | Control-plane schema | Persist discussions without touching pristine DB | ERD + migration script for `conversation_stacks/records/tags/threads/messages`; tenancy FKs; append-only constraints | Platform DB | ☐ | Migration merged, ERD reviewed, seed script in `docs/migrations/` |
| W2 | API & WebSocket contract | Expose conversations to UI/agents | REST spec (CRUD/history/diff); WebSocket event schema + replay cursor doc; SDK typings (TS + Rust) | API guild | ☐ | Contract doc approved by `atomic-ui` + agent teams |
| W3 | Workflow bridge | Sync workflow DSL with discussions | Subscribe to discussion events; emit workflow transitions as tags/actions; add human approval guardrails | Workflows squad | ☐ | Demo: workflow approval updates discussion tag in real-time |
| W4 | Agent client (`atomic-opencode`) | Enable terminal agents to participate | Fork OpenCode; add Atomic adapters; bundle memory bank; implement `/summarize`, `/next-step`, `/link-change` | Agentic tooling | ☐ | Terminal session linking Atomic patch hash to conversation record |
| W5 | UI integration | Provide portfolio/project visibility | Discussions nav; record diff viewer; tag filter; workflow status chips; agent/human timeline | UI team | ☐ | Usability review sign-off; design partner feedback logged |
| W6 | Observability & scale | Keep event stream operable | Structured logs/metrics; alerting; NATS/JetStream prototype for back-pressure; load test | SRE | ☐ | Runbook published; load test meets latency/error SLOs |

### Sequencing & Dependencies
- W1 must land before W2 (schema informs contracts).
- W2 finalizes payloads consumed by W3/W4/W5.
- W6 depends on real traffic from earlier streams but instrumentation work can start once W2 is defined.

### Coordination Rhythm
- Weekly cross-team standup reviewing the table above.
- Tag each workstream update with `discussion-stack` label in issue tracker.
- Record demos for W3, W4, W5; archive links in `docs/demos/`.

### Change Control
- Any schema adjustments post-W1 require sign-off from DB + API owners.
- API breaking changes after W2 require version bump and deprecation notice.
- Agent client releases follow semantic versioning; publish changelog in `atomic-opencode`.

### Completion Definition
Project considered complete when all workstreams reach exit criteria, discussions are available to design partners, and monitoring dashboards show healthy operations under representative load.


