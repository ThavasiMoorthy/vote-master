
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Home, Users } from 'lucide-react';
import { api } from '@/lib/mockBackend';
import { toast } from '@/components/ui/use-toast';

const MapView = ({ onNavigate }) => {
  const [sheets, setSheets] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedSheets, fetchedPoints] = await Promise.all([
        api.sheets.list(),
        api.points.list()
      ]);
      setSheets(fetchedSheets);
      setPoints(fetchedPoints);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [error, setError] = useState(null);

  // Load Google Maps
  useEffect(() => {
    if (isLoading) return;

    const loadGoogleMaps = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setError('Google Maps API Key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
        return Promise.reject('API Key missing');
      }

      if (window.google && window.google.maps) {
        return Promise.resolve(window.google.maps);
      }

      return new Promise((resolve, reject) => {
        const existing = document.getElementById('google-maps-script');
        if (existing) {
          // If script exists but window.google isn't ready, wait for it.
          // If it's already loaded but we missed it (shouldn't happen due to check above), 
          // we might be in a race. Safe fallback:
          if (existing.dataset.loaded === 'true') {
            resolve(window.google.maps);
            return;
          }
          existing.addEventListener('load', () => {
            existing.dataset.loaded = 'true';
            resolve(window.google.maps);
          });
          existing.addEventListener('error', () => reject('Failed to load Google Maps script'));
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve(window.google.maps);
        };
        script.onerror = () => reject('Failed to load Google Maps script');
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps().then((maps) => {
      if (!mapContainerRef.current) return;

      // Initialize Map
      const map = new maps.Map(mapContainerRef.current, {
        center: { lat: 11.1271, lng: 78.6569 }, // Default to Tamil Nadu center
        zoom: 7,
        streetViewControl: false,
        mapTypeControl: true,
      });
      mapRef.current = map;

      // Bounds to fit all markers
      const bounds = new maps.LatLngBounds();
      let hasValidMarkers = false;

      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Add Sheet Markers
      sheets.forEach(sheet => {
        if (sheet.location && sheet.location.lat && sheet.location.lng) {
          const marker = new maps.Marker({
            position: sheet.location,
            map: map,
            title: sheet.houseName,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getMarkerColor(sheet.colourRound),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            setSelectedMarker({ ...sheet, type: 'sheet' });
          });

          markersRef.current.push(marker);
          bounds.extend(sheet.location);
          hasValidMarkers = true;
        }
      });

      // Add Point Markers
      points.forEach(point => {
        if (point.location && point.location.lat && point.location.lng) {
          const marker = new maps.Marker({
            position: point.location,
            map: map,
            title: 'Location Point',
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
              fillColor: '#16a34a', // green-600
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#ffffff',
              scale: 1.5,
              anchor: new maps.Point(12, 24),
            }
          });

          marker.addListener('click', () => {
            setSelectedMarker({ ...point, type: 'point' });
          });

          markersRef.current.push(marker);
          bounds.extend(point.location);
          hasValidMarkers = true;
        }
      });

      if (hasValidMarkers) {
        map.fitBounds(bounds);
      } else if (sheets.length > 0 || points.length > 0) {
        // Data exists but no valid locations
        toast({ title: 'Warning', description: 'Records found but none have GPS coordinates.', variant: 'warning' });
      }

    }).catch((err) => {
      console.error(err);
      setError(typeof err === 'string' ? err : 'Failed to load Google Maps');
    });

  }, [isLoading, sheets, points]);

  const getMarkerColor = (colorName) => {
    const colors = {
      saffron: '#f97316', // orange-500
      black: '#000000',
      red: '#ef4444', // red-500
      yellow: '#facc15', // yellow-400
      blue: '#3b82f6', // blue-500
      white: '#9ca3af', // gray-400 (visible on white map)
      darkpink: '#db2777' // pink-600
    };
    return colors[colorName] || '#6b7280';
  };

  const getColourClass = (value) => {
    const colours = {
      saffron: 'bg-orange-500',
      black: 'bg-black',
      red: 'bg-red-500',
      yellow: 'bg-yellow-400',
      blue: 'bg-blue-500',
      white: 'bg-white border-2 border-gray-300',
      darkpink: 'bg-pink-600'
    };
    return colours[value] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-100px)]"
        >
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white shrink-0">
            <Button
              variant="ghost"
              onClick={() => onNavigate('splash')}
              className="gap-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h2 className="text-xl font-bold">Map View</h2>
            <div className="text-sm">
              {isLoading ? 'Loading...' : `${sheets.length + points.length} markers`}
            </div>
          </div>

          <div className="relative flex-1 bg-gray-200">
            {/* Map Container */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-white/80 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md border border-red-200">
                  <h3 className="text-red-600 font-bold text-lg mb-2">Map Error</h3>
                  <p className="text-gray-700 mb-4">{error}</p>
                  <p className="text-sm text-gray-500">
                    Make sure <code>VITE_GOOGLE_MAPS_API_KEY</code> is set in your <code>.env</code> file.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State / Demo Data Overlay */}
            {!isLoading && !error && sheets.length === 0 && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-8 z-40 pointer-events-none">
                <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow-2xl max-w-md text-center pointer-events-auto">
                  <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Location Data Found</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't added any voter sheets or location points yet. The map is empty because there is nothing to show.
                  </p>
                  <Button
                    onClick={async () => {
                      setIsLoading(true);
                      await api.seedData();
                      await loadData();
                      toast({ title: "Data Loaded", description: "Demo data has been added to the map." });
                    }}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Load Demo Data
                  </Button>
                </div>
              </div>
            )}

            {/* Marker Details Popup */}
            {selectedMarker && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl p-4 max-w-sm w-full mx-4 z-30"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {selectedMarker.type === 'sheet' ? (
                      <Home className="w-5 h-5 text-blue-600" />
                    ) : (
                      <MapPin className="w-5 h-5 text-green-600" />
                    )}
                    <h4 className="font-semibold text-gray-800">
                      {selectedMarker.type === 'sheet' ? selectedMarker.houseName : 'Location Point'}
                    </h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMarker(null)}
                  >
                    ×
                  </Button>
                </div>

                {selectedMarker.type === 'sheet' ? (
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getColourClass(selectedMarker.colourRound)}`}></div>
                      <span>{selectedMarker.address || selectedMarker.community}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{selectedMarker.noOfVoters} voters</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedMarker.location ? `${selectedMarker.location.lat.toFixed(6)}, ${selectedMarker.location.lng.toFixed(6)}` : 'No GPS Coordinates'}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="text-xs">
                      {selectedMarker.location ? `${selectedMarker.location.lat.toFixed(6)}, ${selectedMarker.location.lng.toFixed(6)}` : 'No GPS Coordinates'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Added: {new Date(selectedMarker.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapView;