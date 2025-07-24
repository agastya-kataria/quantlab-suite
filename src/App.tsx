import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import PortfolioOptimizer from './components/PortfolioOptimizer';
import OptionsPricing from './components/OptionsPricing';
import MonteCarloSimulation from './components/MonteCarloSimulation';
import RiskAnalysis from './components/RiskAnalysis';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <PortfolioOptimizer />;
      case 'options':
        return <OptionsPricing />;
      case 'montecarlo':
        return <MonteCarloSimulation />;
      case 'risk':
        return <RiskAnalysis />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;