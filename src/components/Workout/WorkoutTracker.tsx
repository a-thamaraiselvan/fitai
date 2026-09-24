import React, { useState, useEffect } from 'react';
import { Plus, Clock, Dumbbell, Target, Play, Pause, Square, X } from 'lucide-react';
import { Select } from 'antd';
import { toast } from 'react-hot-toast';
import Button from '../UI/Button';
import Input from '../UI/Input';
import api from '../../services/api';

interface WorkoutEntry {
  id: number;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  workoutType: string;
  date: string;
}

interface WorkoutSession {
  id?: number;
  name: string;
  exercises: WorkoutEntry[];
  startTime: Date;
  duration: number;
  isActive: boolean;
}

const WorkoutTracker: React.FC = () => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [timer, setTimer] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [newEntry, setNewEntry] = useState({
    exerciseName: '',
    sets: '3',
    reps: '10',
    weight: '0',
    workoutType: 'strength',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTodaysWorkouts(); }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) { interval = setInterval(() => setTimer(prev => prev + 1), 1000); }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchTodaysWorkouts = async () => {
    try {
      const response = await api.get('/Workout/GetTodayWorkoutEntries');
      const formattedEntries = response.data.map((entry: any) => ({
        ...entry,
        exerciseName: entry.exercise_name || entry.exerciseName,
        workoutType: entry.workout_type || entry.workoutType
      }));
      setWorkoutEntries(formattedEntries);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const sessionsResponse = await api.get(`/Workout/GetWorkoutSessions?startDate=${todayStr}&endDate=${todayStr}`);
      const totalTime = sessionsResponse.data.reduce((acc: number, session: any) => acc + (session.duration || 0), 0);
      setTotalSessionTime(totalTime);
    } catch (error) {
      console.error('Failed to fetch workout entries:', error);
    }
  };

  const startWorkoutSession = () => {
    setActiveSession({ name: `Workout ${new Date().toLocaleDateString()}`, exercises: [], startTime: new Date(), duration: 0, isActive: true });
    setIsTimerRunning(true);
    setTimer(0);
  };

  const pauseResumeTimer = () => { setIsTimerRunning(!isTimerRunning); };

  const endWorkoutSession = async () => {
    if (activeSession) {
      try {
        await api.post('/Workout/SaveWorkoutSession', { ...activeSession, duration: timer, isActive: false });
        setActiveSession(null); setIsTimerRunning(false); setTimer(0);
        await fetchTodaysWorkouts();
        toast.success('Workout session saved successfully!');
      } catch (error) {
        console.error('Failed to save workout session:', error);
        toast.error('Failed to save workout session');
      }
    }
  };

  const addExerciseToSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const exerciseData = { ...newEntry, sets: parseInt(newEntry.sets), reps: parseInt(newEntry.reps), weight: parseInt(newEntry.weight), duration: 0 };
      const response = await api.post('/Workout/AddWorkoutExercise', exerciseData);
      if (activeSession) { setActiveSession({ ...activeSession, exercises: [...activeSession.exercises, response.data] }); }
      setNewEntry({ exerciseName: '', sets: '3', reps: '10', weight: '0', workoutType: 'strength' });
      setShowAddForm(false);
      await fetchTodaysWorkouts();
      toast.success('Exercise added successfully!');
    } catch (error) {
      console.error('Failed to add exercise:', error);
      toast.error('Failed to add exercise');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="ios-large-title text-gray-900">Workout</h1>
            <p className="text-[15px] text-ios-gray1 mt-1">Track your exercises</p>
          </div>
          <div className="flex gap-2">
            {!activeSession ? (
              <Button onClick={startWorkoutSession} icon={Play} size="sm">Start</Button>
            ) : (
              <Button onClick={() => setShowAddForm(!showAddForm)} icon={showAddForm ? X : Plus} size="sm" variant="secondary">
                {showAddForm ? 'Close' : 'Add'}
              </Button>
            )}
          </div>
        </div>

        {/* Workout Timer */}
        {activeSession && (
          <div className="ios-card p-6 mb-5 text-center">
            <p className="text-[13px] text-ios-gray1 uppercase tracking-wider mb-2 font-medium">Session Timer</p>
            <p className="text-[48px] font-light text-gray-900 tracking-tight font-sf-pro tabular-nums mb-4">
              {formatTime(timer)}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={pauseResumeTimer} variant="secondary" icon={isTimerRunning ? Pause : Play} size="md">
                {isTimerRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button onClick={endWorkoutSession} variant="destructive" icon={Square} size="md">
                End
              </Button>
            </div>
          </div>
        )}

        {/* Add Exercise Form */}
        {showAddForm && (
          <div className="ios-card p-5 mb-5 ios-animate-scale-in">
            <h3 className="ios-headline text-gray-900 mb-4">Add Exercise</h3>
            <form onSubmit={addExerciseToSession} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Input label="Exercise Name" value={newEntry.exerciseName}
                  onChange={(e) => setNewEntry({ ...newEntry, exerciseName: e.target.value })} placeholder="e.g., Bench Press" required />
                <div>
                  <label className="block text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-1.5 ml-1">Type</label>
                  <Select value={newEntry.workoutType} onChange={(value) => setNewEntry({ ...newEntry, workoutType: value })}
                    className="w-full h-[48px]"
                    options={[
                      { value: 'strength', label: 'Strength' },
                      { value: 'cardio', label: 'Cardio' },
                      { value: 'flexibility', label: 'Flexibility' },
                      { value: 'sports', label: 'Sports' }
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Sets" type="number" value={newEntry.sets}
                  onChange={(e) => setNewEntry({ ...newEntry, sets: e.target.value })} placeholder="3" min="1" required />
                <Input label="Reps" type="number" value={newEntry.reps}
                  onChange={(e) => setNewEntry({ ...newEntry, reps: e.target.value })} placeholder="10" min="1" required />
                <Input label="Weight (kg)" type="number" value={newEntry.weight}
                  onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })} placeholder="50" min="0" />
              </div>
              <div className="flex gap-2.5 pt-1">
                <Button type="submit" loading={loading}>Add Exercise</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Today's Exercises */}
        <div className="mb-5">
          <h2 className="ios-headline text-gray-900 mb-3 ml-1">Today's Exercises</h2>
          {workoutEntries.length > 0 ? (
            <div className="ios-section">
              {workoutEntries.map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  {index > 0 && <div className="ios-separator" />}
                  <div className="px-4 py-3.5">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[15px] font-medium text-gray-900">{exercise.exerciseName}</h4>
                      <span className="text-[12px] font-medium text-ios-blue bg-ios-blue/8 px-2.5 py-0.5 rounded-full capitalize">
                        {exercise.workoutType}
                      </span>
                    </div>
                    <div className="flex gap-6 text-[13px] text-ios-gray1">
                      <span>{exercise.sets} sets</span>
                      <span>{exercise.reps} reps</span>
                      <span>{exercise.weight} kg</span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="ios-card py-12 text-center">
              <Dumbbell className="h-12 w-12 text-ios-gray3 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[15px] text-ios-gray2 mb-4">No exercises logged today</p>
              <Button onClick={() => !activeSession ? startWorkoutSession() : setShowAddForm(true)} icon={Plus} size="md">
                {!activeSession ? 'Start Workout' : 'Add Exercise'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: Clock, color: 'text-ios-blue', bg: 'bg-ios-blue/10', value: formatTime(totalSessionTime + timer), label: 'Time' },
            { icon: Dumbbell, color: 'text-ios-green', bg: 'bg-ios-green/10', value: workoutEntries.length, label: 'Exercises' },
            { icon: Target, color: 'text-ios-orange', bg: 'bg-ios-orange/10', value: workoutEntries.reduce((t, e) => t + e.sets * e.reps, 0), label: 'Reps' },
            { icon: Dumbbell, color: 'text-ios-purple', bg: 'bg-ios-purple/10', value: `${Math.round(workoutEntries.reduce((t, e) => t + e.weight, 0))}`, label: 'Weight' },
          ].map((stat, i) => (
            <div key={i} className="ios-card p-3 text-center">
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2.2} />
              </div>
              <p className="text-[16px] font-bold text-gray-900">{stat.value}</p>
              <p className="text-[11px] text-ios-gray2 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTracker;