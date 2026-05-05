import { Link, useNavigate } from 'react-router-dom';
import { ModernNavbar } from '../components/ModernNavbar';
import { useAuth } from '../state/auth';
import { toast } from 'sonner';

export function HomePage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      const toastId = toast.loading('Finding your location...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          toast.success('Location found!', { id: toastId });
          nav(`/browse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=10`);
        },
        (err) => {
          console.error(err);
          toast.error('Could not get location. Showing all food.', { id: toastId });
          nav('/browse');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      nav('/browse');
    }
  };

  return (
    <>
      <ModernNavbar />
      <div className="min-h-screen pt-16">
      {/* Dark Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-[90vh] overflow-hidden flex items-center">

        
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8 animate-fadeInUp">
              <div className="inline-block">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm">
                  <span>🚀</span>
                  <span>Ready to Join?</span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <div className="text-white mb-2 flex items-center gap-4">
                  Start Making a
                </div>
                <div>
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Difference</span>
                  {' '}
                  <span className="text-yellow-400">Today</span>
                </div>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-xl">
                Join <span className="text-white font-bold">25,000+</span> Sri Lankans already making their communities more sustainable. Every meal saved makes a difference.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {user?.role === 'DONATION_CENTER' ? (
                  <Link 
                    to="/browse" 
                    className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/70 transform hover:scale-105"
                  >
                    <span>🍔</span>
                    <span>Request Food</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ) : user?.role === 'PROVIDER' ? (
                  <Link 
                    to="/provider/dashboard" 
                    className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transform hover:scale-105"
                  >
                    <span>📊</span>
                    <span>Go to Dashboard</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                ) : user?.role === 'CUSTOMER' ? (
                  <button 
                    onClick={handleLocationSearch}
                    className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/70 transform hover:scale-105"
                  >
                    <span>🔍</span>
                    <span>Around My Location</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/50 hover:shadow-xl shadow-green-500/70 transform hover:scale-105"
                    >
                      <span>👥</span>
                      <span>Start Your Journey</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <button 
                      onClick={handleLocationSearch}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-green-400 border border-green-500/30 px-8 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm"
                    >
                      <span>🔍</span>
                      <span>Around My Location</span>
                    </button>
                  </>
                )}
              </div>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-6 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">100% Free to use</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">Instant notifications</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">Verified businesses</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Food Cards */}
            {user?.role !== 'PROVIDER' && (
              <div className="relative animate-fadeInUp animation-delay-400">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-3xl">
                        🍕
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900">Fresh Pizza Available!</div>
                        <div className="text-sm text-gray-600">Tony's Pizzeria - 200m away</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-transform duration-300 ml-12">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center text-3xl">
                        🥐
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900">Bakery Items - 50% Off</div>
                        <div className="text-sm text-gray-600">Sweet Dreams Bakery</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Plate & Fork Icon */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-5xl animate-slideInRight shadow-2xl border border-white/20 z-10">
                  🍽️
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Meals Saved */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">25,470+</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Meals Saved from Waste
              </h3>
              <p className="text-sm text-gray-600">
                That's enough food to feed 8,490 families for a day!
              </p>
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp animation-delay-200">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">👥</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">12,840+</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Community Members
              </h3>
              <p className="text-sm text-gray-600">
                Growing by 200+ new members every week
              </p>
            </div>

            {/* Partner Businesses */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp animation-delay-400">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">🏪</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">1,560+</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Partner Businesses
              </h3>
              <p className="text-sm text-gray-600">
                Restaurants, bakeries, and grocery stores
              </p>
            </div>

            {/* Communities Supported */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp animation-delay-600">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">🏠</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">890+</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Communities Supported
              </h3>
              <p className="text-sm text-gray-600">
                Orphanages, schools, and community centers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
              <span className="text-green-700 font-semibold text-sm">✨ Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started is easy. Follow these simple steps to save food and help your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                1
              </div>
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Browse Nearby Food</h3>
              <p className="text-gray-600 text-center">
                Discover surplus food from local bakeries and supermarkets near you at discounted prices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                2
              </div>
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <span className="text-5xl">🛍️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Place Your Order</h3>
              <p className="text-gray-600 text-center">
                Pick your favorites, decide on pickup or delivery, and pay safely online or with cash on delivery.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                3
              </div>
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <img 
                  src="https://img.icons8.com/arcade/64/food-donor.png" 
                  alt="food-donor"
                  className="w-14 h-14 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Enjoy & Make Impact</h3>
              <p className="text-gray-600 text-center">
                Get your food and feel good knowing you've helped reduce waste and support local businesses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Service Providers Section */}
      <div id="for-providers" className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div>
              <div className="inline-block bg-blue-100 rounded-full px-6 py-2 mb-4">
                <span className="text-blue-700 font-semibold text-sm">🏪 For Businesses</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Turn Surplus into Revenue
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join 1,560+ restaurants, bakeries, and grocery stores reducing waste while earning additional income.
              </p>

              {/* Benefits List */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Recover Lost Revenue</h3>
                    <p className="text-gray-600">Sell surplus food at a discount instead of throwing it away. Every meal counts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Reduce Environmental Impact</h3>
                    <p className="text-gray-600">Cut your carbon footprint and contribute to a more sustainable food system.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Reach New Customers</h3>
                    <p className="text-gray-600">Connect with 12,840+ active users looking for great food deals near them.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Easy to Use Platform</h3>
                    <p className="text-gray-600">Simple dashboard to manage listings, track orders, and communicate with customers.</p>
                  </div>
                </div>
              </div>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>🚀</span>
                <span>Join as a Provider</span>
              </Link>
            </div>

            {/* Right Side - Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">💵</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">₹2.5M+</div>
                <div className="text-sm text-gray-600">Revenue Recovered</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">🏪</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">1,560+</div>
                <div className="text-sm text-gray-600">Partner Businesses</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">4.8/5</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">25K+</div>
                <div className="text-sm text-gray-600">Orders Fulfilled</div>
              </div>

              {/* Provider Testimonial */}
              <div className="col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍🍳</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                    <div className="text-sm text-gray-600">Tony's Pizzeria</div>
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm">
                  "We've recovered over ₹50,000 in revenue and prevented tons of food waste. Highly recommend!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What People Say</h2>
            <p className="text-xl text-gray-600">Hear from our community members</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 italic mb-6 text-center">
                "Amazing platform! We've donated over 500 meals to local communities through this app."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                  <div className="text-sm text-gray-600">Restaurant Owner</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 italic mb-6 text-center">
                "I save money and help the environment. It's a win-win! Best decision I made this year."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Priya Silva</div>
                  <div className="text-sm text-gray-600">Student</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 italic mb-6 text-center">
                "As a donation center, this platform helps us receive fresh food donations efficiently."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏥</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Hope Foundation</div>
                  <div className="text-sm text-gray-600">Charity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Saving Food?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of Sri Lankans making a difference every day
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-2xl text-lg"
          >
            🚀 Get Started Now - It's Free!
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🍽️</span>
                </div>
                <span className="font-bold text-xl">Food for Everyone</span>
              </div>
              <p className="text-gray-400 mb-6">
                Fighting food waste and feeding communities across Sri Lanka. Together, we're building a more sustainable future.
              </p>
              {/* Social icons removed */}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition">Browse Food</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition">Join Us</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* For Businesses */}
            <div>
              <h3 className="font-semibold text-lg mb-4">For Businesses</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Partner With Us</a></li>
                <li><Link to="/register?role=provider" className="text-gray-400 hover:text-white transition">Business Signup</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">API Documentation</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Safety Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Community Guidelines</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Feedback</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2025 Food for Everyone. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
