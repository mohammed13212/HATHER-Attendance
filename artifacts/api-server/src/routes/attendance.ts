import { Router } from "express";
import {
  handleCheckIn,
  handleListAttendance,
  handleExportAttendance,
} from "../controllers/attendance.js";

const router = Router();

// Order matters: /export must come before /:id-style dynamic routes
router.get("/export", handleExportAttendance);
router.get("/", handleListAttendance);
router.post("/", handleCheckIn);

export default router;
