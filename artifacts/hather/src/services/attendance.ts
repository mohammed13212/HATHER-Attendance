import { config } from '@/config';

/**
 * Response shape returned by the Google Apps Script web app.
 * The deployed script answers GET requests with a JSONP-style body:
 *   callback({"status":"success"|"error","message":"..."})
 */
export type AppsScriptResponse = {
  status: 'success' | 'error';
  message?: string;
};

const REQUEST_TIMEOUT_MS = 20_000;

/** Strip the JSONP wrapper (`callback({...})`) if present and parse the JSON payload. */
function parseAppsScriptBody(body: string): AppsScriptResponse {
  const trimmed = body.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.slice(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));

  const data = JSON.parse(jsonText) as AppsScriptResponse;
  if (data.status !== 'success' && data.status !== 'error') {
    throw new Error('Unexpected Apps Script response shape');
  }
  return data;
}

/**
 * Submit a student check-in to the Google Apps Script web app.
 *
 * Uses a plain GET request (the deployed script only implements doGet) so the
 * browser can follow Google's redirect and read the JSON reply — the script's
 * deployment serves `Access-Control-Allow-Origin: *` on every hop.
 *
 * Throws on network failure, timeout, or an unreadable response; callers
 * should surface those as a generic network error.
 */
export async function submitAttendance(input: {
  studentId: string;
  course?: string;
  section?: string;
  lecture?: string;
}): Promise<AppsScriptResponse> {
  const params = new URLSearchParams({
    action: 'submitAttendance',
    studentId: input.studentId,
  });
  if (input.course) params.set('course', input.course);
  if (input.section) params.set('section', input.section);
  if (input.lecture) params.set('lecture', input.lecture);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
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
