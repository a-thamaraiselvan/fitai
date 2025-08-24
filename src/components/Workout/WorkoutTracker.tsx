import React, { useState, useEffect } from 'react';
import { Plus, Clock, Dumbbell, Target, Play, Pause, RotateCcw } from 'lucide-react';
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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [newEntry, setNewEntry] = useState({
    exerciseName: '',
    sets: '3',
    reps: '10',
    weight: '0',
    workoutType: 'strength',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodaysWorkouts();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchTodaysWorkouts = async () => {
    try {
      const response = await api.get('/workout/entries/today');
      setWorkoutEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch workout entries:', error);
    }
  };

  const startWorkoutSession = () => {
    const session: WorkoutSession = {
      name: `Workout ${new Date().toLocaleDateString()}`,
      exercises: [],
      startTime: new Date(),
      duration: 0,
      isActive: true,
    };
    setActiveSession(session);
    setIsTimerRunning(true);
    setTimer(0);
  };

  const pauseResumeTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const endWorkoutSession = async () => {
    if (activeSession) {
      try {
        const sessionData = {
          ...activeSession,
          duration: timer,
          isActive: false,
        };
        await api.post('/workout/sessions', sessionData);
        setActiveSession(null);
        setIsTimerRunning(false);
        setTimer(0);
        await fetchTodaysWorkouts();
      } catch (error) {
        console.error('Failed to save workout session:', error);
      }
    }
  };

  const addExerciseToSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exerciseData = {
        ...newEntry,
        sets: parseInt(newEntry.sets),
        reps: parseInt(newEntry.reps),
        weight: parseInt(newEntry.weight),
        duration: 0, // Can be updated later for timed exercises
      };

      const response = await api.post('/workout/exercises', exerciseData);
      
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          exercises: [...activeSession.exercises, response.data],
        });
      }

      setNewEntry({
        exerciseName: '',
        sets: '3',
        reps: '10',
        weight: '0',
        workoutType: 'strength',
      });
      setShowAddForm(false);
      await fetchTodaysWorkouts();
    } catch (error) {
      console.error('Failed to add exercise:', error);
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

  const WorkoutTimer: React.FC = () => (
    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white mb-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Workout Session</h3>
        <div className="text-4xl font-bold mb-4">{formatTime(timer)}</div>
        <div className="flex justify-center gap-3">
          <Button
            onClick={pauseResumeTimer}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            icon={isTimerRunning ? Pause : Play}
          >
            {isTimerRunning ? 'Pause' : 'Resume'}
          </Button>
          <Button
            onClick={endWorkoutSession}
            variant="secondary"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );

  const ExerciseCard: React.FC<{ exercise: WorkoutEntry }> = ({ exercise }) => (
    <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{exercise.exerciseName}</h4>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium capitalize">
          {exercise.workoutType}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
        <div>
          <p className="font-medium">Sets</p>
          <p>{exercise.sets}</p>
        </div>
        <div>
          <p className="font-medium">Reps</p>
          <p>{exercise.reps}</p>
        </div>
        <div>
          <p className="font-medium">Weight</p>
          <p>{exercise.weight} kg</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Tracker</h1>
            <p className="text-gray-600">Track your exercises and progress</p>
          </div>
          <div className="flex gap-2">
            {!activeSession ? (
              <Button 
                onClick={startWorkoutSession}
                icon={Play}
                className="shrink-0"
              >
                Start Workout
              </Button>
            ) : (
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                icon={Plus}
                variant="secondary"
                className="shrink-0"
              >
                Add Exercise
              </Button>
            )}
          </div>
        </div>

        {/* Workout Timer */}
        {activeSession && <WorkoutTimer />}

        {/* Add Exercise Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <form onSubmit={addExerciseToSession} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Exercise Name"
                  value={newEntry.exerciseName}
                  onChange={(e) => setNewEntry({ ...newEntry, exerciseName: e.target.value })}
                  placeholder="e.g., Bench Press"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workout Type
                  </label>
                  <select
                    value={newEntry.workoutType}
                    onChange={(e) => setNewEntry({ ...newEntry, workoutType: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Sets"
                  type="number"
                  value={newEntry.sets}
                  onChange={(e) => setNewEntry({ ...newEntry, sets: e.target.value })}
                  placeholder="3"
                  min="1"
                  required
                />
                <Input
                  label="Reps"
                  type="number"
                  value={newEntry.reps}
                  onChange={(e) => setNewEntry({ ...newEntry, reps: e.target.value })}
                  placeholder="10"
                  min="1"
                  required
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={newEntry.weight}
                  onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                  placeholder="50"
                  min="0"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Add Exercise
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Today's Workouts */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Exercises</h2>
          {workoutEntries.length > 0 ? (
            <div className="space-y-4">
              {workoutEntries.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Dumbbell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No exercises logged today</p>
              <Button 
                onClick={() => !activeSession ? startWorkoutSession() : setShowAddForm(true)}
                icon={Plus}
              >
                {!activeSession ? 'Start Your First Workout' : 'Add Exercise'}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatTime(timer)}</p>
            <p className="text-sm text-gray-600">Session Time</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Dumbbell className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{workoutEntries.length}</p>
            <p className="text-sm text-gray-600">Exercises</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <Target className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {workoutEntries.reduce((total, ex) => total + (ex.sets * ex.reps), 0)}
            </p>
            <p className="text-sm text-gray-600">Total Reps</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <RotateCcw className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(workoutEntries.reduce((total, ex) => total + ex.weight, 0))}
            </p>
            <p className="text-sm text-gray-600">Total Weight</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutTracker;