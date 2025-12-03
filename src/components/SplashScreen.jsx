import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Shield } from 'lucide-react';

const SplashScreen = ({ onNavigate }) => {
  const enterRef = useRef(null);
  const addRef = useRef(null);
  const adminRef = useRef(null);

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
            ref={enterRef}
            onClick={() => onNavigate('enter')}
            onDragEnter={(e) => { e.preventDefault(); enterRef.current && enterRef.current.focus(); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDragLeave={() => { enterRef.current && enterRef.current.blur && enterRef.current.blur(); }}
            size="lg"
            className="h-32 flex flex-col gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all focus:[background:white] focus:[background-image:none] active:[background:white] active:[background-image:none] focus:text-black active:text-black"
          >
            <FileText className="w-8 h-8" />
            <span className="text-lg font-semibold">ENTER</span>
            <span className="text-xs opacity-90">Create New Sheet</span>
          </Button>

          <Button
            ref={addRef}
            onClick={() => onNavigate('add')}
            onDragEnter={(e) => { e.preventDefault(); addRef.current && addRef.current.focus(); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDragLeave={() => { addRef.current && addRef.current.blur && addRef.current.blur(); }}
            size="lg"
            className="h-32 flex flex-col gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all focus:[background:white] focus:[background-image:none] active:[background:white] active:[background-image:none] focus:text-black active:text-black"
          >
            <Plus className="w-8 h-8" />
            <span className="text-lg font-semibold">ADD</span>
            <span className="text-xs opacity-90">Add Location Point</span>
          </Button>
        </motion.div>

        {/* Center the admin button below the two main options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full max-w-md mx-auto mt-6 flex justify-center"
        >
          <Button
            ref={adminRef}
            onClick={() => onNavigate('admin')}
            onDragEnter={(e) => { e.preventDefault(); adminRef.current && adminRef.current.focus(); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDragLeave={() => { adminRef.current && adminRef.current.blur && adminRef.current.blur(); }}
            size="lg"
            variant="outline"
            className="w-2/3 h-32 flex flex-col gap-3 border-2 border-purple-300 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all"
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