import React, { useState } from 'react';
import { Activity, AlertTriangle, Shield, TrendingDown, Calculator } from 'lucide-react';

const RiskAnalysis: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState({
    portfolioValue: 1000000,
    positions: [
      { symbol: 'AAPL', value: 200000, beta: 1.2, volatility: 0.25 },
      { symbol: 'GOOGL', value: 150000, beta: 1.1, volatility: 0.28 },
      { symbol: 'MSFT', value: 180000, beta: 0.9, volatility: 0.22 },
      { symbol: 'TSLA', value: 100000, beta: 2.1, volatility: 0.45 },
      { symbol: 'SPY', value: 120000, beta: 1.0, volatility: 0.18 },
      { symbol: 'BONDS', value: 250000, beta: 0.1, volatility: 0.05 }
    ]
  });

  const [timeHorizon, setTimeHorizon] = useState(1); // days
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  // Calculate portfolio metrics
  const calculateRiskMetrics = () => {
    const { positions, portfolioValue } = portfolioData;
    
    // Calculate portfolio beta (weighted average)
    const portfolioBeta = positions.reduce((sum, pos) => 
      sum + (pos.value / portfolioValue) * pos.beta, 0
    );

    // Calculate portfolio volatility (simplified - assuming zero correlation)
    const portfolioVariance = positions.reduce((sum, pos) => {
      const weight = pos.value / portfolioValue;
      return sum + Math.pow(weight * pos.volatility, 2);
    }, 0);
    const portfolioVolatility = Math.sqrt(portfolioVariance);

    // VaR calculation (parametric method)
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326; // 95% or 99%
    const dailyVaR = portfolioValue * portfolioVolatility * zScore * Math.sqrt(timeHorizon / 252);
    
    // Expected Shortfall (CVaR) - simplified approximation
    const expectedShortfall = dailyVaR * 1.28; // approximation for normal distribution

    // Maximum Drawdown simulation (simplified)
    const maxDrawdown = portfolioVolatility * 2.5; // simplified estimate

    // Sharpe Ratio (assuming risk-free rate of 3%)
    const riskFreeRate = 0.03;
    const expectedReturn = 0.08; // assumed portfolio return
    const sharpeRatio = (expectedReturn - riskFreeRate) / portfolioVolatility;

    return {
      portfolioBeta: portfolioBeta.toFixed(2),
      portfolioVolatility: (portfolioVolatility * 100).toFixed(2),
      dailyVaR: dailyVaR.toFixed(0),
      expectedShortfall: expectedShortfall.toFixed(0),
      maxDrawdown: (maxDrawdown * 100).toFixed(1),
      sharpeRatio: sharpeRatio.toFixed(2)
    };
  };

  const riskMetrics = calculateRiskMetrics();

  const riskCategories = [
    {
      name: 'Market Risk',
      level: parseFloat(riskMetrics.portfolioBeta) > 1.2 ? 'High' : 
             parseFloat(riskMetrics.portfolioBeta) > 0.8 ? 'Medium' : 'Low',
      color: parseFloat(riskMetrics.portfolioBeta) > 1.2 ? 'text-red-400' : 
             parseFloat(riskMetrics.portfolioBeta) > 0.8 ? 'text-orange-400' : 'text-green-400',
      description: 'Sensitivity to market movements'
    },
    {
      name: 'Volatility Risk',
      level: parseFloat(riskMetrics.portfolioVolatility) > 25 ? 'High' : 
             parseFloat(riskMetrics.portfolioVolatility) > 15 ? 'Medium' : 'Low',
      color: parseFloat(riskMetrics.portfolioVolatility) > 25 ? 'text-red-400' : 
             parseFloat(riskMetrics.portfolioVolatility) > 15 ? 'text-orange-400' : 'text-green-400',
      description: 'Price fluctuation risk'
    },
    {
      name: 'Concentration Risk',
      level: 'Medium',
      color: 'text-orange-400',
      description: 'Portfolio diversification level'
    },
    {
      name: 'Liquidity Risk',
      level: 'Low',
      color: 'text-green-400',
      description: 'Ability to exit positions'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Risk Analysis</h2>
      </div>

      {/* Portfolio Settings */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Risk Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">Time Horizon (Days)</label>
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value={1}>1 Day</option>
              <option value={7}>1 Week</option>
              <option value={30}>1 Month</option>
              <option value={252}>1 Year</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-2">Confidence Level</label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-2">Portfolio Value</label>
            <input
              type="text"
              value={`$${portfolioData.portfolioValue.toLocaleString()}`}
              readOnly
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Risk Metrics */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Calculator className="text-blue-400" size={20} />
            Key Risk Metrics
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-red-400" size={16} />
                <span className="text-slate-300">Value at Risk ({(confidenceLevel * 100).toFixed(0)}%)</span>
              </div>
              <span className="text-white font-bold">${riskMetrics.dailyVaR}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-400" size={16} />
                <span className="text-slate-300">Expected Shortfall</span>
              </div>
              <span className="text-white font-bold">${riskMetrics.expectedShortfall}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="text-purple-400" size={16} />
                <span className="text-slate-300">Portfolio Beta</span>
              </div>
              <span className="text-white font-bold">{riskMetrics.portfolioBeta}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-400" size={16} />
                <span className="text-slate-300">Portfolio Volatility</span>
              </div>
              <span className="text-white font-bold">{riskMetrics.portfolioVolatility}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-red-400" size={16} />
                <span className="text-slate-300">Max Drawdown (Est.)</span>
              </div>
              <span className="text-white font-bold">{riskMetrics.maxDrawdown}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="text-green-400" size={16} />
                <span className="text-slate-300">Sharpe Ratio</span>
              </div>
              <span className="text-white font-bold">{riskMetrics.sharpeRatio}</span>
            </div>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-400" size={20} />
            Risk Assessment
          </h3>
          
          <div className="space-y-4">
            {riskCategories.map((risk, index) => (
              <div key={index} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{risk.name}</span>
                  <span className={`font-bold ${risk.color}`}>{risk.level}</span>
                </div>
                <p className="text-slate-400 text-sm">{risk.description}</p>
                <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      risk.level === 'High' ? 'bg-red-500' : 
                      risk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: risk.level === 'High' ? '80%' : 
                             risk.level === 'Medium' ? '50%' : '25%' 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-blue-400" size={16} />
              <span className="text-blue-400 font-medium">Risk Summary</span>
            </div>
            <p className="text-slate-300 text-sm">
              Your portfolio shows moderate risk exposure with a beta of {riskMetrics.portfolioBeta} and 
              volatility of {riskMetrics.portfolioVolatility}%. The {(confidenceLevel * 100).toFixed(0)}% VaR 
              suggests potential losses could reach ${riskMetrics.dailyVaR} over {timeHorizon} day(s).
            </p>
          </div>
        </div>
      </div>

      {/* Position Risk Breakdown */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Position Risk Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-slate-300 font-medium py-3">Symbol</th>
                <th className="text-slate-300 font-medium py-3">Value</th>
                <th className="text-slate-300 font-medium py-3">Weight</th>
                <th className="text-slate-300 font-medium py-3">Beta</th>
                <th className="text-slate-300 font-medium py-3">Volatility</th>
                <th className="text-slate-300 font-medium py-3">Risk Contribution</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.positions.map((position, index) => {
                const weight = (position.value / portfolioData.portfolioValue * 100);
                const riskContribution = weight * position.volatility;
                return (
                  <tr key={index} className="border-b border-slate-700/50">
                    <td className="text-white font-medium py-3">{position.symbol}</td>
                    <td className="text-slate-300 py-3">${position.value.toLocaleString()}</td>
                    <td className="text-slate-300 py-3">{weight.toFixed(1)}%</td>
                    <td className="text-slate-300 py-3">{position.beta.toFixed(2)}</td>
                    <td className="text-slate-300 py-3">{(position.volatility * 100).toFixed(1)}%</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(riskContribution * 4, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm">{riskContribution.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;