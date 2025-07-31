import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, BarChart } from 'lucide-react';

const Dashboard: React.FC = () => {
  const metrics = [
    { 
      title: 'Portfolio Value', 
      value: '$2,847,392', 
      change: '+12.5%', 
      positive: true, 
      icon: DollarSign 
    },
    { 
      title: 'Daily P&L', 
      value: '$+18,249', 
      change: '+2.8%', 
      positive: true, 
      icon: TrendingUp 
    },
    { 
      title: 'Sharpe Ratio', 
      value: '1.84', 
      change: '+0.12', 
      positive: true, 
      icon: Target 
    },
    { 
      title: 'Max Drawdown', 
      value: '-8.2%', 
      change: 'Improved', 
      positive: false, 
      icon: AlertTriangle 
    },
  ];

  const positions = [
    { symbol: 'AAPL', shares: 500, price: 175.43, value: 87715, pnl: 4.2 },
    { symbol: 'GOOGL', shares: 200, price: 138.21, value: 27642, pnl: -1.8 },
    { symbol: 'MSFT', shares: 300, price: 378.85, value: 113655, pnl: 2.1 },
    { symbol: 'TSLA', shares: 150, price: 248.50, value: 37275, pnl: -3.4 },
    { symbol: 'NVDA', shares: 100, price: 875.28, value: 87528, pnl: 8.7 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Portfolio Dashboard</h2>
        <div className="text-slate-400 text-sm">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <Icon className="text-blue-400" size={24} />
                <span className={`text-sm font-medium ${
                  metric.positive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-slate-400 text-sm">
                {metric.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart className="text-blue-400" size={20} />
            Top Positions
          </h3>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {position.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{position.symbol}</div>
                    <div className="text-slate-400 text-sm">{position.shares} shares</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    ${position.value.toLocaleString()}
                  </div>
                  <div className={`text-sm ${
                    position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}{position.pnl}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Chart</h3>
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-4 text-blue-400" />
              <p>Interactive chart visualization</p>
              <p className="text-sm mt-2">Real-time performance tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;