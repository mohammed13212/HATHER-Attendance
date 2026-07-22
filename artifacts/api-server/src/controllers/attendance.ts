import { type Request, type Response } from "express";
import { getSession, isActive } from "../services/sessions.js";
import { readAllRecords, appendRecord, buildExcelBuffer } from "../utils/excel.js";

/** POST /api/attendance  —  record a student check-in */
export async function handleCheckIn(req: Request, res: Response) {
  const { studentId, sessionId } = req.body as Record<string, string>;

  // Validate studentId: exactly 9 digits
  if (!studentId || !/^\d{9}$/.test(studentId)) {
    res.status(400).json({ error: "invalidId" });
    return;
  }

  // Validate sessionId
  if (!sessionId) {
    res.status(400).json({ error: "sessionRequired" });
    return;
  }

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "sessionNotFound" });
    return;
  }
  if (!isActive(session)) {
    res.status(410).json({ error: "sessionExpired" });
    return;
  }

  // Check for duplicate in the same session
  const records = readAllRecords();
  const duplicate = records.find(
    (r) =>
      r.studentId === studentId &&
      r.course === session.course &&
      r.section === session.section &&
      r.lecture === session.lecture
  );
  if (duplicate) {
    res.status(409).json({ error: "attendanceExists" });
    return;
  }

  // Append to Excel
  const record = {
    studentId,
    course: session.course,
    section: session.section,
    lecture: session.lecture,
    checkInTime: new Date().toLocaleString("ar-SA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  };
  appendRecord(record);

  res.status(201).json({ success: true, record });
}

/** GET /api/attendance  —  list records with optional filters */
export async function handleListAttendance(req: Request, res: Response) {
  const { course, section, lecture, studentId } = req.query as Record<string, string>;

  let records = readAllRecords();

  if (course)     records = records.filter((r) => r.course === course);
  if (section)    records = records.filter((r) => r.section === section);
  if (lecture)    records = records.filter((r) => r.lecture === lecture);
  if (studentId)  records = records.filter((r) => r.studentId.includes(studentId));

  res.json(records);
}

/** GET /api/attendance/export  —  download filtered records as .xlsx */
export async function handleExportAttendance(req: Request, res: Response) {
  const { course, section, lecture } = req.query as Record<string, string>;

  let records = readAllRecords();
  if (course)  records = records.filter((r) => r.course === course);
  if (section) records = records.filter((r) => r.section === section);
  if (lecture) records = records.filter((r) => r.lecture === lecture);

  const buffer = buildExcelBuffer(records);
  const filename = `attendance-${course ?? "all"}-${section ?? "all"}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
