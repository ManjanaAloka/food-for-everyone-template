import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../env';

const containerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '1.5rem',
  overflow: 'hidden',
};

const defaultCenter = {
  lat: 6.9271, // Colombo
  lng: 79.8612
};

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressSelect?: (data: { address?: string; city: string }) => void;
  initialLat?: number;
  initialLng?: number;
  address?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

export function MapPicker({ onLocationSelect, onAddressSelect, initialLat, initialLng, address }: MapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [center, setCenter] = useState<google.maps.LatLngLiteral>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const extractCity = (results: google.maps.GeocoderResult[]) => {
    let city = "";
    if (results[0]) {
      for (const component of results[0].address_components) {
        if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
          city = component.long_name;
          break;
        }
      }
    }
    return city;
  };

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!isLoaded || !onAddressSelect) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const city = extractCity(results);
        onAddressSelect({ address: results[0].formatted_address, city });
      }
    });
  }, [isLoaded, onAddressSelect]);

  const handleLocationSelect = useCallback((lat: number, lng: number, skipReverse = false) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
    if (!skipReverse) {
      reverseGeocode(lat, lng);
    }
  }, [onLocationSelect, reverseGeocode]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handleLocationSelect(e.latLng.lat(), e.latLng.lng());
    }
  }, [handleLocationSelect]);

  const hasAutoLocated = useRef(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation && !initialLat && !hasAutoLocated.current) {
      hasAutoLocated.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(newPos);
          handleLocationSelect(newPos.lat, newPos.lng);
        },
        () => console.log("Geolocation blocked or failed")
      );
    }
  }, [initialLat, handleLocationSelect]);

  // Sync map with typed address (WITHOUT overwriting the input field)
  useEffect(() => {
    if (isLoaded && address && address.length > 5) {
      const geocoder = new google.maps.Geocoder();
      const timeoutId = setTimeout(() => {
        geocoder.geocode({ address: address + ", Sri Lanka" }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            const newPos = { lat: loc.lat(), lng: loc.lng() };
            
            // Update internal map state
            setCenter(newPos);
            setPosition(newPos);
            
            // Notify parent about new coordinates
            onLocationSelect(newPos.lat, newPos.lng);
            
            // Update city if found, but DO NOT call onAddressSelect with 'address' 
            // to avoid overwriting what the user is typing.
            if (onAddressSelect) {
              const city = extractCity(results);
              onAddressSelect({ city }); 
            }
          }
        });
      }, 1500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, address, onLocationSelect, onAddressSelect]);

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(newPos);
        setPosition(newPos);
        handleLocationSelect(newPos.lat, newPos.lng);
        map?.panTo(newPos);
      });
    }
  };

  return isLoaded ? (
    <div className="relative group rounded-3xl overflow-hidden border-2 border-gray-100 shadow-xl transition-all hover:border-green-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onClick={onMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: mapStyles
        }}
      >
        {position && <MarkerF position={position} animation={window.google ? window.google.maps.Animation.DROP : undefined} />}
      </GoogleMap>

      {/* Overlays */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50 text-[10px] font-black text-gray-800 uppercase tracking-widest pointer-events-auto">
          {position ? `📍 ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '📍 Pick a location'}
        </div>
        
        <button 
          onClick={locateMe}
          type="button"
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-2xl shadow-lg pointer-events-auto transition-transform active:scale-90 flex items-center gap-2 group/btn"
        >
          <span className="text-xl">🎯</span>
          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-300 text-xs font-bold whitespace-nowrap">Locate Me</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] text-white/80 font-medium">
        Click map to auto-fill address & city
      </div>
    </div>
  ) : (
    <div className="w-full h-[350px] bg-gray-50 rounded-3xl animate-pulse flex items-center justify-center border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="text-4xl mb-3">🛰️</div>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Initializing GPS...</p>
      </div>
    </div>
  );
}

const mapStyles = [
  { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
  { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#cae3f1" }, { "visibility": "on" }] }
];
