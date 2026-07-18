# Hyperliquid Perp Market Data API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://hyperliquid-data.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Hyperliquid perp market data -- order books, prices, funding rates, OI, volume, OHLCV candles in one API. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "hyperliquid-data": {
      "url": "https://hyperliquid-data.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://hyperliquid-data.api.klymax402.com/api/orderbook?coin=BTC"
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `hyperliquid_get_market_data` | GET | `/api/orderbook` | $0.003 | L2 order book for a Hyperliquid perp pair |
| `hyperliquid_get_market_data` | POST | `/api/orderbook` | $0.003 | L2 order book for a Hyperliquid perp pair (POST variant) |
| `hyperliquid_get_all_markets` | GET | `/api/markets` | $0.003 | All mid prices, funding rates, OI, volume for every Hyperliquid asset |
| `hyperliquid_get_all_markets` | POST | `/api/markets` | $0.003 | All mid prices, funding rates, OI, volume for every Hyperliquid asset (POST variant) |
| `hyperliquid_get_candles` | GET | `/api/candles` | $0.002 | OHLCV candlestick data for a Hyperliquid perp pair |
| `hyperliquid_get_candles` | POST | `/api/candles` | $0.002 | OHLCV candlestick data for a Hyperliquid perp pair (POST variant) |

### `hyperliquid_get_market_data`

Use this when you need Hyperliquid perpetual futures data for a specific coin. Returns full L2 order book depth with real-time pricing and funding metrics in one call.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. BTC, ETH, SOL, ARB, DOGE) |

**Returns**

- `bids` -- array of bid levels with price and size
- `asks` -- array of ask levels with price and size
- `midPrice` -- current mid price between best bid/ask
- `markPrice` -- oracle mark price used for liquidations
- `fundingRate` -- current hourly funding rate (e.g. 0.0001 = 0.01%)
- `openInterest` -- total open interest in USD
- `volume24h` -- 24-hour trading volume in USD

Example response:

```json
{"midPrice":67450.5,"markPrice":67448.2,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"bids":[{"price":67450,"size":12.5}],"asks":[{"price":67451,"size":8.3}]}
```

**When to use**: placing trades on Hyperliquid. Essential for checking spread, depth, and funding before entering a position.

### `hyperliquid_get_market_data`

Use this when you need Hyperliquid perpetual futures data for a specific coin. Returns full L2 order book depth with real-time pricing and funding metrics in one call. POST variant of hyperliquid_get_market_data -- same params passed as JSON body instead of query string.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. BTC, ETH, SOL, ARB, DOGE) |

**Returns**

- `bids` -- array of bid levels with price and size
- `asks` -- array of ask levels with price and size
- `midPrice` -- current mid price between best bid/ask
- `markPrice` -- oracle mark price used for liquidations
- `fundingRate` -- current hourly funding rate (e.g. 0.0001 = 0.01%)
- `openInterest` -- total open interest in USD
- `volume24h` -- 24-hour trading volume in USD

Example response:

```json
{"midPrice":67450.5,"markPrice":67448.2,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"bids":[{"price":67450,"size":12.5}],"asks":[{"price":67451,"size":8.3}]}
```

**When to use**: placing trades on Hyperliquid. Essential for checking spread, depth, and funding before entering a position.

### `hyperliquid_get_all_markets`

Use this when you need a snapshot of all Hyperliquid perpetual markets at once. Returns pricing, funding, and volume data for every listed asset in a single call.

**Parameters**: none.

**Returns**

- `markets` -- array of all listed perp assets
- `totalMarkets` -- number of listed perp markets
- `timestamp` -- data timestamp in ISO format

Example response:

```json
{"markets":[{"coin":"BTC","midPrice":67450,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"dayChange":2.3},{"coin":"ETH","midPrice":3520,"fundingRate":0.00012,"openInterest":890000000,"volume24h":1200000000,"dayChange":1.1}],"totalMarkets":148}
```

**When to use**: screening all Hyperliquid markets, finding highest funding rates, or building a market overview dashboard.

### `hyperliquid_get_all_markets`

Use this when you need a snapshot of all Hyperliquid perpetual markets at once. Returns pricing, funding, and volume data for every listed asset in a single call. POST variant of hyperliquid_get_all_markets -- same params passed as JSON body instead of query string.

**Parameters**: none.

**Returns**

- `markets` -- array of all listed perp assets
- `totalMarkets` -- number of listed perp markets
- `timestamp` -- data timestamp in ISO format

Example response:

```json
{"markets":[{"coin":"BTC","midPrice":67450,"fundingRate":0.00008,"openInterest":1250000000,"volume24h":3400000000,"dayChange":2.3},{"coin":"ETH","midPrice":3520,"fundingRate":0.00012,"openInterest":890000000,"volume24h":1200000000,"dayChange":1.1}],"totalMarkets":148}
```

**When to use**: screening all Hyperliquid markets, finding highest funding rates, or building a market overview dashboard.

### `hyperliquid_get_candles`

Use this when you need historical OHLCV candlestick data for a Hyperliquid perpetual pair. Returns open, high, low, close, volume for the specified interval.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. BTC, ETH, SOL) |
| `interval` | string | no | Candle interval (1m, 5m, 15m, 1h, 4h, 1d) |
| `limit` | number | no | Number of candles to return (default 100, max 5000) |

**Returns**

- `candles` -- array of OHLCV bars
- `coin` -- the coin symbol queried
- `interval` -- the candle interval used
- `count` -- number of candles returned

Example response:

```json
{"coin":"BTC","interval":"1h","count":100,"candles":[{"timestamp":"2026-04-13T10:00:00Z","open":67200,"high":67550,"low":67100,"close":67450,"volume":45000000}]}
```

**When to use**: technical analysis, backtesting strategies, or charting price history on Hyperliquid perps.

### `hyperliquid_get_candles`

Use this when you need historical OHLCV candlestick data for a Hyperliquid perpetual pair. Returns open, high, low, close, volume for the specified interval. POST variant of hyperliquid_get_candles -- same params passed as JSON body instead of query string.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `coin` | string | yes | Coin symbol (e.g. BTC, ETH, SOL) |
| `interval` | string | no | Candle interval (1m, 5m, 15m, 1h, 4h, 1d) |
| `limit` | number | no | Number of candles to return (default 100, max 5000) |

**Returns**

- `candles` -- array of OHLCV bars
- `coin` -- the coin symbol queried
- `interval` -- the candle interval used
- `count` -- number of candles returned

Example response:

```json
{"coin":"BTC","interval":"1h","count":100,"candles":[{"timestamp":"2026-04-13T10:00:00Z","open":67200,"high":67550,"low":67100,"close":67450,"volume":45000000}]}
```

**When to use**: technical analysis, backtesting strategies, or charting price history on Hyperliquid perps.

## Example agent prompts

- "Hyperliquid perpetual futures data for a specific coin"
- "Hyperliquid perpetual futures data for a specific coin"
- "A snapshot of all Hyperliquid perpetual markets at once"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
