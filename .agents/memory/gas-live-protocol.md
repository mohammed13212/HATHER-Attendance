---
name: Apps Script live protocol
description: Exact wire protocol of the deployed HATHER Google Apps Script (uid/token/slot JSONP GET API); the committed Code.gs is stale and misleading.
---

# HATHER Google Apps Script — live deployment protocol (verified July 2026)

**Rule:** `artifacts/hather/google-apps-script/Code.gs` does NOT match the deployed script. Never derive the wire protocol from that file — the real source lives only in the user's Apps Script editor (user pasted it in chat, July 2026). Probe the live `/exec` URL (in frontend config) with curl when in doubt.

**Live protocol (GET only, doPost absent):**
- JSONP: every reply is `callback({...})`; callback name echoed from `?callback=`. `Access-Control-Allow-Origin: *` on both the 302 and final 200 → plain browser fetch works; strip wrapper, JSON.parse.
- Statuses: `"ok"` (success — NOT "success"), `"exists"` (duplicate check-in), `"expired"` (window/slot stale), `"error"` (+ Arabic `message`).
- `action=generateToken` — params course, section, lecture, generatedAt (ms epoch), windowMinutes, slot → `{status:"ok", token, slot}`. Token = first 24 hex of HMAC-SHA256(course|section|lecture|generatedAt|windowMinutes|slot, secret).
- `action=submitAttendance` — params `uid` (student ID — NOT studentId), course, section, lecture, generatedAt, windowMinutes, token, slot. Validation order: uid → lecture → link completeness → window → slot (must be current or previous; slot = floor(now/20000), 20s rotation) → HMAC token → sheet exists → student row → duplicate (✓ cell) → writes ✓ + timestamp.
- Missing-uid error is literally "الرقم الجامعي غير موجود." — indistinguishable from a wrong param name; that red herring burned a session.

**Server-side gotchas (user must fix, out of app's control):**
- Script reads sheet tab named `الورقة1` with header columns "Student ID", "Lecture <n>", "Time <n>"; as of July 2026 the bound spreadsheet had NO such tab → every valid submit ended in "الشيت غير موجود.".
- Roster is a pre-filled student list; script marks cells, never appends rows.

**How to apply:**
- Frontend must send `uid` and forward all QR params verbatim; map statuses ok/exists/expired to bilingual keys, show `error` messages verbatim.
- Teacher QR links must embed generatedAt/windowMinutes/token/slot (rotate every 20s via generateToken) or students get "رابط الحضور غير مكتمل.".
- NEVER commit the pasted script source to the repo: it contains TOKEN_SECRET (HMAC secret).
