import { useNavigate, useSearchParams } from 'react-router-dom';

export function CheckoutCancelPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Canceled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was canceled. No charges have been made to your account.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono font-semibold text-gray-900">{orderId}</p>
              <p className="text-xs text-gray-500 mt-2">This order is still pending payment</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => nav('/checkout')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => nav('/browse')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
