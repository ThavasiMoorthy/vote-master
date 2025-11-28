import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, MapPin, Crosshair } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const MapPreview = ({ onClose, onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || { lat: 28.6139, lng: 77.2090 }); // Default: New Delhi
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    // Initialize map would go here with Google Maps API
    // For now, we'll use a mock implementation
  }, []);

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

  const handleMapClick = (e) => {
    // In real implementation, this would get coordinates from map click
    // For now, we'll simulate with a small random offset
    const newLocation = {
      lat: selectedLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: selectedLocation.lng + (Math.random() - 0.5) * 0.01
    };
    setSelectedLocation(newLocation);
  };

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

        <div 
          className="flex-1 bg-gray-100 relative cursor-crosshair"
          onClick={handleMapClick}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-64 h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-4 border-blue-300 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 grid-rows-8 h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-gray-300"></div>
                    ))}
                  </div>
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative z-10"
                >
                  <MapPin className="w-16 h-16 text-red-500 drop-shadow-lg" />
                </motion.div>
              </div>
              <p className="text-sm text-gray-600">
                Click anywhere on the map to set location<br />
                <span className="text-xs text-gray-500">(Using Google Maps API in production)</span>
              </p>
            </div>
          </div>
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