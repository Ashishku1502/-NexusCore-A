// ─────────────────────────────────────────────
//  NexusCore — Memory Client (Pinecone)
// ─────────────────────────────────────────────

let isMock = true;
const inMemoryStore = new Map();

export function initMemory() {
  if (!process.env.PINECONE_API_KEY) {
    console.log("[Memory] PINECONE_API_KEY missing. Falling back to in-memory mock.");
    isMock = true;
    return;
  }
  
  console.log("[Memory] Pinecone initialized (mock for now in prototype)");
  isMock = true; 
}

export async function storeMemory(id, vector, metadata) {
  if (isMock) {
    inMemoryStore.set(id, { vector, metadata });
    return;
  }
  // Real Pinecone implementation would go here
}

export async function queryMemory(vector, topK = 5) {
  if (isMock) {
    // Simple mock retrieval
    return Array.from(inMemoryStore.values()).slice(0, topK);
  }
  // Real Pinecone implementation would go here
}
