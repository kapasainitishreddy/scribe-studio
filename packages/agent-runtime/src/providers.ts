import type { AIProviderConfig, AIProviderName } from "../../project-model/src/types";
import type { AgentMessage, ProviderResponse } from "./types";
import { runOfflineHeuristic } from "./offlineEngine";

export async function executeAiCompletion(
  messages: AgentMessage[],
  config: AIProviderConfig,
  taskHint?: string
): Promise<ProviderResponse> {
  const provider = config.provider;

  if (provider === "offline-heuristic" || !config.apiKey && provider !== "ollama") {
    // Graceful offline fallback
    const offlineText = runOfflineHeuristic(messages, taskHint);
    return {
      text: offlineText,
      model: "deterministic-nlp-local",
      provider: "offline-heuristic"
    };
  }

  try {
    if (provider === "gemini") {
      const model = config.model || "gemini-1.5-pro";
      const apiKey = config.apiKey || "";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const systemInstruction = messages.find((m) => m.role === "system")?.content;

      const body: any = { contents };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return { text, model, provider: "gemini" };
    }

    if (provider === "openai" || provider === "openrouter") {
      const baseUrl =
        provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
      const model = config.model || (provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4o");

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        throw new Error(`${provider} API returned status ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        model,
        provider
      };
    }

    if (provider === "anthropic") {
      const model = config.model || "claude-3-5-sonnet-20241022";
      const systemInstruction = messages.find((m) => m.role === "system")?.content;
      const chatMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          system: systemInstruction,
          messages: chatMessages,
          max_tokens: 4096
        })
      });

      if (!res.ok) {
        throw new Error(`Anthropic API returned status ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      return { text, model, provider: "anthropic" };
    }

    if (provider === "ollama") {
      const baseUrl = config.baseUrl || "http://localhost:11434";
      const model = config.model || "llama3";
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      return {
        text: data.message?.content ?? "",
        model,
        provider: "ollama"
      };
    }
  } catch (err) {
    console.warn(`AI Provider ${provider} failed, falling back to deterministic engine:`, err);
  }

  // Safe fallback to deterministic NLP
  return {
    text: runOfflineHeuristic(messages, taskHint),
    model: "deterministic-nlp-fallback",
    provider: "offline-heuristic"
  };
}
