import { describe, it, expect } from "vitest";
import { evaluateRealityGate, evaluateClaimEvidence } from "../packages/agent-runtime/src/realityGate";
import { runParallelSearch } from "../packages/agent-runtime/src/parallelSearch";

describe("Reality Gate & Parallel Search Compliance", () => {
  it("strictly suppresses external search on purely dramatic dialogue (Zero-Compute Protection)", () => {
    const decision = evaluateRealityGate(
      "INT. COFFEE SHOP - DAY",
      "I told you I would never come back here, Sarah.",
      "I told you I loved you, Sarah, but that was before everything fell apart."
    );

    expect(decision.requiresExternalResearch).toBe(false);
    expect(decision.suggestedQueries).toHaveLength(0);
    expect(decision.category).toBe("dramatic");
    expect(decision.reason).toContain("Zero-compute protection");
  });

  it("triggers external research when factual or regulatory claims are introduced", () => {
    const halonDecision = evaluateRealityGate(
      "INT. CYBER VAULT - NIGHT",
      "She opens the secure compartment.",
      "She triggers the halon fire suppression override before entering the chamber."
    );

    expect(halonDecision.requiresExternalResearch).toBe(true);
    expect(halonDecision.category).toBe("safety");
    expect(halonDecision.suggestedQueries.length).toBeGreaterThan(0);
    expect(halonDecision.reason).toContain("halon");

    const maritimeDecision = evaluateRealityGate(
      "EXT. ATLANTIC OCEAN - DAWN",
      "The ship approaches the buoy.",
      "The captain claims salvage rights under maritime admiralty protocol."
    );

    expect(maritimeDecision.requiresExternalResearch).toBe(true);
    expect(maritimeDecision.category).toBe("maritime");
    expect(maritimeDecision.suggestedQueries.length).toBeGreaterThan(0);
  });

  it("evaluates claim evidence and yields POTENTIAL_CONFLICT on contradictory sources", () => {
    const result = evaluateClaimEvidence(
      "Halon 1301 systems can be legally discharged without permit in commercial spaces",
      [
        {
          title: "EPA Clean Air Act Title VI - Halon Regulations",
          url: "https://www.epa.gov/ozone-layer-protection/halon-program",
          snippet: "Production of halons was banned in 1994 under the Clean Air Act and Montreal Protocol. Discharge is restricted.",
          publishedDate: "2024-01-15"
        },
        {
          title: "Industrial Fire Extinguisher Forum",
          url: "https://example.com/fire-forum",
          snippet: "You can freely discharge existing canisters as long as you refill with FM-200.",
          publishedDate: "2023-05-10"
        }
      ]
    );

    expect(result.state).toBe("POTENTIAL_CONFLICT");
    expect(result.citations).toHaveLength(2);
    expect(result.rationale).toContain("Contradictory evidence detected");
  });

  it("yields VERIFIED when sources support the factual claim", () => {
    const result = evaluateClaimEvidence(
      "Halon discharge triggers emergency acoustic alarms and immediate room evacuation",
      [
        {
          title: "NFPA 12A Standard on Halon 1301 Fire Extinguishing Systems",
          url: "https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=12A",
          snippet: "NFPA 12A mandates visual and audible predischarge alarms before halon discharge to prevent occupant asphyxiation.",
          publishedDate: "2024-02-01"
        }
      ]
    );

    expect(result.state).toBe("VERIFIED");
    expect(result.citations).toHaveLength(1);
    expect(result.rationale).toMatch(/verified/i);
  });


  it("yields UNRESOLVED when no supporting sources exist", () => {
    const result = evaluateClaimEvidence("Fictional neural splice frequency 942 GHz", []);
    expect(result.state).toBe("UNRESOLVED");
    expect(result.citations).toHaveLength(0);
  });

  it("strictly reports isLiveApi: false when Parallel API key is absent or offline fallback is engaged", async () => {
    const response = await runParallelSearch({
      query: "Autonomous drone FAA altitude restrictions below 400ft AGL",
      sceneNumber: 2
    });

    // Without a live network call returning genuine Parallel JSON, isLiveApi MUST be false
    expect(response.isLiveApi).toBe(false);
    expect(["offline_grounded", "live_error"]).toContain(response.status);
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.telemetry.engine).toContain("Deterministic");
  });
});
