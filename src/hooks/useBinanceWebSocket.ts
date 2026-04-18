// Backwards-compat shim — the app now uses simulated forex/commodity OTC feeds.
// All imports continue to work; under the hood we delegate to useForexFeed.
export {
  useForexFeed as useBinanceWebSocket,
  TRADING_PAIRS,
} from './useForexFeed';
export type { MarketTicker, CandleData, TradingAsset, AssetCategory } from './useForexFeed';
