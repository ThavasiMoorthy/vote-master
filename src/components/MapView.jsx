import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedSheets, fetchedPoints] = await Promise.all([
        api.sheets.list(),
        api.points.list()
      ]);
      setSheets(fetchedSheets.filter(s => s.location));
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

  const allMarkers = [
    ...sheets.map(s => ({ ...s, type: 'sheet' })),
    ...points.map(p => ({ ...p, type: 'point' }))
  ];

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
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
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
              {isLoading ? 'Loading...' : `${allMarkers.length} markers`}
            </div>
          </div>

          <div className="relative h-[calc(100vh-200px)] bg-gradient-to-br from-green-100 to-blue-100">
            {/* Grid background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-12 grid-rows-12 h-full">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border border-gray-300"></div>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 p-8">
              {allMarkers.map((marker, index) => {
                const position = {
                  top: `${20 + (index * 15) % 60}%`,
                  left: `${15 + (index * 20) % 70}%`
                };

                return (
                  <motion.div
                    key={marker.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    style={position}
                    className="absolute cursor-pointer"
                    onClick={() => setSelectedMarker(marker)}
                  >
                    <div className="relative group">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <MapPin 
                          className={`w-10 h-10 drop-shadow-lg ${
                            marker.type === 'sheet' ? 'text-blue-600' : 'text-green-600'
                          }`}
                        />
                      </motion.div>
                      
                      {marker.type === 'sheet' && marker.colourRound && (
                        <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${getColourClass(marker.colourRound)} border border-white`}></div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-2 z-10">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Voter Sheets ({sheets.length})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>Location Points ({points.length})</span>
              </div>
            </div>

            {selectedMarker && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl p-4 max-w-sm w-full mx-4 z-20"
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
                      <span>{selectedMarker.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{selectedMarker.noOfVoters} voters</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedMarker.location.lat.toFixed(6)}, {selectedMarker.location.lng.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="text-xs">
                      {selectedMarker.location.lat.toFixed(6)}, {selectedMarker.location.lng.toFixed(6)}
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