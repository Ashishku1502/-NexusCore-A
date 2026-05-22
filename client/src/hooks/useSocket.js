// ─────────────────────────────────────────────
//  NexusCore — useSocket Hook
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { SocketEvents } from "../types.js";

// In production (Netlify), VITE_SERVER_URL is set to your Railway backend URL.
// Locally, it falls back to http://localhost:3001
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "" // should always be set via VITE_SERVER_URL in production
    : "http://localhost:3001");

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState("idle"); // idle, running, complete, aborted
  const [logs, setLogs] = useState([]);
  const [dagGraph, setDagGraph] = useState({ nodes: [], edges: [] });
  const [result, setResult] = useState(null);
  const [agentStatuses, setAgentStatuses] = useState({});

  useEffect(() => {
    const s = io(SERVER_URL);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("session:id", ({ sessionId }) => setSessionId(sessionId));

    s.on(SocketEvents.LOG, (log) => {
      setLogs((prev) => [...prev, log]);
      if (log.agent && log.agent !== "system") {
        setAgentStatuses((prev) => ({
          ...prev,
          [log.agent]: log.level === "success" ? "idle" : log.level === "error" ? "error" : "busy",
        }));
      }
    });

    s.on(SocketEvents.DAG_GRAPH, (graph) => setDagGraph(graph));
    
    s.on(SocketEvents.SESSION_START, () => setSessionState("running"));
    
    s.on(SocketEvents.SESSION_END, () => {
      setSessionState(prev => prev === "aborted" ? "aborted" : "complete");
    });

    s.on(SocketEvents.RESULT, (data) => setResult(data));

    s.on(SocketEvents.ERROR, (err) => {
      setLogs((prev) => [...prev, { agent: "system", level: "error", message: err.message }]);
    });

    setSocket(s);

    return () => s.disconnect();
  }, []);

  const runQuery = useCallback(async (query) => {
    setLogs([]);
    setDagGraph({ nodes: [], edges: [] });
    setResult(null);
    setAgentStatuses({});

    if (connected && socket) {
      socket.emit(SocketEvents.RUN_QUERY, { query });
    } else {
      // REST Fallback for Serverless/Vercel
      setSessionState("running");
      setLogs([{ agent: "system", level: "info", message: "Connecting via REST fallback (Vercel optimization)..." }]);
      
      try {
        const response = await fetch(`${SERVER_URL}/api/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          setLogs(prev => [...prev, { agent: "system", level: "error", message: data.error }]);
          setSessionState(data.error === "Session aborted" ? "aborted" : "idle");
        } else {
          setResult(data);
          setSessionState("complete");
          setLogs(prev => [...prev, { agent: "system", level: "success", message: "✓ Complete via fallback" }]);
        }
      } catch (err) {
        setLogs(prev => [...prev, { agent: "system", level: "error", message: "Failed to reach backend." }]);
        setSessionState("idle");
      }
    }
  }, [socket, connected]);

  const abort = useCallback(() => {
    if (!socket) return;
    socket.emit(SocketEvents.ABORT);
    setSessionState("aborted");
    setLogs(prev => [...prev, { agent: "system", level: "warn", message: "⚠ Abort signal sent. Terminating runtime..." }]);
  }, [socket]);

  const reset = useCallback(() => {
    setLogs([]);
    setDagGraph({ nodes: [], edges: [] });
    setResult(null);
    setAgentStatuses({});
    setSessionState("idle");
  }, []);

  return {
    connected,
    sessionId,
    sessionState,
    logs,
    dagGraph,
    result,
    agentStatuses,
    taskStatuses: dagGraph.nodes.reduce((acc, node) => {
      acc[node.id] = node.status;
      return acc;
    }, {}),
    runQuery,
    abort,
    reset,
  };
}
