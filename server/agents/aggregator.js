// ─────────────────────────────────────────────
//  NexusCore — Aggregator Agent
// ─────────────────────────────────────────────

import { callLLM } from "../utils/llm.js";
import { AgentType } from "../../shared/types.js";
import { mutatPromptOnRetry } from "../utils/retry.js";

const SYSTEM_PROMPT = `You are the Aggregator Agent of NexusCore.
Your job is to synthesize a final, coherent response based on the user's original query and the results of multiple specialized agents.

RULES:
1. Provide a comprehensive, professional answer.
2. Structure your output using Markdown.
3. If there were failures, note them if they impact the final answer's quality.
4. Ensure the final answer directly addresses the original user intent.`;

export async function aggregateResults(query, results, { onLog, attempt = 1 } = {}) {
  onLog?.({
    agent: AgentType.AGGREGATOR,
    level: "system",
    message: "Synthesizing final answer from all agent outputs...",
  });

  const contextStr = JSON.stringify(results, null, 2);
  const basePrompt = `${SYSTEM_PROMPT}\n\nUser Query: ${query}\n\nAgent Results:\n${contextStr}`;

  const system = attempt === 1 
    ? basePrompt 
    : mutatPromptOnRetry(basePrompt, attempt, "The previous synthesis was disjointed or missed key information from the agent results.");

  const response = await callLLM({
    system,
    messages: [
      {
        role: "user",
        content: "Please provide the final synthesis now.",
      },
    ],
    maxTokens: 3000,
    temperature: 0.3,
  });

  return {
    finalAnswer: response.text,
    usage: response.usage,
  };
}
