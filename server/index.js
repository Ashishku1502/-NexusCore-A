// ─────────────────────────────────────────────
//  NexusCore — Main Server
//  Express + Socket.io + Agent Orchestration
// ─────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

import { initStream, emitLog, emitDAGGraph, emitSessionStart, emitSessionEnd, emitError, emitResult } from "./sockets/stream.js";
import { initMemory } from "./memory/pinecone.js";
import { orchestrate } from "./agents/orchestrator.js";
import { routeToAgent } from "./agents/agentRouter.js";
import { aggregateResults } from "./agents/aggregator.js";
import { DAGScheduler } from "./utils/dag.js";
import { withRetry } from "./utils/retry.js";
import { AgentType, AgentStatus, SocketEvents } from "../shared/types.js";

// ── App Setup ─────────────────────────────────────────────
export const app = express();
const httpServer = createServer(app);

// Support multiple allowed origins (local dev + Netlify production)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like REST clients / curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ── Init Memory ───────────────────────────────────────────
initMemory();
initStream(io);

// ── Active sessions (abort support) ───────────────────────
const activeSessions = new Map();

// ── REST: Health check ────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    sessions: activeSessions.size,
    ts: new Date().toISOString(),
  });
});

// ── REST: Get session history ─────────────────────────────
app.get("/sessions", (_, res) => {
  res.json({ active: activeSessions.size });
});

// ── Socket.io ─────────────────────────────────────────────
io.on("connection", (socket) => {
  const sessionId = uuidv4();
  socket.join(sessionId);

  console.log(`[NexusCore] Client connected → session ${sessionId}`);

  // Send session ID to client
  socket.emit("session:id", { sessionId });

  // ── Handle incoming query ─────────────────────────────
  socket.on(SocketEvents.RUN_QUERY, async ({ query }) => {
    await runFullOrchestration(query, sessionId, {
      socket,
      onAbort: (handler) => socket.on(SocketEvents.ABORT, handler),
      removeAbort: (handler) => socket.removeListener(SocketEvents.ABORT, handler)
    });
  });

  socket.on("disconnect", () => {
    console.log(`[NexusCore] Client disconnected: ${sessionId}`);
    activeSessions.delete(sessionId);
  });
});

/**
 * ── Unified Orchestration Logic ──────────────────────────
 * Shared by both Socket.io and REST fallback
 */
async function runFullOrchestration(query, sessionId, options = {}) {
  const { socket, onAbort, removeAbort } = options;
  
  if (!query?.trim()) {
    if (socket) socket.emit(SocketEvents.ERROR, { message: "Query cannot be empty" });
    return { error: "Query cannot be empty" };
  }

  const startTime = Date.now();
  let aborted = false;

  const abortHandler = () => {
    aborted = true;
    activeSessions.delete(sessionId);
    emitLog(sessionId, {
      agent: "system",
      level: "warn",
      message: "Session aborted",
    });
  };

  if (onAbort) onAbort(abortHandler);
  activeSessions.set(sessionId, { socket, abortHandler });

  try {
    emitLog(sessionId, {
      agent: AgentType.ORCHESTRATOR,
      level: "system",
      message: "NexusCore session started ⚡",
    });

    const plan = await orchestrate(query, {
      onLog: (log) => {
        if (!aborted) emitLog(sessionId, log);
      },
    });

    if (aborted) {
      console.log(`[NexusCore] Session ${sessionId} aborted after orchestration`);
      return { error: "Session aborted" };
    }

    const tasks = plan?.tasks;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("Orchestrator failed to generate a valid task list.");
    }

    const dag = new DAGScheduler(tasks);
    dag.onStatusChange = (taskId, status) => {
      if (!aborted) emitDAGGraph(sessionId, dag.toGraphData());
    };

    emitSessionStart(sessionId, { query, taskCount: tasks.length });
    emitDAGGraph(sessionId, dag.toGraphData());

    emitLog(sessionId, {
      agent: AgentType.ORCHESTRATOR,
      level: "system",
      message: `Plan: "${plan.plan_summary}" — ${tasks.length} tasks`,
    });

    while (!dag.isComplete()) {
      if (aborted) break;
      const readyTasks = dag.getReadyTasks();
      if (readyTasks.length === 0) break;

      // Pass aborted flag check to routeToAgent
      await Promise.allSettled(
        readyTasks.map((task) => {
          if (aborted) return Promise.resolve();
          return routeToAgent(task, { 
            sessionId, 
            dag,
            isAborted: () => aborted 
          });
        })
      );
      
      if (!aborted) emitDAGGraph(sessionId, dag.toGraphData());
    }

    if (aborted) {
      console.log(`[NexusCore] Session ${sessionId} aborted during task execution`);
      return { error: "Session aborted" };
    }

    const allResults = dag.getAllResults();
    const stats = dag.getStats();

    emitLog(sessionId, {
      agent: AgentType.AGGREGATOR,
      level: "system",
      message: `Tasks done. Aggregating...`,
    });

    const { result: aggregationResult } = await withRetry(
      (attempt) => {
        if (aborted) throw new Error("Aborted");
        return aggregateResults(query, allResults, {
          onLog: (log) => {
            if (!aborted) emitLog(sessionId, log);
          },
          attempt
        });
      },
      {
        agentName: AgentType.AGGREGATOR,
        onRetry: (info) => {
          if (aborted) return;
          emitLog(sessionId, {
            agent: AgentType.AGGREGATOR,
            level: "warn",
            message: `Retry ${info.attempt}: ${info.error}`,
          });
        }
      }
    );

    if (aborted) return { error: "Session aborted" };

    const { finalAnswer, usage } = aggregationResult;
    const durationMs = Date.now() - startTime;

    const finalResult = {
      answer: finalAnswer,
      planSummary: plan.plan_summary,
      taskCount: tasks.length,
      stats,
      durationMs,
      usage,
    };

    emitResult(sessionId, finalResult);
    emitSessionEnd(sessionId, { result: "success", stats, durationMs });

    return finalResult;
  } catch (err) {
    if (aborted || err.message === "Aborted") {
      console.log(`[NexusCore] Caught abortion signal for session ${sessionId}`);
      return { error: "Session aborted" };
    }
    console.error("[NexusCore] Error:", err);
    emitError(sessionId, { message: err.message, agent: "system" });
    return { error: err.message };
  } finally {
    activeSessions.delete(sessionId);
    if (removeAbort) removeAbort(abortHandler);
  }
}

// ── REST: Fallback Run ────────────────────────────────────
app.post("/api/run", async (req, res) => {
  const { query } = req.body;
  const sessionId = uuidv4();
  
  // In Vercel serverless, we might return the result immediately 
  // since Socket.io emits won't persist across requests.
  const result = await runFullOrchestration(query, sessionId);
  res.json({ sessionId, ...result });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

// Always start the HTTP server (Railway, Render, local dev)
httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     NexusCore — Multi-Agent Runtime       ║
  ║     http://localhost:${PORT}                  ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
