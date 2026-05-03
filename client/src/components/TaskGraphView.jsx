import React from "react";
import { TaskStatus } from "../../../shared/types.js";

export function TaskGraphView({ dagGraph }) {
  const { nodes, edges } = dagGraph;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>TASK EXECUTION PIPELINE</h3>
      <div style={styles.graphArea}>
        {nodes.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>◈</div>
            <div>Waiting for orchestrator to decompose query...</div>
          </div>
        ) : (
          <div style={styles.nodesList}>
            {nodes.map((node) => {
              const depCount = edges.filter(e => e.to === node.id).length;
              return (
                <div key={node.id} style={styles.node(node.status)}>
                  <div style={styles.nodeLeft}>
                    <div style={styles.nodeId}>T{node.id}</div>
                    <div style={styles.depBadge}>
                      {depCount > 0 ? `${depCount} DEPS` : "ROOT"}
                    </div>
                  </div>
                  
                  <div style={styles.nodeInfo}>
                    <div style={styles.nodeAgent}>{node.agent.toUpperCase()}</div>
                    <div style={styles.nodeTask}>{node.task}</div>
                  </div>
                  
                  <div style={styles.nodeStatusWrapper}>
                    <div style={styles.statusDot(node.status)} />
                    <span style={styles.nodeStatusText(node.status)}>{node.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20, background: "#08080f", height: "100%", display: "flex", flexDirection: "column", borderTop: "1px solid #111122" },
  title: { fontSize: 10, letterSpacing: "0.2em", color: "#333355", marginBottom: 20, fontWeight: 800 },
  graphArea: { flex: 1, overflowY: "auto", paddingRight: 5 },
  empty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#222244", fontSize: 11, fontFamily: "'Space Mono', monospace", gap: 15 },
  emptyIcon: { fontSize: 24, color: "#1a1a2a", animation: "pulse 2s infinite" },
  nodesList: { display: "flex", flexDirection: "column", gap: 12 },
  node: (status) => ({
    display: "flex",
    alignItems: "center",
    gap: 15,
    padding: "12px 16px",
    background: status === TaskStatus.RUNNING ? "#00e5ff05" : "#0a0a14",
    border: `1px solid ${
      status === TaskStatus.RUNNING ? "#00e5ff44" : 
      status === TaskStatus.DONE ? "#00ff8c22" : 
      status === TaskStatus.FAILED ? "#ff406044" : "#1a1a2a"
    }`,
    borderRadius: 4,
    boxShadow: status === TaskStatus.RUNNING ? "0 0 15px #00e5ff11" : "none",
    transition: "all 0.3s ease",
  }),
  nodeLeft: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 50 },
  nodeId: { fontSize: 16, fontWeight: 900, color: "#2a2a44", fontFamily: "'Space Mono', monospace" },
  depBadge: { fontSize: 8, color: "#1a1a2a", background: "#00e5ff10", padding: "1px 4px", borderRadius: 2, fontWeight: 700 },
  nodeInfo: { flex: 1 },
  nodeAgent: { fontSize: 9, color: "#00e5ff", letterSpacing: "0.15em", fontWeight: 800, marginBottom: 4 },
  nodeTask: { fontSize: 12, color: "#ccccdd", lineHeight: 1.4, fontFamily: "'Space Mono', monospace" },
  nodeStatusWrapper: { display: "flex", alignItems: "center", gap: 8, minWidth: 80, justifyContent: "flex-end" },
  statusDot: (status) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: 
      status === TaskStatus.DONE ? "#00ff8c" : 
      status === TaskStatus.RUNNING ? "#00e5ff" : 
      status === TaskStatus.FAILED ? "#ff4060" : 
      status === TaskStatus.BLOCKED ? "#ffaa00" : "#222244",
    boxShadow: status === TaskStatus.RUNNING ? "0 0 8px #00e5ff" : "none",
  }),
  nodeStatusText: (status) => ({
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.05em",
    fontFamily: "'Space Mono', monospace",
    color: 
      status === TaskStatus.DONE ? "#00ff8c" : 
      status === TaskStatus.RUNNING ? "#00e5ff" : 
      status === TaskStatus.FAILED ? "#ff4060" : 
      status === TaskStatus.BLOCKED ? "#ffaa00" : "#333355"
  }),
};
