---
title: Database Owner and Upgrades
---

# Database Owner and Upgrades

Atomic starts a small background process, called the **database owner**, to save
agent activity for a local repository. It starts automatically when needed and
lets multiple agent hooks share one connection to the change database.

**Closing OpenCode or another agent application does not stop this process.**
When you upgrade Atomic, stop the owner too so the new CLI can start an updated
one. The steps below apply to each repository where you have been using agents.

## Upgrade Atomic

1. Finish any active agent work, then close the agent application.
2. Open a terminal in your project and stop its database owner:

   ```bash
   cd /path/to/your-project
   atomic agent database-owner shutdown --repository "$PWD"
   ```

   Wait for the owner to exit before continuing. You can check it with:

   ```bash
   atomic agent database-owner ping --repository "$PWD"
   ```

   Once it has stopped, `ping` can no longer connect. If you get a protocol error
   instead, follow the recovery steps below. Repeat for other active repositories.
3. [Upgrade Atomic](/getting-started/installation) using your usual installation
   method, then check the version:

   ```bash
   atomic --version
   ```

4. Reopen your agent application. The next recording request starts a new owner
   automatically.

Stopping the owner does **not** delete recorded changes or saved agent activity.
Do not assume your installer stops it automatically.

## Recover After an Upgrade

If you see `database owner does not support frozen journal pagination`, your CLI
may be connecting to an older owner that is still running.

Close the agent application and run these commands from the affected project
using the updated CLI:

```bash
atomic agent database-owner shutdown --repository "$PWD"
```

Wait for the old owner to exit, then start a new one:

```bash
atomic agent database-owner start --repository "$PWD"
```

Reopen the same agent session and retry the failed turn-end recording (the
**Stop hook**) using your integration's retry option. Restarting the owner alone
does not complete a failed recording.

If shutdown fails because the versions cannot communicate, use the previous CLI
version to stop the old owner first. If you have multiple Atomic installations,
check that your terminal and agent application use the same version. Keep your
`.atomic/` directory; deleting it is not a recovery step.

To check what was saved, replace `<session-id>` with the affected session's ID:

```bash
atomic session show <session-id> --json
atomic log
```

A failed Stop can leave file changes recorded while their provenance is still
incomplete. Check the session output and the original error before assuming
anything was lost or that recovery is complete.

## Large Recording Errors

`database-owner frame exceeds size limit` means a recording message is too large
for the connection. Restarting the owner does not fix the size limit by itself.

Check for an Atomic release that supports larger recordings. If the error
continues, include your Atomic version, agent integration, session ID, and error
message in a bug report. Keep the existing session for recovery.

## Owner Commands

Run these commands from the repository you want to manage:

| Command | Purpose |
| --- | --- |
| `atomic agent database-owner ping` | Check whether an owner responds. Does not start one. |
| `atomic agent database-owner start` | Start an owner, or reuse one already running. |
| `atomic agent database-owner shutdown` | Ask the owner to stop. Wait for it to exit before upgrading. |

Use `--repository /path/to/project` to manage another repository, or `--json` for
machine-readable output. `start` does not restart an existing owner. A successful
`ping` confirms that the owner responds, not that it runs the latest CLI version.

## How It Works

The owner runs on your computer and stores agent events in
`.atomic/changes.redb`. At turn end, Atomic uses those events to build the
provenance record: the history of what the agent did and which changes it made.

Hooks communicate with the owner through a local connection. It is separate
from the Atomic Storage server, and it does not handle every Atomic command or
remove every possible database lock.

See [Provenance Graphs](/agents/provenance) for more about recorded activity, or
[Installing Agent Integrations](/agents/installing-agent-integrations) to update
your agent's plugin.
