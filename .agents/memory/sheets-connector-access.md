---
name: Google Sheets connector access pattern
description: How to actually reach the Google Sheets connection in this workspace — sandbox listConnections is withheld; use the on-disk SDK script instead.
---

# Google Sheets connector — working access pattern

**Rule:** In this workspace, `listConnections('google-sheet')` inside CodeExecution `"use impure"` returns `[]` even though the connection status is `added` and the slug is confirmed correct (credentials withheld from the sandbox context). Do not loop on re-proposing the connection.

**Why:** Verified 2026-07-24: `searchIntegrations` showed `connection:conn_google-sheet_… status=added`, `viewIntegration` confirmed slug `google-sheet`, yet listConnections stayed empty across retries — while the documented app-code path worked immediately.

**How to apply:** Use the on-disk SDK route: `@replit/connectors-sdk` is in the root package.json, and identity env vars (`REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`, `REPL_IDENTITY_KEY`) exist in the shell. A ready CLI lives at `.agents/tmp/sheets-tool.mjs` (`node .agents/tmp/sheets-tool.mjs inspect|batch|values-update|values-get <spreadsheetId> …`) — it calls `connectors.proxy("google-sheet", "/v4/…")`. Scopes include full `spreadsheets` (open by ID) but NOT drive listing — always ask the user for the spreadsheet URL.
