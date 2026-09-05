import { describe, it, expect } from "vitest";
import { Parallel } from "parallel-web";
import { GoogleGenAI } from "@google/genai";

describe("TRUE Live Google Cloud & Parallel Submission Verification", () => {
  const backendUrl = process.env.VITE_AGENT_API_BASE_URL || process.env.AGENT_API_BASE_URL || "http://localhost:8080";
  const parallelApiKey = process.env.PARALLEL_API_KEY || process.env.VITE_PARALLEL_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  it("verifies live backend health, Google ADK execution, Gemini response, and Parallel search", async () => {
    // 1. Mandatory Gate: Must fail if neither live credentials nor running backend is reachable
    let backendReachable = false;
    let healthData: any = null;

    try {
      const healthRes = await fetch(`${backendUrl}/health`);
      if (healthRes.ok) {
        healthData = await healthRes.json();
        backendReachable = true;
      }
    } catch {
      backendReachable = false;
    }

    if (!backendReachable && (!parallelApiKey || !geminiApiKey)) {
      throw new Error(
        "FAIL: Live submission verification failed. Neither deployed backend (" +
        backendUrl + ") nor live production credentials (GEMINI_API_KEY and PARALLEL_API_KEY) are accessible. " +
        "Per Hackathon Rule Finding 8, test:live must NOT pass on offline fixtures alone."
      );
    }

    // 2. Test Deployed Backend /health
    if (backendReachable) {
      console.log(`[LIVE TEST] Backend is reachable at ${backendUrl}. Verifying health...`);
      expect(healthData.status).toBe("ok");
      expect(typeof healthData.uptime).toBe("number");

      // 3. Test Runtime Proof endpoint
      const proofRes = await fetch(`${backendUrl}/api/runtime-proof`);
      expect(proofRes.status).toBe(200);
      const proofData = await proofRes.json();
      console.log("[LIVE TEST] Runtime Proof Snapshot:", JSON.stringify(proofData, null, 2));

      expect(proofData.adk.packageName).toBe("@google/adk");
      expect(proofData.gemini.packageName).toBe("@google/genai");
      expect(proofData.parallel.sdkName).toBe("parallel-web");

      // 4. Test Live /api/change-impact with real Google ADK multi-agent run
      console.log("[LIVE TEST] Executing real ADK change impact workflow on backend...");
      const impactRes = await fetch(`${backendUrl}/api/change-impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: "The Obsidian Protocol",
          sceneNumber: 1,
          beforeText: "She pulls an encrypted titanium drive from her belt.",
          afterText: "She activates a high-voltage halon fire suppression purge.",
          changedEntities: ["HALON FIRE SUPPRESSION", "HIGH VOLTAGE PURGE"]
        })
      });

      expect(impactRes.status).toBe(200);
      const impactData = await impactRes.json();

      // Verify ADK multi-agent execution
      expect(impactData.adkExecution).toBeDefined();
      expect(impactData.adkExecution.eventCount).toBeGreaterThanOrEqual(4);
      expect(impactData.adkExecution.agentsInvoked).toContain("RootProductionAgent");
      expect(impactData.adkExecution.agentsInvoked).toContain("RealityResearchAgent");
      expect(impactData.adkExecution.agentsInvoked).toContain("ContinuityReasoningAgent");
      expect(impactData.adkExecution.agentsInvoked).toContain("ProductionImpactAgent");
      expect(impactData.adkExecution.agentsInvoked).toContain("ConsolidationAgent");

      // Verify observable ADK events
      const events = impactData.adkExecution.events;
      expect(events.length).toBeGreaterThanOrEqual(4);
      expect(events.some((e: any) => e.author === "RootProductionAgent")).toBe(true);

      // Verify Reality Gate correctly required research for halon fire suppression
      expect(impactData.realityGate.requiresExternalResearch).toBe(true);

      // Verify execution provenance
      expect(impactData.executionTrace.adkStatus).toBe("VERIFIED");
    }

    // 5. Test Live Parallel SDK direct call if credential present
    if (parallelApiKey) {
      console.log("[LIVE TEST] Testing official Parallel SDK (parallel-web)...");
      const client = new Parallel({ apiKey: parallelApiKey });
      const searchRes = await client.search({
        search_queries: ["NFPA 12A halon fire suppression safety limits filmmaking set"],
        objective: "Production safety verification"
      });

      expect(searchRes.search_id).toBeDefined();
      expect(searchRes.results).toBeDefined();
      expect(searchRes.results.length).toBeGreaterThan(0);
      const firstUrl = searchRes.results[0].url;
      expect(firstUrl.startsWith("http")).toBe(true);
      console.log("[LIVE TEST] Parallel search succeeded with search_id:", searchRes.search_id);
    }

    // 6. Test Live Gemini direct call if credential present
    if (geminiApiKey) {
      console.log("[LIVE TEST] Testing official Gemini SDK (@google/genai)...");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const genRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Analyze prop continuity for a scene where a titanium drive is replaced by a quantum key."
      });
      expect(genRes.text).toBeDefined();
      expect(genRes.text!.length).toBeGreaterThan(10);
      console.log("[LIVE TEST] Gemini response received:", genRes.text?.slice(0, 80));
    }
  });
});

