import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "hyperliquid-data",
  slug: "hyperliquid-data",
  description: "Hyperliquid perp market data -- order books, prices, funding rates, OI, volume, OHLCV candles in one API.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/orderbook",
      price: "$0.001",
      description: "L2 order book for a Hyperliquid perp pair",
      toolName: "hyperliquid_get_market_data",
      toolDescription: `Use this when you need Hyperliquid perpetual futures data for a specific coin. Returns full L2 order book depth with real-time pricing and funding metrics in one call.

1. bids: array of bid levels with price and size
2. asks: array of ask levels with price and size
3. midPrice: current mid price between best bid/ask
4. markPrice: oracle mark price used for liquidations
5. fundingRate: current hourly funding rate (e.g. 0.0001 = 0.01%)
6. openInterest: total open interest in USD
7. volume24h: 24-hour trading volume in USD

Example output: {"midPrice":67450.5,"markPrice":67448.2,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"bids":[{"price":67450,"size":12.5}],"asks":[{"price":67451,"size":8.3}]}

Use this BEFORE placing trades on Hyperliquid. Essential for checking spread, depth, and funding before entering a position.

Do NOT use for EVM gas -- use gas_get_current_price. Do NOT use for spot DEX quotes -- use dex_get_swap_quote. Do NOT use for whale positions -- use hyperliquid_track_whale_positions.`,
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
      toolDescription: `Use this when you need a snapshot of all Hyperliquid perpetual markets at once. Returns pricing, funding, and volume data for every listed asset in a single call.

1. markets: array of all listed perp assets
2. Each market contains: coin, midPrice, markPrice, fundingRate, openInterest, volume24h, dayChange
3. totalMarkets: number of listed perp markets
4. timestamp: data timestamp in ISO format

Example output: {"markets":[{"coin":"BTC","midPrice":67450,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"dayChange":2.3},{"coin":"ETH","midPrice":3520,"fundingRate":0.00012,"openInterest":890000000,"volume24h":1200000000,"dayChange":1.1}],"totalMarkets":148}

Use this FOR screening all Hyperliquid markets, finding highest funding rates, or building a market overview dashboard.

Do NOT use for a single coin order book -- use hyperliquid_get_market_data. Do NOT use for spot DEX quotes -- use dex_get_swap_quote. Do NOT use for vault performance -- use hyperliquid_get_vault_data.`,
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
      toolDescription: `Use this when you need historical OHLCV candlestick data for a Hyperliquid perpetual pair. Returns open, high, low, close, volume for the specified interval.

1. candles: array of OHLCV bars
2. Each candle contains: timestamp, open, high, low, close, volume
3. coin: the coin symbol queried
4. interval: the candle interval used
5. count: number of candles returned

Example output: {"coin":"BTC","interval":"1h","count":100,"candles":[{"timestamp":"2026-04-13T10:00:00Z","open":67200,"high":67550,"low":67100,"close":67450,"volume":45000000}]}

Use this FOR technical analysis, backtesting strategies, or charting price history on Hyperliquid perps.

Do NOT use for real-time order book -- use hyperliquid_get_market_data. Do NOT use for spot DEX quotes -- use dex_get_swap_quote. Do NOT use for whale tracking -- use hyperliquid_track_whale_positions.`,
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
