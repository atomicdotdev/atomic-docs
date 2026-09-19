---
title: Database Owner and Upgrades
---

# Database Owner and Upgrades

Atomic's agent recording path uses a **background database owner for each local
repository**. Short-lived hook processes send provenance journal operations to
that owner over local RPC. The owner holds the writable connection to
`.atomic/changes.redb`, so concurrent hooks do not each try to open that database
for writing.

```text
OpenCode / other agent integrations
              |
       Atomic hook processes
              |
           local RPC
              |
   repository database owner
              |
      .atomic/changes.redb
```

This is a local process, not the Atomic Storage server. It is started on demand
from the CLI executable handling the request. Other hooks reconnect to the same
repository's owner. Local RPC uses a Unix-domain socket on Unix and a named pipe
on Windows.

The owner is separate from OpenCode or your other agent application. **Closing
the application does not shut down its repository's owner.** Replacing the CLI
binary on disk also does not replace the code in an already running owner.

The owner does not route every Atomic command or eliminate every database lock.
Repository graph/index operations have their own database access and contention
handling. Its purpose here is to coordinate the change/provenance store and its
durable journal.

## Inspect or stop an owner

Run these commands from the repository you want to inspect:

```bash
# Check an existing owner without starting one.
atomic agent database-owner ping --repository "$PWD" --json

# Start one if absent, or reconnect to the existing process.
atomic agent database-owner start --repository "$PWD" --json

# Request shutdown of this repository's owner.
atomic agent database-owner shutdown --repository "$PWD" --json
```

`ping` reports a process ID and RPC protocol version. The protocol version is not
the CLI release version, so a successful ping alone does not prove that the owner
is running the newly installed release. `start` reuses a healthy existing owner;
it is not a restart command.

`shutdown` acknowledges that the owner is shutting down; it is not a wait for
process exit. After stopping agent activity, wait for that owner's process to
exit before replacing the binary or restarting work. A subsequent `ping` should
no longer reach it. A failed ping can also indicate a connection or protocol
problem, so inspect the error rather than assuming every failure means no owner
exists.

Shutdown does not delete the database, changes, or committed journal events.
It also does not finish an incomplete checkpoint on its own.

## Upgrade without mixing client and owner versions

Use this sequence for each local repository with an active owner:

1. Pause agent work and let in-flight hooks finish. Keep the agent application
   closed during the upgrade so it cannot start another owner.
2. Use the currently installed CLI to ping and shut down the owner with the
   commands above. Wait for it to exit. Repeat for other active repositories;
   shutting down one owner does not stop all repository owners.
3. Upgrade the CLI using your [installation method](/getting-started/installation).
   Check `atomic --version` in the environment that launches your agent. If you
   have multiple installations, make sure the agent resolves the intended binary.
4. With the updated CLI, start the owner explicitly using the command above, or
   let the next agent hook start it on demand. Restart the agent application.

Do not assume an installer or updater performs this shutdown automatically.
Until the update path you use explicitly handles owner lifecycle, perform it
manually. Updating an agent integration package and restarting its application
are separate from restarting the Atomic database owner.

For installer/updater implementations, the same order matters: stop new hook
traffic, request shutdown of affected owners, wait for exit, replace the binary,
then allow new owners to start. A shutdown error must not be treated as proof
that the old process has exited.

## Recover after an upgrade

An error such as `database owner does not support frozen journal pagination`
means the client needs an owner capability that the connected process does not
provide. An older owner still running after an upgrade is one possible cause.

Pause agent activity, shut down the affected owner, and restart it using the
intended CLI. If client and owner cannot communicate well enough to shut down,
use the matching older CLI to request shutdown before starting the new one.
Do not delete `.atomic/` or its database to resolve a version mismatch.

Retry the failed Stop/checkpoint through the integration's retry path for the
**same session**, then inspect its ledger:

```bash
atomic session show <session-id> --json
atomic status
atomic change <change-hash> --format json
```

A Stop may have recorded file changes before checkpoint publication failed.
Events already acknowledged by the owner are durable, but an append rejected
before acknowledgement may never have reached the journal. Check the session
ledger and hook error output; neither an error nor a successful owner restart
alone establishes what was recorded. Recovery depends on the persisted state
and the installed version's recovery support.

## Large turns and frame limits

RPC limits apply to requests and responses. Reading a frozen journal in pages
keeps each response bounded. A large batch of events sent **to** the owner also
needs bounded requests; read pagination alone does not solve that case. A single
very large event can exceed a frame even when its batch is split.

If you see `database-owner frame exceeds size limit`, retain the session and
error details and check the applicable release's large-event support. Restarting
an owner fixes a version mismatch, but does not make an oversized payload fit
the same implementation's frame limit.

See [Provenance Graphs](/agents/provenance) for journal/checkpoint behavior and
[Installing Agent Integrations](/agents/installing-agent-integrations) for plugin
installation and refresh steps.
