---
name: Apps Script live protocol
description: The deployed Google Apps Script API differs from the committed Code.gs; how the live endpoint actually behaves and how to probe it.
---

# HATHER Google Apps Script — live deployment protocol

**Rule:** `artifacts/hather/google-apps-script/Code.gs` does NOT match the deployed script. Never derive the wire protocol from that file — probe the live `/exec` URL (in frontend config) with curl instead.

**Why:** (verified by live probing, July 2026) The committed Code.gs describes a JSON `doPost` API with English messages and no roster validation. The live deployment has NO doPost ("Script function not found" HTML), answers only GET, wraps replies in JSONP (`callback({...})`, callback name echoed from `?callback=`), uses `{"status":"success"|"error","message":"<Arabic>"}` (not `success: boolean`), routes via `?action=...` (`submitAttendance` is the check-in action; unknown actions → "Action غير معروف."), and validates student IDs against a roster ("الرقم الجامعي غير موجود." for unknown IDs).

**How to apply:**
- Frontend must call it as: GET `{url}?action=submitAttendance&studentId=...&course=...&section=...&lecture=...` (plain fetch works — `Access-Control-Allow-Origin: *` present on both the 302 and the final 200; no preflight because simple GET).
- Parse by stripping the `callback( ... )` wrapper, then JSON.parse; treat non-JSONP/HTML bodies as network errors.
- Unknown-ID error is indistinguishable from wrong-param-name from outside; success path can only be tested with a real roster ID (only the user has one).
- If the protocol seems to change, re-probe with curl before editing frontend code.
