import { Parallel } from "parallel-web";
import { CONFIG } from "../config.js";
import { RuntimeProofRegistry } from "../runtimeProof.js";

export interface ParallelSourceResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface ParallelSearchResultPayload {
  query: string;
  objective?: string;
  sources: ParallelSourceResult[];
  isLiveApi: boolean;
  searchId?: string;
  latencyMs: number;
  error?: string;
}

export async function executeServerParallelSearch(
  query: string,
  objective?: string,
  maxResults = 4
): Promise<ParallelSearchResultPayload> {
  const startTime = performance.now();
  const apiKey = CONFIG.parallelApiKey;

  if (!apiKey) {
    const latency = Math.round(performance.now() - startTime);
    RuntimeProofRegistry.get().recordParallelError(latency);
    return {
      query,
      objective,
      sources: [],
      isLiveApi: false,
      latencyMs: latency,
      error: "PARALLEL_API_KEY is not configured on server."
    };
  }

  try {
    const client = new Parallel({ apiKey });
    const searchResponse = await client.search({
      search_queries: [query],
      objective: objective || `Filmmaking production verification: ${query}`,
      advanced_settings: {
        max_results: maxResults
      }
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const searchId = searchResponse.search_id;

    const sources: ParallelSourceResult[] = (searchResponse.results || []).map((r) => ({
      title: r.title || "Parallel Search Web Citation",
      url: r.url,
      snippet: Array.isArray(r.excerpts) ? r.excerpts.join(" ") : "",
      publishedDate: r.publish_date || undefined
    }));

    RuntimeProofRegistry.get().recordParallelSuccess(latencyMs, searchId);

    return {
      query,
      objective,
      sources,
      isLiveApi: true,
      searchId,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    RuntimeProofRegistry.get().recordParallelError(latencyMs);
    console.error("Parallel Live Search Error:", err.message);

    return {
      query,
      objective,
      sources: [],
      isLiveApi: false,
      latencyMs,
      error: err.message || "Parallel search request failed."
    };
  }
}
