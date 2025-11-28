import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Map, Shield } from 'lucide-react';

const SplashScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-2xl"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl"
          >
            <FileText className="w-16 h-16 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Voter Data Collection
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Comprehensive voter information management system with GPS tracking and offline support
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mx-auto"
        >
          <Button
            onClick={() => onNavigate('enter')}
            size="lg"
            className="h-32 flex flex-col gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <FileText className="w-8 h-8" />
            <span className="text-lg font-semibold">ENTER</span>
            <span className="text-xs opacity-90">Create New Sheet</span>
          </Button>

          <Button
            onClick={() => onNavigate('add')}
            size="lg"
            className="h-32 flex flex-col gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-lg font-semibold">ADD</span>
            <span className="text-xs opacity-90">Add Location Point</span>
          </Button>

          <Button
            onClick={() => onNavigate('map')}
            size="lg"
            variant="outline"
            className="h-32 flex flex-col gap-3 border-2 border-indigo-300 hover:bg-indigo-50 shadow-md hover:shadow-lg transition-all"
          >
            <Map className="w-8 h-8 text-indigo-600" />
            <span className="text-lg font-semibold text-indigo-600">MAP VIEW</span>
            <span className="text-xs text-gray-600">View All Points</span>
          </Button>

          <Button
            onClick={() => onNavigate('admin')}
            size="lg"
            variant="outline"
            className="h-32 flex flex-col gap-3 border-2 border-purple-300 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all"
          >
            <Shield className="w-8 h-8 text-purple-600" />
            <span className="text-lg font-semibold text-purple-600">ADMIN</span>
            <span className="text-xs text-gray-600">Dashboard & Reports</span>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-gray-500"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Offline Mode Active</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;