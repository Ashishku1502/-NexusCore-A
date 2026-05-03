// ─────────────────────────────────────────────
//  NexusCore — Reasoning Agent
// ─────────────────────────────────────────────

import { callLLM } from "../utils/llm.js";
import { AgentType } from "../../shared/types.js";
import { mutatPromptOnRetry } from "../utils/retry.js";

export async function runReasoningAgent(task, { onLog, attempt = 1 }) {
  const basePrompt = `You are a Reasoning Agent. 
Task: ${task.task}
Context from previous tasks: ${JSON.stringify(task.context)}

Apply multi-step logic, analysis, and inference to address this task. Show your thinking where appropriate.`;

  const system = attempt === 1 
    ? basePrompt 
    : mutatPromptOnRetry(basePrompt, attempt, "Previous attempt had logical inconsistencies or was incomplete.");

  const response = await callLLM({
    system,
    messages: [{ role: "user", content: "Analyze and provide reasoning." }],
    temperature: 0.2,
  });

  return { output: response.text };
}
