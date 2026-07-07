/**
 * HATHER – QR Code Attendance System
 * Google Apps Script Backend
 *
 * Deployment instructions:
 * 1. Open Google Apps Script: https://script.google.com
 * 2. Create a new project and paste this code.
 * 3. Replace SPREADSHEET_ID with your Google Sheet's ID.
 * 4. Deploy as a Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployed Web App URL into src/config.ts → APPS_SCRIPT_URL
 */

// ─── CONFIGURATION ───────────────────────────────────────────────────────────

/** Replace with your Google Sheet ID (from the sheet URL) */
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

/** Name of the worksheet/tab to write attendance to */
const SHEET_NAME = "Attendance";

/** Allowed origins for CORS (set to "*" for public, or your GitHub Pages URL) */
const ALLOWED_ORIGIN = "*";

// ─── SHEET HEADERS ───────────────────────────────────────────────────────────
const HEADERS = ["Timestamp", "Student ID", "Course", "Section", "Lecture"];

// ─── MAIN HANDLERS ───────────────────────────────────────────────────────────

/**
 * Handle HTTP GET requests.
 * Returns a simple health check response.
 */
function doGet(e) {
  return buildResponse({ success: true, message: "HATHER API is running." });
}

/**
 * Handle HTTP POST requests.
 * Validates the payload and writes a new attendance row.
 */
function doPost(e) {
  try {
    // Parse JSON body
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return buildResponse({ success: false, message: "Invalid JSON payload." }, 400);
    }

    // Validate required fields
    var validation = validatePayload(payload);
    if (!validation.valid) {
      return buildResponse({ success: false, message: validation.message }, 400);
    }

    // Check for duplicate submission
    var isDuplicate = checkDuplicate(payload.studentId, payload.course, payload.section, payload.lecture);
    if (isDuplicate) {
      return buildResponse({
        success: false,
        message: "Attendance already recorded for this student in this lecture.",
        duplicate: true
      }, 409);
    }

    // Write to Google Sheets
    writeAttendance(payload);

    return buildResponse({ success: true });

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return buildResponse({ success: false, message: "An internal error occurred. Please try again." }, 500);
  }
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

/**
 * Validate the incoming attendance payload.
 * @param {Object} payload
 * @returns {{ valid: boolean, message: string }}
 */
function validatePayload(payload) {
  if (!payload) {
    return { valid: false, message: "Empty payload." };
  }

  // Student ID: required, exactly 9 digits
  if (!payload.studentId) {
    return { valid: false, message: "Student ID is required." };
  }
  var studentId = String(payload.studentId).trim();
  if (!/^\d{9}$/.test(studentId)) {
    return { valid: false, message: "Student ID must be exactly 9 digits." };
  }

  // Course: required
  if (!payload.course || String(payload.course).trim() === "") {
    return { valid: false, message: "Course name is required." };
  }

  // Section: required
  if (!payload.section || String(payload.section).trim() === "") {
    return { valid: false, message: "Section is required." };
  }

  // Lecture: required
  if (!payload.lecture || String(payload.lecture).trim() === "") {
    return { valid: false, message: "Lecture number is required." };
  }

  return { valid: true, message: "" };
}

// ─── DUPLICATE CHECK ─────────────────────────────────────────────────────────

/**
 * Check if a student already submitted attendance for this lecture on the same session date.
 *
 * Deduplication key: studentId + course + section + lecture + calendar date of submission.
 * Using the calendar date (not an exact timestamp) means:
 *   - A student cannot check in twice to the same lecture on the same day.
 *   - The same lecture label (e.g. "L1") used on a different day is treated as a new session.
 *
 * @param {string} studentId
 * @param {string} course
 * @param {string} section
 * @param {string} lecture
 * @returns {boolean}
 */
function checkDuplicate(studentId, course, section, lecture) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();

  // Today's date string (YYYY-MM-DD in UTC) used as the session boundary
  var today = new Date();
  var todayStr = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  // Row 0 is headers; start from row 1
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Columns: [Timestamp, Student ID, Course, Section, Lecture]
    var rowTimestamp = row[0];
    var rowDateStr = "";
    if (rowTimestamp instanceof Date) {
      rowDateStr = rowTimestamp.getFullYear() + "-" +
        String(rowTimestamp.getMonth() + 1).padStart(2, "0") + "-" +
        String(rowTimestamp.getDate()).padStart(2, "0");
    } else {
      // Try parsing if stored as string
      var parsed = new Date(rowTimestamp);
      if (!isNaN(parsed.getTime())) {
        rowDateStr = parsed.getFullYear() + "-" +
          String(parsed.getMonth() + 1).padStart(2, "0") + "-" +
          String(parsed.getDate()).padStart(2, "0");
      }
    }

    if (
      rowDateStr === todayStr &&
      String(row[1]).trim() === String(studentId).trim() &&
      String(row[2]).trim().toLowerCase() === String(course).trim().toLowerCase() &&
      String(row[3]).trim().toLowerCase() === String(section).trim().toLowerCase() &&
      String(row[4]).trim().toLowerCase() === String(lecture).trim().toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

// ─── WRITE ATTENDANCE ────────────────────────────────────────────────────────

/**
 * Append a new attendance record to the sheet.
 * @param {Object} payload
 */
function writeAttendance(payload) {
  var sheet = getOrCreateSheet();
  var timestamp = new Date();

  sheet.appendRow([
    timestamp,
    String(payload.studentId).trim(),
    String(payload.course).trim(),
    String(payload.section).trim(),
    String(payload.lecture).trim()
  ]);
}

// ─── SHEET HELPERS ───────────────────────────────────────────────────────────

/**
 * Get the attendance sheet, creating it with headers if it doesn't exist.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet() {
  var ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    // Fallback: use the bound spreadsheet (if script is attached to a sheet)
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Create the sheet and add headers
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1E40AF");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");

    // Freeze the header row
    sheet.setFrozenRows(1);

    // Set column widths
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 130); // Student ID
    sheet.setColumnWidth(3, 200); // Course
    sheet.setColumnWidth(4, 100); // Section
    sheet.setColumnWidth(5, 100); // Lecture
  }

  return sheet;
}

// ─── RESPONSE HELPER ─────────────────────────────────────────────────────────

/**
 * Build a JSON ContentService response with CORS headers.
 * @param {Object} data
 * @param {number} [statusCode] - Ignored by Apps Script (always 200), but kept for clarity
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function buildResponse(data, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
