import { MarketData, OrderBookLevel } from '../types/trading';

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: Date;
  sequence: number;
}

export interface MarketImpactModel {
  symbol: string;
  temporaryImpact: number;
  permanentImpact: number;
  liquidityScore: number;
  spreadCost: number;
}

export interface LiquidityMetrics {
  symbol: string;
  bidAskSpread: number;
  effectiveSpread: number;
  realizedSpread: number;
  priceImpact: number;
  marketDepth: number;
  resilience: number;
  timestamp: Date;
}

export class MarketMicrostructureEngine {
  private orderBooks: Map<string, OrderBook> = new Map();
  private marketData: Map<string, MarketData[]> = new Map();
  private liquidityMetrics: Map<string, LiquidityMetrics[]> = new Map();
  private sequenceNumber = 1;

  constructor() {
    this.initializeMarketData();
    this.startMarketDataSimulation();
  }

  // Initialize market data for common symbols
  private initializeMarketData(): void {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'SPY', 'QQQ'];
    
    symbols.forEach(symbol => {
      this.orderBooks.set(symbol, this.generateInitialOrderBook(symbol));
      this.marketData.set(symbol, []);
      this.liquidityMetrics.set(symbol, []);
    });
  }

  // Generate realistic order book
  private generateInitialOrderBook(symbol: string): OrderBook {
    const midPrice = this.getBasePriceForSymbol(symbol);
    const spread = midPrice * 0.001; // 10 bps spread
    
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    // Generate 10 levels on each side
    for (let i = 0; i < 10; i++) {
      const bidPrice = midPrice - spread/2 - (i * spread * 0.1);
      const askPrice = midPrice + spread/2 + (i * spread * 0.1);
      
      // Size decreases with distance from mid
      const baseSize = 1000 * Math.exp(-i * 0.3);
      const bidSize = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
      const askSize = Math.floor(baseSize * (0.8 + Math.random() * 0.4));
      
      bids.push({
        price: Number(bidPrice.toFixed(2)),
        size: bidSize,
        side: 'BID',
        orders: Math.floor(bidSize / 100) + 1
      });
      
      asks.push({
        price: Number(askPrice.toFixed(2)),
        size: askSize,
        side: 'ASK',
        orders: Math.floor(askSize / 100) + 1
      });
    }
    
    return {
      symbol,
      bids: bids.sort((a, b) => b.price - a.price), // Highest bid first
      asks: asks.sort((a, b) => a.price - b.price), // Lowest ask first
      timestamp: new Date(),
      sequence: this.sequenceNumber++
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'AAPL': 175,
      'GOOGL': 138,
      'MSFT': 378,
      'TSLA': 248,
      'NVDA': 875,
      'SPY': 450,
      'QQQ': 380
    };
    return basePrices[symbol] || 100;
  }

  // Start real-time market data simulation
  private startMarketDataSimulation(): void {
    setInterval(() => {
      this.orderBooks.forEach((orderBook, symbol) => {
        this.updateOrderBook(symbol);
        this.generateMarketData(symbol);
        this.calculateLiquidityMetrics(symbol);
      });
    }, 100); // Update every 100ms
  }

  // Update order book with realistic changes
  private updateOrderBook(symbol: string): void {
    const orderBook = this.orderBooks.get(symbol)!;
    
    // Simulate order book changes
    if (Math.random() < 0.3) { // 30% chance of update
      const updateType = Math.random();
      
      if (updateType < 0.4) {
        // Add new order
        this.addOrderToBook(orderBook);
      } else if (updateType < 0.7) {
        // Modify existing order
        this.modifyOrderInBook(orderBook);
      } else {
        // Remove order (execution or cancellation)
        this.removeOrderFromBook(orderBook);
      }
      
      orderBook.timestamp = new Date();
      orderBook.sequence = this.sequenceNumber++;
    }
  }

  private addOrderToBook(orderBook: OrderBook): void {
    const side = Math.random() < 0.5 ? 'bid' : 'ask';
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    
    if (levels.length > 0) {
      const bestPrice = levels[0].price;
      const spread = Math.abs(orderBook.asks[0].price - orderBook.bids[0].price);
      
      // Add order within 5 levels of best price
      const priceOffset = (Math.random() * 5) * (spread * 0.1);
      const newPrice = side === 'bid' ? 
        bestPrice - priceOffset : 
        bestPrice + priceOffset;
      
      const newSize = Math.floor(100 + Math.random() * 900);
      
      const newLevel: OrderBookLevel = {
        price: Number(newPrice.toFixed(2)),
        size: newSize,
        side: side === 'bid' ? 'BID' : 'ASK',
        orders: 1
      };
      
      // Insert in correct position
      if (side === 'bid') {
        orderBook.bids.push(newLevel);
        orderBook.bids.sort((a, b) => b.price - a.price);
        orderBook.bids = orderBook.bids.slice(0, 10); // Keep top 10
      } else {
        orderBook.asks.push(newLevel);
        orderBook.asks.sort((a, b) => a.price - b.price);
        orderBook.asks = orderBook.asks.slice(0, 10); // Keep top 10
      }
    }
  }

  private modifyOrderInBook(orderBook: OrderBook): void {
    const side = Math.random() < 0.5 ? 'bid' : 'ask';
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    
    if (levels.length > 0) {
      const levelIndex = Math.floor(Math.random() * Math.min(5, levels.length));
      const level = levels[levelIndex];
      
      // Modify size (increase or decrease)
      const sizeChange = Math.floor((Math.random() - 0.5) * 200);
      level.size = Math.max(100, level.size + sizeChange);
      level.orders = Math.max(1, Math.floor(level.size / 100));
    }
  }

  private removeOrderFromBook(orderBook: OrderBook): void {
    const side = Math.random() < 0.5 ? 'bid' : 'ask';
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    
    if (levels.length > 1) { // Keep at least one level
      const levelIndex = Math.floor(Math.random() * Math.min(3, levels.length));
      levels.splice(levelIndex, 1);
    }
  }

  // Generate market data from order book
  private generateMarketData(symbol: string): void {
    const orderBook = this.orderBooks.get(symbol)!;
    const history = this.marketData.get(symbol)!;
    
    if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
      const bid = orderBook.bids[0].price;
      const ask = orderBook.asks[0].price;
      const bidSize = orderBook.bids[0].size;
      const askSize = orderBook.asks[0].size;
      
      // Simulate last trade price
      const lastTrade = history.length > 0 ? history[history.length - 1].last : (bid + ask) / 2;
      const priceChange = (Math.random() - 0.5) * 0.02; // ±1% max change
      const newLast = lastTrade * (1 + priceChange);
      
      // Ensure last price is within bid-ask spread or close to it
      const adjustedLast = Math.max(bid - 0.01, Math.min(ask + 0.01, newLast));
      
      const marketData: MarketData = {
        symbol,
        bid,
        ask,
        bidSize,
        askSize,
        last: Number(adjustedLast.toFixed(2)),
        volume: Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date(),
        orderBook: [...orderBook.bids, ...orderBook.asks]
      };
      
      history.push(marketData);
      
      // Keep only last 1000 data points
      if (history.length > 1000) {
        history.shift();
      }
    }
  }

  // Calculate comprehensive liquidity metrics
  private calculateLiquidityMetrics(symbol: string): void {
    const orderBook = this.orderBooks.get(symbol)!;
    const marketDataHistory = this.marketData.get(symbol)!;
    
    if (orderBook.bids.length === 0 || orderBook.asks.length === 0 || marketDataHistory.length < 10) {
      return;
    }
    
    const currentData = marketDataHistory[marketDataHistory.length - 1];
    const bid = currentData.bid;
    const ask = currentData.ask;
    const mid = (bid + ask) / 2;
    
    // Bid-Ask Spread
    const bidAskSpread = (ask - bid) / mid;
    
    // Effective Spread (using recent trades)
    const effectiveSpread = this.calculateEffectiveSpread(marketDataHistory.slice(-10));
    
    // Realized Spread
    const realizedSpread = this.calculateRealizedSpread(marketDataHistory.slice(-20));
    
    // Price Impact (simulated based on order book depth)
    const priceImpact = this.calculatePriceImpact(orderBook);
    
    // Market Depth (total size within 1% of mid)
    const marketDepth = this.calculateMarketDepth(orderBook, mid);
    
    // Resilience (how quickly order book recovers)
    const resilience = this.calculateResilience(symbol);
    
    const metrics: LiquidityMetrics = {
      symbol,
      bidAskSpread,
      effectiveSpread,
      realizedSpread,
      priceImpact,
      marketDepth,
      resilience,
      timestamp: new Date()
    };
    
    const metricsHistory = this.liquidityMetrics.get(symbol)!;
    metricsHistory.push(metrics);
    
    // Keep only last 100 metrics
    if (metricsHistory.length > 100) {
      metricsHistory.shift();
    }
  }

  private calculateEffectiveSpread(recentData: MarketData[]): number {
    if (recentData.length < 2) return 0;
    
    let totalSpread = 0;
    let count = 0;
    
    for (let i = 1; i < recentData.length; i++) {
      const current = recentData[i];
      const previous = recentData[i - 1];
      const mid = (current.bid + current.ask) / 2;
      
      // Simulate trade direction based on price movement
      const tradeDirection = current.last > previous.last ? 1 : -1;
      const effectiveSpread = 2 * tradeDirection * (current.last - mid) / mid;
      
      totalSpread += Math.abs(effectiveSpread);
      count++;
    }
    
    return count > 0 ? totalSpread / count : 0;
  }

  private calculateRealizedSpread(recentData: MarketData[]): number {
    if (recentData.length < 5) return 0;
    
    // Simplified realized spread calculation
    const window = 5;
    let totalRealizedSpread = 0;
    let count = 0;
    
    for (let i = window; i < recentData.length; i++) {
      const current = recentData[i];
      const future = recentData[i - window];
      const mid = (current.bid + current.ask) / 2;
      const futureMid = (future.bid + future.ask) / 2;
      
      const priceReversion = (futureMid - current.last) / mid;
      totalRealizedSpread += Math.abs(priceReversion);
      count++;
    }
    
    return count > 0 ? totalRealizedSpread / count : 0;
  }

  private calculatePriceImpact(orderBook: OrderBook): number {
    // Calculate price impact for a standard trade size (1000 shares)
    const tradeSize = 1000;
    let remainingSize = tradeSize;
    let totalCost = 0;
    
    // Simulate buying through the ask side
    for (const level of orderBook.asks) {
      if (remainingSize <= 0) break;
      
      const sizeAtLevel = Math.min(remainingSize, level.size);
      totalCost += sizeAtLevel * level.price;
      remainingSize -= sizeAtLevel;
    }
    
    if (remainingSize > 0) {
      // Not enough liquidity, high impact
      return 0.01; // 1% impact
    }
    
    const avgPrice = totalCost / tradeSize;
    const midPrice = (orderBook.bids[0].price + orderBook.asks[0].price) / 2;
    
    return (avgPrice - midPrice) / midPrice;
  }

  private calculateMarketDepth(orderBook: OrderBook, midPrice: number): number {
    const threshold = midPrice * 0.01; // 1% from mid
    
    let bidDepth = 0;
    let askDepth = 0;
    
    for (const bid of orderBook.bids) {
      if (bid.price >= midPrice - threshold) {
        bidDepth += bid.size;
      } else {
        break;
      }
    }
    
    for (const ask of orderBook.asks) {
      if (ask.price <= midPrice + threshold) {
        askDepth += ask.size;
      } else {
        break;
      }
    }
    
    return bidDepth + askDepth;
  }

  private calculateResilience(symbol: string): number {
    // Simplified resilience calculation based on order book recovery
    const metricsHistory = this.liquidityMetrics.get(symbol)!;
    
    if (metricsHistory.length < 10) return 0.5;
    
    // Look at spread stability over time
    const recentSpreads = metricsHistory.slice(-10).map(m => m.bidAskSpread);
    const spreadVariance = this.calculateVariance(recentSpreads);
    
    // Lower variance indicates higher resilience
    return Math.max(0, 1 - spreadVariance * 100);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Market Impact Model
  calculateMarketImpactModel(symbol: string, tradeSize: number): MarketImpactModel {
    const orderBook = this.orderBooks.get(symbol);
    const metricsHistory = this.liquidityMetrics.get(symbol)!;
    
    if (!orderBook || metricsHistory.length === 0) {
      return {
        symbol,
        temporaryImpact: 0,
        permanentImpact: 0,
        liquidityScore: 0,
        spreadCost: 0
      };
    }
    
    const latestMetrics = metricsHistory[metricsHistory.length - 1];
    
    // Temporary impact (square root law)
    const temporaryImpact = Math.sqrt(tradeSize / 1000) * latestMetrics.bidAskSpread * 0.5;
    
    // Permanent impact (linear in trade size)
    const permanentImpact = (tradeSize / 10000) * latestMetrics.bidAskSpread * 0.1;
    
    // Liquidity score (0-100)
    const liquidityScore = Math.min(100, latestMetrics.marketDepth / 100);
    
    // Spread cost
    const spreadCost = latestMetrics.bidAskSpread / 2;
    
    return {
      symbol,
      temporaryImpact,
      permanentImpact,
      liquidityScore,
      spreadCost
    };
  }

  // Public API methods
  getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol);
  }

  getMarketData(symbol: string): MarketData[] {
    return this.marketData.get(symbol) || [];
  }

  getCurrentMarketData(symbol: string): MarketData | undefined {
    const data = this.marketData.get(symbol);
    return data && data.length > 0 ? data[data.length - 1] : undefined;
  }

  getLiquidityMetrics(symbol: string): LiquidityMetrics[] {
    return this.liquidityMetrics.get(symbol) || [];
  }

  getCurrentLiquidityMetrics(symbol: string): LiquidityMetrics | undefined {
    const metrics = this.liquidityMetrics.get(symbol);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : undefined;
  }

  getAvailableSymbols(): string[] {
    return Array.from(this.orderBooks.keys());
  }

  // Bid-ask spread analysis
  analyzeBidAskSpread(symbol: string, timeWindow: number = 3600000): any {
    const metrics = this.liquidityMetrics.get(symbol) || [];
    const cutoffTime = new Date(Date.now() - timeWindow);
    
    const recentMetrics = metrics.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) return null;
    
    const spreads = recentMetrics.map(m => m.bidAskSpread);
    
    return {
      symbol,
      timeWindow: timeWindow / 1000 / 60, // minutes
      avgSpread: spreads.reduce((sum, s) => sum + s, 0) / spreads.length,
      minSpread: Math.min(...spreads),
      maxSpread: Math.max(...spreads),
      spreadVolatility: this.calculateVariance(spreads),
      dataPoints: spreads.length
    };
  }
}