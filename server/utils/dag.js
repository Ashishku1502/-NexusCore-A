// ─────────────────────────────────────────────
//  NexusCore — Task DAG Scheduler
//
//  Manages task dependency resolution.
//  Tasks with no unmet dependencies run in parallel.
//  Tasks with dependencies wait until deps complete.
// ─────────────────────────────────────────────

import { TaskStatus } from "../../shared/types.js";

export class DAGScheduler {
  constructor(tasks) {
    // tasks: [{ id, agent, task, dependencies: [id] }]
    this.nodes = new Map();
    this.status = new Map();
    this.results = new Map();
    this.onStatusChange = null; // callback(taskId, status)

    for (const t of tasks) {
      this.nodes.set(t.id, { ...t, dependencies: t.dependencies || [] });
      this.status.set(t.id, TaskStatus.PENDING);
    }
  }

  // ── Serialize graph for frontend visualization ──────
  toGraphData() {
    const nodes = [];
    const edges = [];

    for (const [id, node] of this.nodes) {
      nodes.push({
        id,
        agent: node.agent,
        task: node.task,
        status: this.status.get(id),
      });

      for (const dep of node.dependencies) {
        edges.push({ from: dep, to: id });
      }
    }

    return { nodes, edges };
  }

  // ── Get tasks ready to run (no pending deps) ────────
  getReadyTasks() {
    const ready = [];

    for (const [id, node] of this.nodes) {
      if (this.status.get(id) !== TaskStatus.PENDING) continue;

      const allDepsDone = node.dependencies.every(
        (dep) => this.status.get(dep) === TaskStatus.DONE
      );
      const anyDepFailed = node.dependencies.some(
        (dep) => this.status.get(dep) === TaskStatus.FAILED
      );

      if (anyDepFailed) {
        this._setStatus(id, TaskStatus.BLOCKED);
        continue;
      }

      if (allDepsDone) {
        ready.push(node);
      }
    }

    return ready;
  }

  // ── Check if all tasks are terminal ─────────────────
  isComplete() {
    const terminal = [TaskStatus.DONE, TaskStatus.FAILED, TaskStatus.BLOCKED];
    return [...this.status.values()].every((s) => terminal.includes(s));
  }

  // ── Mark task running ────────────────────────────────
  markRunning(id) {
    this._setStatus(id, TaskStatus.RUNNING);
  }

  // ── Mark task done with result ───────────────────────
  markDone(id, result) {
    this.results.set(id, result);
    this._setStatus(id, TaskStatus.DONE);
  }

  // ── Mark task failed ─────────────────────────────────
  markFailed(id, error) {
    this.results.set(id, { error: error?.message || String(error) });
    this._setStatus(id, TaskStatus.FAILED);
  }

  // ── Get context for a task (resolved dep outputs) ───
  getDependencyContext(id) {
    const node = this.nodes.get(id);
    if (!node) return {};

    const ctx = {};
    for (const dep of node.dependencies) {
      const result = this.results.get(dep);
      if (result) ctx[dep] = result;
    }
    return ctx;
  }

  // ── All collected results ────────────────────────────
  getAllResults() {
    return Object.fromEntries(this.results);
  }

  // ── Summary stats ────────────────────────────────────
  getStats() {
    const counts = { pending: 0, running: 0, done: 0, failed: 0, blocked: 0 };
    for (const s of this.status.values()) counts[s] = (counts[s] || 0) + 1;
    return counts;
  }

  _setStatus(id, status) {
    this.status.set(id, status);
    if (this.onStatusChange) this.onStatusChange(id, status);
  }
}

// ── Topological sort (for display ordering) ─────────────
export function topologicalSort(tasks) {
  const result = [];
  const visited = new Set();
  const depMap = new Map(tasks.map((t) => [t.id, t.dependencies || []]));

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dep of depMap.get(id) || []) visit(dep);
    const task = tasks.find((t) => t.id === id);
    if (task) result.push(task);
  }

  for (const t of tasks) visit(t.id);
  return result;
}
