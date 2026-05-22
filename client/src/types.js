// ─────────────────────────────────────────────
//  NexusCore — Shared Constants
//  Duplicated inside client/src for Netlify compatibility
//  (Vite root is client/, so outside imports are blocked on Linux)
// ─────────────────────────────────────────────

export const AgentType = {
  ORCHESTRATOR: "orchestrator",
  RESEARCH: "research",
  REASONING: "reasoning",
  EXECUTION: "execution",
  MEMORY: "memory",
  AGGREGATOR: "aggregator",
};

export const AgentStatus = {
  IDLE: "idle",
  BUSY: "busy",
  ERROR: "error",
};

export const TaskStatus = {
  PENDING: "pending",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
  BLOCKED: "blocked",
};

export const SocketEvents = {
  RUN_QUERY: "query:run",
  ABORT: "session:abort",
  LOG: "session:log",
  DAG_GRAPH: "session:dag",
  SESSION_START: "session:start",
  SESSION_END: "session:end",
  ERROR: "session:error",
  RESULT: "session:result",
};
