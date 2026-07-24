import { config } from '@/config';

/**
 * Response shape returned by the deployed Google Apps Script web app.
 *
 * The script answers GET requests with a JSONP-style body:
 *   callback({"status":"...","message":"..."})
 *
 * Statuses used by the deployed script:
 *   - "ok"      → attendance recorded (also used by generateToken replies)
 *   - "exists"  → this student already checked in for this lecture
 *   - "expired" → attendance window over, or the rotating QR slot is stale
 *   - "error"   → validation / lookup failure; `message` explains (in Arabic)
 */
export type AppsScriptResponse = {
  status: 'ok' | 'exists' | 'expired' | 'error' | (string & {});
  message?: string;
  timestamp?: string;
};

/**
 * Query parameters for a check-in, mirroring what the deployed script reads.
 * `uid` is the student's university ID — the script's expected parameter name.
 * The QR link supplies the rest: session identity (course/section/lecture) and
 * the anti-replay token data minted by the script's `generateToken` action
 * (`generatedAt` ms epoch, `windowMinutes`, HMAC `token`, 20-second `slot`).
 */
export type CheckInRequest = {
  uid: string;
  course?: string;
  section?: string;
  lecture?: string;
  generatedAt?: string;
  windowMinutes?: string;
  token?: string;
  slot?: string;
};

const REQUEST_TIMEOUT_MS = 20_000;

/** Strip the JSONP wrapper (`callback({...})`) if present and parse the JSON payload. */
function parseAppsScriptBody(body: string): AppsScriptResponse {
  const trimmed = body.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.slice(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));

  const data = JSON.parse(jsonText) as AppsScriptResponse;
  if (typeof data.status !== 'string') {
    throw new Error('Unexpected Apps Script response shape');
  }
  return data;
}

/** Response of the script's `generateToken` action. */
export type GenerateTokenResponse = AppsScriptResponse & {
  token?: string;
  slot?: number;
};

/** Current 20-second QR rotation slot, matching the script's floor(now/20000). */
export function currentSlot(now: number = Date.now()): number {
  return Math.floor(now / 20_000);
}

/**
 * Ask the Apps Script to mint an HMAC token for a session's QR link.
 *
 * The HMAC secret lives only in the deployed script; the frontend must fetch
 * tokens from the `generateToken` action for every slot rotation.
 *
 * Throws on network failure, timeout, or a non-"ok" status.
 */
export async function generateToken(input: {
  course: string;
  section: string;
  lecture: string;
  generatedAt: number;
  windowMinutes: number;
  slot: number;
}): Promise<{ token: string; slot: number }> {
  const params = new URLSearchParams({
    action: 'generateToken',
    course: input.course,
    section: input.section,
    lecture: input.lecture,
    generatedAt: String(input.generatedAt),
    windowMinutes: String(input.windowMinutes),
    slot: String(input.slot),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Apps Script responded with HTTP ${response.status}`);
    }
    const data = parseAppsScriptBody(await response.text()) as GenerateTokenResponse;
    if (data.status !== 'ok' || typeof data.token !== 'string') {
      throw new Error(data.message || 'Token generation failed');
    }
    return { token: data.token, slot: typeof data.slot === 'number' ? data.slot : input.slot };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Submit a student check-in to the Google Apps Script web app.
 *
 * Uses a plain GET request (the deployed script only implements doGet) so the
 * browser can follow Google's redirect and read the reply — the deployment
 * serves `Access-Control-Allow-Origin: *` on every hop.
 *
 * All QR-link parameters are forwarded verbatim; the script enforces link
 * completeness, the attendance window, QR slot freshness, and token validity,
 * and reports the outcome in its `status` field.
 *
 * Throws on network failure, timeout, or an unreadable response; callers
 * should surface those as a generic network error.
 */
export async function submitAttendance(input: CheckInRequest): Promise<AppsScriptResponse> {
  const params = new URLSearchParams({
    action: 'submitAttendance',
    uid: input.uid,
  });
  for (const key of ['course', 'section', 'lecture', 'generatedAt', 'windowMinutes', 'token', 'slot'] as const) {
    const value = input[key];
    if (value) params.set(key, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Apps Script responded with HTTP ${response.status}`);
    }
    return parseAppsScriptBody(await response.text());
  } finally {
    clearTimeout(timer);
  }
}
