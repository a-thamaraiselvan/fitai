import React, { useState, useEffect } from 'react';
import { Plus, Apple, X } from 'lucide-react';
import { Select } from 'antd';
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
      const response = await api.get('/Diet/GetTodayDietEntries');
      const formattedEntries = response.data.map((entry: any) => ({
        ...entry,
        foodName: entry.food_name || entry.foodName,
        mealType: entry.meal_type || entry.mealType
      }));
      setFoodEntries(formattedEntries);
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

      await api.post('/Diet/AddDietEntry', entryData);
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

  const NutritionPill: React.FC<{ label: string; value: number; unit: string; color: string; target?: number }> = 
    ({ label, value, unit, color, target }) => (
    <div className="ios-card p-3.5 text-center">
      <p className="text-[11px] font-medium text-ios-gray1 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[20px] font-bold text-gray-900">{value}<span className="text-[12px] font-normal text-ios-gray2 ml-0.5">{unit}</span></p>
      {target && (
        <div className="mt-2">
          <div className="w-full bg-ios-gray5 rounded-full h-1">
            <div 
              className="h-1 rounded-full transition-all duration-500"
              style={{ backgroundColor: color, width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const MealSection: React.FC<{ mealType: string; entries: FoodEntry[] }> = ({ mealType, entries }) => (
    <div className="mb-4">
      <h3 className="ios-headline text-gray-900 mb-2 ml-1 capitalize">{mealType}</h3>
      <div className="ios-section">
        {entries.length > 0 ? (
          entries.map((entry, index) => (
            <React.Fragment key={entry.id}>
              {index > 0 && <div className="ios-separator" />}
              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-[15px] font-medium text-gray-900">{entry.foodName}</p>
                  <p className="text-[13px] text-ios-gray1">
                    {entry.quantity} serving · {entry.calories * entry.quantity} kcal
                  </p>
                </div>
                <p className="text-[12px] text-ios-gray2 text-right">
                  P:{entry.protein * entry.quantity}g · C:{entry.carbs * entry.quantity}g · F:{entry.fat * entry.quantity}g
                </p>
              </div>
            </React.Fragment>
          ))
        ) : (
          <p className="text-ios-gray2 text-center py-5 text-[14px]">No entries for {mealType}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="ios-large-title text-gray-900">Diet</h1>
            <p className="text-[15px] text-ios-gray1 mt-1">Track your daily nutrition</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            icon={showAddForm ? X : Plus}
            size="sm"
          >
            {showAddForm ? 'Close' : 'Add'}
          </Button>
        </div>

        {/* Add Food Form */}
        {showAddForm && (
          <div className="ios-card p-5 mb-5 ios-animate-scale-in">
            <h3 className="ios-headline text-gray-900 mb-4">Add Food Entry</h3>
            <form onSubmit={handleAddEntry} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Input
                  label="Food Name"
                  value={newEntry.foodName}
                  onChange={(e) => setNewEntry({ ...newEntry, foodName: e.target.value })}
                  placeholder="e.g., Grilled Chicken"
                  required
                />
                <div>
                  <label className="block text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-1.5 ml-1">
                    Meal Type
                  </label>
                  <Select
                    value={newEntry.mealType}
                    onChange={(value) => setNewEntry({ ...newEntry, mealType: value })}
                    className="w-full h-[48px]"
                    options={[
                      { value: 'breakfast', label: 'Breakfast' },
                      { value: 'lunch', label: 'Lunch' },
                      { value: 'dinner', label: 'Dinner' },
                      { value: 'snack', label: 'Snack' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Input label="Calories" type="number" value={newEntry.calories}
                  onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })} placeholder="250" required />
                <Input label="Protein (g)" type="number" value={newEntry.protein}
                  onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value })} placeholder="25" required />
                <Input label="Carbs (g)" type="number" value={newEntry.carbs}
                  onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value })} placeholder="30" required />
                <Input label="Fat (g)" type="number" value={newEntry.fat}
                  onChange={(e) => setNewEntry({ ...newEntry, fat: e.target.value })} placeholder="10" required />
                <Input label="Quantity" type="number" value={newEntry.quantity}
                  onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })} placeholder="1" min="1" required />
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button type="submit" loading={loading} size="md">Add Entry</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Nutrition Summary */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          <NutritionPill label="Cal" value={totalNutrition.calories} unit="kcal" color="#007AFF" target={2000} />
          <NutritionPill label="Protein" value={totalNutrition.protein} unit="g" color="#34C759" target={150} />
          <NutritionPill label="Carbs" value={totalNutrition.carbs} unit="g" color="#FF9500" target={250} />
          <NutritionPill label="Fat" value={totalNutrition.fat} unit="g" color="#FF3B30" target={65} />
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