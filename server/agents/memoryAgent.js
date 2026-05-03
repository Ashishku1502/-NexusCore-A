// ─────────────────────────────────────────────
//  NexusCore — Memory Agent
// ─────────────────────────────────────────────

import { AgentType } from "../../shared/types.js";
import { storeMemory, queryMemory } from "../memory/pinecone.js";
import { callLLM } from "../utils/llm.js";

export async function runMemoryAgent(task, { onLog }) {
  const { operation, data, query } = task;

  if (operation === "store") {
    onLog?.({ agent: AgentType.MEMORY, level: "info", message: "Storing to vector memory..." });
    await storeMemory(Date.now().toString(), [], data);
    return { success: true };
  } else if (operation === "compress") {
    onLog?.({ agent: AgentType.MEMORY, level: "info", message: "Compressing context window..." });
    const response = await callLLM({
      system: "You are a context compression specialist. Summarize the following information into a dense, high-entropy representation that preserves all key facts while reducing token count by 70%.",
      messages: [{ role: "user", content: JSON.stringify(data) }],
    });
    return { compressed: response.text };
  } else {
    onLog?.({ agent: AgentType.MEMORY, level: "info", message: "Retrieving from vector memory..." });
    const results = await queryMemory([], 3);
    return { results };
  }
}
