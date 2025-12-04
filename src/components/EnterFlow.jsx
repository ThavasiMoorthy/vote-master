import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import VoterCards from '@/components/VoterCards';
import MapPreview from '@/components/MapPreview';
import { api } from '@/lib/mockBackend';
import geocodeAddress from '@/lib/geocode';

const COLOUR_ROUNDS = [
  { value: 'saffron', label: 'Saffron', color: 'bg-orange-500' },
  { value: 'black', label: 'Black', color: 'bg-black' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-400' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'white', label: 'White', color: 'bg-white border-2 border-gray-300' },
  { value: 'darkpink', label: 'Dark Pink', color: 'bg-pink-600' }
];

const EnterFlow = ({ onNavigate, editingSheet }) => {
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    houseName: '',
    colourRound: '',
    community: '',
    noOfVoters: '',
    location: null
  });
  const [voters, setVoters] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (editingSheet) {
      setFormData({
        houseName: editingSheet.houseName || '',
        colourRound: editingSheet.colourRound || '',
        community: editingSheet.community || '',
        noOfVoters: editingSheet.noOfVoters?.toString() || '',
        location: editingSheet.location || null
      });
      setVoters(editingSheet.voters || []);
    }
  }, [editingSheet]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'noOfVoters') {
      const count = parseInt(value) || 0;
      const newVoters = Array.from({ length: count }, (_, i) =>
        voters[i] || { name: '', age: '', colourRound: '' }
      );
      setVoters(newVoters);
    }
  };

  const handleAddressGeocode = async (address) => {
    if (!address || !address.includes(',')) {
      // simple heuristic: expect commas in full address, but still attempt
      // proceed anyway
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('Debug: VITE_GOOGLE_MAPS_API_KEY is', key ? 'Set' : 'Missing', key ? key.substring(0, 5) + '...' : '');

    if (!key) {
      toast({
        title: 'API Key Missing (v1.1)',
        description: 'Set `VITE_GOOGLE_MAPS_API_KEY` in your environment to enable address lookup',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsGeocoding(true);
      const result = await geocodeAddress(address);
      if (result && result.lat && result.lng) {
        const location = { lat: result.lat, lng: result.lng };
        setFormData(prev => ({ ...prev, location }));
        setShowMapPreview(true);
        toast({
          title: 'Address Geocoded',
          description: `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Geocoding Error',
        description: err.message || 'Failed to find the address',
        variant: 'destructive'
      });
      // If geocoding fails, still open the map so the user can select manually
      setShowMapPreview(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleVoterChange = (index, field, value) => {
    setVoters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.houseName || !formData.colourRound || !formData.community || !formData.noOfVoters) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingSheet) {
        await api.sheets.update(editingSheet.id, { ...formData, voters });
      } else {
        await api.sheets.create({ ...formData, voters });
      }

      toast({
        title: "Success!",
        description: `Sheet ${editingSheet ? 'updated' : 'created'} successfully`,
      });

      setTimeout(() => onNavigate('splash'), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sheet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({ ...prev, location }));
    setShowMapPreview(false);
    toast({
      title: "Location Set",
      description: "GPS coordinates captured successfully",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onNavigate('splash')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">
              {editingSheet ? 'Edit Sheet' : 'New Sheet'}
            </h2>
            <div className="w-20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="houseName">House Name *</Label>
              <Input
                id="houseName"
                placeholder="Enter house name"
                value={formData.houseName}
                onChange={(e) => handleInputChange('houseName', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // when user presses Enter, try to geocode the entered address
                    handleAddressGeocode(e.target.value);
                  }
                }}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colourRound">Colour Round *</Label>
              <Select value={formData.colourRound} onValueChange={(value) => handleInputChange('colourRound', value)}>
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select colour" />
                </SelectTrigger>
                <SelectContent>
                  {COLOUR_ROUNDS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.color}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">Community *</Label>
              <Input
                id="community"
                placeholder="Enter community name"
                value={formData.community}
                onChange={(e) => handleInputChange('community', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noOfVoters">No. of Voters *</Label>
              <Input
                id="noOfVoters"
                type="number"
                min="0"
                placeholder="Enter number"
                value={formData.noOfVoters}
                onChange={(e) => handleInputChange('noOfVoters', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              // If a location is already set, just open the map.
              if (formData.location) {
                setShowMapPreview(true);
                return;
              }

              // Build an address from available fields to attempt geocoding.
              // Avoid forcing `Chennai` as default — instead append state and country
              const parts = [];
              if (formData.houseName) parts.push(formData.houseName);
              if (formData.community) parts.push(formData.community);

              const joined = parts.join(', ').toLowerCase();
              // If user didn't provide locality info, do not assume Chennai.
              // Append state and country to bias geocoding within Tamil Nadu, India.
              if (!joined.includes('tamil') && !joined.includes('india')) {
                parts.push('Tamil Nadu');
                parts.push('India');
              }

              const address = parts.join(', ');

              if (address.trim()) {
                // Try to geocode and then open the map centered at result
                await handleAddressGeocode(address);
              } else {
                // No address info available, just open the map to allow manual selection
                setShowMapPreview(true);
              }
            }}
            className="w-full gap-2 border-2 hover:bg-blue-50 hover:border-blue-500 transition-all"
            disabled={isGeocoding}
          >
            <MapPin className="w-4 h-4" />
            {isGeocoding ? 'Finding address...' : (formData.location ? 'Update Location' : 'Set Location on Map')}
          </Button>

          {formData.location && (
            <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
              Location set: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
            </div>
          )}

          {voters.length > 0 && (
            <VoterCards
              voters={voters}
              onVoterChange={handleVoterChange}
              colourRounds={COLOUR_ROUNDS}
            />
          )}

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('splash')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Sheet'}
            </Button>
          </div>
        </motion.div>
      </div>

      {showMapPreview && (
        <MapPreview
          onClose={() => setShowMapPreview(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={formData.location}
        />
      )}
      <div className="fixed bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded border">v1.1 - Debug Mode</div>
    </div>
  );
};

export default EnterFlow;