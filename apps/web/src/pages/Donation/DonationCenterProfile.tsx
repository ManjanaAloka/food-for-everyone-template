import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function DonationCenterProfilePage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['center-profile', id],
    queryFn: async () => (await api.get(`/donation-centers/${id}`)).data
  });

  if (isLoading) return (
    <div className="min-h-screen pt-24 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  const center = data?.center;
  if (!center) return <div className="pt-24 text-center">Center not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-orange-100 rounded-3xl flex items-center justify-center text-5xl shadow-inner border-2 border-orange-200">
            {center.image ? <img src={center.image} alt={center.name} className="w-full h-full object-cover rounded-3xl" /> : '🏥'}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{center.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-600">
              <span className="flex items-center gap-1">📍 {center.address || 'Address not provided'}</span>
              <span className="flex items-center gap-1">✉️ {center.user.email}</span>
              {center.verifiedAt && <span className="flex items-center gap-1 text-green-600 font-bold">✔️ Verified Center</span>}
            </div>
          </div>
          <Link 
            to="/give-back" 
            className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all"
          >
            Support this Center
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
        {/* Left Column: Requests & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Requests</h2>
            {center.requests.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No active fundraising requests at the moment.</p>
            ) : (
              <div className="space-y-4">
                {center.requests.map((r: any) => (
                  <div key={r.id} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
                    <div className="text-xs text-orange-600 mb-3">LKR {Number(r.raisedAmount).toFixed(0)} / {Number(r.targetAmount).toFixed(0)}</div>
                    <Link 
                      to="/give-back" 
                      className="text-xs font-bold text-orange-700 hover:underline"
                    >
                      Donate Now →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span>Type</span>
                <span className="font-medium text-gray-900">{center.centerType || 'NGO'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span>Registration</span>
                <span className="font-medium text-gray-900">{center.registrationNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Beneficiaries</span>
                <span className="font-medium text-gray-900">{center.beneficiariesCount || '50+'} souls</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activities (Impact Stories) */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📸 Impact Stories & Activities
          </h2>
          
          {center.activities.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No stories yet</h3>
              <p className="text-gray-500">Check back later to see what this center has been up to!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {center.activities.map((a: any) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                        {center.image ? <img src={center.image} className="w-full h-full object-cover rounded-full" alt="" /> : '🏥'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-none mb-1">{center.name}</h4>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const url = window.location.href;
                        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(a.title)}`;
                        window.open(fbUrl, '_blank', 'width=600,height=400');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Share to Facebook"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{a.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
                  </div>

                  {/* Image Grid */}
                  <div className="border-t border-gray-100">
                    <ImageGrid images={a.images || []} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageGrid({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  
  if (images.length === 1) {
    return <img src={images[0]} className="w-full h-80 object-cover" alt="Story" />;
  }
  
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 h-80">
        {images.map((img, i) => <img key={i} src={img} className="w-full h-full object-cover" alt="Story" />)}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 h-80">
        <img src={images[0]} className="w-full h-full object-cover row-span-2" alt="Story" />
        <div className="grid grid-rows-2 gap-0.5 h-full">
          <img src={images[1]} className="w-full h-full object-cover" alt="Story" />
          <img src={images[2]} className="w-full h-full object-cover" alt="Story" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 h-80">
      <img src={images[0]} className="w-full h-full object-cover" alt="Story" />
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
        {images.slice(1, 4).map((img, i) => (
          <div key={i} className="relative h-full">
            <img src={img} className="w-full h-full object-cover" alt="Story" />
            {i === 2 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
