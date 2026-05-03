// ─────────────────────────────────────────────
//  NexusCore — LLM Wrapper (Anthropic)
// ─────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callLLM({ system, messages, maxTokens = 1000, temperature = 0.7 }) {
  if (process.env.MOCK_MODE === "true") {
    return getMockResponse(system, messages);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: maxTokens,
      temperature: temperature,
      system: system,
      messages: messages,
    });

    return {
      text: response.content[0].text,
      usage: response.usage,
    };
  } catch (err) {
    console.error("[LLM] Call failed:", err);
    throw new Error(`LLM call failed: ${err.message}`);
  }
}

/**
 * ── MOCK LLM ENGINE ──────────────────────────────────────
 * Generates realistic simulated responses for demo/testing
 */
function getMockResponse(system, messages) {
  const isOrchestrator = system.includes("Orchestrator Agent");
  const isAggregator = system.includes("Aggregator Agent");
  const isResearch = system.includes("Research Agent");
  const isReasoning = system.includes("Reasoning Agent");
  const isExecution = system.includes("Execution Agent");

  const queryMatch = system.match(/User Request:\n([\s\S]*?)\n\nAgent Results:/) || system.match(/User Request:\n([\s\S]*)$/);
  const actualQuery = queryMatch ? queryMatch[1].trim() : "user request";
  const shortQuery = actualQuery.length > 50 ? actualQuery.slice(0, 47) + "..." : actualQuery;

  let text = "Simulation response generated.";
  let usage = { input_tokens: 100, output_tokens: 250 };

  if (isOrchestrator) {
    text = JSON.stringify({
      plan_summary: `Developing comprehensive solution for: ${shortQuery}`,
      tasks: [
        { id: 1, agent: "research", task: `Gather details on ${shortQuery}`, dependencies: [], priority: 1 },
        { id: 2, agent: "research", task: `Search for best practices and benchmarks`, dependencies: [], priority: 1 },
        { id: 3, agent: "reasoning", task: "Analyze trade-offs and define core logic", dependencies: [1, 2], priority: 2 },
        { id: 4, agent: "execution", task: "Generate final implementation plan and deliverables", dependencies: [3], priority: 3 }
      ]
    });
  } else if (isAggregator) {
    text = `# ◈ Project Outcome: ${shortQuery}\n\n## Summary\nSuccessfully orchestrated a multi-agent workflow to address your request. Research and reasoning phases have been synthesized into the final output.\n\n## Key Highlights\n- **Comprehensive Research**: Synthesized cross-domain knowledge.\n- **Optimized Reasoning**: Validated logical consistency and performance trade-offs.\n- **Actionable Execution**: Generated complete deliverables.\n\n*This is a simulated response for demonstration purposes.*`;
    usage = { input_tokens: 450, output_tokens: 1200 };
  } else if (isResearch) {
    text = `### Research Synthesis\nSuccessfully retrieved and cross-referenced data related to your query about ${shortQuery}. Key findings include multiple viable patterns and standard industry benchmarks. Confidence: 94%.`;
  } else if (isReasoning) {
    text = `### Analytical Conclusion\nBased on the research data for ${shortQuery}, the optimal approach involves balancing scalability with immediate deployment needs. The logic has been verified for edge cases.`;
  } else if (isExecution) {
    text = `### Final Deliverable\nGenerating production-ready output for ${shortQuery} based on the defined reasoning. All components are aligned with the project specification.`;
  }

  return { text, usage };
}

export const AGENT_TOOLS = [
  // Define tools here if needed for specific agents
];
