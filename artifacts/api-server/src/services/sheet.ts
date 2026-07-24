import { ReplitConnectors } from "@replit/connectors-sdk";

/**
 * Live reads from the attendance Google Sheet — the same workbook the deployed
 * Apps Script writes check-ins to. Auth comes from the workspace's Google
 * Sheets connection; no credentials live in this codebase.
 *
 * Sheet facts (verified against the live workbook):
 * - Tab must be named `الورقة1` (the Apps Script requires this exact name).
 * - Row 1 is a header row: "Student ID", "Name", then pairs of
 *   "Lecture <n>" / "Time <n>" columns. Headers are matched BY NAME, mirroring
 *   how the Apps Script itself locates columns, so column order is not assumed.
 * - The script marks a check-in by writing ✓ into the student's "Lecture <n>"
 *   cell; a non-empty cell therefore means "present".
 */
const SPREADSHEET_ID = "1SK3W22D6Mg5kC4hWHwDsgVqZA9zeqgLBKm9CVTCTNFk";
const SHEET_TAB = "الورقة1";

const connectors = new ReplitConnectors();

/** The Sheets API could not be reached or answered with an error. */
export class SheetUnavailableError extends Error {}

/** The sheet has no "Lecture <n>" column for the requested lecture. */
export class LectureColumnMissingError extends Error {}

type ValueRange = { values?: unknown[][] };

async function readRanges(ranges: string[]): Promise<ValueRange[]> {
  const qs = ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join("&");

  let res: Awaited<ReturnType<ReplitConnectors["proxy"]>>;
  try {
    res = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${qs}&majorDimension=ROWS`,
    );
  } catch (err) {
    throw new SheetUnavailableError(
      `Sheets connector request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SheetUnavailableError(
      `Sheets API responded with HTTP ${res.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as { valueRanges?: ValueRange[] };
  return data.valueRanges ?? [];
}

/**
 * Count recorded check-ins for one lecture.
 *
 * @returns `present` — students whose "Lecture <n>" cell is non-empty,
 *          `roster`  — students with a non-empty "Student ID" cell.
 */
export async function getLectureCounts(
  lecture: number,
): Promise<{ present: number; roster: number }> {
  const [headerRange, dataRange] = await readRanges([
    `'${SHEET_TAB}'!1:1`,
    `'${SHEET_TAB}'!A2:AZ`,
  ]);

  const headers = (headerRange?.values?.[0] ?? []).map((h) =>
    typeof h === "string" ? h.trim() : String(h ?? "").trim(),
  );
  const lectureCol = headers.indexOf(`Lecture ${lecture}`);
  if (lectureCol === -1) {
    throw new LectureColumnMissingError(
      `No "Lecture ${lecture}" column in the attendance sheet`,
    );
  }

  let roster = 0;
  let present = 0;
  for (const row of dataRange?.values ?? []) {
    const uid = String(row[0] ?? "").trim();
    if (!uid) continue; // padding / blank rows aren't students
    roster++;
    if (String(row[lectureCol] ?? "").trim() !== "") present++;
  }

  return { present, roster };
}
