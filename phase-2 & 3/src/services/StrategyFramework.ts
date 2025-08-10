import { Order, Position, TradingSignal, Strategy } from '../types/trading';
import { MarketMicrostructureEngine } from './MarketMicrostructureEngine';
import { OrderManagementSystem } from './OrderManagementSystem';

export interface StrategyConfig {
  name: string;
  symbols: string[];
  parameters: Record<string, any>;
  riskLimits: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxDrawdown: number;
    concentrationLimit: number;
  };
  enabled: boolean;
}

export interface SignalFilter {
  name: string;
  apply: (signal: TradingSignal, context: StrategyContext) => boolean;
}

export interface PositionSizer {
  name: string;
  calculate: (signal: TradingSignal, context: StrategyContext) => number;
}

export interface StrategyContext {
  currentPositions: Map<string, Position>;
  marketData: any;
  portfolioValue: number;
  availableCash: number;
  riskMetrics: any;
}

export abstract class BaseStrategy {
  protected config: StrategyConfig;
  protected positions: Map<string, Position> = new Map();
  protected signals: TradingSignal[] = [];
  protected pnl: number = 0;
  protected maxDrawdown: number = 0;
  protected peakValue: number = 0;
  protected isActive: boolean = false;

  constructor(config: StrategyConfig) {
    this.config = config;
    this.peakValue = 1000000; // Starting portfolio value
  }

  abstract generateSignals(marketEngine: MarketMicrostructureEngine): TradingSignal[];
  abstract getName(): string;
  abstract getDescription(): string;

  // Strategy lifecycle methods
  start(): void {
    this.isActive = true;
    console.log(`Strategy ${this.getName()} started`);
  }

  stop(): void {
    this.isActive = false;
    console.log(`Strategy ${this.getName()} stopped`);
  }

  pause(): void {
    this.isActive = false;
    console.log(`Strategy ${this.getName()} paused`);
  }

  // Position management
  updatePosition(symbol: string, quantity: number, price: number): void {
    const existing = this.positions.get(symbol);
    
    if (existing) {
      const totalQuantity = existing.quantity + quantity;
      const totalValue = (existing.quantity * existing.avgPrice) + (quantity * price);
      
      if (totalQuantity === 0) {
        this.positions.delete(symbol);
      } else {
        existing.quantity = totalQuantity;
        existing.avgPrice = totalValue / totalQuantity;
        existing.lastUpdate = new Date();
      }
    } else if (quantity !== 0) {
      this.positions.set(symbol, {
        symbol,
        quantity,
        avgPrice: price,
        marketValue: quantity * price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        lastUpdate: new Date()
      });
    }
  }

  // Risk management
  checkRiskLimits(signal: TradingSignal, proposedSize: number): boolean {
    const { riskLimits } = this.config;
    
    // Position size limit
    if (Math.abs(proposedSize) > riskLimits.maxPositionSize) {
      console.log(`Risk check failed: Position size ${proposedSize} exceeds limit ${riskLimits.maxPositionSize}`);
      return false;
    }
    
    // Concentration limit
    const currentPosition = this.positions.get(signal.symbol);
    const newQuantity = (currentPosition?.quantity || 0) + proposedSize;
    const positionValue = Math.abs(newQuantity * (signal.targetPrice || 100));
    const concentrationRatio = positionValue / this.peakValue;
    
    if (concentrationRatio > riskLimits.concentrationLimit) {
      console.log(`Risk check failed: Concentration ${concentrationRatio} exceeds limit ${riskLimits.concentrationLimit}`);
      return false;
    }
    
    // Drawdown limit
    if (this.maxDrawdown > riskLimits.maxDrawdown) {
      console.log(`Risk check failed: Drawdown ${this.maxDrawdown} exceeds limit ${riskLimits.maxDrawdown}`);
      return false;
    }
    
    return true;
  }

  // Performance calculation
  updatePerformanceMetrics(marketEngine: MarketMicrostructureEngine): void {
    let totalValue = 0;
    let totalUnrealizedPnL = 0;
    
    this.positions.forEach((position, symbol) => {
      const currentData = marketEngine.getCurrentMarketData(symbol);
      if (currentData) {
        const marketPrice = (currentData.bid + currentData.ask) / 2;
        position.marketValue = position.quantity * marketPrice;
        position.unrealizedPnL = (marketPrice - position.avgPrice) * position.quantity;
        
        totalValue += position.marketValue;
        totalUnrealizedPnL += position.unrealizedPnL;
      }
    });
    
    const currentPortfolioValue = totalValue + this.pnl;
    
    // Update peak and drawdown
    if (currentPortfolioValue > this.peakValue) {
      this.peakValue = currentPortfolioValue;
    }
    
    this.maxDrawdown = Math.max(this.maxDrawdown, 
      (this.peakValue - currentPortfolioValue) / this.peakValue);
  }

  // Getters
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getSignals(): TradingSignal[] {
    return this.signals;
  }

  getPnL(): number {
    return this.pnl;
  }

  getMaxDrawdown(): number {
    return this.maxDrawdown;
  }

  isStrategyActive(): boolean {
    return this.isActive;
  }
}

// Mean Reversion Strategy Implementation
export class MeanReversionStrategy extends BaseStrategy {
  private lookbackPeriod: number;
  private zScoreThreshold: number;
  private priceHistory: Map<string, number[]> = new Map();

  constructor(config: StrategyConfig) {
    super(config);
    this.lookbackPeriod = config.parameters.lookbackPeriod || 20;
    this.zScoreThreshold = config.parameters.zScoreThreshold || 2.0;
  }

  getName(): string {
    return 'Mean Reversion Strategy';
  }

  getDescription(): string {
    return `Statistical arbitrage strategy based on price reversion to ${this.lookbackPeriod}-period mean with Z-score threshold of ${this.zScoreThreshold}`;
  }

  generateSignals(marketEngine: MarketMicrostructureEngine): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    this.config.symbols.forEach(symbol => {
      const currentData = marketEngine.getCurrentMarketData(symbol);
      if (!currentData) return;
      
      const currentPrice = (currentData.bid + currentData.ask) / 2;
      
      // Update price history
      if (!this.priceHistory.has(symbol)) {
        this.priceHistory.set(symbol, []);
      }
      
      const history = this.priceHistory.get(symbol)!;
      history.push(currentPrice);
      
      if (history.length > this.lookbackPeriod) {
        history.shift();
      }
      
      // Generate signal if we have enough history
      if (history.length === this.lookbackPeriod) {
        const signal = this.calculateMeanReversionSignal(symbol, currentPrice, history);
        if (signal) {
          signals.push(signal);
        }
      }
    });
    
    this.signals = signals;
    return signals;
  }

  private calculateMeanReversionSignal(symbol: string, currentPrice: number, history: number[]): TradingSignal | null {
    const mean = history.reduce((sum, price) => sum + price, 0) / history.length;
    const variance = history.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return null;
    
    const zScore = (currentPrice - mean) / stdDev;
    
    if (Math.abs(zScore) > this.zScoreThreshold) {
      const action = zScore > 0 ? 'SELL' : 'BUY'; // Contrarian signal
      const strength = Math.min(1, Math.abs(zScore) / (this.zScoreThreshold * 2));
      const confidence = Math.min(0.95, 0.5 + (Math.abs(zScore) - this.zScoreThreshold) * 0.1);
      
      return {
        symbol,
        action,
        strength,
        confidence,
        timestamp: new Date(),
        reasoning: `Z-score: ${zScore.toFixed(2)}, Mean: ${mean.toFixed(2)}, Current: ${currentPrice.toFixed(2)}`,
        targetPrice: mean,
        stopLoss: action === 'BUY' ? currentPrice * 0.95 : currentPrice * 1.05
      };
    }
    
    return null;
  }
}

// Momentum Strategy Implementation
export class MomentumStrategy extends BaseStrategy {
  private shortPeriod: number;
  private longPeriod: number;
  private priceHistory: Map<string, number[]> = new Map();

  constructor(config: StrategyConfig) {
    super(config);
    this.shortPeriod = config.parameters.shortPeriod || 5;
    this.longPeriod = config.parameters.longPeriod || 20;
  }

  getName(): string {
    return 'Momentum Strategy';
  }

  getDescription(): string {
    return `Trend following strategy using ${this.shortPeriod}/${this.longPeriod} period moving average crossover`;
  }

  generateSignals(marketEngine: MarketMicrostructureEngine): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    this.config.symbols.forEach(symbol => {
      const currentData = marketEngine.getCurrentMarketData(symbol);
      if (!currentData) return;
      
      const currentPrice = (currentData.bid + currentData.ask) / 2;
      
      // Update price history
      if (!this.priceHistory.has(symbol)) {
        this.priceHistory.set(symbol, []);
      }
      
      const history = this.priceHistory.get(symbol)!;
      history.push(currentPrice);
      
      if (history.length > this.longPeriod) {
        history.shift();
      }
      
      // Generate signal if we have enough history
      if (history.length >= this.longPeriod) {
        const signal = this.calculateMomentumSignal(symbol, currentPrice, history);
        if (signal) {
          signals.push(signal);
        }
      }
    });
    
    this.signals = signals;
    return signals;
  }

  private calculateMomentumSignal(symbol: string, currentPrice: number, history: number[]): TradingSignal | null {
    const shortMA = this.calculateMovingAverage(history.slice(-this.shortPeriod));
    const longMA = this.calculateMovingAverage(history.slice(-this.longPeriod));
    const prevShortMA = this.calculateMovingAverage(history.slice(-this.shortPeriod - 1, -1));
    const prevLongMA = this.calculateMovingAverage(history.slice(-this.longPeriod - 1, -1));
    
    // Check for crossover
    const currentCross = shortMA > longMA;
    const prevCross = prevShortMA > prevLongMA;
    
    if (currentCross !== prevCross) {
      const action = currentCross ? 'BUY' : 'SELL';
      const momentum = Math.abs(shortMA - longMA) / longMA;
      const strength = Math.min(1, momentum * 10);
      const confidence = Math.min(0.9, 0.6 + momentum * 5);
      
      return {
        symbol,
        action,
        strength,
        confidence,
        timestamp: new Date(),
        reasoning: `MA Crossover: Short MA ${shortMA.toFixed(2)}, Long MA ${longMA.toFixed(2)}`,
        targetPrice: currentPrice * (action === 'BUY' ? 1.05 : 0.95),
        stopLoss: currentPrice * (action === 'BUY' ? 0.97 : 1.03)
      };
    }
    
    return null;
  }

  private calculateMovingAverage(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
}

// Strategy Framework Manager
export class StrategyFramework {
  private strategies: Map<string, BaseStrategy> = new Map();
  private signalFilters: SignalFilter[] = [];
  private positionSizers: PositionSizer[] = [];
  private marketEngine: MarketMicrostructureEngine;
  private orderManager: OrderManagementSystem;
  private isRunning: boolean = false;

  constructor(marketEngine: MarketMicrostructureEngine, orderManager: OrderManagementSystem) {
    this.marketEngine = marketEngine;
    this.orderManager = orderManager;
    this.initializeDefaultFilters();
    this.initializeDefaultSizers();
  }

  private initializeDefaultFilters(): void {
    // Confidence filter
    this.signalFilters.push({
      name: 'MinConfidenceFilter',
      apply: (signal: TradingSignal, context: StrategyContext) => {
        return signal.confidence >= 0.6;
      }
    });

    // Market hours filter
    this.signalFilters.push({
      name: 'MarketHoursFilter',
      apply: (signal: TradingSignal, context: StrategyContext) => {
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 16; // Market hours
      }
    });

    // Volatility filter
    this.signalFilters.push({
      name: 'VolatilityFilter',
      apply: (signal: TradingSignal, context: StrategyContext) => {
        // Skip signals during high volatility periods
        const metrics = this.marketEngine.getCurrentLiquidityMetrics(signal.symbol);
        return !metrics || metrics.bidAskSpread < 0.01; // 1% spread threshold
      }
    });
  }

  private initializeDefaultSizers(): void {
    // Fixed size position sizer
    this.positionSizers.push({
      name: 'FixedSizer',
      calculate: (signal: TradingSignal, context: StrategyContext) => {
        return 1000; // Fixed 1000 shares
      }
    });

    // Volatility-adjusted position sizer
    this.positionSizers.push({
      name: 'VolatilityAdjustedSizer',
      calculate: (signal: TradingSignal, context: StrategyContext) => {
        const metrics = this.marketEngine.getCurrentLiquidityMetrics(signal.symbol);
        const baseSize = 1000;
        
        if (metrics) {
          // Reduce size for higher volatility
          const volatilityAdjustment = Math.max(0.1, 1 - (metrics.bidAskSpread * 50));
          return Math.floor(baseSize * volatilityAdjustment * signal.confidence);
        }
        
        return baseSize;
      }
    });

    // Kelly Criterion position sizer
    this.positionSizers.push({
      name: 'KellySizer',
      calculate: (signal: TradingSignal, context: StrategyContext) => {
        const winRate = 0.55; // Assumed win rate
        const avgWin = 0.02; // 2% average win
        const avgLoss = 0.015; // 1.5% average loss
        
        const kellyFraction = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
        const adjustedFraction = Math.max(0.01, Math.min(0.25, kellyFraction * signal.confidence));
        
        const positionValue = context.portfolioValue * adjustedFraction;
        const currentPrice = signal.targetPrice || 100;
        
        return Math.floor(positionValue / currentPrice);
      }
    });
  }

  // Strategy management
  addStrategy(strategy: BaseStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
    console.log(`Added strategy: ${strategy.getName()}`);
  }

  removeStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.stop();
      this.strategies.delete(strategyName);
      console.log(`Removed strategy: ${strategyName}`);
    }
  }

  startStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.start();
    }
  }

  stopStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.stop();
    }
  }

  // Main execution loop
  start(): void {
    this.isRunning = true;
    console.log('Strategy Framework started');
    
    // Run strategy loop every 5 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.executeStrategies();
      }
    }, 5000);
  }

  stop(): void {
    this.isRunning = false;
    this.strategies.forEach(strategy => strategy.stop());
    console.log('Strategy Framework stopped');
  }

  private executeStrategies(): void {
    this.strategies.forEach(strategy => {
      if (strategy.isStrategyActive()) {
        try {
          // Generate signals
          const signals = strategy.generateSignals(this.marketEngine);
          
          // Process each signal
          signals.forEach(signal => {
            this.processSignal(signal, strategy);
          });
          
          // Update performance metrics
          strategy.updatePerformanceMetrics(this.marketEngine);
          
        } catch (error) {
          console.error(`Error executing strategy ${strategy.getName()}:`, error);
        }
      }
    });
  }

  private processSignal(signal: TradingSignal, strategy: BaseStrategy): void {
    // Create strategy context
    const context: StrategyContext = {
      currentPositions: new Map(strategy.getPositions().map(p => [p.symbol, p])),
      marketData: this.marketEngine.getCurrentMarketData(signal.symbol),
      portfolioValue: 1000000, // Simulated portfolio value
      availableCash: 500000, // Simulated available cash
      riskMetrics: {}
    };

    // Apply signal filters
    const passesFilters = this.signalFilters.every(filter => {
      try {
        return filter.apply(signal, context);
      } catch (error) {
        console.error(`Error applying filter ${filter.name}:`, error);
        return false;
      }
    });

    if (!passesFilters) {
      console.log(`Signal filtered out for ${signal.symbol}: ${signal.action}`);
      return;
    }

    // Calculate position size
    const sizer = this.positionSizers[1]; // Use volatility-adjusted sizer
    const positionSize = sizer.calculate(signal, context);
    const adjustedSize = signal.action === 'SELL' ? -positionSize : positionSize;

    // Risk check
    if (!strategy.checkRiskLimits(signal, adjustedSize)) {
      console.log(`Signal rejected due to risk limits: ${signal.symbol}`);
      return;
    }

    // Submit order
    this.submitOrder(signal, adjustedSize, strategy);
  }

  private submitOrder(signal: TradingSignal, size: number, strategy: BaseStrategy): void {
    const orderType = signal.targetPrice ? 'LIMIT' : 'MARKET';
    
    const orderRequest = {
      symbol: signal.symbol,
      side: size > 0 ? 'BUY' as const : 'SELL' as const,
      type: orderType as any,
      quantity: Math.abs(size),
      price: signal.targetPrice,
      stopPrice: signal.stopLoss,
      timeInForce: 'DAY' as const,
      clientOrderId: `${strategy.getName()}_${Date.now()}`
    };

    const orderId = this.orderManager.submitOrder(orderRequest);
    console.log(`Order submitted for ${strategy.getName()}: ${orderId}`);
    
    // Update strategy position (simplified)
    const fillPrice = signal.targetPrice || 100;
    strategy.updatePosition(signal.symbol, size, fillPrice);
  }

  // Public API
  getStrategies(): Strategy[] {
    return Array.from(this.strategies.values()).map(strategy => ({
      id: strategy.getName(),
      name: strategy.getName(),
      status: strategy.isStrategyActive() ? 'ACTIVE' : 'INACTIVE',
      parameters: {},
      positions: strategy.getPositions(),
      pnl: strategy.getPnL(),
      maxDrawdown: strategy.getMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio(strategy),
      lastSignal: strategy.getSignals()[strategy.getSignals().length - 1]
    }));
  }

  private calculateSharpeRatio(strategy: BaseStrategy): number {
    // Simplified Sharpe ratio calculation
    const returns = 0.08; // Assumed annual return
    const riskFreeRate = 0.03;
    const volatility = 0.15; // Assumed volatility
    
    return (returns - riskFreeRate) / volatility;
  }

  getStrategyPerformance(strategyName: string): any {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return null;

    return {
      name: strategyName,
      pnl: strategy.getPnL(),
      maxDrawdown: strategy.getMaxDrawdown(),
      positions: strategy.getPositions(),
      signals: strategy.getSignals().slice(-10), // Last 10 signals
      isActive: strategy.isStrategyActive()
    };
  }
}