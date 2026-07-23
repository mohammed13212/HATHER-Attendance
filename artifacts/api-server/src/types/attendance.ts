/** A single attendance check-in record stored in the Excel file. */
export type AttendanceRecord = {
  studentId: string;
  course: string;
  section: string;
  lecture: string;
  checkInTime: string;
};
