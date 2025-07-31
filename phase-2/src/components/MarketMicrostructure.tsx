import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, BarChart, Layers } from 'lucide-react';
import { MarketMicrostructureEngine, OrderBook, LiquidityMetrics } from '../services/MarketMicrostructureEngine';

const MarketMicrostructure: React.FC = () => {
  const [engine] = useState(() => new MarketMicrostructureEngine());
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [liquidityMetrics, setLiquidityMetrics] = useState<LiquidityMetrics | null>(null);
  const [spreadAnalysis, setSpreadAnalysis] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const book = engine.getOrderBook(selectedSymbol);
      const metrics = engine.getCurrentLiquidityMetrics(selectedSymbol);
      const analysis = engine.analyzeBidAskSpread(selectedSymbol, 300000); // 5 minutes
      
      setOrderBook(book || null);
      setLiquidityMetrics(metrics || null);
      setSpreadAnalysis(analysis);
    }, 500);

    return () => clearInterval(interval);
  }, [engine, selectedSymbol]);

  const symbols = engine.getAvailableSymbols();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Market Microstructure</h2>
      </div>

      {/* Symbol Selector */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <label className="text-slate-300 font-medium">Symbol:</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Book Visualization */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="text-blue-400" size={20} />
            Level 2 Order Book
          </h3>
          
          {orderBook ? (
            <div className="space-y-4">
              {/* Market Data Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-700 rounded-lg">
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg">
                    ${orderBook.bids[0]?.price.toFixed(2)}
                  </div>
                  <div className="text-slate-400 text-sm">Best Bid</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">
                    ${((orderBook.bids[0]?.price + orderBook.asks[0]?.price) / 2).toFixed(2)}
                  </div>
                  <div className="text-slate-400 text-sm">Mid Price</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold text-lg">
                    ${orderBook.asks[0]?.price.toFixed(2)}
                  </div>
                  <div className="text-slate-400 text-sm">Best Ask</div>
                </div>
              </div>

              {/* Order Book Levels */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bids */}
                <div>
                  <h4 className="text-green-400 font-medium mb-2">Bids</h4>
                  <div className="space-y-1">
                    {orderBook.bids.slice(0, 10).map((bid, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                        <span className="text-green-400 font-mono text-sm">
                          ${bid.price.toFixed(2)}
                        </span>
                        <span className="text-slate-300 text-sm">
                          {bid.size.toLocaleString()}
                        </span>
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (bid.size / 2000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div>
                  <h4 className="text-red-400 font-medium mb-2">Asks</h4>
                  <div className="space-y-1">
                    {orderBook.asks.slice(0, 10).map((ask, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                        <span className="text-red-400 font-mono text-sm">
                          ${ask.price.toFixed(2)}
                        </span>
                        <span className="text-slate-300 text-sm">
                          {ask.size.toLocaleString()}
                        </span>
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (ask.size / 2000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <Activity size={48} className="mx-auto mb-4 text-slate-500" />
                <p>Loading order book data...</p>
              </div>
            </div>
          )}
        </div>

        {/* Liquidity Metrics */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart className="text-blue-400" size={20} />
            Liquidity Metrics
          </h3>
          
          {liquidityMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Bid-Ask Spread</div>
                  <div className="text-white text-xl font-bold">
                    {(liquidityMetrics.bidAskSpread * 100).toFixed(3)}%
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Effective Spread</div>
                  <div className="text-white text-xl font-bold">
                    {(liquidityMetrics.effectiveSpread * 100).toFixed(3)}%
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Market Depth</div>
                  <div className="text-white text-xl font-bold">
                    {liquidityMetrics.marketDepth.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-1">Price Impact</div>
                  <div className="text-white text-xl font-bold">
                    {(liquidityMetrics.priceImpact * 100).toFixed(3)}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Resilience Score</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-600 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${liquidityMetrics.resilience * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">
                    {(liquidityMetrics.resilience * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Realized Spread</div>
                <div className="text-white text-xl font-bold">
                  {(liquidityMetrics.realizedSpread * 100).toFixed(3)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-4 text-slate-500" />
                <p>Calculating liquidity metrics...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spread Analysis */}
      {spreadAnalysis && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Bid-Ask Spread Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-blue-400 text-sm font-medium mb-1">Average Spread</div>
              <div className="text-white text-xl font-bold">
                {(spreadAnalysis.avgSpread * 100).toFixed(3)}%
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-green-400 text-sm font-medium mb-1">Min Spread</div>
              <div className="text-white text-xl font-bold">
                {(spreadAnalysis.minSpread * 100).toFixed(3)}%
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-red-400 text-sm font-medium mb-1">Max Spread</div>
              <div className="text-white text-xl font-bold">
                {(spreadAnalysis.maxSpread * 100).toFixed(3)}%
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-orange-400 text-sm font-medium mb-1">Volatility</div>
              <div className="text-white text-xl font-bold">
                {(Math.sqrt(spreadAnalysis.spreadVolatility) * 100).toFixed(3)}%
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-slate-400 text-sm">
            Analysis based on {spreadAnalysis.dataPoints} data points over {spreadAnalysis.timeWindow} minutes
          </div>
        </div>
      )}

      {/* Market Impact Model */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Market Impact Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1000, 5000, 10000].map(tradeSize => {
            const impactModel = engine.calculateMarketImpactModel(selectedSymbol, tradeSize);
            return (
              <div key={tradeSize} className="bg-slate-700 rounded-lg p-4">
                <div className="text-white font-medium mb-3">
                  Trade Size: {tradeSize.toLocaleString()} shares
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Temporary Impact:</span>
                    <span className="text-white font-medium">
                      {(impactModel.temporaryImpact * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Permanent Impact:</span>
                    <span className="text-white font-medium">
                      {(impactModel.permanentImpact * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Spread Cost:</span>
                    <span className="text-white font-medium">
                      {(impactModel.spreadCost * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Liquidity Score:</span>
                    <span className="text-white font-medium">
                      {impactModel.liquidityScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketMicrostructure;