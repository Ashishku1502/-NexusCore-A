// ─────────────────────────────────────────────
//  NexusCore — Retry Utilities
// ─────────────────────────────────────────────

export async function withRetry(fn, { agentName, maxRetries = 3, onRetry } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn(attempt);
      return { result, attempts: attempt };
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;

      const delay = Math.pow(2, attempt - 1) * 500; // 500ms, 1s, 2s
      onRetry?.({ attempt, error: err.message, agent: agentName });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export function mutatPromptOnRetry(originalPrompt, attempt, errorContext) {
  return `${originalPrompt}

---
RETRY ATTEMPT ${attempt}
Previous error: ${errorContext}

Please correct your output. Ensure it strictly follows the JSON format and rules provided.`;
}

export function safeParseJSON(text) {
  try {
    // 1. Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const clean = jsonMatch ? jsonMatch[1] : text.trim();
    
    // 2. Remove any common prefix junk (e.g. "Here is the JSON:") 
    // by finding the first '{' and last '}'
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = clean.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonCandidate);
    }

    return JSON.parse(clean);
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${err.message}. Original text: ${text.slice(0, 150)}...`);
  }
}
