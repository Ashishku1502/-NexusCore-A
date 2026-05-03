// ─────────────────────────────────────────────
//  NexusCore — Agent Router
// ─────────────────────────────────────────────

import { AgentType } from "../../shared/types.js";
import { runResearchAgent } from "./researchAgent.js";
import { runReasoningAgent } from "./reasoningAgent.js";
import { runExecutionAgent } from "./executionAgent.js";
import { runMemoryAgent } from "./memoryAgent.js";
import { withRetry } from "../utils/retry.js";
import { emitLog } from "../sockets/stream.js";
import { storeMemory } from "../memory/pinecone.js";

export async function routeToAgent(task, { sessionId, dag, isAborted }) {
  const { id, agent, dependencies } = task;
  
  if (isAborted && isAborted()) return;

  dag.markRunning(id);
  
  // Get context from previous tasks
  let context = dag.getDependencyContext(id);
  
  // Heuristic: Compress context if it's too large (> 8000 chars)
  if (JSON.stringify(context).length > 8000) {
    if (isAborted && isAborted()) return;
    emitLog(sessionId, {
      agent: AgentType.MEMORY,
      level: "info",
      message: `Task ${id} context too large. Compressing...`,
    });
    const { compressed } = await runMemoryAgent({ 
      operation: "compress", 
      data: context 
    }, { onLog: (log) => {
      if (isAborted && !isAborted()) emitLog(sessionId, log);
    } });
    context = { _compressed: true, summary: compressed };
  }

  const enrichedTask = { ...task, context };

  if (isAborted && isAborted()) return;
  emitLog(sessionId, {
    agent: agent,
    level: "info",
    message: `Executing: "${task.task}"`,
  });

  const onLog = (log) => {
    if (isAborted && !isAborted()) emitLog(sessionId, log);
  };
  
  try {
    const { result, attempts } = await withRetry(async (attempt) => {
      if (isAborted && isAborted()) throw new Error("Aborted");
      
      let res;
      const opts = { onLog, attempt };

      switch (agent) {
        case AgentType.RESEARCH:
          res = await runResearchAgent(enrichedTask, opts);
          break;
        case AgentType.REASONING:
          res = await runReasoningAgent(enrichedTask, opts);
          break;
        case AgentType.EXECUTION:
          res = await runExecutionAgent(enrichedTask, opts);
          break;
        case AgentType.MEMORY:
          res = await runMemoryAgent(enrichedTask, opts);
          break;
        default:
          throw new Error(`Unknown agent type: ${agent}`);
      }
      return res;
    }, {
      agentName: agent,
      onRetry: (info) => {
        if (isAborted && isAborted()) return;
        onLog({
          agent: agent,
          level: "warn",
          message: `Retry ${info.attempt}/${3} due to: ${info.error}`,
        });
      }
    });

    if (isAborted && isAborted()) return;
    dag.markDone(id, result);
    
    // Auto-store result in memory
    if (agent !== AgentType.MEMORY) {
      storeMemory(`${sessionId}-${id}`, [], {
        agent,
        task: task.task,
        output: result,
        timestamp: Date.now()
      }).catch(err => console.error("[Router] Auto-store failed:", err));
    }
    
    emitLog(sessionId, {
      agent: agent,
      level: "success",
      message: `Completed Task ${id} (${attempts > 1 ? `${attempts} attempts` : "1st try"})`,
    });

    return result;
  } catch (err) {
    if (isAborted && isAborted()) return;
    dag.markFailed(id, err);
    emitLog(sessionId, {
      agent: agent,
      level: "error",
      message: `Failed Task ${id}: ${err.message}`,
    });
    throw err;
  }
}
