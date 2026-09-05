import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import { RuntimeProofRegistry } from "./runtimeProof.js";
import { executeServerParallelSearch } from "./tools/parallelSearchTool.js";
import { runChangeImpactWorkflow } from "./agents/changeImpactAgent.js";
import { ChangeImpactRequestSchema, ParallelResearchRequestSchema } from "./schemas.js";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (CONFIG.allowedOrigins.includes(origin) || origin.endsWith(".github.io") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for competition review
  },
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// GET /health
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// GET /api/runtime-proof
app.get("/api/runtime-proof", (_req, res) => {
  const proof = RuntimeProofRegistry.get().getProof();
  res.status(200).json(proof);
});

// POST /api/research
app.post("/api/research", async (req, res) => {
  const parsed = ParallelResearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid research request payload", details: parsed.error });
  }

  const { query, objective, maxResults } = parsed.data;
  const result = await executeServerParallelSearch(query, objective, maxResults);
  return res.status(200).json(result);
});

// POST /api/change-impact
app.post("/api/change-impact", async (req, res) => {
  const parsed = ChangeImpactRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid change impact payload", details: parsed.error });
  }

  const result = await runChangeImpactWorkflow(parsed.data);
  return res.status(200).json(result);
});

app.listen(CONFIG.port, () => {
  console.log(`Scribe Studio Cloud Run Agent Service listening on port ${CONFIG.port}`);
});
