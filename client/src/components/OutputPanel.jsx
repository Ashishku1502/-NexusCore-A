// ─────────────────────────────────────────────
//  NexusCore — Output Panel
// ─────────────────────────────────────────────

import React from "react";

export function OutputPanel({ result, sessionState }) {
  if (sessionState === "running") {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <div style={styles.loadingText}>SYNTHESIZING RESULTS...</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>Waiting for task execution...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>FINAL DELIVERABLE</h3>
        <div style={styles.stats}>
          {result.durationMs && <span>{(result.durationMs / 1000).toFixed(1)}s</span>}
          <span>{result.taskCount} TASKS</span>
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.planSummary}>{result.planSummary}</div>
        <div style={styles.answer}>{result.answer}</div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0a0a14", height: "100%", display: "flex", flexDirection: "column" },
  loading: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 },
  spinner: { width: 40, height: 40, border: "2px solid #00e5ff22", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { fontSize: 10, letterSpacing: "0.2em", color: "#00e5ff", fontFamily: "'Space Mono', monospace" },
  empty: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#222244", fontSize: 11, fontFamily: "'Space Mono', monospace" },
  header: { padding: "15px 20px", borderBottom: "1px solid #1a1a2a", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 10, letterSpacing: "0.2em", color: "#333355" },
  stats: { display: "flex", gap: 15, fontSize: 9, color: "#1a1a3a", fontFamily: "'Space Mono', monospace" },
  content: { flex: 1, overflowY: "auto", padding: 25 },
  planSummary: { fontSize: 13, fontWeight: 700, color: "#00e5ff", marginBottom: 20, paddingBottom: 15, borderBottom: "1px solid #1a1a2a" },
  answer: { fontSize: 14, color: "#ccccee", lineHeight: 1.8, whiteSpace: "pre-wrap" },
};
