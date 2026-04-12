import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "hyperliquid-data",
  slug: "hyperliquid-data",
  description: "Hyperliquid perpetual futures market data: order book, prices, funding, OI, candles.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/orderbook",
      price: "$0.001",
      description: "L2 order book for a Hyperliquid perp pair",
      toolName: "hyperliquid_get_market_data",
      toolDescription:
        "Use this when you need Hyperliquid perpetual futures data. Returns order book depth, mid prices, mark prices, funding rates, open interest, 24h volume for any HL perp pair in one call. Do NOT use for EVM gas — use gas_get_current_price. Do NOT use for spot DEX quotes — use dex_get_swap_quote.",
      inputSchema: {
        type: "object",
        properties: {
          coin: {
            type: "string",
            description: "Coin symbol (e.g. BTC, ETH, SOL, ARB, DOGE)",
          },
        },
        required: ["coin"],
      },
    },
    {
      method: "GET",
      path: "/api/markets",
      price: "$0.001",
      description: "All mid prices, funding rates, OI, volume for every Hyperliquid asset",
      toolName: "hyperliquid_get_all_markets",
      toolDescription:
        "Use this when you need a snapshot of all Hyperliquid perpetual markets. Returns mid prices, mark prices, funding rates, open interest, and 24h volume for every listed asset. Do NOT use for a single coin order book — use hyperliquid_get_market_data. Do NOT use for spot DEX quotes — use dex_get_swap_quote.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      method: "GET",
      path: "/api/candles",
      price: "$0.002",
      description: "OHLCV candlestick data for a Hyperliquid perp pair",
      toolName: "hyperliquid_get_candles",
      toolDescription:
        "Use this when you need historical OHLCV candlestick data for a Hyperliquid perpetual. Returns open, high, low, close, volume for the specified interval. Do NOT use for real-time order book — use hyperliquid_get_market_data. Do NOT use for spot DEX quotes — use dex_get_swap_quote.",
      inputSchema: {
        type: "object",
        properties: {
          coin: {
            type: "string",
            description: "Coin symbol (e.g. BTC, ETH, SOL)",
          },
          interval: {
            type: "string",
            description: "Candle interval (1m, 5m, 15m, 1h, 4h, 1d)",
          },
          limit: {
            type: "number",
            description: "Number of candles to return (default 100, max 5000)",
          },
        },
        required: ["coin"],
      },
    },
  ],
};
