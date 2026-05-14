import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, CircleF } from '@react-google-maps/api';


import { GOOGLE_MAPS_API_KEY } from '../env';
import { Link } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '1.5rem',
};

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612
};

const mapOptions = {
  styles: [
    { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
    { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
    { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
    { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
    { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#cae3f1" }, { "visibility": "on" }] }
  ],
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true
};


interface ListingsMapProps {
  listings: any[];
  userLocation?: { lat: number, lng: number } | null;
  radius?: number;
}


export function ListingsMap({ listings, userLocation, radius = 25 }: ListingsMapProps) {

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [selectedListing, setSelectedListing] = useState<any>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Update bounds when listings or userLocation changes
  useEffect(() => {
    if (isLoaded && mapRef.current && listings.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasMarkers = false;
      
      listings.forEach(l => {
        const lat = Number(l.provider?.lat);
        const lng = Number(l.provider?.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
          bounds.extend({ lat, lng });
          hasMarkers = true;
        }
      });

      if (userLocation) {
        bounds.extend(userLocation);
        hasMarkers = true;
      }

      if (hasMarkers) {
        mapRef.current.fitBounds(bounds);
        // Add a small buffer/padding
        const listener = google.maps.event.addListener(mapRef.current, "idle", () => {
          if (mapRef.current && mapRef.current.getZoom()! > 15) {
            mapRef.current.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [isLoaded, listings, userLocation]);


  // Group listings by provider
  const providersMap = new Map();
  listings.forEach(l => {
    const lat = Number(l.provider?.lat);
    const lng = Number(l.provider?.lng);
    if (lat && lng) {
      if (!providersMap.has(l.providerId)) {
        providersMap.set(l.providerId, {
          ...l.provider,
          lat,
          lng,
          listings: []
        });
      }
      providersMap.get(l.providerId).listings.push(l);
    }
  });

  const providers = Array.from(providersMap.values());

  if (isLoaded && listings.length > 0 && providers.length === 0) {
    return (
      <div className="w-full h-[600px] bg-amber-50 rounded-3xl flex flex-col items-center justify-center border-4 border-dashed border-amber-200 p-8 text-center">
        <div className="text-6xl mb-4">📍</div>
        <h3 className="text-xl font-bold text-amber-900 mb-2">No Location Data Available</h3>
        <p className="text-amber-700 max-w-md">
          The available providers haven't set their map coordinates yet. 
          Please switch back to <b>Grid View</b> to see the items.
        </p>
      </div>
    );
  }

  return isLoaded ? (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onMapLoad}
        options={mapOptions}
      >

        {userLocation && (
          <>
            <MarkerF 
              position={userLocation} 
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 8,
              }}
              label={{
                text: "YOU",
                className: "mt-8 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black shadow-lg"
              }}
            />
            <CircleF
              center={userLocation}
              radius={radius * 1000} // Convert KM to Meters
              options={{
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                strokeColor: '#3B82F6',
                strokeOpacity: 0.4,
                strokeWeight: 2,
                clickable: false,
                editable: false,
                zIndex: 1
              }}
            />
          </>
        )}


        {providers.map(p => (
          <MarkerF
            key={p.userId || Math.random()}
            position={{ lat: Number(p.lat), lng: Number(p.lng) }}
            onClick={() => setSelectedListing(p.listings[0])}
            label={p.businessName ? p.businessName.substring(0, 1) : "?"}
          />
        ))}



        {selectedListing && (
          <InfoWindow
            position={{ lat: selectedListing.provider.lat, lng: selectedListing.provider.lng }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="p-0 min-w-[220px] bg-white rounded-xl overflow-hidden shadow-2xl border-0 relative">
              {/* Custom Close Button */}
              <button 
                onClick={() => setSelectedListing(null)}
                className="absolute top-2 right-2 z-50 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-lg transition-all"
              >
                ✕
              </button>
              
              {/* Image Header */}

              <div className="relative h-28 w-full group">
                <img 
                  src={selectedListing.images?.[0] || 'https://via.placeholder.com/150'} 
                  className="w-full h-full object-cover" 
                  alt={selectedListing.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest bg-green-600 px-2 py-0.5 rounded-full">
                    {selectedListing.category}
                  </span>
                  <span className="text-white text-[10px] font-black bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                    ⭐ {selectedListing.provider.ratingAvg?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    🏪 {selectedListing.provider.businessName}
                  </span>
                </div>
                <h4 className="font-black text-gray-900 text-sm mb-1 line-clamp-1">{selectedListing.title}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-600 font-black text-sm">LKR {Number(selectedListing.discountPrice).toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 line-through">LKR {Number(selectedListing.unitPrice).toFixed(2)}</span>
                </div>


                <div className="flex flex-col gap-2">
                  <Link 
                    to={`/listings/${selectedListing.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-[10px] font-black rounded-lg hover:shadow-lg transition-all"
                  >
                    <span>👀</span> VIEW DETAILS
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedListing.provider.lat},${selectedListing.provider.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      🚀 DIRECTIONS
                    </a>
                    <Link 
                      to={`/providers/${selectedListing.providerId}`}
                      className="flex items-center justify-center gap-1 py-1.5 bg-gray-50 text-gray-600 text-[9px] font-bold rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      🏪 VISIT SHOP
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}

      </GoogleMap>
      
      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Food Provider</span>
        </div>
      </div>
    </div>
  ) : (

    <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-3xl" />
  );
}


