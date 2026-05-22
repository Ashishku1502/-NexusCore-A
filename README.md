# ◈ NexusCore — Multi-Agent AI Operating System

> A production-grade multi-agent orchestration runtime powered by Claude.

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                    │
│  Breaks query → DAG of atomic tasks with dependencies   │
└─────────────┬───────────────────────────────────────────┘
              │  (parallel wave-front execution)
    ┌─────────┼─────────┐
    ▼         ▼         ▼
Research  Reasoning  Execution    ← Parallel where possible
  Agent     Agent      Agent      ← Sequential when dependent
    │         │         │
    └────┬────┘─────────┘
         │  (with retry + prompt mutation)
    ┌────▼────┐
    │ Memory  │  ← Pinecone vector store
    │  Agent  │
    └────┬────┘
         ▼
  ┌──────────────┐
  │  AGGREGATOR  │  ← Merges all outputs
  └──────┬───────┘
         ▼
  Final Answer (via Socket.io → React Dashboard)
```

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-repo/nexuscore
cd nexuscore
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — add ANTHROPIC_API_KEY (required)
# Add PINECONE_API_KEY (optional — falls back to in-memory mock)

# 3. Run
npm run dev    # starts server (3001) + client (5173) concurrently
```

## 🔑 Environment Variables

| Variable | Required | Where | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Railway | Claude API key |
| `PINECONE_API_KEY` | ⚪ | Railway | Vector memory (mock if absent) |
| `PINECONE_INDEX_NAME` | ⚪ | Railway | Index name (default: nexuscore-memory) |
| `PORT` | ⚪ | Railway | Server port (Railway sets automatically) |
| `CLIENT_URL` | ✅ (prod) | Railway | Your Netlify frontend URL (CORS whitelist) |
| `VITE_SERVER_URL` | ✅ (prod) | Netlify | Your Railway backend URL |
| `MOCK_MODE` | ⚪ | Railway | `true` for demo without API key |

---

## 🚀 Deploy to Netlify + Railway

NexusCore uses a split architecture:
- **Frontend** (React/Vite) → **Netlify** (static hosting + CDN)
- **Backend** (Express + Socket.io) → **Railway** (persistent Node.js server)

> Socket.io requires persistent WebSocket connections — Netlify Functions cannot support this, so the backend runs on Railway.

### Step 1 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your NexusCore repository
3. Railway auto-detects `railway.json` and starts `node server/index.js`
4. Go to **Variables** tab and add:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   CLIENT_URL=https://your-app.netlify.app
   MOCK_MODE=false
   ```
5. Go to **Settings → Networking** → **Generate Domain**  
   Copy your Railway URL: `https://nexuscore-xxx.up.railway.app`

### Step 2 — Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Select your NexusCore repository
3. Netlify auto-detects `netlify.toml` (build command + publish dir are pre-configured)
4. Go to **Site configuration → Environment variables** and add:
   ```
   VITE_SERVER_URL=https://nexuscore-xxx.up.railway.app
   ```
5. Click **Deploy site**

### Step 3 — Update CORS on Railway

Once you have your Netlify URL (e.g. `https://nexuscore-ai.netlify.app`):

1. Go to Railway → your project → **Variables**
2. Update: `CLIENT_URL=https://nexuscore-ai.netlify.app`
3. Railway auto-redeploys

### Architecture in Production

```
Browser (Netlify CDN)
    │
    │  Socket.io WebSocket + REST
    ▼
Railway (Express + Socket.io server)
    │
    └── Anthropic Claude API
    └── Pinecone (optional)
```



## 🧩 Architecture

### Agents

| Agent | Role | Output |
|---|---|---|
| **Orchestrator** | Plans task DAG | JSON task list with dependencies |
| **Research** | Retrieves knowledge | Synthesized facts + confidence |
| **Reasoning** | Multi-step logic | Chain-of-thought conclusions |
| **Execution** | Generates deliverables | Code, plans, architecture, docs |
| **Memory** | Vector I/O | Stores + retrieves context embeddings |
| **Aggregator** | Synthesis | Final coherent answer |

### Advanced Features

#### ✅ DAG Scheduling
Tasks execute in dependency order. Independent tasks run **in parallel**.
```
Task 1 (research)  ─┐
Task 2 (research)  ─┤─→ Task 4 (reasoning) ─→ Task 5 (execution)
Task 3 (research)  ─┘
```

#### ✅ Retry System
Each agent retries up to 3 times with **exponential backoff** (500ms, 1s, 2s).
Each retry **mutates the prompt** to help the model correct itself.

#### ✅ Memory Context Window
Task outputs are stored in Pinecone and passed to downstream tasks as context.
The Memory Agent compresses large context windows to stay within token limits.

#### ✅ Agent Abort
Users can abort mid-session. Clean teardown, no dangling promises.

#### ✅ Real-time DAG Visualization
The frontend renders the task graph live with status colors:
- 🔵 Running (cyan glow)
- 🟢 Done (green)
- 🔴 Failed (red)
- 🟡 Blocked (orange — dep failed)
- ⬛ Pending (dark)

## 📁 Project Structure

```
nexuscore/
├── server/
│   ├── agents/
│   │   ├── orchestrator.js      # Task planner + DAG builder
│   │   ├── researchAgent.js     # Knowledge retrieval + synthesis
│   │   ├── reasoningAgent.js    # Chain-of-thought logic
│   │   ├── executionAgent.js    # Final output generator
│   │   ├── memoryAgent.js       # Pinecone I/O + compression
│   │   ├── aggregator.js        # Result synthesis
│   │   └── agentRouter.js       # Routes tasks to agents
│   ├── memory/
│   │   └── pinecone.js          # Pinecone client + mock fallback
│   ├── sockets/
│   │   └── stream.js            # Socket.io event emitters
│   ├── utils/
│   │   ├── dag.js               # DAGScheduler class
│   │   ├── retry.js             # withRetry + prompt mutation
│   │   └── llm.js               # Anthropic SDK wrapper
│   └── index.js                 # Express + Socket.io server
├── client/
│   └── src/
│       ├── components/
│       │   ├── AgentStatusPanel.jsx  # Agent grid with live status
│       │   ├── LiveLogsStream.jsx    # Terminal log stream
│       │   ├── TaskGraphView.jsx     # SVG DAG visualization
│       │   └── OutputPanel.jsx       # Final result with markdown
│       ├── hooks/
│       │   └── useSocket.js          # Socket.io state management
│       ├── App.jsx                   # Main dashboard layout
│       └── main.jsx                  # Entry point
├── shared/
│   └── types.js                 # Shared constants
└── .env.example
```

## 🔌 Extending NexusCore

### Add a new agent

1. Create `server/agents/myAgent.js` following the pattern:
   ```js
   export async function runMyAgent(task, { onLog }) { ... }
   ```
2. Register it in `agentRouter.js`:
   ```js
   case "my_agent":
     result = await runMyAgent(enrichedTask, { onLog });
     break;
   ```
3. Add it to the orchestrator's system prompt agent list.

### Add a tool (API calls, code execution, etc.)

1. Define the tool schema in `utils/llm.js` → `AGENT_TOOLS`
2. Pass it to the agent's `callLLM` call
3. Handle `toolCalls` in the agent response loop

## 🏆 What makes NexusCore stand out

- **True DAG scheduling** — not just sequential agents
- **Parallel execution** — independent tasks run simultaneously
- **Prompt mutation on retry** — smarter than just retrying
- **Memory context windows** — long-term state across tasks
- **Real-time everything** — Socket.io from plan → result
- **Production patterns** — error boundaries, abort support, structured logging
