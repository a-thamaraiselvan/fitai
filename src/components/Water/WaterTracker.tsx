import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, Target } from 'lucide-react';
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
  const [dailyGoal] = useState(2000);
  const [weeklyStats, setWeeklyStats] = useState<number[]>([]);

  useEffect(() => { fetchTodayWater(); fetchWeeklyStats(); }, []);

  const fetchTodayWater = async () => {
    try { const response = await api.get('/Water/GetTodayWaterIntake'); setWaterEntries(response.data.entries); setTodayWater(response.data.total); }
    catch (error) { console.error('Failed to fetch water data:', error); }
  };

  const fetchWeeklyStats = async () => {
    try { const response = await api.get('/Water/GetWeeklyWaterStats'); setWeeklyStats(response.data); }
    catch (error) { console.error('Failed to fetch weekly stats:', error); }
  };

  const addWater = async (amount: number) => {
    try {
      await api.post('/Water/AddWaterEntry', { amount });
      await fetchTodayWater();
      const newTotal = todayWater + amount;
      if (newTotal >= dailyGoal && todayWater < dailyGoal) { toast.success('Daily water goal achieved! Great job!'); }
      else { toast.success(`Added ${amount}ml water!`); }
    } catch (error) { console.error('Failed to add water:', error); toast.error('Failed to add water entry'); }
  };

  const removeLastEntry = async () => {
    if (waterEntries.length === 0) return;
    try {
      const lastEntry = waterEntries[waterEntries.length - 1];
      await api.delete(`/Water/DeleteWaterEntry/${lastEntry.id}`);
      await fetchTodayWater();
      toast.success('Last water entry removed!');
    } catch (error) { console.error('Failed to remove water entry:', error); toast.error('Failed to remove water entry'); }
  };

  const getProgressPercentage = () => Math.min((todayWater / dailyGoal) * 100, 100);
  const quickAmounts = [250, 500, 750, 1000];

  // Circular progress ring
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progress = (getProgressPercentage() / 100) * circumference;

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="ios-large-title text-gray-900 mb-1">Water</h1>
          <p className="text-[15px] text-ios-gray1">Stay hydrated throughout the day</p>
        </div>

        {/* Circular Progress Ring */}
        <div className="ios-card p-8 mb-5">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#E5E5EA" strokeWidth="10" />
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#5AC8FA" strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Droplets className="h-6 w-6 text-ios-teal mb-1" strokeWidth={2} />
                <p className="text-[32px] font-bold text-gray-900 tracking-tight">{todayWater}</p>
                <p className="text-[13px] text-ios-gray1">of {dailyGoal}ml</p>
              </div>
            </div>
          </div>
          <p className="text-center text-[14px] text-ios-gray1">
            {Math.round(getProgressPercentage())}% of daily goal
          </p>
        </div>

        {/* Quick Add */}
        <div className="mb-5">
          <h2 className="ios-headline text-gray-900 mb-3 ml-1">Quick Add</h2>
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            {quickAmounts.map((amount) => (
              <button key={amount} onClick={() => addWater(amount)}
                className="ios-card py-3.5 text-center active:scale-[0.96] transition-transform duration-150">
                <Droplets className="h-5 w-5 text-ios-teal mx-auto mb-1.5" strokeWidth={2} />
                <span className="text-[14px] font-semibold text-gray-900">{amount}ml</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2.5">
            <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount (ml)" className="ios-input flex-1" />
            <Button onClick={() => { if (customAmount) { addWater(parseInt(customAmount)); setCustomAmount(''); } }}
              icon={Plus} disabled={!customAmount}>Add</Button>
          </div>
        </div>

        {/* Today's Entries */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="ios-headline text-gray-900">Today's Entries</h2>
            {waterEntries.length > 0 && (
              <Button onClick={removeLastEntry} variant="destructive" icon={Minus} size="sm">Undo</Button>
            )}
          </div>
          {waterEntries.length > 0 ? (
            <div className="ios-section max-h-52 overflow-y-auto">
              {waterEntries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  {index > 0 && <div className="ios-separator" />}
                  <div className="flex items-center px-4 py-3">
                    <Droplets className="h-4 w-4 text-ios-teal mr-3" strokeWidth={2} />
                    <div>
                      <p className="text-[15px] font-medium text-gray-900">{entry.amount}ml</p>
                      <p className="text-[12px] text-ios-gray2">{entry.time}</p>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="ios-card py-10 text-center">
              <Droplets className="h-12 w-12 text-ios-gray3 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-ios-gray2">No entries yet today</p>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div>
          <h2 className="ios-headline text-gray-900 mb-3 ml-1">Weekly Progress</h2>
          <div className="ios-card p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                const amount = weeklyStats[index] || 0;
                const percentage = Math.min((amount / dailyGoal) * 100, 100);
                return (
                  <div key={`${day}-${index}`} className="text-center">
                    <div className="h-20 bg-ios-gray6 rounded-lg mb-1.5 relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 bg-ios-teal/30 transition-all duration-500 rounded-lg"
                        style={{ height: `${percentage}%` }} />
                    </div>
                    <p className="text-[11px] font-medium text-ios-gray1">{day}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;