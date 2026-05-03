// ─────────────────────────────────────────────
//  NexusCore — Main Dashboard
//  Aesthetic: Industrial Terminal / Cyberpunk OS
// ─────────────────────────────────────────────

import React, { useState, useRef } from "react";
import { useSocket } from "./hooks/useSocket.js";
import { AgentStatusPanel } from "./components/AgentStatusPanel.jsx";
import { LiveLogsStream } from "./components/LiveLogsStream.jsx";
import { TaskGraphView } from "./components/TaskGraphView.jsx";
import { OutputPanel } from "./components/OutputPanel.jsx";

const SAMPLE_QUERIES = [
  "Build a complete REST API for a task management app with authentication",
  "Analyze the trade-offs between microservices and monolithic architecture",
  "Create a Python ML pipeline for sentiment analysis with deployment plan",
  "Design a scalable real-time chat system for 1M concurrent users",
];

export default function App() {
  const [input, setInput] = useState("");
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [showLogs, setShowLogs] = useState(true);

  const {
    connected,
    sessionId,
    sessionState,
    logs,
    agentStatuses,
    taskStatuses,
    dagGraph,
    result,
    runQuery,
    abort,
    reset,
  } = useSocket();

  const handleSubmit = () => {
    if (!input.trim() || sessionState === "running") return;
    reset();
    setTimeout(() => runQuery(input.trim()), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const isRunning = sessionState === "running";
  const isAborted = sessionState === "aborted";

  return (
    <div style={styles.root}>
      {/* CSS animations */}
      <style>{CSS_ANIMATIONS}</style>

      {/* ── Top Bar ─────────────────────────────────── */}
      <header style={styles.topBar}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>NEXUSCORE</span>
          <span style={styles.logoVersion}>v1.0</span>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.connDot(connected)} />
          <span style={styles.connText}>
            {connected ? "CONNECTED" : "OFFLINE"}
          </span>
          {sessionId && (
            <span style={styles.sessionId}>
              SID:{sessionId.slice(0, 8)}
            </span>
          )}
          {isRunning && (
            <span style={styles.runningBadge}>
              <span style={styles.runningDot} />
              RUNNING
            </span>
          )}
          {isAborted && (
            <span style={styles.abortedBadge}>
              TERMINATED
            </span>
          )}
        </div>
      </header>

      {/* ── Input Bar ───────────────────────────────── */}
      <div style={styles.inputBar}>
        <div style={styles.inputWrapper}>
          <span style={styles.inputPrompt}>▶</span>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter task for the agent runtime... (⌘+Enter to run)"
            rows={2}
            disabled={isRunning}
          />
        </div>

        <div style={styles.inputActions}>
          <div style={styles.samples}>
            {SAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                style={styles.sampleBtn}
                onClick={() => setInput(q)}
                disabled={isRunning}
              >
                {q.slice(0, 42)}…
              </button>
            ))}
          </div>

          <div style={styles.actionBtns}>
            {isRunning ? (
              <button style={styles.abortBtn} onClick={abort}>
                ■ ABORT
              </button>
            ) : isAborted ? (
              <button style={styles.resetBtn} onClick={reset}>
                ⟳ RESET
              </button>
            ) : (
              <button
                style={styles.runBtn(!!input.trim() && connected)}
                onClick={handleSubmit}
                disabled={!input.trim() || !connected}
              >
                ◈ LAUNCH
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── UI Controls ────────────────────────────── */}
      <div style={styles.controlsBar}>
        <button 
          style={styles.controlBtn(showAgentPanel)} 
          onClick={() => setShowAgentPanel(!showAgentPanel)}
        >
          {showAgentPanel ? "◀ HIDE AGENTS" : "▶ SHOW AGENTS"}
        </button>
        <button 
          style={styles.controlBtn(showLogs)} 
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? "◀ HIDE LOGS" : "▶ SHOW LOGS"}
        </button>
      </div>

      {/* ── Main Grid ───────────────────────────────── */}
      <div style={styles.mainGrid(showAgentPanel, showLogs)}>
        {/* Left column: Agent Status + Task Graph */}
        {showAgentPanel && (
          <div style={styles.leftCol}>
            <div style={styles.agentPanel}>
              <AgentStatusPanel agentStatuses={agentStatuses} />
            </div>
            <div style={styles.graphPanel}>
              <TaskGraphView dagGraph={dagGraph} taskStatuses={taskStatuses} />
            </div>
          </div>
        )}

        {/* Center: Live Logs */}
        {showLogs && (
          <div style={styles.logsPanel}>
            <LiveLogsStream logs={logs} sessionState={sessionState} />
          </div>
        )}

        {/* Right: Output */}
        <div style={styles.outputPanel}>
          <OutputPanel result={result} sessionState={sessionState} />
        </div>
      </div>

      {/* ── Status Footer ───────────────────────────── */}
      <footer style={styles.footer}>
        <span style={styles.footerItem}>NexusCore Multi-Agent Runtime</span>
        <span style={styles.footerSep}>|</span>
        <span style={styles.footerItem}>
          Orchestrator → Research · Reasoning · Execution → Aggregator
        </span>
        <span style={styles.footerSep}>|</span>
        <span style={styles.footerItem}>⌘+Enter to run</span>
      </footer>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#06060d",
    color: "#ccccdd",
    overflow: "hidden",
    fontFamily: "'Syne', sans-serif",
  },

  // ── Top Bar ────────────────────────────────────────────
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 44,
    background: "#08080f",
    borderBottom: "1px solid #1a1a2a",
    flexShrink: 0,
  },
  logoArea: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: {
    color: "#00e5ff",
    fontSize: 18,
    textShadow: "0 0 12px #00e5ff88",
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#e0e0ff",
  },
  logoVersion: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#333355",
    letterSpacing: "0.1em",
    marginTop: 2,
  },
  statusRow: { display: "flex", alignItems: "center", gap: 10 },
  connDot: (ok) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: ok ? "#00ff8c" : "#ff4060",
    boxShadow: ok ? "0 0 8px #00ff8c" : "0 0 8px #ff4060",
  }),
  connText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#33335a",
    letterSpacing: "0.1em",
  },
  sessionId: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#222244",
    letterSpacing: "0.05em",
  },
  runningBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#00e5ff",
    letterSpacing: "0.1em",
    background: "#00e5ff10",
    padding: "2px 8px",
    borderRadius: 2,
    border: "1px solid #00e5ff22",
  },
  abortedBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#ff4060",
    letterSpacing: "0.1em",
    background: "#ff406010",
    padding: "2px 8px",
    borderRadius: 2,
    border: "1px solid #ff406022",
  },
  runningDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#00e5ff",
    animation: "pulse 1s infinite",
  },

  // ── Input ───────────────────────────────────────────────
  inputBar: {
    background: "#0a0a14",
    borderBottom: "1px solid #1a1a2a",
    padding: "12px 20px",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "#08080f",
    border: "1px solid #1e1e2e",
    borderRadius: 4,
    padding: "8px 12px",
    marginBottom: 10,
  },
  inputPrompt: {
    color: "#00e5ff",
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    marginTop: 3,
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ccccee",
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    lineHeight: 1.6,
    resize: "none",
    letterSpacing: "0.02em",
  },
  inputActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  samples: {
    display: "flex",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  sampleBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#333355",
    background: "#0a0a14",
    border: "1px solid #1a1a28",
    padding: "4px 8px",
    borderRadius: 2,
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "all 0.15s",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 200,
  },
  actionBtns: { flexShrink: 0 },
  runBtn: (active) => ({
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.15em",
    fontWeight: 700,
    color: active ? "#00e5ff" : "#2a2a3a",
    background: active ? "#00e5ff10" : "#08080f",
    border: `1px solid ${active ? "#00e5ff44" : "#1a1a28"}`,
    padding: "8px 24px",
    borderRadius: 3,
    cursor: active ? "pointer" : "not-allowed",
    transition: "all 0.2s",
    boxShadow: active ? "0 0 16px #00e5ff18" : "none",
  }),
  abortBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.15em",
    fontWeight: 700,
    color: "#ff4060",
    background: "#ff406010",
    border: "1px solid #ff406044",
    padding: "8px 24px",
    borderRadius: 3,
    cursor: "pointer",
  },
  resetBtn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.15em",
    fontWeight: 700,
    color: "#ccccdd",
    background: "#111122",
    border: "1px solid #222244",
    padding: "8px 24px",
    borderRadius: 3,
    cursor: "pointer",
  },

  // ── Controls ─────────────────────────────────────────────
  controlsBar: {
    display: "flex",
    gap: 1,
    background: "#111122",
    borderBottom: "1px solid #1a1a2a",
    flexShrink: 0,
  },
  controlBtn: (active) => ({
    padding: "6px 12px",
    background: active ? "#0a0a14" : "#08080f",
    border: "none",
    borderRight: "1px solid #111122",
    color: active ? "#00e5ff" : "#333355",
    fontFamily: "'Space Mono', monospace",
    fontSize: 8,
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "all 0.2s",
  }),

  // ── Main Grid ────────────────────────────────────────────
  mainGrid: (showAgents, showLogs) => ({
    flex: 1,
    display: "grid",
    gridTemplateColumns: `${showAgents ? "240px" : "0px"} ${showLogs ? "1fr" : "0px"} 1fr`,
    gap: 1,
    background: "#0f0f1a",
    overflow: "hidden",
    minHeight: 0,
    transition: "grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  }),
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  agentPanel: {
    flex: "0 0 340px",
    minHeight: 0,
    overflow: "auto",
  },
  graphPanel: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  logsPanel: {
    minHeight: 0,
    overflow: "hidden",
  },
  outputPanel: {
    minHeight: 0,
    overflow: "hidden",
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 20px",
    height: 28,
    background: "#06060d",
    borderTop: "1px solid #111122",
    flexShrink: 0,
  },
  footerItem: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: "#222244",
    letterSpacing: "0.05em",
  },
  footerSep: {
    color: "#1a1a28",
    fontSize: 10,
  },
};

const CSS_ANIMATIONS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06060d; overflow: hidden; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes moveProgress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }

  textarea::placeholder { color: #2a2a44; }
  textarea:disabled { opacity: 0.5; cursor: not-allowed; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 2px; }

  button:hover:not(:disabled) { filter: brightness(1.2); }
  button:active:not(:disabled) { filter: brightness(0.9); }
`;
