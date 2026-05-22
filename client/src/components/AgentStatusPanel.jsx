import React from "react";
import { AgentType } from "../types.js";

export function AgentStatusPanel({ agentStatuses }) {
  const agents = Object.values(AgentType);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>AGENT CLUSTER STATUS</h3>
      <div style={styles.grid}>
        {agents.map((type) => {
          const status = agentStatuses[type] || "IDLE";
          const isBusy = status === "busy";
          
          return (
            <div key={type} style={styles.agentCard(isBusy)}>
              <div style={styles.agentHeader}>
                <div style={styles.agentIconWrapper(isBusy)}>
                  <span style={styles.agentIcon}>◈</span>
                </div>
                <div style={styles.agentInfo}>
                  <span style={styles.agentName}>{type.toUpperCase()}</span>
                  <div style={styles.statusRow}>
                    <div style={styles.statusDot(status)} />
                    <span style={styles.statusText(status)}>{status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              {isBusy && <div style={styles.progressBar}><div style={styles.progressFill} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20, background: "#08080f", height: "100%", display: "flex", flexDirection: "column" },
  title: { fontSize: 10, letterSpacing: "0.2em", color: "#333355", marginBottom: 20, fontWeight: 800 },
  grid: { display: "flex", flexDirection: "column", gap: 12 },
  agentCard: (isBusy) => ({
    padding: "12px 16px",
    background: isBusy ? "linear-gradient(90deg, #00e5ff05, transparent)" : "#0a0a14",
    border: `1px solid ${isBusy ? "#00e5ff44" : "#1a1a2a"}`,
    borderRadius: 4,
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  }),
  agentHeader: { display: "flex", alignItems: "center", gap: 12 },
  agentIconWrapper: (isBusy) => ({
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: isBusy ? "#00e5ff10" : "#111122",
    borderRadius: 4,
    border: `1px solid ${isBusy ? "#00e5ff33" : "#1a1a2a"}`,
    boxShadow: isBusy ? "0 0 10px #00e5ff11" : "none",
  }),
  agentIcon: { color: "#00e5ff", fontSize: 14, fontWeight: 900 },
  agentInfo: { display: "flex", flexDirection: "column", gap: 2 },
  agentName: { fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#ccccdd" },
  statusRow: { display: "flex", alignItems: "center", gap: 6 },
  statusDot: (status) => ({
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: status === "busy" ? "#00e5ff" : status === "error" ? "#ff4060" : "#222244",
    boxShadow: status === "busy" ? "0 0 8px #00e5ff" : "none",
  }),
  statusText: (status) => ({ 
    fontSize: 8, 
    fontFamily: "'Space Mono', monospace", 
    color: status === "busy" ? "#00e5ff" : "#333355",
    fontWeight: 700
  }),
  progressBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "#111122" },
  progressFill: { 
    height: "100%", 
    width: "40%", 
    background: "#00e5ff", 
    animation: "moveProgress 2s infinite linear",
    boxShadow: "0 0 5px #00e5ff"
  }
};
