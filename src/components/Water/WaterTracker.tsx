import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, Target, TrendingUp } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface WaterEntry {
  id: number;
  amount: number;
  date: string;
  time: string;
}

const WaterTracker: React.FC = () => {
  const [todayWater, setTodayWater] = useState(0);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [quickAmount, setQuickAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [dailyGoal] = useState(2000); // 2L daily goal
  const [weeklyStats, setWeeklyStats] = useState<number[]>([]);

  useEffect(() => {
    fetchTodayWater();
    fetchWeeklyStats();
  }, []);

  const fetchTodayWater = async () => {
    try {
      const response = await api.get('/water/today');
      setWaterEntries(response.data.entries);
      setTodayWater(response.data.total);
    } catch (error) {
      console.error('Failed to fetch water data:', error);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await api.get('/water/weekly');
      setWeeklyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch weekly stats:', error);
    }
  };

  const addWater = async (amount: number) => {
    try {
      await api.post('/water/add', { amount });
      await fetchTodayWater();
      
      const newTotal = todayWater + amount;
      if (newTotal >= dailyGoal && todayWater < dailyGoal) {
        toast.success('🎉 Daily water goal achieved! Great job!');
      } else {
        toast.success(`Added ${amount}ml water! 💧`);
      }
    } catch (error) {
      console.error('Failed to add water:', error);
      toast.error('Failed to add water entry');
    }
  };

  const removeLastEntry = async () => {
    if (waterEntries.length === 0) return;

    try {
      const lastEntry = waterEntries[waterEntries.length - 1];
      await api.delete(`/water/entries/${lastEntry.id}`);
      await fetchTodayWater();
      toast.success('Last water entry removed! ↩️');
    } catch (error) {
      console.error('Failed to remove water entry:', error);
      toast.error('Failed to remove water entry');
    }
  };

  const getProgressPercentage = () => {
    return Math.min((todayWater / dailyGoal) * 100, 100);
  };

  const getWaterLevelHeight = () => {
    return Math.min((todayWater / dailyGoal) * 100, 100);
  };

  const quickAmounts = [250, 500, 750, 1000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-full">
              <Droplets className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Tracker</h1>
          <p className="text-gray-600">Stay hydrated and track your daily water intake</p>
        </div>

        {/* Water Bottle Visualization */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Water Bottle */}
              <div className="w-32 h-64 bg-gray-200 rounded-full relative overflow-hidden border-4 border-gray-300">
                {/* Water Level */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-cyan-300 transition-all duration-1000 ease-out rounded-full"
                  style={{ height: `${getWaterLevelHeight()}%` }}
                >
                  {/* Water Animation */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-300 to-cyan-200 opacity-50 animate-pulse"></div>
                </div>
                
                {/* Measurement Lines */}
                {[25, 50, 75, 100].map((percent) => (
                  <div
                    key={percent}
                    className="absolute left-0 right-0 h-0.5 bg-gray-400"
                    style={{ bottom: `${percent}%` }}
                  >
                    <span className="absolute -right-12 -top-2 text-xs text-gray-500">
                      {Math.round((dailyGoal * percent) / 100)}ml
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Info */}
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-2">{todayWater}ml</p>
            <p className="text-gray-600 mb-4">of {dailyGoal}ml daily goal</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-600">
              {Math.round(getProgressPercentage())}% of daily goal completed
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                onClick={() => addWater(amount)}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center"
              >
                <Droplets className="h-5 w-5 mb-1 text-blue-500" />
                <span className="text-sm font-medium">{amount}ml</span>
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex gap-3">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount (ml)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={() => {
                if (customAmount) {
                  addWater(parseInt(customAmount));
                  setCustomAmount('');
                }
              }}
              icon={Plus}
              disabled={!customAmount}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Today's Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Entries</h3>
            {waterEntries.length > 0 && (
              <Button
                onClick={removeLastEntry}
                variant="outline"
                icon={Minus}
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remove Last
              </Button>
            )}
          </div>

          {waterEntries.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {waterEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{entry.amount}ml</p>
                      <p className="text-sm text-gray-600">{entry.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Droplets className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No water entries today</p>
              <p className="text-sm text-gray-400">Start tracking your hydration!</p>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const amount = weeklyStats[index] || 0;
              const percentage = Math.min((amount / dailyGoal) * 100, 100);
              
              return (
                <div key={day} className="text-center">
                  <div className="h-24 bg-gray-200 rounded-lg mb-2 relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-cyan-300 transition-all duration-500"
                      style={{ height: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-gray-600">{day}</p>
                  <p className="text-xs text-gray-500">{amount}ml</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;