// Public market-data adapters used by exmxc intelligence surfaces.
// Hyperliquid is treated as a supplemental real-time signal, not as the canonical
// exchange price for listed equities. HIP-3 perpetuals can trade away from cash equities.

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_SYMBOLS = 25;

function timeoutSignal(ms = DEFAULT_TIMEOUT_MS) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function hlInfo(body, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: timeoutSignal(timeoutMs)
  });
  if (!response.ok) throw new Error(`Hyperliquid info ${body?.type || "request"}: ${response.status}`);
  return response.json();
}

function normalizeRequestedSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^\$+/, "")
    .replace(/\s+/g, "");
}

function terminalSymbol(name) {
  const raw = String(name || "");
  const suffix = raw.includes(":") ? raw.split(":").pop() : raw;
  return normalizeRequestedSymbol(suffix);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current / previous) - 1) * 100;
}

async function getDexCatalog() {
  const payload = await hlInfo({ type: "perpDexs" });
  if (!Array.isArray(payload)) return [{ name: "", fullName: "Hyperliquid" }];
  return payload.map((entry, index) => {
    if (entry === null) return { name: "", fullName: "Hyperliquid", index };
    return { name: String(entry?.name || ""), fullName: String(entry?.fullName || entry?.name || ""), index };
  });
}

async function getDexMarkets(dex) {
  const body = { type: "metaAndAssetCtxs" };
  if (dex) body.dex = dex;
  const payload = await hlInfo(body);
  const meta = Array.isArray(payload) ? payload[0] : null;
  const contexts = Array.isArray(payload) ? payload[1] : null;
  const universe = Array.isArray(meta?.universe) ? meta.universe : [];
  return universe.map((asset, index) => ({
    asset,
    context: Array.isArray(contexts) ? contexts[index] || {} : {}
  }));
}

function quoteFromMatch(requested, dexInfo, match) {
  const { asset, context } = match;
  const mid = toNumber(context?.midPx);
  const mark = toNumber(context?.markPx);
  const oracle = toNumber(context?.oraclePx);
  const previous = toNumber(context?.prevDayPx);
  const price = mid ?? mark ?? oracle;
  return {
    requested_symbol: requested,
    symbol: terminalSymbol(asset?.name),
    hyperliquid_coin: asset?.name || null,
    dex: dexInfo?.name || "",
    dex_name: dexInfo?.fullName || (dexInfo?.name ? dexInfo.name : "Hyperliquid"),
    price,
    price_basis: mid !== null ? "mid" : (mark !== null ? "mark" : (oracle !== null ? "oracle" : null)),
    mid_price: mid,
    mark_price: mark,
    oracle_price: oracle,
    previous_day_price: previous,
    change_pct_vs_previous_day: pctChange(price, previous),
    funding_rate: toNumber(context?.funding),
    open_interest: toNumber(context?.openInterest),
    day_notional_volume: toNumber(context?.dayNtlVlm),
    day_base_volume: toNumber(context?.dayBaseVlm),
    source: "Hyperliquid public API",
    venue_type: dexInfo?.name ? "HIP-3 perpetual dex" : "Hyperliquid perpetual dex",
    is_cash_equity_price: false,
    as_of: new Date().toISOString()
  };
}

export async function getHyperliquidQuote(symbol, { dex = null } = {}) {
  const requested = normalizeRequestedSymbol(symbol);
  if (!requested) return { success: false, error: "symbol is required" };

  const catalog = await getDexCatalog();
  const dexes = dex !== null
    ? catalog.filter((entry) => entry.name.toLowerCase() === String(dex).toLowerCase())
    : catalog;

  if (!dexes.length) return { success: false, error: "Unknown Hyperliquid perp dex", symbol: requested, dex };

  const matches = [];
  for (const dexInfo of dexes) {
    try {
      const markets = await getDexMarkets(dexInfo.name);
      for (const market of markets) {
        if (terminalSymbol(market?.asset?.name) === requested) {
          matches.push(quoteFromMatch(requested, dexInfo, market));
        }
      }
    } catch (error) {
      // Continue across dexes; one builder-deployed dex should not take down discovery.
      matches.push({
        requested_symbol: requested,
        dex: dexInfo?.name || "",
        error: String(error?.message || error),
        source: "Hyperliquid public API"
      });
    }
  }

  const valid = matches.filter((item) => item && item.price !== null && item.price !== undefined);
  if (!valid.length) {
    return {
      success: false,
      symbol: requested,
      error: "Symbol not found on Hyperliquid perpetual markets",
      checked_dexes: dexes.map((item) => item.name || "main"),
      as_of: new Date().toISOString()
    };
  }

  valid.sort((a, b) => (b.day_notional_volume || 0) - (a.day_notional_volume || 0));
  return {
    success: true,
    symbol: requested,
    primary: valid[0],
    alternatives: valid.slice(1),
    warning: "Hyperliquid perpetual pricing is a market signal and may diverge from the underlying cash equity or ETF price.",
    as_of: new Date().toISOString()
  };
}

export async function getHyperliquidQuotes(symbols, options = {}) {
  const requested = Array.from(new Set(
    (Array.isArray(symbols) ? symbols : String(symbols || "").split(","))
      .map(normalizeRequestedSymbol)
      .filter(Boolean)
  ));
  if (!requested.length) return { success: false, error: "At least one symbol is required" };
  if (requested.length > MAX_SYMBOLS) return { success: false, error: `Maximum ${MAX_SYMBOLS} symbols per request` };

  const results = [];
  for (const symbol of requested) {
    try {
      results.push(await getHyperliquidQuote(symbol, options));
    } catch (error) {
      results.push({ success: false, symbol, error: String(error?.message || error) });
    }
  }

  return {
    success: results.some((item) => item?.success),
    source: "Hyperliquid public API",
    requested_symbols: requested,
    results,
    as_of: new Date().toISOString(),
    warning: "Perpetual-market prices are supplemental signals, not authoritative cash-equity quotes."
  };
}
