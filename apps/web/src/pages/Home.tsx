import { Link, useNavigate } from 'react-router-dom';
import { ModernNavbar } from '../components/ModernNavbar';
import { useAuth } from '../state/auth';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function HomePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({
    mealsSaved: 0,
    activeMembers: 0,
    activeCustomers: 0,
    partnerBusinesses: 0,
    communitiesSupported: 0,
    revenueRecovered: 0,
    ordersFulfilled: 0,
    avgRating: '0.0'
  });

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [stories, setStories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = () => {
    api.get('/site-reviews').then(res => {
      setReviews(res.data.reviews);
    }).catch(err => {
      console.error('Failed to fetch reviews:', err);
    });
  };

  useEffect(() => {
    api.get('/public/stats').then(res => {
      setStats(prev => ({ ...prev, ...res.data }));
    }).catch(err => {
      console.error('Failed to fetch stats:', err);
    });

    api.get('/public/latest-stories').then(res => {
      setStories(res.data.activities);
    }).catch(err => {
      console.error('Failed to fetch stories:', err);
    });

    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      nav('/login');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/site-reviews', newReview);
      toast.success('Thank you for your feedback!');
      setShowReviewModal(false);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/site-reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PROVIDER': return 'Restaurant Owner';
      case 'DONATION_CENTER': return 'Charity';
      case 'CUSTOMER': return 'Community Member';
      default: return 'User';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PROVIDER': return '👨‍🍳';
      case 'DONATION_CENTER': return '🏥';
      case 'CUSTOMER': return '👤';
      default: return '👤';
    }
  };

  const formatNum = (num: any) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

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
          let msg = 'Could not get location. Showing all food.';
          if (err.code === 1) msg = 'Location access denied. Please enable it in browser settings.';
          else if (err.code === 3) msg = 'Location request timed out. Trying again might help.';
          
          toast.error(msg, { id: toastId });
          nav('/browse');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
                Join <span className="text-white font-bold">{formatNum(stats.activeMembers || 25000)}+</span> Sri Lankans already making their communities more sustainable. Every meal saved makes a difference.
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
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {formatNum(stats.mealsSaved)}+
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Meals Saved from Waste
              </h3>
              <p className="text-sm text-gray-600">
                That's enough food to feed {formatNum(Math.floor(stats.mealsSaved / 3))} families for a day!
              </p>
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp animation-delay-200">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">👥</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {formatNum(stats.activeMembers)}+
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Community Members
              </h3>
              <p className="text-sm text-gray-600">
                Join our growing network of {formatNum(stats.activeMembers)} heroes
              </p>
            </div>

            {/* Partner Businesses */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fadeInUp animation-delay-400">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">🏪</span>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {formatNum(stats.partnerBusinesses)}+
              </div>
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
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {formatNum(stats.communitiesSupported)}+
              </div>
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
                Join {formatNum(stats.partnerBusinesses)}+ restaurants, bakeries, and grocery stores reducing waste while earning additional income.
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
                    <p className="text-gray-600">Connect with {formatNum(stats.activeCustomers)}+ active users looking for great food deals near them.</p>


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
                <div className="text-3xl font-bold text-gray-900 mb-1">LKR {formatNum(stats.revenueRecovered)}</div>
                <div className="text-sm text-gray-600">Revenue Recovered</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">🏪</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatNum(stats.partnerBusinesses)}+</div>
                <div className="text-sm text-gray-600">Partner Businesses</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgRating}/5</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{formatNum(stats.ordersFulfilled)}+</div>
                <div className="text-sm text-gray-600">Orders Fulfilled</div>
              </div>

              {/* Provider Testimonial - Using a real review if available */}
              <div className="col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">{reviews[0] ? getRoleIcon(reviews[0].user.role) : '👨‍🍳'}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{reviews[0] ? reviews[0].user.name : 'Rajesh Kumar'}</div>
                    <div className="text-sm text-gray-600">{reviews[0] ? getRoleLabel(reviews[0].user.role) : 'Tony\'s Pizzeria'}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm">
                  "{reviews[0] ? reviews[0].comment : "We've recovered revenue and prevented tons of food waste. Highly recommend!"}"
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Impact Stories Section */}
      {stories.length > 0 && (
        <div className="bg-white py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="max-w-2xl">
                <div className="inline-block bg-orange-100 rounded-full px-6 py-2 mb-4">
                  <span className="text-orange-700 font-semibold text-sm">📸 Community Impact</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Real Stories, Real Change</h2>
                <p className="text-xl text-gray-600">
                  See how your donations are making a direct impact in communities across Sri Lanka.
                </p>
              </div>
              <Link 
                to="/donation-centers" 
                className="text-orange-600 font-bold hover:underline flex items-center gap-2 group"
              >
                View all centers <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((s: any) => (
                <div key={s.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col transform hover:-translate-y-2">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-orange-200 group-hover:rotate-6 transition-transform">
                        {s.center.image ? <img src={s.center.image} className="w-full h-full object-cover rounded-2xl" alt="" /> : '🏥'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">{s.center.name}</h4>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {s.request && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-widest">
                        <span>🤝</span> {s.request.title.replace('Fundraising for:', '')}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:translate-x-1 transition-transform duration-300">{s.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6">{s.content}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <HomeImageGrid images={s.images || []} />
                  </div>

                  <Link 
                    to={`/donation-centers/${s.center.userId}`}
                    className="absolute inset-0 z-0"
                    aria-label="View Story"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What People Say</h2>
            <p className="text-xl text-gray-600 mb-8">Hear from our community members</p>
            
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 border-2 border-green-500 font-semibold rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-sm"
            >
              <span>⭐</span>
              <span>Share Your Experience</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.length > 0 ? (
              reviews.map((rev, i) => (
                <div key={rev.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-none'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>

                    <p className="text-gray-700 italic mb-6 text-center">
                      "{rev.comment}"
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{getRoleIcon(rev.user.role)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{rev.user.name}</div>
                      <div className="text-sm text-gray-600">{getRoleLabel(rev.user.role)}</div>
                    </div>
                  </div>
                  
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 justify-center transition-colors"
                    >
                      <span>🗑️</span>
                      <span>Delete Review</span>
                    </button>
                  )}

                </div>
              ))
            ) : (
              // Fallback placeholders if no reviews yet
              <>
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-6 h-6 text-yellow-400 fill-yellow-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
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
                {/* Add more fallbacks if desired, but 1 is fine for a placeholder */}
              </>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fadeInUp">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Site Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How was your experience?</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`transition-transform hover:scale-110`}
                      >
                        <svg
                          className={`w-10 h-10 transition-all ${newReview.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-none'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>

                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback</label>
                  <textarea
                    required
                    rows={4}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell us what you think about Food for Everyone..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>
          </div>
        )}
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

function HomeImageGrid({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  
  const imgClass = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110";

  if (images.length === 1) {
    return (
      <div className="h-64 overflow-hidden">
        <img src={images[0]} className={imgClass} alt="Story" />
      </div>
    );
  }
  
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 h-64 overflow-hidden">
        {images.map((img, i) => (
          <div key={i} className="overflow-hidden">
            <img src={img} className={imgClass} alt="Story" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 h-64 overflow-hidden">
      <div className="overflow-hidden">
        <img src={images[0]} className={imgClass} alt="Story" />
      </div>
      <div className="grid grid-rows-2 gap-1 h-full overflow-hidden">
        <div className="overflow-hidden">
          <img src={images[1]} className={imgClass} alt="Story" />
        </div>
        <div className="relative overflow-hidden">
          <img src={images[2]} className={imgClass} alt="Story" />
          {images.length > 3 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-xl">
              +{images.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
