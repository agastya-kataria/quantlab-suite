import React, { useState, useEffect } from 'react';
import { Brain, Play, Pause, Square, TrendingUp, AlertTriangle } from 'lucide-react';
import { StrategyFramework, MeanReversionStrategy, MomentumStrategy, StrategyConfig } from '../services/StrategyFramework';
import { MarketMicrostructureEngine } from '../services/MarketMicrostructureEngine';
import { OrderManagementSystem } from '../services/OrderManagementSystem';
import { Strategy, TradingSignal } from '../types/trading';

const StrategyManager: React.FC = () => {
  const [marketEngine] = useState(() => new MarketMicrostructureEngine());
  const [orderManager] = useState(() => new OrderManagementSystem());
  const [strategyFramework] = useState(() => new StrategyFramework(marketEngine, orderManager));
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [strategyPerformance, setStrategyPerformance] = useState<any>(null);

  useEffect(() => {
    // Initialize default strategies
    const meanReversionConfig: StrategyConfig = {
      name: 'Mean Reversion',
      symbols: ['AAPL', 'GOOGL', 'MSFT'],
      parameters: {
        lookbackPeriod: 20,
        zScoreThreshold: 2.0
      },
      riskLimits: {
        maxPositionSize: 10000,
        maxDailyLoss: 50000,
        maxDrawdown: 0.15,
        concentrationLimit: 0.25
      },
      enabled: true
    };

    const momentumConfig: StrategyConfig = {
      name: 'Momentum',
      symbols: ['TSLA', 'NVDA', 'QQQ'],
      parameters: {
        shortPeriod: 5,
        longPeriod: 20
      },
      riskLimits: {
        maxPositionSize: 5000,
        maxDailyLoss: 30000,
        maxDrawdown: 0.20,
        concentrationLimit: 0.20
      },
      enabled: true
    };

    const meanReversionStrategy = new MeanReversionStrategy(meanReversionConfig);
    const momentumStrategy = new MomentumStrategy(momentumConfig);

    strategyFramework.addStrategy(meanReversionStrategy);
    strategyFramework.addStrategy(momentumStrategy);
    strategyFramework.start();

    const interval = setInterval(() => {
      setStrategies(strategyFramework.getStrategies());
      
      if (selectedStrategy) {
        const performance = strategyFramework.getStrategyPerformance(selectedStrategy);
        setStrategyPerformance(performance);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      strategyFramework.stop();
    };
  }, [strategyFramework, selectedStrategy]);

  const handleStartStrategy = (strategyName: string) => {
    strategyFramework.startStrategy(strategyName);
  };

  const handleStopStrategy = (strategyName: string) => {
    strategyFramework.stopStrategy(strategyName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400';
      case 'PAUSED':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Play className="text-green-400" size={16} />;
      case 'PAUSED':
        return <Pause className="text-orange-400" size={16} />;
      default:
        return <Square className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Strategy Framework</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy List */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Active Strategies</h3>
          
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(strategy.status)}
                      <span className="text-white font-medium">{strategy.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(strategy.status)}`}>
                      {strategy.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {strategy.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStopStrategy(strategy.name)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartStrategy(strategy.name)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedStrategy(strategy.name)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">P&L</div>
                    <div className={`font-bold ${
                      strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${strategy.pnl.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Max Drawdown</div>
                    <div className="text-white font-bold">
                      {(strategy.maxDrawdown * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Sharpe Ratio</div>
                    <div className="text-white font-bold">
                      {strategy.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                </div>

                {strategy.positions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-slate-400 text-sm mb-2">Positions:</div>
                    <div className="flex flex-wrap gap-2">
                      {strategy.positions.map((position, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-600 rounded text-xs text-white">
                          {position.symbol}: {position.quantity > 0 ? '+' : ''}{position.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {strategy.lastSignal && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-slate-400 text-sm mb-1">Last Signal:</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.lastSignal.action === 'BUY' ? 'bg-green-600 text-white' : 
                        strategy.lastSignal.action === 'SELL' ? 'bg-red-600 text-white' : 
                        'bg-slate-600 text-white'
                      }`}>
                        {strategy.lastSignal.action}
                      </span>
                      <span className="text-white text-sm">{strategy.lastSignal.symbol}</span>
                      <span className="text-slate-400 text-sm">
                        Confidence: {(strategy.lastSignal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Performance Details */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Strategy Performance</h3>
          
          {strategyPerformance ? (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-slate-400 text-sm mb-1">Total P&L</div>
                  <div className={`text-2xl font-bold ${
                    strategyPerformance.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${strategyPerformance.pnl.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-slate-400 text-sm mb-1">Max Drawdown</div>
                  <div className="text-red-400 text-2xl font-bold">
                    {(strategyPerformance.maxDrawdown * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Current Positions */}
              {strategyPerformance.positions.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Current Positions</h4>
                  <div className="space-y-2">
                    {strategyPerformance.positions.map((position: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{position.symbol}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.quantity > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {position.quantity > 0 ? 'LONG' : 'SHORT'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {Math.abs(position.quantity).toLocaleString()} @ ${position.avgPrice.toFixed(2)}
                          </div>
                          <div className={`text-sm ${
                            position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            P&L: ${position.unrealizedPnL.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Signals */}
              {strategyPerformance.signals.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Recent Signals</h4>
                  <div className="space-y-2">
                    {strategyPerformance.signals.slice(-5).reverse().map((signal: TradingSignal, index: number) => (
                      <div key={index} className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">{signal.symbol}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              signal.action === 'BUY' ? 'bg-green-600 text-white' : 
                              signal.action === 'SELL' ? 'bg-red-600 text-white' : 
                              'bg-slate-600 text-white'
                            }`}>
                              {signal.action}
                            </span>
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-slate-300 text-sm mb-2">
                          {signal.reasoning}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-400">
                            Strength: <span className="text-white">{(signal.strength * 100).toFixed(0)}%</span>
                          </span>
                          <span className="text-slate-400">
                            Confidence: <span className="text-white">{(signal.confidence * 100).toFixed(0)}%</span>
                          </span>
                          {signal.targetPrice && (
                            <span className="text-slate-400">
                              Target: <span className="text-white">${signal.targetPrice.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-4 text-slate-500" />
                <p>Select a strategy to view performance details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Framework Status */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={20} />
          Framework Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-blue-400 text-sm font-medium mb-1">Active Strategies</div>
            <div className="text-white text-2xl font-bold">
              {strategies.filter(s => s.status === 'ACTIVE').length}
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-green-400 text-sm font-medium mb-1">Total Positions</div>
            <div className="text-white text-2xl font-bold">
              {strategies.reduce((sum, s) => sum + s.positions.length, 0)}
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-orange-400 text-sm font-medium mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${
              strategies.reduce((sum, s) => sum + s.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              ${strategies.reduce((sum, s) => sum + s.pnl, 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-purple-400 text-sm font-medium mb-1">Avg Sharpe Ratio</div>
            <div className="text-white text-2xl font-bold">
              {strategies.length > 0 ? 
                (strategies.reduce((sum, s) => sum + s.sharpeRatio, 0) / strategies.length).toFixed(2) : 
                '0.00'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyManager;