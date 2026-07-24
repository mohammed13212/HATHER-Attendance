# Memory Index

- [Apps Script live protocol](gas-live-protocol.md) — deployed GAS ≠ committed Code.gs; live API is GET+JSONP, `uid`+HMAC token/slot params, statuses ok/exists/expired/error. Trust live probes/user-pasted source, never the repo copy.
- [Sheets connector access](sheets-connector-access.md) — sandbox listConnections('google-sheet') is withheld here; use the on-disk SDK CLI (.agents/tmp/sheets-tool.mjs) and ask the user for spreadsheet URLs (no drive listing scope).
