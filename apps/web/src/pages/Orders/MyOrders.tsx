import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LS_ORDERS = 'ffe_my_orders';
export function MyOrdersPage() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem(LS_ORDERS); setIds(raw ? JSON.parse(raw) : []); } catch { setIds([]); } }, []);
  
  if (!ids.length) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">After placing an order, it will appear here on this device.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
            <span className="text-green-700 font-semibold text-sm">📦 My Orders</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order History</h1>
          <p className="text-xl text-gray-600">View your recent orders and track their status</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-3">
            {ids.map((id, index) => (
              <Link 
                key={id} 
                to={`/orders/${id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all hover:border-green-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Order #{index + 1}</div>
                    <div className="text-sm text-gray-600">{id}</div>
                  </div>
                </div>
                <div className="text-green-600 font-medium">View Details →</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
