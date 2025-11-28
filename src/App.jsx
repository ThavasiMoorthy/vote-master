import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import SplashScreen from '@/components/SplashScreen';
import EnterFlow from '@/components/EnterFlow';
import AddFlow from '@/components/AddFlow';
import MapView from '@/components/MapView';
import AdminPanel from '@/components/AdminPanel';
import AuthPage from '@/components/AuthPage';
import { Toaster } from '@/components/ui/toaster';

// Wrapper component to handle protected routes
const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('splash'); // splash, enter, add, map, admin
  const [editingSheet, setEditingSheet] = useState(null);

  const handleNavigate = (view, data = null) => {
    setCurrentView(view);
    if (data) {
      setEditingSheet(data);
    } else {
      setEditingSheet(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-blue-50">Loading...</div>;
  }

  if (!user) {
    return <AuthPage onLoginSuccess={() => setCurrentView('splash')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentView === 'splash' && <SplashScreen onNavigate={handleNavigate} />}
      {currentView === 'enter' && <EnterFlow onNavigate={handleNavigate} editingSheet={editingSheet} />}
      {currentView === 'add' && <AddFlow onNavigate={handleNavigate} />}
      {currentView === 'map' && <MapView onNavigate={handleNavigate} />}
      {currentView === 'admin' && <AdminPanel onNavigate={handleNavigate} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Voter Data Collection App</title>
        <meta name="description" content="Comprehensive voter data collection and management system with GPS tracking and offline support" />
      </Helmet>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;