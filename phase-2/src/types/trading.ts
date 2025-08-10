// Core trading types and interfaces
export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  status: OrderStatus;
  timestamp: Date;
  fillQuantity: number;
  avgFillPrice: number;
  commission: number;
  clientOrderId?: string;
  parentOrderId?: string; // For iceberg orders
  displayQuantity?: number; // For iceberg orders
}

export type OrderType = 
  | 'MARKET' 
  | 'LIMIT' 
  | 'STOP' 
  | 'STOP_LIMIT' 
  | 'ICEBERG'
  | 'TWAP'
  | 'VWAP';

export type OrderStatus = 
  | 'PENDING'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  commission: number;
  venue: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  lastUpdate: Date;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  last: number;
  volume: number;
  timestamp: Date;
  orderBook?: OrderBookLevel[];
}

export interface OrderBookLevel {
  price: number;
  size: number;
  side: 'BID' | 'ASK';
  orders: number;
}

export interface Strategy {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  parameters: Record<string, any>;
  positions: Position[];
  pnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  lastSignal?: TradingSignal;
}

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-1
  confidence: number; // 0-1
  timestamp: Date;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
}

export interface RiskMetrics {
  portfolioValue: number;
  dailyVaR: number;
  expectedShortfall: number;
  beta: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  exposureByAsset: Record<string, number>;
  exposureBySector: Record<string, number>;
}

export interface ExecutionMetrics {
  symbol: string;
  twap: number;
  vwap: number;
  implementationShortfall: number;
  marketImpact: number;
  timing: number;
  slippage: number;
  fillRate: number;
}