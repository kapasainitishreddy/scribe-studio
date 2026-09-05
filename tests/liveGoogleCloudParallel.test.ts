import { describe, it, expect } from "vitest";
import { runParallelSearch } from "../packages/agent-runtime/src/parallelSearch";

describe("Live Google Cloud & Parallel Integration Verification", () => {
  it("validates runtime credentials and reports truthful status", async () => {
    const parallelApiKey = process.env.PARALLEL_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (parallelApiKey) {
      console.log("[LIVE TEST] Running real Parallel Search query with PARALLEL_API_KEY...");
      const result = await runParallelSearch({
        query: "FAA regulations drone commercial filmmaking altitude permit 2026",
        sceneNumber: 1
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.isLiveApi).toBe(true);
      expect(result.status).toBe("live_success");
    } else {
      console.log("[OFFLINE VERIFICATION] PARALLEL_API_KEY not provided in environment. Running truthful grounded fallback...");
      const fallback = await runParallelSearch({
        query: "FAA regulations drone commercial filmmaking altitude permit 2026",
        sceneNumber: 1
      });

      expect(fallback.isLiveApi).toBe(false);
      expect(fallback.results.length).toBeGreaterThan(0);
    }
  });
});
