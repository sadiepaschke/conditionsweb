import { Router } from "express";
import { createWeb, getWeb, updateWeb, listWebs } from "../db/queries/webs.js";
import { syncConditions } from "../db/queries/conditions.js";
import { syncConnections, getConnectionDensity } from "../db/queries/connections.js";
import { findPaths, getProgramPathways, getHighLeverageConditions } from "../db/queries/graph.js";

const router = Router();

// List all webs
router.get("/", async (_req, res) => {
  try {
    const webs = await listWebs();
    res.json(webs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new web
router.post("/", async (req, res) => {
  try {
    const web = await createWeb(req.body);
    res.status(201).json(web);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a web with all its data
router.get("/:id", async (req, res) => {
  try {
    const web = await getWeb(req.params.id);
    if (!web) return res.status(404).json({ error: "Web not found" });
    res.json(web);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update web metadata
router.patch("/:id", async (req, res) => {
  try {
    const web = await updateWeb(req.params.id, req.body);
    if (!web) return res.status(404).json({ error: "Web not found" });
    res.json(web);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync conditions (from AI output)
router.post("/:id/conditions", async (req, res) => {
  try {
    const { nodes, turnNumber } = req.body;
    const result = await syncConditions(req.params.id, nodes, turnNumber);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync connections (from AI output)
router.post("/:id/connections", async (req, res) => {
  try {
    const { edges } = req.body;
    const result = await syncConnections(req.params.id, edges);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get connection density (for node sizing)
router.get("/:id/graph/density", async (req, res) => {
  try {
    const density = await getConnectionDensity(req.params.id);
    res.json(density);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Graph path queries
router.get("/:id/graph/paths", async (req, res) => {
  try {
    const { from, to } = req.query;
    const paths = await findPaths(
      req.params.id,
      from as string | undefined,
      to as string | undefined
    );
    res.json(paths);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Program pathways (for ToC generation)
router.get("/:id/graph/pathways", async (req, res) => {
  try {
    const pathways = await getProgramPathways(req.params.id);
    res.json(pathways);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// High leverage conditions
router.get("/:id/graph/leverage", async (req, res) => {
  try {
    const leverage = await getHighLeverageConditions(req.params.id);
    res.json(leverage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
