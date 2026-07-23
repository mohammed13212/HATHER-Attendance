import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";
import type { AttendanceRecord } from "../types/attendance.js";

export type { AttendanceRecord };

// Path is relative to the built dist/ output → ../data = api-server/data/
const DATA_DIR = path.join(__dirname, "..", "data");
const FILE_PATH = path.join(DATA_DIR, "attendance.xlsx");
const SHEET_NAME = "Attendance";

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Read all records from the Excel file (returns [] if file doesn't exist). */
export function readAllRecords(): AttendanceRecord[] {
  if (!fs.existsSync(FILE_PATH)) return [];
  try {
    const wb = XLSX.readFile(FILE_PATH);
    const ws = wb.Sheets[SHEET_NAME];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<AttendanceRecord>(ws);
  } catch {
    return [];
  }
}

/** Append a single record to the Excel file. Creates the file if it doesn't exist. */
export function appendRecord(record: AttendanceRecord): void {
  ensureDir();

  const existing = readAllRecords();
  existing.push(record);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(existing, {
    header: ["studentId", "course", "section", "lecture", "checkInTime"],
  });

  // Human-readable column headers
  ws["A1"] = { v: "Student ID", t: "s" };
  ws["B1"] = { v: "Course", t: "s" };
  ws["C1"] = { v: "Section", t: "s" };
  ws["D1"] = { v: "Lecture", t: "s" };
  ws["E1"] = { v: "Check-In Time", t: "s" };

  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  XLSX.writeFile(wb, FILE_PATH);
}

/** Generate an xlsx Buffer from a list of records (for export/download). */
export function buildExcelBuffer(records: AttendanceRecord[]): Buffer {
  const wb = XLSX.utils.book_new();

  const exportRows = records.map((r) => ({
    "Student ID": r.studentId,
    "Course": r.course,
    "Section": r.section,
    "Lecture": r.lecture,
    "Check-In Time": r.checkInTime,
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);

  // Column widths
  ws["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
