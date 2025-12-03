import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, MapPin, Crosshair } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const MapPreview = ({ onClose, onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || { lat: 28.6139, lng: 77.2090 }); // Default: New Delhi
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  // Dynamically load Google Maps script
  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return Promise.reject(new Error('Google Maps API key is not set. Please set VITE_GOOGLE_MAPS_API_KEY in .env'));
    }
    // Surface auth failures (invalid key / referer restrictions) to the UI
    try {
      window.gm_authFailure = function() {
        toast({
          title: 'Google Maps Authentication Failed',
          description: 'Map failed to authenticate. Check API key, billing, and referrer restrictions in Google Cloud Console. See browser console for details.',
          variant: 'destructive'
        });
      };
    } catch (e) {
      // ignore
    }
    if (window.google && window.google.maps) return Promise.resolve(window.google.maps);

    return new Promise((resolve, reject) => {
      const existing = document.getElementById('google-maps-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // log which script url was used (helps confirm which key was appended)
        try { console.debug('Google Maps script loaded:', script.src); } catch(e) {}
        resolve(window.google.maps);
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then((maps) => {
        if (!mounted) return;
        // initialize map
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          zoom: 15,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
          zoomControl: true,
        });

        markerRef.current = new maps.Marker({
          position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          map: mapRef.current,
          draggable: true,
        });

        // click listener to set marker
        mapRef.current.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedLocation({ lat, lng });
          if (markerRef.current) markerRef.current.setPosition({ lat, lng });
        });

        // dragend listener on marker
        markerRef.current.addListener('dragend', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedLocation({ lat, lng });
        });

        // Trigger a resize after a short delay to ensure tiles render when the modal animation completes
        setTimeout(() => {
          try {
            if (maps && mapRef.current) {
              maps.event.trigger(mapRef.current, 'resize');
              mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
            }
          } catch (e) {
            // ignore
          }
        }, 300);
      })
      .catch((err) => {
        toast({ title: 'Map Error', description: err.message, variant: 'destructive' });
      });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep marker in sync when selectedLocation changes (from Use Current Location)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      if (mapRef.current) mapRef.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
  }, [selectedLocation]);

  // If parent provides a new initialLocation after mount, update the selectedLocation
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          setIsLoadingLocation(false);
          toast({
            title: "Location Captured",
            description: "Current GPS position set successfully",
          });
        },
        (error) => {
          setIsLoadingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get current location. Please select manually on map.",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
    }
  };

  // Map clicks are handled by the Google Maps listener initialized in useEffect

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Select Location</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Coordinates:</span> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
            <Button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="gap-2 bg-green-500 hover:bg-green-600"
              size="sm"
            >
              <Crosshair className="w-4 h-4" />
              {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100 relative min-h-[420px]">
          <div ref={mapContainerRef} className="absolute inset-0 h-full" />
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={() => onLocationSelect(selectedLocation)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Confirm Location
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MapPreview;