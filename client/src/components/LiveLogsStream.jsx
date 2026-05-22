// ─────────────────────────────────────────────
//  NexusCore — Live Logs Stream
// ─────────────────────────────────────────────

import React, { useRef, useEffect } from "react";

export function LiveLogsStream({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>LIVE RUNTIME LOGS</span>
        <span style={styles.badge}>v1.0.0-PROD</span>
      </div>
      <div style={styles.stream}>
        {logs.map((log, i) => (
          <div key={i} style={styles.logLine}>
            <span style={styles.timestamp}>[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}]</span>
            <span style={styles.agent(log.agent)}>{log.agent?.toUpperCase() || "SYS"}</span>
            <span style={styles.message(log.level)}>{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#06060d", height: "100%", display: "flex", flexDirection: "column", borderLeft: "1px solid #1a1a2a" },
  header: { padding: "10px 15px", borderBottom: "1px solid #1a1a2a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 10, letterSpacing: "0.2em", color: "#333355" },
  badge: { fontSize: 9, color: "#1a1a3a", fontFamily: "'Space Mono', monospace" },
  stream: { flex: 1, overflowY: "auto", padding: 15, fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.6 },
  logLine: { marginBottom: 4, display: "flex", gap: 10 },
  timestamp: { color: "#222244" },
  agent: (a) => ({ 
    color: a === "orchestrator" ? "#00e5ff" : a === "research" ? "#00ff8c" : a === "reasoning" ? "#ffcc00" : "#ff4060",
    fontWeight: 700,
    minWidth: 80
  }),
  message: (lvl) => ({ 
    color: lvl === "error" ? "#ff4060" : lvl === "success" ? "#00ff8c" : lvl === "warn" ? "#ffcc00" : "#ccccdd" 
  }),
};
