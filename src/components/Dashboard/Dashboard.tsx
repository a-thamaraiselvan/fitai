import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Apple, Dumbbell, Calendar, Award } from 'lucide-react';
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
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">Let's crush your fitness goals today</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today's Calories"
            value={stats.todayCalories}
            icon={<Apple className="h-6 w-6 text-white" />}
            color="bg-gradient-to-r from-green-500 to-emerald-600"
            subtitle="kcal consumed"
          />
          <StatCard
            title="Weekly Workouts"
            value={stats.weeklyWorkouts}
            icon={<Dumbbell className="h-6 w-6 text-white" />}
            color="bg-gradient-to-r from-blue-500 to-cyan-600"
            subtitle="this week"
          />
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            icon={<Award className="h-6 w-6 text-white" />}
            color="bg-gradient-to-r from-orange-500 to-red-600"
            subtitle="keep it up!"
          />
          <StatCard
            title="Goal Progress"
            value={`${stats.goalProgress}%`}
            icon={<Target className="h-6 w-6 text-white" />}
            color="bg-gradient-to-r from-purple-500 to-pink-600"
            subtitle="monthly target"
          />
        </div>

        {/* Today's Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Overview</h2>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Apple className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Nutrition Goal</p>
                  <p className="text-sm text-gray-600">{stats.todayCalories}/2000 calories</p>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.todayCalories / 2000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <Dumbbell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Workout Status</p>
                  <p className="text-sm text-gray-600">
                    {stats.weeklyWorkouts > 0 ? 'Keep the momentum!' : 'Ready to start?'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">
                  {stats.weeklyWorkouts}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">AI Recommendations</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="font-semibold mb-1">💪 Workout Suggestion</p>
              <p className="text-sm opacity-90">
                Based on your progress, try adding 10 minutes of cardio to boost your endurance.
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="font-semibold mb-1">🥗 Nutrition Tip</p>
              <p className="text-sm opacity-90">
                Your protein intake is great! Consider adding more leafy greens for better recovery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;