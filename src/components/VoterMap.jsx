import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const VoterMap = ({ sheets = [], points = [] }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markersRef = useRef([]);

    // Load Google Maps
    useEffect(() => {
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

            // Initialize Map if not already done
            if (!mapRef.current) {
                const map = new maps.Map(mapContainerRef.current, {
                    center: { lat: 11.1271, lng: 78.6569 }, // Default to Tamil Nadu center
                    zoom: 7,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    backgroundColor: '#e6f3ff', // Light blue background like the image
                    styles: [
                        {
                            "featureType": "all",
                            "elementType": "all",
                            "stylers": [{ "visibility": "off" }]
                        },
                        {
                            "featureType": "landscape",
                            "elementType": "geometry",
                            "stylers": [{ "visibility": "on" }, { "color": "#f0fdf4" }] // Very light green for land
                        },
                        {
                            "featureType": "water",
                            "elementType": "geometry",
                            "stylers": [{ "visibility": "on" }, { "color": "#e0f2fe" }] // Light blue for water
                        }
                    ]
                });
                mapRef.current = map;
            }

            const map = mapRef.current;
            const bounds = new maps.LatLngBounds();
            let hasValidMarkers = false;

            // Clear existing markers
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];

            // Red Pin Icon SVG
            const pinIcon = {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: '#ef4444', // Red-500
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 2,
                anchor: new maps.Point(12, 24),
            };

            // Add Sheet Markers
            sheets.forEach(sheet => {
                if (sheet.location && sheet.location.lat && sheet.location.lng) {
                    const marker = new maps.Marker({
                        position: sheet.location,
                        map: map,
                        title: sheet.houseName,
                        icon: pinIcon, // Use the red pin for everything as requested
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
                        icon: pinIcon, // Use the red pin for everything as requested
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
                // Adjust zoom if too close (e.g. single point)
                const listener = maps.event.addListener(map, "idle", () => {
                    if (map.getZoom() > 15) map.setZoom(15);
                    maps.event.removeListener(listener);
                });
            }

        }).catch((err) => {
            console.error(err);
            setError(typeof err === 'string' ? err : 'Failed to load Google Maps');
        });

    }, [sheets, points]);

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
        <div className="relative w-full h-full bg-gray-200">
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
    );
};

export default VoterMap;
