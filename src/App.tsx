import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import DietTracker from './components/Diet/DietTracker';
import MealAnalyzer from './components/Diet/MealAnalyzer';
import WorkoutTracker from './components/Workout/WorkoutTracker';
import GymCalendar from './components/Calendar/GymCalendar';
import WaterTracker from './components/Water/WaterTracker';
import ProgressCharts from './components/Charts/ProgressCharts';
import Profile from './components/Profile/Profile';
import AdminPanel from './components/Admin/AdminPanel';
import BottomNavigation from './components/Layout/BottomNavigation';
import LoadingSpinner from './components/UI/LoadingSpinner';
import AINotifications from './components/AI/AINotifications';
import ResetFirstPassword from './components/Auth/ResetFirstPassword';

import PrivateRoute from './components/Auth/PrivateRoute';
import PublicRoute from './components/Auth/PublicRoute';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/resetPassword';

  return (
    <div className={`min-h-screen bg-ios-bg ${!isAuthPage ? 'pb-24' : ''}`}>
      {!isAuthPage && user && <AINotifications />}
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/resetPassword" element={<PublicRoute><ResetFirstPassword /></PublicRoute>} />
        
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/diet" element={<PrivateRoute><DietTracker /></PrivateRoute>} />
        <Route path="/meal-analyzer" element={<PrivateRoute><MealAnalyzer /></PrivateRoute>} />
        <Route path="/workout" element={<PrivateRoute><WorkoutTracker /></PrivateRoute>} />
        <Route path="/gym-calendar" element={<PrivateRoute><GymCalendar /></PrivateRoute>} />
        <Route path="/water" element={<PrivateRoute><WaterTracker /></PrivateRoute>} />
        <Route path="/charts" element={<PrivateRoute><ProgressCharts /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute>{user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" replace />}</PrivateRoute>} />
        
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
      {!isAuthPage && user && <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: 'rgba(50, 50, 50, 0.92)',
              color: '#fff',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '500',
              padding: '12px 20px',
              fontFamily: '"SF Pro Text", -apple-system, sans-serif',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maxWidth: '340px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            },
          }}
        />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;