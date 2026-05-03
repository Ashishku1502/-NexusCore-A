// ─────────────────────────────────────────────
//  NexusCore — Execution Agent
// ─────────────────────────────────────────────

import { callLLM } from "../utils/llm.js";
import { AgentType } from "../../shared/types.js";
import { mutatPromptOnRetry } from "../utils/retry.js";

export async function runExecutionAgent(task, { onLog, attempt = 1 }) {
  const basePrompt = `You are an Execution Agent. 
Task: ${task.task}
Context from previous tasks: ${JSON.stringify(task.context)}

Generate the required deliverables (code, architectural plans, structured documentation) based on the provided task and context.`;

  const system = attempt === 1 
    ? basePrompt 
    : mutatPromptOnRetry(basePrompt, attempt, "Previous attempt failed to produce high-quality or accurate deliverables.");

  const response = await callLLM({
    system,
    messages: [{ role: "user", content: "Generate the output deliverables." }],
    temperature: 0.5,
  });

  return { output: response.text };
}
