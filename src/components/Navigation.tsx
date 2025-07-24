import React from 'react';
import { TrendingUp, PieChart, Calculator, BarChart3, Activity, Send, Layers, Brain } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'options', label: 'Options Pricing', icon: Calculator },
    { id: 'montecarlo', label: 'Monte Carlo', icon: TrendingUp },
    { id: 'risk', label: 'Risk Analysis', icon: Activity },
    { id: 'orders', label: 'Order Management', icon: Send },
    { id: 'microstructure', label: 'Market Structure', icon: Layers },
    { id: 'strategies', label: 'Strategy Framework', icon: Brain },
  ];

  return (
    <nav className="bg-slate-800 border-r border-slate-700 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-blue-400" />
          QuantLab
        </h1>
        <p className="text-slate-400 text-sm mt-1">Professional Analytics</p>
      </div>
      
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;