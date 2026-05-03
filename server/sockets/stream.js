// ─────────────────────────────────────────────
//  NexusCore — Socket.io Stream
// ─────────────────────────────────────────────

import { SocketEvents } from "../../shared/types.js";

let io;

export function initStream(socketIo) {
  io = socketIo;
}

export function emitLog(sessionId, log) {
  // log: { agent, level, message }
  io.to(sessionId).emit(SocketEvents.LOG, {
    ...log,
    timestamp: new Date().toISOString(),
  });
}

export function emitDAGGraph(sessionId, graphData) {
  io.to(sessionId).emit(SocketEvents.DAG_GRAPH, graphData);
}

export function emitSessionStart(sessionId, data) {
  io.to(sessionId).emit(SocketEvents.SESSION_START, data);
}

export function emitSessionEnd(sessionId, data) {
  io.to(sessionId).emit(SocketEvents.SESSION_END, data);
}

export function emitError(sessionId, error) {
  io.to(sessionId).emit(SocketEvents.ERROR, error);
}

export function emitResult(sessionId, result) {
  io.to(sessionId).emit(SocketEvents.RESULT, result);
}
