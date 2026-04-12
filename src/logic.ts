import type { Hono } from "hono";

// --- Cache ---
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttlMs) return entry.data as T;
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// --- Hyperliquid info endpoint ---
const HL_INFO = "https://api.hyperliquid.xyz/info";

async function hlPost(body: Record<string, unknown>): Promise<any> {
  const resp = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Hyperliquid API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// --- Valid intervals ---
const VALID_INTERVALS = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"];

export function registerRoutes(app: Hono) {
  // GET /api/orderbook?coin=BTC
  app.get("/api/orderbook", async (c) => {
    const coin = c.req.query("coin")?.toUpperCase();
    if (!coin) {
      return c.json(
        { error: "Missing required parameter: coin", example: "/api/orderbook?coin=BTC" },
        400
      );
    }

    const cacheKey = `orderbook_${coin}`;
    const cached = getCached<any>(cacheKey, 2_000);
    if (cached) return c.json(cached);

    try {
      const book = await hlPost({ type: "l2Book", coin });

      // Also fetch meta for context (mark price, funding, OI)
      const metaCacheKey = "meta_all";
      let meta = getCached<any>(metaCacheKey, 2_000);
      if (!meta) {
        meta = await hlPost({ type: "metaAndAssetCtxs" });
        setCache(metaCacheKey, meta);
      }

      // Find this coin in meta
      const universe = meta?.[0]?.universe || [];
      const assetCtxs = meta?.[1] || [];
      const idx = universe.findIndex((u: any) => u.name === coin);
      const ctx = idx >= 0 ? assetCtxs[idx] : null;

      const levels = book?.levels || [[], []];
      const bids = levels[0]?.map((l: any) => ({ price: l.px, size: l.sz, count: l.n })) || [];
      const asks = levels[1]?.map((l: any) => ({ price: l.px, size: l.sz, count: l.n })) || [];

      const bestBid = bids[0]?.price ? parseFloat(bids[0].price) : null;
      const bestAsk = asks[0]?.price ? parseFloat(asks[0].price) : null;
      const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
      const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
      const spreadBps = midPrice && spread ? parseFloat(((spread / midPrice) * 10000).toFixed(2)) : null;

      const result = {
        coin,
        midPrice,
        bestBid,
        bestAsk,
        spread,
        spreadBps,
        markPrice: ctx ? parseFloat(ctx.markPx) : null,
        fundingRate: ctx ? parseFloat(ctx.funding) : null,
        openInterest: ctx ? parseFloat(ctx.openInterest) : null,
        volume24h: ctx ? parseFloat(ctx.dayNtlVlm) : null,
        bids: bids.slice(0, 20),
        asks: asks.slice(0, 20),
        timestamp: Date.now(),
      };

      setCache(cacheKey, result);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: "Failed to fetch order book", details: err.message }, 502);
    }
  });

  // GET /api/markets
  app.get("/api/markets", async (c) => {
    const cacheKey = "markets_all";
    const cached = getCached<any>(cacheKey, 2_000);
    if (cached) return c.json(cached);

    try {
      // Fetch allMids + metaAndAssetCtxs in parallel
      const [mids, meta] = await Promise.all([
        hlPost({ type: "allMids" }),
        hlPost({ type: "metaAndAssetCtxs" }),
      ]);

      const universe = meta?.[0]?.universe || [];
      const assetCtxs = meta?.[1] || [];

      const markets = universe.map((asset: any, i: number) => {
        const ctx = assetCtxs[i] || {};
        const name = asset.name;
        return {
          coin: name,
          midPrice: mids?.[name] ? parseFloat(mids[name]) : null,
          markPrice: ctx.markPx ? parseFloat(ctx.markPx) : null,
          fundingRate: ctx.funding ? parseFloat(ctx.funding) : null,
          openInterest: ctx.openInterest ? parseFloat(ctx.openInterest) : null,
          volume24h: ctx.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : null,
          prevDayPrice: ctx.prevDayPx ? parseFloat(ctx.prevDayPx) : null,
          priceChange24h:
            ctx.markPx && ctx.prevDayPx
              ? parseFloat(
                  (
                    ((parseFloat(ctx.markPx) - parseFloat(ctx.prevDayPx)) /
                      parseFloat(ctx.prevDayPx)) *
                    100
                  ).toFixed(4)
                )
              : null,
          maxLeverage: asset.maxLeverage ?? null,
          szDecimals: asset.szDecimals ?? null,
        };
      });

      // Sort by 24h volume descending
      markets.sort((a: any, b: any) => (b.volume24h || 0) - (a.volume24h || 0));

      const result = {
        totalAssets: markets.length,
        timestamp: Date.now(),
        markets,
      };

      setCache(cacheKey, result);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: "Failed to fetch markets", details: err.message }, 502);
    }
  });

  // GET /api/candles?coin=BTC&interval=1h&limit=100
  app.get("/api/candles", async (c) => {
    const coin = c.req.query("coin")?.toUpperCase();
    const interval = c.req.query("interval") || "1h";
    const limit = Math.min(parseInt(c.req.query("limit") || "100", 10), 5000);

    if (!coin) {
      return c.json(
        { error: "Missing required parameter: coin", example: "/api/candles?coin=BTC&interval=1h&limit=100" },
        400
      );
    }

    if (!VALID_INTERVALS.includes(interval)) {
      return c.json(
        { error: `Invalid interval: ${interval}`, validIntervals: VALID_INTERVALS },
        400
      );
    }

    const cacheKey = `candles_${coin}_${interval}_${limit}`;
    const cached = getCached<any>(cacheKey, 30_000);
    if (cached) return c.json(cached);

    try {
      const endTime = Date.now();
      // Calculate startTime based on interval and limit
      const intervalMs: Record<string, number> = {
        "1m": 60_000, "3m": 180_000, "5m": 300_000, "15m": 900_000,
        "30m": 1_800_000, "1h": 3_600_000, "2h": 7_200_000, "4h": 14_400_000,
        "8h": 28_800_000, "12h": 43_200_000, "1d": 86_400_000, "3d": 259_200_000,
        "1w": 604_800_000, "1M": 2_592_000_000,
      };
      const startTime = endTime - (intervalMs[interval] || 3_600_000) * (limit + 1);

      const data = await hlPost({
        type: "candleSnapshot",
        req: { coin, interval, startTime, endTime },
      });

      const candles = (Array.isArray(data) ? data : []).slice(-limit).map((c: any) => ({
        timestamp: c.t,
        open: parseFloat(c.o),
        high: parseFloat(c.h),
        low: parseFloat(c.l),
        close: parseFloat(c.c),
        volume: parseFloat(c.v),
      }));

      const result = {
        coin,
        interval,
        count: candles.length,
        cachedUntil: new Date(Date.now() + 30_000).toISOString(),
        candles,
      };

      setCache(cacheKey, result);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: "Failed to fetch candles", details: err.message }, 502);
    }
  });
}
