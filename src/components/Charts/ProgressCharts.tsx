import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import api from '../../services/api';

interface ChartData { name: string; value: number; color: string; }
interface WeeklyData { day: string; calories: number; workouts: number; water: number; }

const ProgressCharts: React.FC = () => {
  const [nutritionData, setNutritionData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [gymData, setGymData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchChartData(); }, []);

  const fetchChartData = async () => {
    try {
      const [nutritionRes, weeklyRes, gymRes] = await Promise.all([
        api.get('/Charts/GetNutritionChartData'), api.get('/Charts/GetWeeklyProgressChartData'), api.get('/Charts/GetGymStatisticsChartData')
      ]);
      setNutritionData(nutritionRes.data); setWeeklyData(weeklyRes.data); setGymData(gymRes.data);
    } catch (error) { console.error('Failed to fetch chart data:', error); }
    finally { setLoading(false); }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-ios-lg border border-ios-gray5 text-[13px]">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-[3px] border-ios-gray5 border-t-ios-gray1 mx-auto mb-3"
            style={{ animation: 'ios-spin 0.8s linear infinite' }} />
          <p className="text-[15px] text-ios-gray1">Loading charts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-2xl mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="ios-large-title text-gray-900 mb-1">Analytics</h1>
          <p className="text-[15px] text-ios-gray1">Visualize your fitness journey</p>
        </div>

        <div className="space-y-4">
          {/* Nutrition Breakdown */}
          <div className="ios-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-ios-blue/10 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-ios-blue" strokeWidth={2.2} />
              </div>
              <h3 className="ios-headline text-gray-900">Today's Nutrition</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nutritionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {nutritionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {nutritionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[13px] text-ios-gray1">{item.name}: {item.value}g</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gym Attendance */}
          <div className="ios-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-ios-green/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-ios-green" strokeWidth={2.2} />
              </div>
              <h3 className="ios-headline text-gray-900">Monthly Gym Stats</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gymData} cx="50%" cy="50%" outerRadius={85} dataKey="value" strokeWidth={0}>
                    {gymData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {gymData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-ios-gray1">{item.name}</span>
                  </div>
                  <span className="text-[13px] font-medium text-gray-900">{item.value} days</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="ios-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-ios-purple/10 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-ios-purple" strokeWidth={2.2} />
              </div>
              <h3 className="ios-headline text-gray-900">Weekly Progress</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8E8E93' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8E8E93' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="calories" fill="#007AFF" radius={[4, 4, 0, 0]} name="Calories" />
                  <Bar dataKey="workouts" fill="#34C759" radius={[4, 4, 0, 0]} name="Workouts" />
                  <Bar dataKey="water" fill="#5AC8FA" radius={[4, 4, 0, 0]} name="Water (L)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Intake Trend */}
          <div className="ios-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-ios-teal/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-ios-teal" strokeWidth={2.2} />
              </div>
              <h3 className="ios-headline text-gray-900">Water Intake Trend</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8E8E93' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8E8E93' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="water" stroke="#5AC8FA" strokeWidth={2.5}
                    dot={{ fill: '#5AC8FA', strokeWidth: 0, r: 4 }} name="Water (L)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;