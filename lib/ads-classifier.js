import {
  TIER_KEYWORDS,
  DEPLOYMENT_SIGNALS,
  EXPLORATION_SIGNALS,
  LEADERSHIP_SIGNALS
} from "./ads-taxonomy.js";

const CLASSIFIER_SYSTEM_PROMPT = `Classify each AI job posting into a maturity tier and return ONLY valid JSON (no markdown).
Format:
{"classified":[{"posting_id":"string","tier":1,"mcp_signal":false,"deployment_signal":true,"exploration_signal":false,"leadership":false,"confidence":0.9}]}
Rules:
- T1 = strategy/governance/literacy/policy
- T2 = data scientist/RAG/embeddings/LangChain
- T3 = ML/LLM Engineer/MLOps/model deployment
- T4 = AI agent/multi-agent/LangGraph/CrewAI/tool use/function calling
- T4 + MCP = MCP/Model Context Protocol (mcp_signal:true)
- T5 = foundation model/RLHF/pre-training/custom silicon
- deployment_signal=true if engineer/infra/platform/systems/architect/developer present
- exploration_signal=true if strategy/transformation/governance/policy/literacy present
- leadership=true if head of/director/vp/principal/staff/distinguished present`;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export async function classifyPostings(postings, anthropicApiKey) {
  try {
    if (!Array.isArray(postings) || postings.length === 0 || !anthropicApiKey) {
      return [];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `${CLASSIFIER_SYSTEM_PROMPT}\n\nTaxonomy reference:\n${JSON.stringify(TIER_KEYWORDS)}`,
        messages: [
          {
            role: "user",
            content: JSON.stringify(postings)
          }
        ]
      })
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const text = payload?.content?.[0]?.text;
    if (!text) {
      return [];
    }

    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.classified) ? parsed.classified : [];
  } catch {
    return [];
  }
}

export function computeADS(classified, currentCount, priorCount) {
  if (!Array.isArray(classified) || classified.length === 0) {
    return null;
  }

  const tierWeights = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6 };

  let weightedTotal = 0;
  let deployCount = 0;
  let exploreCount = 0;
  let mcpSignalCount = 0;

  for (const item of classified) {
    const tier = Number(item?.tier);
    let weight = tierWeights[tier] ?? 1;

    if (item?.mcp_signal) {
      weight *= 1.5;
      mcpSignalCount += 1;
    }

    if (item?.leadership) {
      weight *= 1.2;
    }

    if (item?.deployment_signal === true) {
      deployCount += 1;
    }

    if (item?.exploration_signal === true) {
      exploreCount += 1;
    }

    if (item?.deployment_signal !== true && item?.exploration_signal !== true) {
      const text = `${item?.title || ""} ${(item?.skills_raw || []).join(" ")}`.toLowerCase();
      if (DEPLOYMENT_SIGNALS.some((signal) => text.includes(signal))) {
        deployCount += 1;
      }
      if (EXPLORATION_SIGNALS.some((signal) => text.includes(signal))) {
        exploreCount += 1;
      }
      if (!item?.leadership && LEADERSHIP_SIGNALS.some((signal) => text.includes(signal))) {
        weight *= 1.2;
      }
    }

    weightedTotal += weight;
  }

  const avgWeighted = weightedTotal / classified.length;
  const rsi = ((avgWeighted - 1) / (6 - 1)) * 100;

  const der = deployCount + exploreCount > 0 ? deployCount / (deployCount + exploreCount) : 0.5;

  let vs = 50;
  if (priorCount > 0) {
    const rawVS = ((currentCount - priorCount) / priorCount) * 100;
    vs = (clamp(rawVS, -100, 100) + 100) / 2;
  }

  const adsScore = (rsi * 0.4) + (der * 100 * 0.35) + (vs * 0.25);

  let adsTier = 1;
  if (adsScore >= 86) {
    adsTier = 5;
  } else if (adsScore >= 61) {
    adsTier = 4;
  } else if (adsScore >= 41) {
    adsTier = 3;
  } else if (adsScore >= 21) {
    adsTier = 2;
  }

  return {
    rsi: round1(rsi),
    der: round1(der),
    vs: round1(vs),
    ads_score: round1(adsScore),
    ads_tier: round1(adsTier),
    mcp_signal_count: round1(mcpSignalCount),
    mcp_weight_applied: round1(mcpSignalCount * 1.5)
  };
}
