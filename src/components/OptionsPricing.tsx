import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, Target } from 'lucide-react';

const OptionsPricing: React.FC = () => {
  const [inputs, setInputs] = useState({
    spotPrice: 100,
    strikePrice: 105,
    timeToExpiry: 0.25, // 3 months
    riskFreeRate: 0.05,
    volatility: 0.2,
    optionType: 'call'
  });

  const [result, setResult] = useState<{
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  } | null>(null);

  // Black-Scholes calculation
  const calculateBlackScholes = () => {
    const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma } = inputs;
    
    // Standard normal cumulative distribution function approximation
    const normCDF = (x: number): number => {
      return 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
    };

    // Standard normal probability density function
    const normPDF = (x: number): number => {
      return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    };

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    let price: number;
    if (inputs.optionType === 'call') {
      price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    } else {
      price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    }

    // Greeks calculations
    const delta = inputs.optionType === 'call' ? normCDF(d1) : normCDF(d1) - 1;
    const gamma = normPDF(d1) / (S * sigma * sqrtT);
    const theta = inputs.optionType === 'call' 
      ? (-S * normPDF(d1) * sigma / (2 * sqrtT) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365
      : (-S * normPDF(d1) * sigma / (2 * sqrtT) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
    const vega = S * normPDF(d1) * sqrtT / 100;
    const rho = inputs.optionType === 'call'
      ? K * T * Math.exp(-r * T) * normCDF(d2) / 100
      : -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;

    setResult({ price, delta, gamma, theta, vega, rho });
  };

  useEffect(() => {
    calculateBlackScholes();
  }, [inputs]);

  const handleInputChange = (field: string, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Options Pricing (Black-Scholes)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Parameters</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Option Type</label>
                <select
                  value={inputs.optionType}
                  onChange={(e) => handleInputChange('optionType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Spot Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.spotPrice}
                  onChange={(e) => handleInputChange('spotPrice', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Strike Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.strikePrice}
                  onChange={(e) => handleInputChange('strikePrice', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Time to Expiry (Years)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.timeToExpiry}
                  onChange={(e) => handleInputChange('timeToExpiry', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Risk-Free Rate (%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={inputs.riskFreeRate}
                  onChange={(e) => handleInputChange('riskFreeRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Volatility (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.volatility}
                  onChange={(e) => handleInputChange('volatility', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Pricing Results</h3>
          
          {result && (
            <div className="space-y-4">
              {/* Option Price */}
              <div className="bg-blue-600 rounded-lg p-4 text-center">
                <div className="text-blue-100 text-sm font-medium mb-1">Option Price</div>
                <div className="text-white text-3xl font-bold">${result.price.toFixed(2)}</div>
              </div>

              {/* Greeks */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="text-green-400" size={14} />
                    <span className="text-slate-300 text-sm">Delta</span>
                  </div>
                  <div className="text-white font-bold">{result.delta.toFixed(4)}</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="text-orange-400" size={14} />
                    <span className="text-slate-300 text-sm">Gamma</span>
                  </div>
                  <div className="text-white font-bold">{result.gamma.toFixed(4)}</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="text-red-400" size={14} />
                    <span className="text-slate-300 text-sm">Theta</span>
                  </div>
                  <div className="text-white font-bold">{result.theta.toFixed(4)}</div>
                </div>
                
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="text-purple-400" size={14} />
                    <span className="text-slate-300 text-sm">Vega</span>
                  </div>
                  <div className="text-white font-bold">{result.vega.toFixed(4)}</div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="text-blue-400" size={14} />
                  <span className="text-slate-300 text-sm">Rho</span>
                </div>
                <div className="text-white font-bold">{result.rho.toFixed(4)}</div>
              </div>

              {/* Greeks Explanation */}
              <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-600">
                <p><strong>Delta:</strong> Price sensitivity to underlying price</p>
                <p><strong>Gamma:</strong> Rate of change of delta</p>
                <p><strong>Theta:</strong> Time decay per day</p>
                <p><strong>Vega:</strong> Sensitivity to volatility (per 1%)</p>
                <p><strong>Rho:</strong> Sensitivity to interest rate (per 1%)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionsPricing;