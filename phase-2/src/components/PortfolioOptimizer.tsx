import React, { useState } from 'react';
import { PieChart, TrendingUp, Calculator, Target } from 'lucide-react';

const PortfolioOptimizer: React.FC = () => {
  const [expectedReturns, setExpectedReturns] = useState({
    AAPL: 12.5,
    GOOGL: 10.8,
    MSFT: 11.2,
    TSLA: 18.7,
    NVDA: 22.3
  });

  const [riskTolerance, setRiskTolerance] = useState(0.15);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const assets = Object.keys(expectedReturns);

  const optimizePortfolio = () => {
    // Simplified portfolio optimization simulation
    const totalReturn = Object.values(expectedReturns).reduce((a, b) => a + b, 0);
    const weights = Object.fromEntries(
      assets.map(asset => [
        asset, 
        (expectedReturns[asset as keyof typeof expectedReturns] / totalReturn * 100).toFixed(1)
      ])
    );

    setOptimizationResult({
      weights,
      expectedReturn: (totalReturn / assets.length).toFixed(2),
      expectedRisk: (riskTolerance * 100).toFixed(1),
      sharpeRatio: ((totalReturn / assets.length) / (riskTolerance * 100)).toFixed(2)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PieChart className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Portfolio Optimization</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Expected Returns (%)</h3>
          <div className="space-y-4">
            {assets.map(asset => (
              <div key={asset} className="flex items-center justify-between">
                <label className="text-slate-300 font-medium">{asset}</label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedReturns[asset as keyof typeof expectedReturns]}
                  onChange={(e) => setExpectedReturns(prev => ({
                    ...prev,
                    [asset]: parseFloat(e.target.value)
                  }))}
                  className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <label className="block text-slate-300 font-medium mb-2">
              Risk Tolerance (Volatility)
            </label>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1">
              <span>Conservative (5%)</span>
              <span className="text-blue-400 font-medium">{(riskTolerance * 100).toFixed(1)}%</span>
              <span>Aggressive (30%)</span>
            </div>
          </div>

          <button
            onClick={optimizePortfolio}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calculator size={20} />
            Optimize Portfolio
          </button>
        </div>

        {/* Optimization Results */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Optimal Allocation</h3>
          
          {optimizationResult ? (
            <div className="space-y-6">
              {/* Portfolio Weights */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Asset Weights</h4>
                <div className="space-y-3">
                  {Object.entries(optimizationResult.weights).map(([asset, weight]) => (
                    <div key={asset} className="flex items-center justify-between">
                      <span className="text-slate-300">{asset}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${weight}%` }}
                          />
                        </div>
                        <span className="text-white font-medium w-12 text-right">{weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-400" size={16} />
                    <span className="text-slate-300">Expected Return</span>
                  </div>
                  <span className="text-white font-bold">{optimizationResult.expectedReturn}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="text-orange-400" size={16} />
                    <span className="text-slate-300">Expected Risk</span>
                  </div>
                  <span className="text-white font-bold">{optimizationResult.expectedRisk}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calculator className="text-blue-400" size={16} />
                    <span className="text-slate-300">Sharpe Ratio</span>
                  </div>
                  <span className="text-white font-bold">{optimizationResult.sharpeRatio}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <PieChart size={48} className="mx-auto mb-4 text-slate-500" />
                <p>Click "Optimize Portfolio" to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioOptimizer;