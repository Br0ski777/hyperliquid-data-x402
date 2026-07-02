# Hyperliquid Perp Market Data API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://hyperliquid-data.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](#license)

Hyperliquid perpetual futures market data — L2 order books, mid/mark prices, funding rates, open interest, volume, and OHLCV candles, in one API. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) — no API key, no signup.

Part of the [klymax402](https://klymax402.com) marketplace — 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart — MCP

```json
{
  "mcpServers": {
    "hyperliquid-data": {
      "url": "https://hyperliquid-data.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart — HTTP (x402)

```bash
curl "https://hyperliquid-data.api.klymax402.com/api/orderbook?coin=BTC"
# → 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client (`@x402/fetch`, [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 → sign → retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `hyperliquid_get_market_data` | GET | `/api/orderbook` | $0.001 | L2 order book for a Hyperliquid perp pair |
| `hyperliquid_get_all_markets` | GET | `/api/markets` | $0.001 | Mid prices, funding, OI, volume for every listed asset |
| `hyperliquid_get_candles` | GET | `/api/candles` | $0.002 | OHLCV candlestick data for a Hyperliquid perp pair |

### `hyperliquid_get_market_data`

Use this when you need Hyperliquid perpetual futures data for a specific coin. Returns full L2 order book depth with real-time pricing and funding metrics in one call.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. `BTC`, `ETH`, `SOL`, `ARB`, `DOGE`) |

**Returns**: `bids`/`asks` (price+size levels), `midPrice`, `markPrice`, `fundingRate` (hourly), `openInterest` (USD), `volume24h` (USD).

Example response:

```json
{"midPrice":67450.5,"markPrice":67448.2,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"bids":[{"price":67450,"size":12.5}],"asks":[{"price":67451,"size":8.3}]}
```

**When to use**: before placing trades on Hyperliquid — essential for checking spread, depth, and funding before entering a position.

**Not for**: EVM gas (use `gas_get_current_price`), spot DEX quotes (use `dex_get_swap_quote`), whale positions (use `hyperliquid_track_whale_positions`).

### `hyperliquid_get_all_markets`

Use this when you need a snapshot of all Hyperliquid perpetual markets at once. Returns pricing, funding, and volume data for every listed asset in a single call.

**Parameters**: none.

**Returns**: `markets[]` (coin, midPrice, markPrice, fundingRate, openInterest, volume24h, dayChange per asset), `totalMarkets`, `timestamp`.

Example response:

```json
{"markets":[{"coin":"BTC","midPrice":67450,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"dayChange":2.3}],"totalMarkets":148}
```

**When to use**: screening all Hyperliquid markets, finding highest funding rates, building a market overview dashboard.

**Not for**: a single coin order book (use `hyperliquid_get_market_data`), spot DEX quotes (use `dex_get_swap_quote`), vault performance (use `hyperliquid_get_vault_data`).

### `hyperliquid_get_candles`

Use this when you need historical OHLCV candlestick data for a Hyperliquid perpetual pair.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. `BTC`, `ETH`, `SOL`) |
| `interval` | string | no | Candle interval: `1m`, `5m`, `15m`, `1h`, `4h`, `1d` |
| `limit` | number | no | Number of candles to return (default 100, max 5000) |

**Returns**: `candles[]` (timestamp, open, high, low, close, volume per bar), `coin`, `interval`, `count`.

Example response:

```json
{"coin":"BTC","interval":"1h","count":100,"candles":[{"timestamp":"2026-04-13T10:00:00Z","open":67200,"high":67550,"low":67100,"close":67450,"volume":45000000}]}
```

**When to use**: technical analysis, backtesting strategies, charting price history on Hyperliquid perps.

**Not for**: real-time order book (use `hyperliquid_get_market_data`), spot DEX quotes (use `dex_get_swap_quote`), whale tracking (use `hyperliquid_track_whale_positions`).

## Example agent prompts

- "What's the current funding rate and order book depth for BTC on Hyperliquid?"
- "Give me a snapshot of all Hyperliquid perp markets sorted by funding rate"
- "Pull the last 100 1h candles for ETH on Hyperliquid for a backtest"

## Payment

- Protocol: [x402](https://x402.org) — HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents — one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
