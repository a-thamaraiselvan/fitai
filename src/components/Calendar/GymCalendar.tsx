import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
  const [clickTimer, setClickTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [monthStats, setMonthStats] = useState<MonthStats>({ gymDays: 0, restDays: 0, missedDays: 0, totalDays: 0, consistency: 0 });

  useEffect(() => { fetchGymDays(); }, [currentDate]);
  useEffect(() => { calculateStats(); }, [gymDays]);

  const fetchGymDays = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/GymCalendar/GetGymDaysByMonth/${year}/${month}`);

      const normalizedDays = response.data.map((day: GymDay) => {
        const d = new Date(day.date);
        return {
          ...day,
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        };
      });

      setGymDays(normalizedDays);
    } catch (error) { console.error('Failed to fetch gym days:', error); }
  };

  const calculateStats = () => {
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYearStr = String(currentDate.getFullYear());
    const prefix = `${currentYearStr}-${currentMonthStr}-`;

    const monthData = gymDays.filter(day => day.date.startsWith(prefix));
    const gymCount = monthData.filter(day => day.status === 'gym').length;
    const restCount = monthData.filter(day => day.status === 'rest').length;
    const missedCount = monthData.filter(day => day.status === 'missed').length;
    const consistency = monthData.length > 0 ? Math.round((gymCount / monthData.length) * 100) : 0;
    setMonthStats({ gymDays: gymCount, restDays: restCount, missedDays: missedCount, totalDays: monthData.length, consistency });
  };

  const isDateSelectable = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const clickedDate = new Date(year, month - 1, day);
    clickedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 1);
    twoDaysAgo.setHours(0, 0, 0, 0);

    return clickedDate <= today && clickedDate >= twoDaysAgo;
  };

  const handleDateClick = (date: string) => {
    if (!isDateSelectable(date)) return;

    setClickCount(prev => prev + 1);
    if (clickTimer) clearTimeout(clickTimer);
    const timer = setTimeout(() => { processDateClick(date, clickCount + 1); setClickCount(0); }, 300);
    setClickTimer(timer);
  };

  const processDateClick = async (date: string, clicks: number) => {
    const existingDay = gymDays.find(day => day.date === date);
    let newStatus: 'gym' | 'rest' | 'missed';
    if (clicks === 1) newStatus = 'gym';
    else if (clicks === 2) newStatus = 'rest';
    else { newStatus = 'missed'; setSelectedDate(date); setShowReasonModal(true); return; }

    try {
      await api.post('/GymCalendar/UpdateGymDayStatus', { date, status: newStatus });
      if (existingDay) setGymDays(prev => prev.map(day => day.date === date ? { ...day, status: newStatus } : day));
      else setGymDays(prev => [...prev, { date, status: newStatus }]);
      const messages = { gym: 'Gym day marked!', rest: 'Rest day marked!', missed: 'Missed day marked!' };
      toast.success(messages[newStatus]);
    } catch (error) { console.error('Failed to update gym day:', error); toast.error('Failed to update gym day'); }
  };

  const handleReasonSubmit = async () => {
    if (!selectedDate) return;
    try {
      await api.post('/GymCalendar/UpdateGymDayStatus', { date: selectedDate, status: 'missed', reason });
      const existingDay = gymDays.find(day => day.date === selectedDate);
      if (existingDay) setGymDays(prev => prev.map(day => day.date === selectedDate ? { ...day, status: 'missed', reason } : day));
      else setGymDays(prev => [...prev, { date: selectedDate, status: 'missed', reason }]);
      setShowReasonModal(false); setReason(''); setSelectedDate(null);
      toast.success('Missed day marked with reason!');
    } catch (error) { console.error('Failed to update gym day:', error); toast.error('Failed to update gym day'); }
  };

  const getDayStatus = (date: string) => gymDays.find(day => day.date === date);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gym': return 'bg-ios-green text-white';
      case 'rest': return 'bg-ios-orange text-white';
      case 'missed': return 'bg-ios-red text-white';
      default: return 'bg-white text-gray-700';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      direction === 'prev' ? newDate.setMonth(prev.getMonth() - 1) : newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`empty-${i}`} className="h-10" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayStatus = getDayStatus(date);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelectable = isDateSelectable(date);

      days.push(
        <button key={day} onClick={() => handleDateClick(date)}
          disabled={!isSelectable}
          className={`h-10 w-full rounded-xl transition-all duration-150 font-medium text-[14px] ${isSelectable ? 'active:scale-[0.92]' : 'opacity-40 cursor-not-allowed'} ${dayStatus ? getStatusColor(dayStatus.status) : `bg-ios-gray6 text-gray-700 ${isSelectable ? 'hover:bg-ios-gray5' : ''}`
            } ${isToday ? 'ring-2 ring-ios-blue ring-offset-1' : ''}`}
          title={dayStatus?.reason ? `Reason: ${dayStatus.reason}` : ''}>
          {day}
        </button>
      );
    }
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="ios-large-title text-gray-900 mb-1">Calendar</h1>
          <p className="text-[15px] text-ios-gray1">Track your gym attendance</p>
        </div>

        {/* Legend */}
        <div className="ios-card p-4 mb-5">
          <div className="flex justify-between">
            {[
              { color: 'bg-ios-green', label: '1 tap = Gym' },
              { color: 'bg-ios-orange', label: '2 taps = Rest' },
              { color: 'bg-ios-red', label: '3 taps = Missed' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${item.color} rounded-md`} />
                <span className="text-[12px] text-ios-gray1">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {[
            { value: monthStats.gymDays, label: 'Gym', color: 'text-ios-green' },
            { value: monthStats.restDays, label: 'Rest', color: 'text-ios-orange' },
            { value: monthStats.missedDays, label: 'Missed', color: 'text-ios-red' },
            { value: `${monthStats.consistency}%`, label: 'Rate', color: 'text-ios-purple' },
          ].map(stat => (
            <div key={stat.label} className="ios-card p-3 text-center">
              <p className={`text-[20px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-ios-gray2 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="ios-card p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-xl hover:bg-ios-gray6 active:bg-ios-gray5 transition-colors">
              <ChevronLeft className="h-5 w-5 text-ios-blue" strokeWidth={2.5} />
            </button>
            <h2 className="ios-headline text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-xl hover:bg-ios-gray6 active:bg-ios-gray5 transition-colors">
              <ChevronRight className="h-5 w-5 text-ios-blue" strokeWidth={2.5} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center text-[12px] font-medium text-ios-gray2 py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">{renderCalendar()}</div>
        </div>

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="fixed inset-0 ios-backdrop flex items-end justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-ios-xl w-full max-w-md ios-animate-slide-up">
              <div className="p-5">
                <h3 className="ios-headline text-gray-900 mb-1">Missed Day</h3>
                <p className="text-[14px] text-ios-gray1 mb-4">Why did you miss the gym?</p>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional reason..." className="ios-input resize-none mb-4" rows={3} />
                <div className="flex gap-2.5">
                  <Button onClick={handleReasonSubmit} className="flex-1">Save</Button>
                  <Button onClick={() => { setShowReasonModal(false); setReason(''); setSelectedDate(null); }}
                    variant="secondary" className="flex-1">Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymCalendar;