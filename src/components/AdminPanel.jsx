import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, FileText, MapPin, BarChart3, Eye, Trash2, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/mockBackend';

import VoterMap from '@/components/VoterMap';

const AdminPanel = ({ onNavigate, adminUser }) => {
  const { logout, user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [points, setPoints] = useState([]);
  const [stats, setStats] = useState({ totalSheets: 0, totalVoters: 0, totalPoints: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSheets, fetchedPoints] = await Promise.all([
        api.sheets.list(),
        api.points.list()
      ]);

      setSheets(fetchedSheets);
      setPoints(fetchedPoints);

      const totalVoters = fetchedSheets.reduce((sum, sheet) => sum + parseInt(sheet.noOfVoters || 0), 0);
      setStats({
        totalSheets: fetchedSheets.length,
        totalVoters,
        totalPoints: fetchedPoints.length
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (sheets.length === 0) {
      toast({
        title: "No Data",
        description: "No sheets available to export",
        variant: "destructive"
      });
      return;
    }

    // CSV Generation - Flattened structure (One row per voter)
    const headers = [
      'Sheet ID', 'House Name', 'Sheet Colour', 'Community', 'Total Voters',
      'Latitude', 'Longitude', 'Created At',
      'Voter Name', 'Voter Age', 'Voter Colour'
    ];

    const rows = [];

    sheets.forEach(sheet => {
      // If there are voters, create a row for each voter
      if (sheet.voters && sheet.voters.length > 0) {
        sheet.voters.forEach(voter => {
          rows.push([
            sheet.id,
            sheet.houseName,
            sheet.colourRound,
            sheet.community,
            sheet.noOfVoters,
            sheet.location?.lat || '',
            sheet.location?.lng || '',
            new Date(sheet.createdAt).toLocaleString(),
            voter.name || '',
            voter.age || '',
            voter.colourRound || ''
          ]);
        });
      } else {
        // If no voters (or empty list), still output the sheet info with empty voter columns
        rows.push([
          sheet.id,
          sheet.houseName,
          sheet.colourRound,
          sheet.community,
          sheet.noOfVoters,
          sheet.location?.lat || '',
          sheet.location?.lng || '',
          new Date(sheet.createdAt).toLocaleString(),
          '', '', '' // Empty voter details
        ]);
      }
    });

    const csvContent = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') // Escape quotes
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voter-data-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Detailed CSV file has been downloaded",
    });
  };

  const handleDeleteSheet = async (id) => {
    try {
      await api.sheets.delete(id);
      toast({
        title: "Sheet Deleted",
        description: "Record has been removed",
      });
      loadData(); // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sheet",
        variant: "destructive"
      });
    }
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
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('splash')}
                  className="gap-2 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm opacity-80 hidden md:inline">User: {adminUser?.username || user?.username}</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    // If this panel was opened via in-memory admin auth, clear that and navigate away.
                    if (adminUser) {
                      try { sessionStorage.removeItem('admin_auth_token'); } catch (e) { }
                      onNavigate('splash');
                    } else {
                      logout();
                    }
                  }}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">Loading dashboard data...</div>
          ) : (
            <>
              {stats.totalSheets === 0 && stats.totalPoints === 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 mx-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          The dashboard is empty. Load demo data to see the map in action?
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4 bg-white text-yellow-700 hover:bg-yellow-50"
                      onClick={async () => {
                        await api.seedData();
                        loadData();
                        toast({ title: "Demo Data Loaded", description: "Sample sheets added to the map." });
                      }}
                    >
                      Load Demo Data
                    </Button>
                  </div>
                </div>
              )}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Sheets</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalSheets}</p>
                      </div>
                      <FileText className="w-12 h-12 text-blue-500 opacity-50" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Voters</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalVoters}</p>
                      </div>
                      <Eye className="w-12 h-12 text-green-500 opacity-50" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Location Points</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalPoints}</p>
                      </div>
                      <MapPin className="w-12 h-12 text-purple-500 opacity-50" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <Tabs defaultValue="sheets" className="p-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="sheets">Sheet Records</TabsTrigger>
                  <TabsTrigger value="map">Map View</TabsTrigger>
                </TabsList>

                <TabsContent value="sheets" className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">All Records</h3>
                    <Button
                      onClick={handleExportCSV}
                      className="gap-2 bg-green-500 hover:bg-green-600"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border max-h-96">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">House Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colour</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Community</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voters</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {sheets.map((sheet, index) => (
                          <motion.tr
                            key={sheet.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm text-gray-800">{sheet.houseName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${getColourClass(sheet.colourRound)}`}></div>
                                <span className="text-sm text-gray-600">{sheet.colourRound}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{sheet.community}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{sheet.noOfVoters}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(sheet.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSheet(sheet.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="map" className="mt-6">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] border border-gray-200 relative">
                    <VoterMap sheets={sheets} points={points} />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;