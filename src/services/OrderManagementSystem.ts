import { Order, Trade, OrderType, OrderStatus, MarketData, ExecutionMetrics } from '../types/trading';

export class OrderManagementSystem {
  private orders: Map<string, Order> = new Map();
  private trades: Trade[] = [];
  private orderIdCounter = 1;
  private tradeIdCounter = 1;
  private executionMetrics: Map<string, ExecutionMetrics> = new Map();

  // Smart Order Router
  private venues = ['NYSE', 'NASDAQ', 'BATS', 'ARCA', 'IEX'];
  private venueLatency = new Map([
    ['NYSE', 0.5],
    ['NASDAQ', 0.3],
    ['BATS', 0.2],
    ['ARCA', 0.4],
    ['IEX', 0.35]
  ]);

  private venueFees = new Map([
    ['NYSE', 0.0025],
    ['NASDAQ', 0.0020],
    ['BATS', 0.0015],
    ['ARCA', 0.0022],
    ['IEX', 0.0009]
  ]);

  constructor() {
    this.initializeOrderProcessing();
  }

  // Submit order with smart routing and FIX protocol simulation
  submitOrder(orderRequest: Omit<Order, 'id' | 'status' | 'timestamp' | 'fillQuantity' | 'avgFillPrice' | 'commission'>): string {
    const order: Order = {
      ...orderRequest,
      id: `ORD_${this.orderIdCounter++}`,
      status: 'PENDING',
      timestamp: new Date(),
      fillQuantity: 0,
      avgFillPrice: 0,
      commission: 0
    };

    // Pre-trade risk checks
    if (!this.preTradeRiskCheck(order)) {
      order.status = 'REJECTED';
      this.orders.set(order.id, order);
      this.logFIXMessage('8', order, 'Order Rejected - Risk Check Failed');
      return order.id;
    }

    // Smart order routing
    const selectedVenue = this.selectOptimalVenue(order);
    
    this.orders.set(order.id, order);
    this.logFIXMessage('D', order, `New Order Single - Routed to ${selectedVenue}`);
    this.processOrder(order, selectedVenue);
    
    return order.id;
  }

  // FIX Protocol Message Simulation
  private logFIXMessage(msgType: string, order: Order, description: string): void {
    const fixMessage = {
      msgType,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      orderQty: order.quantity,
      price: order.price,
      timestamp: new Date().toISOString(),
      description
    };
    console.log(`FIX Message: ${JSON.stringify(fixMessage)}`);
  }

  // Pre-trade risk validation
  private preTradeRiskCheck(order: Order): boolean {
    // Position limit check
    const maxPositionSize = 50000;
    if (order.quantity > maxPositionSize) {
      console.log(`Order rejected: Quantity ${order.quantity} exceeds position limit ${maxPositionSize}`);
      return false;
    }

    // Concentration limit check (max 5% of portfolio)
    const maxOrderValue = 5000000;
    const estimatedValue = order.quantity * (order.price || 100);
    if (estimatedValue > maxOrderValue) {
      console.log(`Order rejected: Estimated value ${estimatedValue} exceeds limit ${maxOrderValue}`);
      return false;
    }

    // Price collar check (within 10% of last price)
    const lastPrice = 100; // Simulated last price
    if (order.price) {
      const priceDeviation = Math.abs(order.price - lastPrice) / lastPrice;
      if (priceDeviation > 0.10) {
        console.log(`Order rejected: Price ${order.price} deviates ${(priceDeviation * 100).toFixed(2)}% from last price`);
        return false;
      }
    }

    // Velocity check (max orders per second)
    const recentOrders = Array.from(this.orders.values())
      .filter(o => Date.now() - o.timestamp.getTime() < 1000);
    if (recentOrders.length > 10) {
      console.log('Order rejected: Velocity limit exceeded');
      return false;
    }

    return true;
  }

  // Smart venue selection with advanced scoring
  private selectOptimalVenue(order: Order): string {
    const venueScores = this.venues.map(venue => ({
      venue,
      score: this.calculateVenueScore(venue, order)
    }));

    venueScores.sort((a, b) => b.score - a.score);
    console.log(`Venue selection for ${order.symbol}: ${JSON.stringify(venueScores)}`);
    return venueScores[0].venue;
  }

  private calculateVenueScore(venue: string, order: Order): number {
    const latency = this.venueLatency.get(venue) || 1;
    const fees = this.venueFees.get(venue) || 0.003;
    
    // Simulated venue-specific metrics
    const liquidityScore = this.getLiquidityScore(venue, order.symbol);
    const fillProbability = this.getFillProbability(venue, order);
    const marketImpact = this.getMarketImpact(venue, order);
    
    // Weighted scoring: liquidity (40%), fill probability (25%), fees (20%), latency (15%)
    const score = (liquidityScore * 0.4) + 
                  (fillProbability * 0.25) + 
                  ((1 - fees) * 100 * 0.2) + 
                  ((1/latency) * 10 * 0.15) - 
                  (marketImpact * 0.1);
    
    return Math.max(0, score);
  }

  private getLiquidityScore(venue: string, symbol: string): number {
    // Simulated liquidity scoring based on venue and symbol
    const baseScore = Math.random() * 100;
    const venueMultiplier = venue === 'NYSE' ? 1.2 : venue === 'NASDAQ' ? 1.1 : 1.0;
    return Math.min(100, baseScore * venueMultiplier);
  }

  private getFillProbability(venue: string, order: Order): number {
    // Simulated fill probability based on order type and market conditions
    const baseProb = order.type === 'MARKET' ? 95 : 
                     order.type === 'LIMIT' ? 70 : 60;
    const venueAdjustment = Math.random() * 20 - 10; // ±10%
    return Math.max(0, Math.min(100, baseProb + venueAdjustment));
  }

  private getMarketImpact(venue: string, order: Order): number {
    // Simulated market impact calculation
    const baseImpact = Math.log(order.quantity / 1000) * 0.01;
    const venueMultiplier = venue === 'IEX' ? 0.8 : 1.0; // IEX has lower impact
    return Math.max(0, baseImpact * venueMultiplier);
  }

  // Process different order types
  private async processOrder(order: Order, venue: string): Promise<void> {
    order.status = 'SUBMITTED';
    this.logFIXMessage('A', order, 'Order Submitted');
    
    switch (order.type) {
      case 'MARKET':
        await this.processMarketOrder(order, venue);
        break;
      case 'LIMIT':
        await this.processLimitOrder(order, venue);
        break;
      case 'STOP':
        await this.processStopOrder(order, venue);
        break;
      case 'STOP_LIMIT':
        await this.processStopLimitOrder(order, venue);
        break;
      case 'ICEBERG':
        await this.processIcebergOrder(order, venue);
        break;
      case 'TWAP':
        await this.processTWAPOrder(order, venue);
        break;
      case 'VWAP':
        await this.processVWAPOrder(order, venue);
        break;
    }
  }

  private async processMarketOrder(order: Order, venue: string): Promise<void> {
    setTimeout(() => {
      const marketPrice = 100 + (Math.random() - 0.5) * 10;
      const slippage = this.calculateSlippage(order, venue);
      const fillPrice = order.side === 'BUY' ? 
        marketPrice * (1 + slippage) : 
        marketPrice * (1 - slippage);

      this.executeTrade(order, order.quantity, fillPrice, venue);
    }, this.venueLatency.get(venue)! * 1000);
  }

  private async processLimitOrder(order: Order, venue: string): Promise<void> {
    const checkInterval = setInterval(() => {
      const currentPrice = this.simulateMarketPrice();
      const shouldFill = order.side === 'BUY' ? 
        currentPrice <= order.price! : 
        currentPrice >= order.price!;

      if (shouldFill && Math.random() > 0.3) { // 70% fill probability
        clearInterval(checkInterval);
        this.executeTrade(order, order.quantity, order.price!, venue);
      }
    }, 500);

    // Auto-cancel after time in force expires
    setTimeout(() => {
      clearInterval(checkInterval);
      if (order.status === 'SUBMITTED') {
        order.status = 'CANCELLED';
        this.logFIXMessage('4', order, 'Order Cancelled - Time in Force Expired');
      }
    }, this.getTimeInForceMs(order.timeInForce));
  }

  private async processStopOrder(order: Order, venue: string): Promise<void> {
    const checkInterval = setInterval(() => {
      const currentPrice = this.simulateMarketPrice();
      const shouldTrigger = order.side === 'BUY' ? 
        currentPrice >= order.stopPrice! : 
        currentPrice <= order.stopPrice!;

      if (shouldTrigger) {
        clearInterval(checkInterval);
        // Convert to market order
        order.type = 'MARKET';
        this.processMarketOrder(order, venue);
      }
    }, 100);
  }

  private async processStopLimitOrder(order: Order, venue: string): Promise<void> {
    const checkInterval = setInterval(() => {
      const currentPrice = this.simulateMarketPrice();
      const shouldTrigger = order.side === 'BUY' ? 
        currentPrice >= order.stopPrice! : 
        currentPrice <= order.stopPrice!;

      if (shouldTrigger) {
        clearInterval(checkInterval);
        // Convert to limit order
        order.type = 'LIMIT';
        this.processLimitOrder(order, venue);
      }
    }, 100);
  }

  private async processIcebergOrder(order: Order, venue: string): Promise<void> {
    const displayQuantity = order.displayQuantity || Math.floor(order.quantity / 10);
    let remainingQuantity = order.quantity;
    let totalFillPrice = 0;
    let totalFillQuantity = 0;

    const processSlice = async () => {
      if (remainingQuantity <= 0) return;

      const sliceQuantity = Math.min(displayQuantity, remainingQuantity);
      
      // Simulate slice execution
      setTimeout(() => {
        const fillPrice = order.price! + (Math.random() - 0.5) * 0.02;
        const fillQuantity = Math.floor(sliceQuantity * (0.8 + Math.random() * 0.2));
        
        if (fillQuantity > 0) {
          totalFillPrice += fillPrice * fillQuantity;
          totalFillQuantity += fillQuantity;
          remainingQuantity -= fillQuantity;
          
          // Create trade record for slice
          this.createTrade(order, fillQuantity, fillPrice, venue);
          
          if (remainingQuantity > 0) {
            setTimeout(processSlice, 2000 + Math.random() * 3000); // Random delay
          } else {
            // Complete the iceberg order
            order.fillQuantity = totalFillQuantity;
            order.avgFillPrice = totalFillPrice / totalFillQuantity;
            order.status = totalFillQuantity === order.quantity ? 'FILLED' : 'PARTIALLY_FILLED';
            this.calculateExecutionMetrics(order, venue);
          }
        }
      }, 1000 + Math.random() * 2000);
    };

    processSlice();
  }

  private async processTWAPOrder(order: Order, venue: string): Promise<void> {
    const duration = 30 * 60 * 1000; // 30 minutes
    const numSlices = 20;
    const sliceSize = Math.floor(order.quantity / numSlices);
    const sliceInterval = duration / numSlices;
    
    let executedQuantity = 0;
    let totalValue = 0;
    let sliceCount = 0;

    const executeSlice = () => {
      if (sliceCount >= numSlices) return;
      
      const currentSliceSize = sliceCount === numSlices - 1 ? 
        order.quantity - executedQuantity : sliceSize;
      
      // Execute slice at current market price
      const marketPrice = this.simulateMarketPrice();
      const slippage = this.calculateSlippage({...order, quantity: currentSliceSize}, venue);
      const fillPrice = order.side === 'BUY' ? 
        marketPrice * (1 + slippage) : 
        marketPrice * (1 - slippage);
      
      executedQuantity += currentSliceSize;
      totalValue += fillPrice * currentSliceSize;
      sliceCount++;
      
      this.createTrade(order, currentSliceSize, fillPrice, venue);
      
      if (sliceCount < numSlices) {
        setTimeout(executeSlice, sliceInterval);
      } else {
        order.fillQuantity = executedQuantity;
        order.avgFillPrice = totalValue / executedQuantity;
        order.status = 'FILLED';
        this.calculateTWAPMetrics(order, venue, duration);
      }
    };

    executeSlice();
  }

  private async processVWAPOrder(order: Order, venue: string): Promise<void> {
    // Simplified VWAP implementation
    const historicalVWAP = this.calculateHistoricalVWAP(order.symbol);
    const duration = 45 * 60 * 1000; // 45 minutes
    const numSlices = 15;
    
    let executedQuantity = 0;
    let totalValue = 0;
    let sliceCount = 0;

    const executeSlice = () => {
      if (sliceCount >= numSlices) return;
      
      // Adjust slice size based on volume profile
      const volumeWeight = this.getVolumeWeight(sliceCount, numSlices);
      const sliceSize = Math.floor(order.quantity * volumeWeight);
      
      const marketPrice = this.simulateMarketPrice();
      const vwapDeviation = (marketPrice - historicalVWAP) / historicalVWAP;
      
      // Adjust execution aggressiveness based on VWAP deviation
      const aggressiveness = Math.abs(vwapDeviation) > 0.02 ? 0.8 : 0.5;
      const fillPrice = this.calculateVWAPFillPrice(marketPrice, order.side, aggressiveness);
      
      executedQuantity += sliceSize;
      totalValue += fillPrice * sliceSize;
      sliceCount++;
      
      this.createTrade(order, sliceSize, fillPrice, venue);
      
      if (sliceCount < numSlices && executedQuantity < order.quantity) {
        setTimeout(executeSlice, duration / numSlices);
      } else {
        order.fillQuantity = executedQuantity;
        order.avgFillPrice = totalValue / executedQuantity;
        order.status = executedQuantity === order.quantity ? 'FILLED' : 'PARTIALLY_FILLED';
        this.calculateVWAPMetrics(order, venue, historicalVWAP);
      }
    };

    executeSlice();
  }

  // Execution quality metrics calculation
  private calculateExecutionMetrics(order: Order, venue: string): void {
    const benchmarkPrice = this.simulateMarketPrice(); // Arrival price
    const implementationShortfall = this.calculateImplementationShortfall(order, benchmarkPrice);
    const marketImpact = this.calculateMarketImpact(order, venue);
    
    const metrics: ExecutionMetrics = {
      symbol: order.symbol,
      twap: 0, // Will be calculated for TWAP orders
      vwap: 0, // Will be calculated for VWAP orders
      implementationShortfall,
      marketImpact,
      timing: Math.random() * 0.001, // Simulated timing cost
      slippage: Math.abs(order.avgFillPrice - benchmarkPrice) / benchmarkPrice,
      fillRate: order.fillQuantity / order.quantity
    };
    
    this.executionMetrics.set(order.id, metrics);
    console.log(`Execution metrics for ${order.id}:`, metrics);
  }

  private calculateImplementationShortfall(order: Order, benchmarkPrice: number): number {
    const priceImpact = Math.abs(order.avgFillPrice - benchmarkPrice) / benchmarkPrice;
    const opportunityCost = 0.001; // Simulated opportunity cost
    const commissions = order.commission / (order.avgFillPrice * order.fillQuantity);
    
    return priceImpact + opportunityCost + commissions;
  }

  private calculateTWAPMetrics(order: Order, venue: string, duration: number): void {
    const twapBenchmark = this.calculateTWAPBenchmark(order.symbol, duration);
    const metrics = this.executionMetrics.get(order.id) || {} as ExecutionMetrics;
    
    metrics.twap = twapBenchmark;
    metrics.implementationShortfall = Math.abs(order.avgFillPrice - twapBenchmark) / twapBenchmark;
    
    this.executionMetrics.set(order.id, metrics);
  }

  private calculateVWAPMetrics(order: Order, venue: string, vwapBenchmark: number): void {
    const metrics = this.executionMetrics.get(order.id) || {} as ExecutionMetrics;
    
    metrics.vwap = vwapBenchmark;
    metrics.implementationShortfall = Math.abs(order.avgFillPrice - vwapBenchmark) / vwapBenchmark;
    
    this.executionMetrics.set(order.id, metrics);
  }

  // Helper methods
  private simulateMarketPrice(): number {
    return 100 + (Math.random() - 0.5) * 10;
  }

  private calculateSlippage(order: Order, venue: string): number {
    const baseSlippage = Math.log(order.quantity / 1000) * 0.0001;
    const venueMultiplier = venue === 'IEX' ? 0.7 : 1.0;
    return Math.max(0, baseSlippage * venueMultiplier);
  }

  private getTimeInForceMs(timeInForce: string): number {
    switch (timeInForce) {
      case 'IOC': return 1000; // Immediate or Cancel
      case 'FOK': return 500;  // Fill or Kill
      case 'DAY': return 8 * 60 * 60 * 1000; // Day order
      default: return 24 * 60 * 60 * 1000; // GTC
    }
  }

  private calculateHistoricalVWAP(symbol: string): number {
    // Simulated historical VWAP
    return 100 + (Math.random() - 0.5) * 5;
  }

  private getVolumeWeight(slice: number, totalSlices: number): number {
    // U-shaped volume profile (higher at open/close)
    const normalizedTime = slice / totalSlices;
    const uShape = Math.pow(normalizedTime - 0.5, 2) * 4 + 0.5;
    return uShape / totalSlices;
  }

  private calculateVWAPFillPrice(marketPrice: number, side: string, aggressiveness: number): number {
    const spread = marketPrice * 0.001; // 10 bps spread
    const adjustment = spread * aggressiveness;
    
    return side === 'BUY' ? 
      marketPrice + adjustment : 
      marketPrice - adjustment;
  }

  private calculateTWAPBenchmark(symbol: string, duration: number): number {
    // Simulated TWAP benchmark
    return 100 + (Math.random() - 0.5) * 2;
  }

  private executeTrade(order: Order, quantity: number, price: number, venue: string): void {
    const trade = this.createTrade(order, quantity, price, venue);
    
    order.fillQuantity += quantity;
    order.avgFillPrice = ((order.avgFillPrice * (order.fillQuantity - quantity)) + (price * quantity)) / order.fillQuantity;
    order.commission += this.calculateCommission(quantity, price, venue);
    
    if (order.fillQuantity >= order.quantity) {
      order.status = 'FILLED';
      this.logFIXMessage('2', order, 'Order Filled');
    } else {
      order.status = 'PARTIALLY_FILLED';
      this.logFIXMessage('1', order, 'Order Partially Filled');
    }
    
    this.calculateExecutionMetrics(order, venue);
  }

  private createTrade(order: Order, quantity: number, price: number, venue: string): Trade {
    const trade: Trade = {
      id: `TRD_${this.tradeIdCounter++}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity,
      price,
      timestamp: new Date(),
      commission: this.calculateCommission(quantity, price, venue),
      venue
    };
    
    this.trades.push(trade);
    return trade;
  }

  private calculateCommission(quantity: number, price: number, venue: string): number {
    const feeRate = this.venueFees.get(venue) || 0.003;
    return quantity * price * feeRate;
  }

  private initializeOrderProcessing(): void {
    console.log('Order Management System initialized');
    console.log(`Available venues: ${this.venues.join(', ')}`);
  }

  // Public methods for monitoring
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getExecutionMetrics(orderId: string): ExecutionMetrics | undefined {
    return this.executionMetrics.get(orderId);
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (order && order.status === 'SUBMITTED') {
      order.status = 'CANCELLED';
      this.logFIXMessage('4', order, 'Order Cancelled by User');
      return true;
    }
    return false;
  }
}