---
sidebar_position: 3
title: Hook Health and Troubleshooting
description: Check whether Atomic agent hooks are working, inspect session-level failures, and understand concurrent parent/child diagnostics and outage recovery.
---

# Hook Health and Troubleshooting

Agent hooks can be installed and still fail when they run. Use the observed
dispatch outcomes to find parsing, recording, and transport failures that a
hook's shell guard may otherwise hide.

:::note Availability
This page describes the session-scoped diagnostics introduced by
[Atomic PR #220](https://github.com/atomicdotdev/atomic/pull/220). Use a CLI build
containing that change.
:::

```bash
# Installation, sessions, hook liveness, and outstanding failures
atomic agent status

# Machine-readable outcomes and failure details
atomic agent status --json
```

## Understand the Report

The human report shows the most recent successful dispatch and its age relative
to the current time. A hook that fired but has never succeeded is distinguishable
from one that worked and then failed. Outstanding failures are attributed to
their sessions and parent sessions.

Outcomes are tracked per **agent, session, and verb**. A child's success cannot
clear a parent's failure. A later successful dispatch of the same verb in the
same session clears that session's current failure, while the operational log
retains the earlier observations.

A successful dispatch may produce no new change when the working copy is
unchanged. Inspect [recorded changes](/commands/log) to review the work itself.

## Inspect JSON Outcomes

| Field | What it tells you |
|-------|-------------------|
| `hook_health` | Per-agent `last_fired`, `last_ok`, `last_error`, `verbs_recorded`, and `failing_verbs` |
| `hook_sessions` | Per-session rows with `agent`, `session_id`, `parent_session_id`, and `health.verbs` |
| `hook_health_error` | Why the database-backed operational log could not be loaded |
| `hook_errors` | Grouped errors and recent entries from the bounded tail of the legacy plugin/git-shadow error log |
| `silent_agents` | Installed agents with no successful dispatch in the available operational log |

Each entry in `health.verbs` includes `last_fired`, `outcome` (`ok` or `error`),
an optional failure `detail`, and an optional `last_ok`. Details are flattened
and truncated for the report. An unassigned diagnostic has `session_id: null`.

With `jq` installed, inspect one session:

```bash
atomic agent status --json \
  | jq '.hook_sessions[]? | select(.session_id == "ses_child")'
```

When there are no observations, the hook-health fields are omitted. A freshly
installed hook may simply not have fired yet. If the service is unavailable and
only pending observations can be read, `hook_health_error` explains the partial
report and `silent_agents` is omitted.

## Diagnose a Failure

1. Check the installation flags in `atomic agent status`.
2. Inspect the affected session in `hook_sessions` and find the failing verb's
   `detail`. A malformed payload or service transport error can fail before
   recording starts.
3. Correct the reported cause. If the integration is missing or its hook
   configuration is stale, [refresh the integration](/agents/installing-agent-integrations).
4. Trigger the same hook again and check that its session-level outcome becomes
   `ok` and `last_ok` advances.

Atomic also groups existing plugin and git-shadow errors from
`.atomic/hook-errors.log`, collapsing repeated failures with differing session
IDs or turn numbers into useful classes.

## Concurrent Sessions and Correlation

Native payloads identify the session. Integration bridges can preserve a
`parent_session_id` in `raw_json`, or set `ATOMIC_SESSION_ID` and
`ATOMIC_PARENT_SESSION_ID` for the hook process. Typed `agent receive` also
accepts a top-level `parent_session_id` and forwards the caller-resolved parent
on the service request. These fields keep parent/child attribution intact
across process boundaries.

Malformed input without a usable session ID remains an unassigned diagnostic,
so the failure is visible without being attributed to another session.

## Logging and Service Outages

Native hooks, typed receive, and the shared dispatch handler emit structured
Rust `tracing` observations. The existing service layer appends them
transactionally to `.atomic/atomic.redb`, with event-ID deduplication and
session-indexed reads. Local mode runs the service handlers in-process; reactor
mode calls the daemon. Concurrent hook processes retain independent events.

Status derives health from these local operational logs. They are independent
of the running-turn provenance journal, allowing parsing failures and failures
after a turn closes to remain recordable.

During a service outage, each observation is spooled to its own immutable file
under `.atomic/hook-log-pending/`. Status can inspect pending observations while
the service is unavailable. A successful append replays them into the database
and removes their spool files after commit. Replayed events retain their IDs
and original observation times, so retries do not duplicate events or make an
older failure appear newer than a later recovery.

## See Also

- [`atomic agent`](/commands/agent) — Command reference and JSON status options
- [Installing Agent Integrations](/agents/installing-agent-integrations) — Setup and refresh
- [AI Agent Workflows](/getting-started/ai-agent-workflows) — Recording workflow and troubleshooting
