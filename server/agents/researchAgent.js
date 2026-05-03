// ─────────────────────────────────────────────
//  NexusCore — Research Agent
// ─────────────────────────────────────────────

import { callLLM } from "../utils/llm.js";
import { AgentType } from "../../shared/types.js";
import { mutatPromptOnRetry } from "../utils/retry.js";

export async function runResearchAgent(task, { onLog, attempt = 1 }) {
  const basePrompt = `You are a Research Agent. 
Task: ${task.task}
Context from previous tasks: ${JSON.stringify(task.context)}

Retrieve and synthesize relevant information for this task. Focus on facts, data, and established patterns.`;

  const system = attempt === 1 
    ? basePrompt 
    : mutatPromptOnRetry(basePrompt, attempt, "Previous attempt failed to provide satisfactory research findings.");

  const response = await callLLM({
    system,
    messages: [{ role: "user", content: "Perform research and synthesize findings." }],
    temperature: 0.4,
  });

  return { output: response.text };
}
