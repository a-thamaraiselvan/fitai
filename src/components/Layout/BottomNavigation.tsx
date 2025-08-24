import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell, User, Shield, Calendar, Droplets, TrendingUp, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
    { 
      id: 'diet', 
      label: 'Diet', 
      icon: Apple, 
      path: '/diet',
      subItems: [
        { id: 'diet-tracker', label: 'Diet Tracker', icon: Apple, path: '/diet' },
        { id: 'meal-analyzer', label: 'AI Analyzer', icon: Camera, path: '/meal-analyzer' },
      ]
    },
    { 
      id: 'workout', 
      label: 'Workout', 
      icon: Dumbbell, 
      path: '/workout',
      subItems: [
        { id: 'workout-tracker', label: 'Workouts', icon: Dumbbell, path: '/workout' },
        { id: 'gym-calendar', label: 'Gym Calendar', icon: Calendar, path: '/gym-calendar' },
      ]
    },
    { 
      id: 'more', 
      label: 'More', 
      icon: TrendingUp, 
      path: '/charts',
      subItems: [
        { id: 'water', label: 'Water', icon: Droplets, path: '/water' },
        { id: 'charts', label: 'Charts', icon: TrendingUp, path: '/charts' },
      ]
    },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    ...(user?.role === 'admin' 
      ? [{ id: 'admin', label: 'Admin', icon: Shield, path: '/admin' }] 
      : []
    ),
  ];

  const handleNavigation = (item: any) => {
    if (item.subItems) {
      setShowSubMenu(showSubMenu === item.id ? null : item.id);
    } else {
      setActiveTab(item.id);
      navigate(item.path);
      setShowSubMenu(null);
    }
  };

  const currentPath = location.pathname;

  return (
    <>
      {/* Sub Menu */}
      {showSubMenu && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex justify-around items-center py-2">
            {navItems.find(item => item.id === showSubMenu)?.subItems?.map((subItem) => {
              const SubIconComponent = subItem.icon;
              const isActive = currentPath === subItem.path;
              
              return (
                <button
                  key={subItem.id}
                  onClick={() => {
                    setActiveTab(subItem.id);
                    navigate(subItem.path);
                    setShowSubMenu(null);
                  }}
                  className={`flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-100' 
                      : 'hover:bg-gray-100'
                  }`}>
                    <SubIconComponent className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {subItem.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.subItems 
              ? item.subItems.some(sub => currentPath === sub.path)
              : currentPath === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                } ${showSubMenu === item.id ? 'bg-blue-50' : ''}`}
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-100' 
                    : 'hover:bg-gray-100'
                }`}>
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;