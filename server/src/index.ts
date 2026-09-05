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
    // Allow requests with no origin (like curl, health checks, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      CONFIG.allowedOrigins.includes(origin) ||
      origin === "https://kapasainitishreddy.github.io" ||
      /^https:\/\/[a-z0-9-]+\.github\.io$/.test(origin) ||
      /^http:\/\/localhost:(5173|4173|3000|8080)$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:(5173|4173|3000|8080)$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin ${origin} is not authorized.`));
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
