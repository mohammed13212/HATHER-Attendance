import { type Request, type Response } from "express";
import { createSession, getSession, isActive, secondsRemaining } from "../utils/sessions.js";

/** POST /api/sessions  —  create a new attendance session */
export async function handleCreateSession(req: Request, res: Response) {
  const { course, section, lecture, duration } = req.body as Record<string, string>;

  if (!course || !section || !lecture || !duration) {
    res.status(400).json({ error: "missingFields" });
    return;
  }

  const durationMinutes = parseInt(duration, 10);
  if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
    res.status(400).json({ error: "invalidDuration" });
    return;
  }

  const session = createSession({ course, section, lecture, durationMinutes });

  res.status(201).json({
    id: session.id,
    course: session.course,
    section: session.section,
    lecture: session.lecture,
    durationMinutes: session.durationMinutes,
    startTime: session.startTime.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  });
}

/** GET /api/sessions/:id  —  get session status */
export async function handleGetSession(req: Request, res: Response) {
  const { id } = req.params;
  const session = getSession(id);

  if (!session) {
    res.status(404).json({ error: "sessionNotFound" });
    return;
  }

  const active = isActive(session);

  res.json({
    id: session.id,
    course: session.course,
    section: session.section,
    lecture: session.lecture,
    durationMinutes: session.durationMinutes,
    startTime: session.startTime.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    active,
    secondsRemaining: active ? secondsRemaining(session) : 0,
  });
}
