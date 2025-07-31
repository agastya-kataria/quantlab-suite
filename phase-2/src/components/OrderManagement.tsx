import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { OrderManagementSystem } from '../services/OrderManagementSystem';
import { Order, OrderType, ExecutionMetrics } from '../types/trading';

const OrderManagement: React.FC = () => {
  const [oms] = useState(() => new OrderManagementSystem());
  const [orders, setOrders] = useState<Order[]>([]);
  const [executionMetrics, setExecutionMetrics] = useState<Map<string, ExecutionMetrics>>(new Map());
  const [newOrder, setNewOrder] = useState({
    symbol: 'AAPL',
    side: 'BUY' as const,
    type: 'MARKET' as OrderType,
    quantity: 100,
    price: 0,
    stopPrice: 0,
    timeInForce: 'DAY' as const,
    displayQuantity: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(oms.getAllOrders());
      
      // Update execution metrics
      const metrics = new Map<string, ExecutionMetrics>();
      oms.getAllOrders().forEach(order => {
        const orderMetrics = oms.getExecutionMetrics(order.id);
        if (orderMetrics) {
          metrics.set(order.id, orderMetrics);
        }
      });
      setExecutionMetrics(metrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [oms]);

  const handleSubmitOrder = () => {
    const orderRequest = {
      ...newOrder,
      price: newOrder.type === 'MARKET' ? undefined : newOrder.price,
      stopPrice: ['STOP', 'STOP_LIMIT'].includes(newOrder.type) ? newOrder.stopPrice : undefined,
      displayQuantity: newOrder.type === 'ICEBERG' ? newOrder.displayQuantity : undefined
    };

    oms.submitOrder(orderRequest);
    
    // Reset form
    setNewOrder({
      ...newOrder,
      quantity: 100,
      price: 0,
      stopPrice: 0,
      displayQuantity: 0
    });
  };

  const handleCancelOrder = (orderId: string) => {
    oms.cancelOrder(orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FILLED':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="text-red-400" size={16} />;
      case 'PARTIALLY_FILLED':
        return <AlertTriangle className="text-orange-400" size={16} />;
      default:
        return <Clock className="text-blue-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FILLED':
        return 'text-green-400';
      case 'CANCELLED':
      case 'REJECTED':
        return 'text-red-400';
      case 'PARTIALLY_FILLED':
        return 'text-orange-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Send className="text-blue-400" size={32} />
        <h2 className="text-3xl font-bold text-white">Order Management System</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Entry */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">New Order</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Symbol</label>
                <select
                  value={newOrder.symbol}
                  onChange={(e) => setNewOrder({...newOrder, symbol: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="AAPL">AAPL</option>
                  <option value="GOOGL">GOOGL</option>
                  <option value="MSFT">MSFT</option>
                  <option value="TSLA">TSLA</option>
                  <option value="NVDA">NVDA</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Side</label>
                <select
                  value={newOrder.side}
                  onChange={(e) => setNewOrder({...newOrder, side: e.target.value as 'BUY' | 'SELL'})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Order Type</label>
                <select
                  value={newOrder.type}
                  onChange={(e) => setNewOrder({...newOrder, type: e.target.value as OrderType})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                  <option value="STOP">Stop</option>
                  <option value="STOP_LIMIT">Stop Limit</option>
                  <option value="ICEBERG">Iceberg</option>
                  <option value="TWAP">TWAP</option>
                  <option value="VWAP">VWAP</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({...newOrder, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {['LIMIT', 'STOP_LIMIT'].includes(newOrder.type) && (
              <div>
                <label className="block text-slate-300 font-medium mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({...newOrder, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {['STOP', 'STOP_LIMIT'].includes(newOrder.type) && (
              <div>
                <label className="block text-slate-300 font-medium mb-2">Stop Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newOrder.stopPrice}
                  onChange={(e) => setNewOrder({...newOrder, stopPrice: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {newOrder.type === 'ICEBERG' && (
              <div>
                <label className="block text-slate-300 font-medium mb-2">Display Quantity</label>
                <input
                  type="number"
                  value={newOrder.displayQuantity}
                  onChange={(e) => setNewOrder({...newOrder, displayQuantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-2">Time in Force</label>
              <select
                value={newOrder.timeInForce}
                onChange={(e) => setNewOrder({...newOrder, timeInForce: e.target.value as any})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="GTC">Good Till Cancelled</option>
                <option value="DAY">Day</option>
                <option value="IOC">Immediate or Cancel</option>
                <option value="FOK">Fill or Kill</option>
              </select>
            </div>

            <button
              onClick={handleSubmitOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Submit Order
            </button>
          </div>
        </div>

        {/* Order Book */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Order Book</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-slate-300 font-medium py-3">Order ID</th>
                  <th className="text-slate-300 font-medium py-3">Symbol</th>
                  <th className="text-slate-300 font-medium py-3">Side</th>
                  <th className="text-slate-300 font-medium py-3">Type</th>
                  <th className="text-slate-300 font-medium py-3">Qty</th>
                  <th className="text-slate-300 font-medium py-3">Price</th>
                  <th className="text-slate-300 font-medium py-3">Filled</th>
                  <th className="text-slate-300 font-medium py-3">Status</th>
                  <th className="text-slate-300 font-medium py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(-10).reverse().map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50">
                    <td className="text-slate-300 py-3 font-mono text-sm">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="text-white font-medium py-3">{order.symbol}</td>
                    <td className={`py-3 font-medium ${
                      order.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {order.side}
                    </td>
                    <td className="text-slate-300 py-3">{order.type}</td>
                    <td className="text-slate-300 py-3">{order.quantity.toLocaleString()}</td>
                    <td className="text-slate-300 py-3">
                      {order.price ? `$${order.price.toFixed(2)}` : 'Market'}
                    </td>
                    <td className="text-slate-300 py-3">
                      {order.fillQuantity.toLocaleString()} / {order.quantity.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {order.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Execution Metrics */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-400" size={20} />
          Execution Quality Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from(executionMetrics.entries()).slice(-4).map(([orderId, metrics]) => (
            <div key={orderId} className="bg-slate-700 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-2">Order: {orderId.substring(0, 8)}...</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm">Slippage:</span>
                  <span className="text-white font-medium">
                    {(metrics.slippage * 100).toFixed(3)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm">Fill Rate:</span>
                  <span className="text-white font-medium">
                    {(metrics.fillRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm">Market Impact:</span>
                  <span className="text-white font-medium">
                    {(metrics.marketImpact * 100).toFixed(3)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 text-sm">Impl. Shortfall:</span>
                  <span className="text-white font-medium">
                    {(metrics.implementationShortfall * 100).toFixed(3)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;