import React, { useState } from 'react';
import { TrendingUp, Play, BarChart, Target } from 'lucide-react';

const MonteCarloSimulation: React.FC = () => {
  const [parameters, setParameters] = useState({
    initialPrice: 100,
    drift: 0.08,
    volatility: 0.2,
    timeHorizon: 1,
    numSimulations: 1000,
    timeSteps: 252
  });

  const [results, setResults] = useState<{
    finalPrices: number[];
    meanPrice: number;
    stdDev: number;
    var95: number;
    var99: number;
    paths: number[][];
  } | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = async () => {
    setIsRunning(true);
    
    // Simulate delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { initialPrice: S0, drift: mu, volatility: sigma, timeHorizon: T, numSimulations: N, timeSteps: steps } = parameters;
    const dt = T / steps;
    const finalPrices: number[] = [];
    const paths: number[][] = [];

    // Box-Muller transform for normal random variables
    const normalRandom = (): number => {
      const u1 = Math.random();
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };

    for (let sim = 0; sim < N; sim++) {
      let price = S0;
      const path = [price];

      for (let step = 0; step < steps; step++) {
        const z = normalRandom();
        price = price * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z);
        if (sim < 10) path.push(price); // Store only first 10 paths for visualization
      }

      finalPrices.push(price);
      if (sim < 10) paths.push(path);
    }

    // Calculate statistics
    const meanPrice = finalPrices.reduce((sum, price) => sum + price, 0) / N;
    const variance = finalPrices.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / (N - 1);
    const stdDev = Math.sqrt(variance);
    
    // Calculate VaR (Value at Risk)
    const sortedPrices = [...finalPrices].sort((a, b) => a - b);
    const var95 = sortedPrices[Math.floor(0.05 * N)];
    const var99 = sortedPrices[Math.floor(0.01 * N)];

    setResults({
      finalPrices,
      meanPrice,
      stdDev,
      var95,
      var99,
      paths
    });

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Monte Carlo Simulation</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Simulation Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Initial Price ($)</label>
              <input
                type="number"
                value={parameters.initialPrice}
                onChange={(e) => setParameters(prev => ({ ...prev, initialPrice: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Annual Drift (%)</label>
              <input
                type="number"
                step="0.01"
                value={parameters.drift}
                onChange={(e) => setParameters(prev => ({ ...prev, drift: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Volatility (%)</label>
              <input
                type="number"
                step="0.01"
                value={parameters.volatility}
                onChange={(e) => setParameters(prev => ({ ...prev, volatility: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Time Horizon (Years)</label>
              <input
                type="number"
                step="0.1"
                value={parameters.timeHorizon}
                onChange={(e) => setParameters(prev => ({ ...prev, timeHorizon: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Number of Simulations</label>
              <select
                value={parameters.numSimulations}
                onChange={(e) => setParameters(prev => ({ ...prev, numSimulations: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
              </select>
            </div>

            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Statistics */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart className="text-blue-400" size={20} />
                  Simulation Results
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <div className="text-blue-400 text-sm font-medium mb-1">Mean Price</div>
                    <div className="text-white text-xl font-bold">${results.meanPrice.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <div className="text-green-400 text-sm font-medium mb-1">Std Deviation</div>
                    <div className="text-white text-xl font-bold">${results.stdDev.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <div className="text-orange-400 text-sm font-medium mb-1">VaR 95%</div>
                    <div className="text-white text-xl font-bold">${results.var95.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-slate-700 rounded-lg p-4 text-center">
                    <div className="text-red-400 text-sm font-medium mb-1">VaR 99%</div>
                    <div className="text-white text-xl font-bold">${results.var99.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Price Paths Visualization */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Sample Price Paths</h3>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <TrendingUp size={48} className="mx-auto mb-4 text-blue-400" />
                    <p>Interactive price path visualization</p>
                    <p className="text-sm mt-2">Showing {results.paths.length} sample paths</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <Target size={48} className="mx-auto mb-4 text-slate-500" />
                  <p>Click "Run Simulation" to generate results</p>
                  <p className="text-sm mt-2">Monte Carlo price path simulation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonteCarloSimulation;