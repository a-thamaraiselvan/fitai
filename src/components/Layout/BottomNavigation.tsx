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
        <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 bg-white/40 backdrop-blur-lg border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-full z-40 p-1.5 flex items-center space-x-1 overflow-hidden transition-all duration-300">
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
                className={`group flex items-center justify-center transition-all duration-500 rounded-full h-10 ${isActive
                    ? 'bg-white/70 text-purple-600 shadow-sm border border-white/60 px-4'
                    : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900 px-3'
                  }`}
              >
                <SubIconComponent className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ${isActive ? 'max-w-[100px] ml-2 opacity-100' : 'max-w-0 opacity-0 ml-0'
                  }`}>
                  {subItem.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/40 backdrop-blur-lg border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-full z-50 p-1.5 flex items-center space-x-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = item.subItems
            ? item.subItems.some(sub => currentPath === sub.path)
            : currentPath === item.path;
          const isMenuOpen = showSubMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`group flex items-center justify-center transition-all duration-500 rounded-full h-12 ${isActive || isMenuOpen
                  ? 'bg-white/70 text-purple-600 shadow-md border border-white/60 px-5'
                  : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900 px-4'
                }`}
            >
              <IconComponent className="h-5 w-5 shrink-0" strokeWidth={isActive || isMenuOpen ? 2.5 : 2} />
              <span className={`text-[13px] font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ${isActive ? 'max-w-[120px] ml-2.5 opacity-100' : 'max-w-0 opacity-0 ml-0'
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default BottomNavigation;