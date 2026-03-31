import { Router } from "express";
import pool from "../db/pool.js";

const router = Router();

// Save a conversation turn
router.post("/:webId/turns", async (req, res) => {
  try {
    const { webId } = req.params;
    const { turn_number, role, content, raw_web_data } = req.body;

    const result = await pool.query(
      `INSERT INTO conversation_turns (web_id, turn_number, role, content, raw_web_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [webId, turn_number, role, content, raw_web_data ? JSON.stringify(raw_web_data) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get conversation turns for a web (for resume)
router.get("/:webId/turns", async (req, res) => {
  try {
    const { webId } = req.params;
    const result = await pool.query(
      "SELECT * FROM conversation_turns WHERE web_id = $1 ORDER BY turn_number",
      [webId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
