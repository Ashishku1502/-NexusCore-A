// ─────────────────────────────────────────────
//  NexusCore — Orchestrator Agent
//
//  THE BRAIN. Decomposes user queries into atomic
//  tasks and builds a dependency-aware DAG.
// ─────────────────────────────────────────────

import { callLLM } from "../utils/llm.js";
import { withRetry, mutatPromptOnRetry, safeParseJSON } from "../utils/retry.js";
import { AgentType } from "../../shared/types.js";

const SYSTEM_PROMPT = `You are the Orchestrator Agent of NexusCore, an AI operating system.

Your job is to decompose a user request into a directed acyclic graph (DAG) of atomic tasks.

AVAILABLE AGENTS:
- research: Retrieves and synthesizes relevant knowledge and context
- reasoning: Performs multi-step logical analysis and inference
- execution: Generates final outputs (code, plans, structured content)
- memory: Stores and retrieves embeddings from vector memory

RULES:
1. Keep tasks ATOMIC — one clear goal per task
2. Use dependencies to express sequencing (task B depends on task A's output)
3. Parallelize where possible — tasks without shared deps run simultaneously
4. Label dependencies using task IDs (integers starting at 1)
5. Maximum 8 tasks per plan
6. Output ONLY valid JSON — no explanation, no markdown fences

OUTPUT FORMAT:
{
  "plan_summary": "one line: what you're doing",
  "tasks": [
    {
      "id": 1,
      "agent": "research",
      "task": "precise description of what this task does",
      "dependencies": [],
      "priority": 1
    },
    {
      "id": 2,
      "agent": "reasoning",
      "task": "analyze the research output and determine approach",
      "dependencies": [1],
      "priority": 2
    }
  ]
}`;

export async function orchestrate(userInput, { onLog } = {}) {
  onLog?.({
    agent: AgentType.ORCHESTRATOR,
    level: "system",
    message: `Planning task decomposition for: "${userInput.slice(0, 80)}..."`,
  });

  let currentPrompt = `${SYSTEM_PROMPT}\n\nUser Request:\n${userInput}`;

  const { result, attempts } = await withRetry(
    (attempt) => {
      const prompt =
        attempt === 1
          ? currentPrompt
          : mutatPromptOnRetry(currentPrompt, attempt, "Invalid JSON output");

      return runOrchestratorCall(prompt);
    },
    {
      agentName: AgentType.ORCHESTRATOR,
      onRetry: (info) => {
        onLog?.({
          agent: AgentType.ORCHESTRATOR,
          level: "warn",
          message: `Retry ${info.attempt}: ${info.error}`,
        });
      },
    }
  );

  onLog?.({
    agent: AgentType.ORCHESTRATOR,
    level: "success",
    message: `Plan ready: ${result.tasks.length} tasks in ${attempts} attempt(s). Summary: ${result.plan_summary}`,
  });

  return result;
}

async function runOrchestratorCall(prompt) {
  const response = await callLLM({
    system: prompt,
    messages: [
      {
        role: "user",
        content: "Generate the task decomposition plan now.",
      },
    ],
    maxTokens: 1500,
    temperature: 0.2,
  });

  return safeParseJSON(response.text);
}
