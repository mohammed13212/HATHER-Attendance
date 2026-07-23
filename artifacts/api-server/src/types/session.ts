/** Represents an active attendance session stored in memory. */
export type Session = {
  id: string;
  course: string;
  section: string;
  lecture: string;
  durationMinutes: number;
  startTime: Date;
  expiresAt: Date;
};
