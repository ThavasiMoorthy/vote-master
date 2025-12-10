import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, MapPin, Edit, Trash2, FileText, LogOut, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import MapPreview from '@/components/MapPreview';
import { api } from '@/lib/mockBackend';
import { useAuth } from '@/context/AuthContext';

const AddFlow = ({ onNavigate }) => {
  const [sheets, setSheets] = useState([]);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [mapInitialLocation, setMapInitialLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      const fetchedSheets = await api.sheets.list();
      setSheets(fetchedSheets);
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to load sheets",
      //   variant: "destructive"
      // });
      console.error("Failed to load sheets", error);
    } finally {
      setIsLoading(false);
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
            <Button
              variant="ghost"
              onClick={() => {
                logout();
              }}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>


        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Existing Sheets</h3>
            </div>

            <div className="relative w-full max-w-2xl mx-auto">
              <Search className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search house name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading records...</div>
          ) : sheets.filter(s => s.houseName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No sheets found</p>
              {searchQuery ? (
                <p className="text-sm">Try a different search term</p>
              ) : (
                <p className="text-sm">Create your first sheet using the ENTER button</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.filter(s => s.houseName.toLowerCase().includes(searchQuery.toLowerCase())).map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleEdit(sheet)}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md cursor-pointer group"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sheet.id);
                        }}
                        className="h-10 w-10 hover:bg-red-100 rounded-full"
                      >
                        <Trash2 className="w-6 h-6 text-red-600" />
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
          initialLocation={mapInitialLocation}
          onClose={() => setShowMapPreview(false)}
          onLocationSelect={async (location) => {
            setShowMapPreview(false);
            try {
              await api.points.create({ location });
              toast({ title: 'Location Added', description: `Point added at ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
            } catch (err) {
              toast({ title: 'Error', description: 'Failed to save location point', variant: 'destructive' });
            }
          }}
        />
      )}
    </div>
  );
};

export default AddFlow;