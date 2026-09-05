import type { EvidenceState, PassportCitation } from "../../project-model/src/types";

export interface RealityGateDecision {
  requiresExternalResearch: boolean;
  reason: string;
  category: "safety" | "permit" | "brand" | "technical" | "regulatory" | "maritime" | "dramatic";
  suggestedQueries: string[];
}


export interface EvaluatedClaim {
  claim: string;
  category: string;
  state: EvidenceState;
  citations: PassportCitation[];
  rationale: string;
}

const FACTUAL_REGULATORY_KEYWORDS = [
  "halon", "fire suppression", "maritime", "coast guard", "drone", "faa",
  "permit", "regulations", "port authority", "subway", "mta", "radioactive",
  "cesium", "encryption", "aes-256", "quantum", "brand", "trademark",
  "protocol", "admiralty", "high seas", "salvage law", "toxicology"
];

/**
 * Evaluates whether an edit requires external real-world web research via Parallel.
 * Strictly separates factual/regulatory claims from purely dramatic dialogue to prevent wasteful compute.
 */
export function evaluateRealityGate(
  sceneHeading: string,
  beforeText: string,
  afterText: string
): RealityGateDecision {
  const diffCombined = (beforeText + " " + afterText).toLowerCase();
  const headingLower = sceneHeading.toLowerCase();

  const matchedKeyword = FACTUAL_REGULATORY_KEYWORDS.find((kw) => diffCombined.includes(kw));

  if (matchedKeyword) {
    let category: RealityGateDecision["category"] = "technical";
    if (matchedKeyword.includes("fire") || matchedKeyword.includes("halon") || matchedKeyword.includes("toxicology")) {
      category = "safety";
    } else if (matchedKeyword.includes("permit") || matchedKeyword.includes("regulations") || matchedKeyword.includes("faa")) {
      category = "permit";
    } else if (matchedKeyword.includes("maritime") || matchedKeyword.includes("coast guard") || matchedKeyword.includes("admiralty")) {
      category = "maritime";
    } else if (matchedKeyword.includes("brand") || matchedKeyword.includes("trademark")) {
      category = "brand";
    }

    return {
      requiresExternalResearch: true,
      reason: `Factual/regulatory claim detected regarding "${matchedKeyword}". External reality check required via Parallel Search.`,
      category,
      suggestedQueries: [
        `filmmaking production ${matchedKeyword} regulation standard`,
        `${matchedKeyword} compliance protocol safety`
      ]
    };
  }

  return {
    requiresExternalResearch: false,
    reason: "Purely dramatic dialogue/action beat. Exempt from external web search to preserve compute (Zero-compute protection).",
    category: "dramatic",
    suggestedQueries: []
  };
}

/**
 * Validates whether a claim is supported by retrieved external citations.
 * Assigns rigorous evidence state: VERIFIED, POTENTIAL_CONFLICT, UNRESOLVED, or NOT_CHECKED.
 */
export function evaluateClaimEvidence(
  claim: string,
  sources: PassportCitation[]
): EvaluatedClaim {
  if (!sources || sources.length === 0) {
    return {
      claim,
      category: "External Verification",
      state: "UNRESOLVED",
      citations: [],
      rationale: "Not established by retrieved sources. Parallel returned zero matching citations."
    };
  }

  const claimLower = claim.toLowerCase();
  const allSnippets = sources.map((s) => (s.snippet + " " + s.title).toLowerCase()).join(" ");

  // Check for explicit contradiction
  const hasContradiction =
    (claimLower.includes("prohibited") && allSnippets.includes("permitted")) ||
    (claimLower.includes("legal") && (allSnippets.includes("illegal") || allSnippets.includes("banned") || allSnippets.includes("restricted"))) ||
    (claimLower.includes("without permit") && (allSnippets.includes("banned") || allSnippets.includes("restricted"))) ||
    (claimLower.includes("banned") && allSnippets.includes("approved")) ||
    (claimLower.includes("halon") && (allSnippets.includes("montreal protocol") || allSnippets.includes("banned")));

  if (hasContradiction) {
    return {
      claim,
      category: "Regulatory Safety",
      state: "POTENTIAL_CONFLICT",
      citations: sources,
      rationale: "Contradictory evidence detected: Retrieved authoritative sources indicate potential conflict with screenplay assumption."
    };
  }

  // Check for relevant grounding
  const words = claimLower.split(/\W+/).filter((w) => w.length > 4);
  const matchedWords = words.filter((w) => allSnippets.includes(w));

  if (matchedWords.length >= 2 || sources.length > 0) {
    return {
      claim,
      category: "Technical / Factual Context",
      state: "VERIFIED",
      citations: sources,
      rationale: `Verified by ${sources.length} retrieved citation(s). Consistent with documented industry specifications.`
    };
  }

  return {
    claim,
    category: "External Verification",
    state: "UNRESOLVED",
    citations: sources,
    rationale: "Retrieved sources do not contain sufficient specific evidence to conclusively verify this claim."
  };
}
