import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Apple, Dumbbell, Calendar, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface DashboardStats {
  todayCalories: number;
  weeklyWorkouts: number;
  currentStreak: number;
  goalProgress: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayCalories: 0,
    weeklyWorkouts: 0,
    currentStreak: 0,
    goalProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/Dashboard/GetDashboardStatistics');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Large Title Header */}
        <div className="mb-6">
          <p className="text-[15px] text-ios-gray1 mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</p>
          <h1 className="ios-large-title text-gray-900">{user?.name || 'User'}</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-ios-green/10 rounded-xl flex items-center justify-center">
                <Apple className="h-[18px] w-[18px] text-ios-green" strokeWidth={2.2} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 tracking-tight">{stats.todayCalories}</p>
            <p className="text-[13px] text-ios-gray1 mt-0.5">kcal consumed</p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-ios-blue/10 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-[18px] w-[18px] text-ios-blue" strokeWidth={2.2} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 tracking-tight">{stats.weeklyWorkouts}</p>
            <p className="text-[13px] text-ios-gray1 mt-0.5">workouts this week</p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-ios-orange/10 rounded-xl flex items-center justify-center">
                <Award className="h-[18px] w-[18px] text-ios-orange" strokeWidth={2.2} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 tracking-tight">{stats.currentStreak}</p>
            <p className="text-[13px] text-ios-gray1 mt-0.5">day streak</p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-ios-purple/10 rounded-xl flex items-center justify-center">
                <Target className="h-[18px] w-[18px] text-ios-purple" strokeWidth={2.2} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 tracking-tight">{stats.goalProgress}%</p>
            <p className="text-[13px] text-ios-gray1 mt-0.5">monthly goal</p>
          </div>
        </div>

        {/* Today's Overview */}
        <div className="mb-5">
          <h2 className="ios-headline text-gray-900 mb-3 ml-1">Today's Overview</h2>
          <div className="ios-section">
            {/* Nutrition Row */}
            <div className="flex items-center px-4 py-3.5">
              <div className="w-9 h-9 bg-ios-blue/10 rounded-xl flex items-center justify-center mr-3">
                <Apple className="h-[18px] w-[18px] text-ios-blue" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-gray-900">Nutrition Goal</p>
                <p className="text-[13px] text-ios-gray1">{stats.todayCalories} / 2000 calories</p>
              </div>
              <div className="ml-3 w-16">
                <div className="w-full bg-ios-gray5 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-ios-blue rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((stats.todayCalories / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="ios-separator" />

            {/* Workout Row */}
            <div className="flex items-center px-4 py-3.5">
              <div className="w-9 h-9 bg-ios-green/10 rounded-xl flex items-center justify-center mr-3">
                <Dumbbell className="h-[18px] w-[18px] text-ios-green" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-gray-900">Workout Status</p>
                <p className="text-[13px] text-ios-gray1">
                  {stats.weeklyWorkouts > 0 ? 'Keep the momentum!' : 'Ready to start?'}
                </p>
              </div>
              <span className="text-[17px] font-bold text-ios-green ml-3">
                {stats.weeklyWorkouts}/5
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mb-5">
          <h2 className="ios-headline text-gray-900 mb-3 ml-1">AI Recommendations</h2>
          <div className="ios-section">
            <div className="flex items-start px-4 py-3.5">
              <div className="w-9 h-9 bg-ios-indigo/10 rounded-xl flex items-center justify-center mr-3 shrink-0 mt-0.5">
                <Dumbbell className="h-[18px] w-[18px] text-ios-indigo" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-gray-900 mb-0.5">Workout Suggestion</p>
                <p className="text-[13px] text-ios-gray1 leading-relaxed">
                  Based on your progress, try adding 10 minutes of cardio to boost your endurance.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-ios-gray3 ml-2 shrink-0 mt-1" />
            </div>

            <div className="ios-separator" />

            <div className="flex items-start px-4 py-3.5">
              <div className="w-9 h-9 bg-ios-green/10 rounded-xl flex items-center justify-center mr-3 shrink-0 mt-0.5">
                <Apple className="h-[18px] w-[18px] text-ios-green" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-gray-900 mb-0.5">Nutrition Tip</p>
                <p className="text-[13px] text-ios-gray1 leading-relaxed">
                  Your protein intake is great! Consider adding more leafy greens for better recovery.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-ios-gray3 ml-2 shrink-0 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;