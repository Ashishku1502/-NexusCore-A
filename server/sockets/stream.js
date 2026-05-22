// ─────────────────────────────────────────────
//  NexusCore — Socket.io Stream
//  All emitters are null-guarded for Vercel
//  serverless where io is not a live server.
// ─────────────────────────────────────────────

import { SocketEvents } from "../../shared/types.js";

let io;

export function initStream(socketIo) {
  io = socketIo;
}

export function emitLog(sessionId, log) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.LOG, {
    ...log,
    timestamp: new Date().toISOString(),
  });
}

export function emitDAGGraph(sessionId, graphData) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.DAG_GRAPH, graphData);
}

export function emitSessionStart(sessionId, data) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.SESSION_START, data);
}

export function emitSessionEnd(sessionId, data) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.SESSION_END, data);
}

export function emitError(sessionId, error) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.ERROR, error);
}

export function emitResult(sessionId, result) {
  if (!io) return;
  io.to(sessionId).emit(SocketEvents.RESULT, result);
}
