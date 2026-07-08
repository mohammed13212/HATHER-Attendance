import { Router } from "express";
import { handleCreateSession, handleGetSession } from "../controllers/sessions.js";

const router = Router();

router.post("/", handleCreateSession);
router.get("/:id", handleGetSession);

export default router;
