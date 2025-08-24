import React, { useState, useEffect } from 'react';
import { Plus, Search, Apple, Calendar, TrendingUp } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import api from '../../services/api';

interface FoodEntry {
  id: number;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  mealType: string;
  date: string;
}

const DietTracker: React.FC = () => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntry, setNewEntry] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    quantity: '1',
    mealType: 'breakfast',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodaysFoodEntries();
  }, []);

  const fetchTodaysFoodEntries = async () => {
    try {
      const response = await api.get('/diet/entries/today');
      setFoodEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch food entries:', error);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const entryData = {
        ...newEntry,
        calories: parseInt(newEntry.calories),
        protein: parseInt(newEntry.protein),
        carbs: parseInt(newEntry.carbs),
        fat: parseInt(newEntry.fat),
        quantity: parseInt(newEntry.quantity),
      };

      await api.post('/diet/entries', entryData);
      await fetchTodaysFoodEntries();
      setNewEntry({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        quantity: '1',
        mealType: 'breakfast',
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add food entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalNutrition = () => {
    return foodEntries.reduce(
      (total, entry) => ({
        calories: total.calories + entry.calories * entry.quantity,
        protein: total.protein + entry.protein * entry.quantity,
        carbs: total.carbs + entry.carbs * entry.quantity,
        fat: total.fat + entry.fat * entry.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMealEntries = (mealType: string) => {
    return foodEntries.filter(entry => entry.mealType === mealType);
  };

  const totalNutrition = getTotalNutrition();

  const NutritionCard: React.FC<{
    title: string;
    value: number;
    unit: string;
    color: string;
    target?: number;
  }> = ({ title, value, unit, color, target }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4" style={{ borderLeftColor: color }}>
      <p className="text-sm text-gray-600 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}<span className="text-sm font-normal text-gray-500">{unit}</span></p>
      {target && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: color,
                width: `${Math.min((value / target) * 100, 100)}%`
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round((value / target) * 100)}% of target</p>
        </div>
      )}
    </div>
  );

  const MealSection: React.FC<{ mealType: string; entries: FoodEntry[] }> = ({ mealType, entries }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{mealType}</h3>
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{entry.foodName}</p>
                <p className="text-sm text-gray-600">
                  {entry.quantity} serving • {entry.calories * entry.quantity} kcal
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  P: {entry.protein * entry.quantity}g • C: {entry.carbs * entry.quantity}g • F: {entry.fat * entry.quantity}g
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No entries for {mealType}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diet Tracker</h1>
            <p className="text-gray-600">Track your daily nutrition intake</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            icon={Plus}
            className="shrink-0"
          >
            Add Food
          </Button>
        </div>

        {/* Add Food Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Food Name"
                  value={newEntry.foodName}
                  onChange={(e) => setNewEntry({ ...newEntry, foodName: e.target.value })}
                  placeholder="e.g., Grilled Chicken"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <select
                    value={newEntry.mealType}
                    onChange={(e) => setNewEntry({ ...newEntry, mealType: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input
                  label="Calories"
                  type="number"
                  value={newEntry.calories}
                  onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                  placeholder="250"
                  required
                />
                <Input
                  label="Protein (g)"
                  type="number"
                  value={newEntry.protein}
                  onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value })}
                  placeholder="25"
                  required
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={newEntry.carbs}
                  onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value })}
                  placeholder="30"
                  required
                />
                <Input
                  label="Fat (g)"
                  type="number"
                  value={newEntry.fat}
                  onChange={(e) => setNewEntry({ ...newEntry, fat: e.target.value })}
                  placeholder="10"
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  Add Entry
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

        {/* Nutrition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <NutritionCard
            title="Calories"
            value={totalNutrition.calories}
            unit="kcal"
            color="#3B82F6"
            target={2000}
          />
          <NutritionCard
            title="Protein"
            value={totalNutrition.protein}
            unit="g"
            color="#10B981"
            target={150}
          />
          <NutritionCard
            title="Carbs"
            value={totalNutrition.carbs}
            unit="g"
            color="#F59E0B"
            target={250}
          />
          <NutritionCard
            title="Fat"
            value={totalNutrition.fat}
            unit="g"
            color="#EF4444"
            target={65}
          />
        </div>

        {/* Meals */}
        <MealSection mealType="breakfast" entries={getMealEntries('breakfast')} />
        <MealSection mealType="lunch" entries={getMealEntries('lunch')} />
        <MealSection mealType="dinner" entries={getMealEntries('dinner')} />
        <MealSection mealType="snack" entries={getMealEntries('snack')} />
      </div>
    </div>
  );
};

export default DietTracker;