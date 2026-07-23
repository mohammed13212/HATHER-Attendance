import { randomUUID } from "node:crypto";
import type { Session } from "../types/session.js";

export type { Session };

// In-memory store — persists for the lifetime of the server process.
const store = new Map<string, Session>();

export function createSession(params: {
  course: string;
  section: string;
  lecture: string;
  durationMinutes: number;
}): Session {
  const id = randomUUID();
  const startTime = new Date();
  const expiresAt = new Date(startTime.getTime() + params.durationMinutes * 60 * 1000);
  const session: Session = { id, startTime, expiresAt, ...params };
  store.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return store.get(id);
}

export function isActive(session: Session): boolean {
  return Date.now() < session.expiresAt.getTime();
}

export function secondsRemaining(session: Session): number {
  return Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
}
