import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-16">
      <AINotifications />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diet" element={<DietTracker />} />
        <Route path="/meal-analyzer" element={<MealAnalyzer />} />
        <Route path="/workout" element={<WorkoutTracker />} />
        <Route path="/gym-calendar" element={<GymCalendar />} />
        <Route path="/water" element={<WaterTracker />} />
        <Route path="/charts" element={<ProgressCharts />} />
        <Route path="/profile" element={<Profile />} />
        {user.role === 'admin' && (
          <Route path="/admin" element={<AdminPanel />} />
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
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
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
            },
          }}
        />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;