import "dotenv/config";
import express from "express";
import chatRoutes from "./routes/chat.js";
import websRoutes from "./routes/webs.js";
import deliverablesRoutes from "./routes/deliverables.js";
import turnsRoutes from "./routes/turns.js";
import analyzeRoutes from "./routes/analyze.js";

const app = express();
const PORT = parseInt(process.env.API_PORT || "3001");

app.use(express.json({ limit: "2mb" }));

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/webs", websRoutes);
app.use("/api/webs", deliverablesRoutes);
app.use("/api/webs", turnsRoutes);
app.use("/api/analyze", analyzeRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
