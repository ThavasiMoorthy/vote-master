import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, MapPin, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import MapPreview from '@/components/MapPreview';
import { api } from '@/lib/mockBackend';

const AddFlow = ({ onNavigate }) => {
  const [sheets, setSheets] = useState([]);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const fetchedSheets = await api.sheets.list();
      setSheets(fetchedSheets);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sheets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewPoint = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            await api.points.create({ location });
            toast({
              title: "Location Added",
              description: `Point added at ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to save location point",
              variant: "destructive"
            });
          }
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get current location. Please try again.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (sheet) => {
    onNavigate('enter', sheet);
  };

  const handleDelete = async (sheetId) => {
    try {
      await api.sheets.delete(sheetId);
      setSheets(sheets.filter(s => s.id !== sheetId));
      toast({
        title: "Sheet Deleted",
        description: "Sheet has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sheet",
        variant: "destructive"
      });
    }
  };

  const getColourLabel = (value) => {
    const colours = {
      saffron: 'Saffron',
      black: 'Black',
      red: 'Red',
      yellow: 'Yellow',
      blue: 'Blue',
      white: 'White',
      darkpink: 'Dark Pink'
    };
    return colours[value] || value;
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
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => onNavigate('splash')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">Add Location</h2>
            <div className="w-20"></div>
          </div>

          <Button
            onClick={handleAddNewPoint}
            className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-16 text-lg shadow-lg"
          >
            <MapPin className="w-6 h-6" />
            Add New Point at My Location
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Existing Sheets</h3>
          
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading records...</div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No sheets created yet</p>
              <p className="text-sm">Create your first sheet using the ENTER button</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getColourClass(sheet.colourRound)}`}></div>
                      <h4 className="font-semibold text-gray-800">{sheet.houseName}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sheet)}
                        className="h-8 w-8 hover:bg-blue-100"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sheet.id)}
                        className="h-8 w-8 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Community:</span> {sheet.community}</p>
                    <p><span className="font-medium">Voters:</span> {sheet.noOfVoters}</p>
                    <p><span className="font-medium">Colour:</span> {getColourLabel(sheet.colourRound)}</p>
                    {sheet.location && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location set
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {showMapPreview && (
        <MapPreview
          onClose={() => setShowMapPreview(false)}
          onLocationSelect={(location) => {
            setShowMapPreview(false);
          }}
        />
      )}
    </div>
  );
};

export default AddFlow;