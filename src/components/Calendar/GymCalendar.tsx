import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Award } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface GymDay {
  date: string;
  status: 'gym' | 'rest' | 'missed';
  reason?: string;
}

interface MonthStats {
  gymDays: number;
  restDays: number;
  missedDays: number;
  totalDays: number;
  consistency: number;
}

const GymCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gymDays, setGymDays] = useState<GymDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [monthStats, setMonthStats] = useState<MonthStats>({
    gymDays: 0,
    restDays: 0,
    missedDays: 0,
    totalDays: 0,
    consistency: 0
  });

  useEffect(() => {
    fetchGymDays();
  }, [currentDate]);

  useEffect(() => {
    calculateStats();
  }, [gymDays]);

  const fetchGymDays = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/gym-calendar/month/${year}/${month}`);
      setGymDays(response.data);
    } catch (error) {
      console.error('Failed to fetch gym days:', error);
    }
  };

  const calculateStats = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const monthData = gymDays.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear;
    });

    const gymCount = monthData.filter(day => day.status === 'gym').length;
    const restCount = monthData.filter(day => day.status === 'rest').length;
    const missedCount = monthData.filter(day => day.status === 'missed').length;
    
    const consistency = monthData.length > 0 ? Math.round((gymCount / monthData.length) * 100) : 0;

    setMonthStats({
      gymDays: gymCount,
      restDays: restCount,
      missedDays: missedCount,
      totalDays: monthData.length,
      consistency
    });
  };

  const handleDateClick = (date: string) => {
    setClickCount(prev => prev + 1);
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const timer = setTimeout(() => {
      processDateClick(date, clickCount + 1);
      setClickCount(0);
    }, 300);

    setClickTimer(timer);
  };

  const processDateClick = async (date: string, clicks: number) => {
    const existingDay = gymDays.find(day => day.date === date);
    let newStatus: 'gym' | 'rest' | 'missed';

    if (clicks === 1) {
      newStatus = 'gym';
    } else if (clicks === 2) {
      newStatus = 'rest';
    } else {
      newStatus = 'missed';
      setSelectedDate(date);
      setShowReasonModal(true);
      return;
    }

    try {
      await api.post('/gym-calendar/update', {
        date,
        status: newStatus
      });

      if (existingDay) {
        setGymDays(prev => prev.map(day => 
          day.date === date ? { ...day, status: newStatus } : day
        ));
      } else {
        setGymDays(prev => [...prev, { date, status: newStatus }]);
      }

      const statusMessages = {
        gym: 'Gym day marked! 💪',
        rest: 'Rest day marked! 😴',
        missed: 'Missed day marked! 😔'
      };

      toast.success(statusMessages[newStatus]);
    } catch (error) {
      console.error('Failed to update gym day:', error);
      toast.error('Failed to update gym day');
    }
  };

  const handleReasonSubmit = async () => {
    if (!selectedDate) return;

    try {
      await api.post('/gym-calendar/update', {
        date: selectedDate,
        status: 'missed',
        reason
      });

      const existingDay = gymDays.find(day => day.date === selectedDate);
      if (existingDay) {
        setGymDays(prev => prev.map(day => 
          day.date === selectedDate ? { ...day, status: 'missed', reason } : day
        ));
      } else {
        setGymDays(prev => [...prev, { date: selectedDate, status: 'missed', reason }]);
      }

      setShowReasonModal(false);
      setReason('');
      setSelectedDate(null);
      toast.success('Missed day marked with reason! 📝');
    } catch (error) {
      console.error('Failed to update gym day:', error);
      toast.error('Failed to update gym day');
    }
  };

  const getDayStatus = (date: string) => {
    return gymDays.find(day => day.date === date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gym': return 'bg-green-500 text-white';
      case 'rest': return 'bg-yellow-500 text-white';
      case 'missed': return 'bg-red-500 text-white';
      default: return 'bg-white text-gray-700 hover:bg-gray-50';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayStatus = getDayStatus(date);
      const isToday = new Date().toDateString() === new Date(date).toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-12 w-full rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
            dayStatus 
              ? getStatusColor(dayStatus.status)
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          title={dayStatus?.reason ? `Reason: ${dayStatus.reason}` : ''}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gym Calendar</h1>
          <p className="text-gray-600">Track your gym attendance visually</p>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-lg mr-3"></div>
              <div>
                <p className="font-medium text-gray-900">Single Click</p>
                <p className="text-sm text-gray-600">Mark as Gym Day</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-yellow-500 rounded-lg mr-3"></div>
              <div>
                <p className="font-medium text-gray-900">Double Click</p>
                <p className="text-sm text-gray-600">Mark as Rest Day</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded-lg mr-3"></div>
              <div>
                <p className="font-medium text-gray-900">Triple Click</p>
                <p className="text-sm text-gray-600">Mark as Missed/Leave</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{monthStats.gymDays}</p>
              <p className="text-sm opacity-90">Gym Days</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{monthStats.restDays}</p>
              <p className="text-sm opacity-90">Rest Days</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{monthStats.missedDays}</p>
              <p className="text-sm opacity-90">Missed Days</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
            <div className="text-center">
              <p className="text-2xl font-bold">{monthStats.consistency}%</p>
              <p className="text-sm opacity-90">Consistency</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigateMonth('prev')}
              variant="ghost"
              icon={ChevronLeft}
              className="text-gray-600 hover:text-gray-900"
            />
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              onClick={() => navigateMonth('next')}
              variant="ghost"
              icon={ChevronRight}
              className="text-gray-600 hover:text-gray-900"
            />
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reason for Missing Gym
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional: Why did you miss the gym?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleReasonSubmit}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setShowReasonModal(false);
                    setReason('');
                    setSelectedDate(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymCalendar;