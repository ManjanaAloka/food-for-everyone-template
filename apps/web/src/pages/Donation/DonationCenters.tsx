import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function DonationCentersPage() {
  const centers = useQuery({ queryKey: ['centers'], queryFn: async () => (await api.get('/donation-centers')).data });
  const requests = useQuery({ queryKey: ['requests'], queryFn: async () => (await api.get('/donation-centers/requests')).data });
  const [activeTab, setActiveTab] = useState<'centers' | 'requests'>('centers');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-orange-100 rounded-full px-6 py-2 mb-4">
            <span className="text-orange-700 font-semibold text-sm">❤️ Giving Back</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Donation Centers</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Connect with local donation centers and help ensure surplus food reaches those in need.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('centers')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'centers'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🏥 Donation Centers
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Active Requests
          </button>
        </div>

        {/* Centers Tab */}
        {activeTab === 'centers' && (
          <div>
            {centers.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 mt-4">Loading centers...</p>
              </div>
            ) : centers.data?.centers?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">🏥</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No centers yet</h2>
                <p className="text-gray-600">Check back soon for donation centers in your area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centers.data?.centers?.map((c: any) => (
                  <div
                    key={c.userId}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                  >
                    {/* Center Icon */}
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl">🏥</span>
                    </div>

                    {/* Center Name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{c.name}</h3>

                    {/* Address */}
                    {c.address && (
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-gray-400 mt-1">📍</span>
                        <p className="text-sm text-gray-600">{c.address}</p>
                      </div>
                    )}

                    {/* City */}
                    {c.city && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400">🏛️</span>
                        <p className="text-sm text-gray-600">{c.city}</p>
                      </div>
                    )}

                    {/* Contact */}
                    {c.user?.email && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-gray-400">✉️</span>
                        <p className="text-sm text-gray-600">{c.user.email}</p>
                      </div>
                    )}

                    {/* Verified Badge */}
                    {c.verifiedAt && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <span>✔️</span>
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {requests.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 mt-4">Loading requests...</p>
              </div>
            ) : requests.data?.requests?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No active requests</h2>
                <p className="text-gray-600">There are no donation requests at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.data?.requests?.map((r: any) => {
                  const progress = r.targetQty > 0 ? (r.fulfilledQty / r.targetQty) * 100 : 0;
                  const isComplete = r.fulfilledQty >= r.targetQty;

                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            r.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : r.status === 'FULFILLED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {r.status}
                        </span>
                        {isComplete && <span className="text-2xl">✅</span>}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{r.title}</h3>

                      {/* Description */}
                      {r.description && (
                        <p className="text-sm text-gray-600 mb-4">{r.description}</p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">
                            {r.fulfilledQty} / {r.targetQty}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isComplete
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-orange-500 to-red-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Center Info */}
                      {r.center && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>🏥</span>
                          <span>{r.center.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">🤝 Help Make a Difference</h2>
            <p className="text-orange-100 mb-6">
              When you donate food through our platform, you're helping fight hunger in your community while reducing food waste.
            </p>
            <a
              href="/browse"
              className="inline-block px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Food to Donate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
