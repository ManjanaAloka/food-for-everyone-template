import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function PublicImpactPage() {
  const { data, isLoading } = useQuery({ queryKey: ['impact'], queryFn: async () => (await api.get('/reports/public')).data });
  
  const t = data?.totals || {};
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-block bg-green-100 rounded-full px-4 sm:px-6 py-2 mb-3 sm:mb-4">
            <span className="text-green-700 font-semibold text-xs sm:text-sm">🌍 Our Impact</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Making a Difference Together
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Every meal saved is a step towards a more sustainable future. Here's the impact we've made together.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="text-gray-600 mt-4">Loading impact data...</p>
          </div>
        ) : (
          <>
            {/* Impact Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {/* Orders Delivered */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">📦</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t.ordersDelivered || 0}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Orders Delivered</div>
              </div>

              {/* Food Saved */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🍽️</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {(t.foodSavedKg || 0).toFixed ? t.foodSavedKg.toFixed(2) : t.foodSavedKg}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Kilograms of Food Saved</div>
              </div>

              {/* CO2 Avoided */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🌱</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {(t.co2eAvoidedKg || 0).toFixed ? t.co2eAvoidedKg.toFixed(2) : t.co2eAvoidedKg}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Kg CO₂ Emissions Avoided</div>
              </div>

              {/* Donations */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">❤️</span>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t.donations || 0}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Meals Donated</div>
              </div>
            </div>

            {/* Impact Story Sections */}
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Environmental Impact */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 sm:p-8">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🌍</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Environmental Impact</h2>
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                  By preventing food waste, we're reducing greenhouse gas emissions and conserving the resources used in food production.
                </p>
                <div className="bg-white/60 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong className="text-green-700">Did you know?</strong> Food waste is responsible for 8-10% of global greenhouse gas emissions.
                  </p>
                </div>
              </div>

              {/* Social Impact */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 sm:p-8">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🤝</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Social Impact</h2>
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                  Through our donation program, we're helping ensure that surplus food reaches those who need it most.
                </p>
                <div className="bg-white/60 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong className="text-orange-700">Together we can:</strong> Reduce hunger while fighting food waste in our community.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6 sm:p-8 text-center text-white shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Join Our Mission</h2>
              <p className="text-sm sm:text-base text-green-100 mb-4 sm:mb-6 max-w-2xl mx-auto">
                Every purchase you make helps reduce food waste and supports local providers. Together, we can create a more sustainable food system.
              </p>
              <a
                href="/browse"
                className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-green-600 text-sm sm:text-base font-semibold rounded-lg hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Browse Available Food
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
