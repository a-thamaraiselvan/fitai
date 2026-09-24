import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AnalyzedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface MealAnalysis {
  foods: AnalyzedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const MealAnalyzer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [mealType, setMealType] = useState('breakfast');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    try {
      const response = await api.post('/Ai/AnalyzeMealImage', { image: selectedImage, mealType });
      setAnalysis(response.data.analysis);
      toast.success('Meal analyzed successfully!');
    } catch (error) {
      console.error('Failed to analyze meal:', error);
      toast.error('Failed to analyze meal. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const addFoodToDiet = async (food: AnalyzedFood) => {
    try {
      await api.post('/Diet/AddDietEntry', {
        foodName: food.name, calories: food.calories, protein: food.protein,
        carbs: food.carbs, fat: food.fat, quantity: 1, mealType
      });
      toast.success(`${food.name} added to your ${mealType}!`);
    } catch (error) {
      console.error('Failed to add food:', error);
      toast.error('Failed to add food to diet tracker');
    }
  };

  const addAllFoods = async () => {
    if (!analysis) return;
    try {
      const promises = analysis.foods.map(food => 
        api.post('/Diet/AddDietEntry', {
          foodName: food.name, calories: food.calories, protein: food.protein,
          carbs: food.carbs, fat: food.fat, quantity: 1, mealType
        })
      );
      await Promise.all(promises);
      toast.success(`All foods added to your ${mealType}!`);
      setSelectedImage(null);
      setAnalysis(null);
    } catch (error) {
      console.error('Failed to add foods:', error);
      toast.error('Failed to add some foods to diet tracker');
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setMealType(getCurrentMealType());
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-ios-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-ios-purple" strokeWidth={2} />
          </div>
          <h1 className="ios-large-title text-gray-900 mb-1">AI Analyzer</h1>
          <p className="text-[15px] text-ios-gray1">Upload a photo to analyze nutrition</p>
        </div>

        {/* Meal Type — iOS Segmented Control */}
        <div className="ios-card p-1.5 mb-5">
          <div className="flex bg-ios-gray6 rounded-xl p-0.5">
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 capitalize ${
                  mealType === type
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-ios-gray1 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        {!selectedImage && (
          <div className="ios-card p-6 mb-5">
            <div className="border-2 border-dashed border-ios-gray4 rounded-2xl p-10 text-center">
              <div className="flex justify-center gap-3 mb-4">
                <Button onClick={() => cameraInputRef.current?.click()} icon={Camera} size="md">
                  Camera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} icon={Upload} variant="secondary" size="md">
                  Upload
                </Button>
              </div>
              <p className="text-[14px] text-ios-gray2">Take a photo or upload an image</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <div className="ios-card p-5 mb-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="ios-headline text-gray-900">Meal Image</h3>
              <Button onClick={resetAnalysis} variant="ghost" icon={X} size="sm">Clear</Button>
            </div>
            <img src={selectedImage} alt="Selected meal" className="w-full rounded-2xl mb-4" />
            {!analysis && (
              <Button onClick={analyzeImage} loading={analyzing} icon={analyzing ? Loader2 : Sparkles} className="w-full" size="lg">
                {analyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="ios-card p-5">
              <h3 className="ios-headline text-gray-900 mb-4">Nutrition Summary</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Calories', value: analysis.totalCalories, unit: '' },
                  { label: 'Protein', value: analysis.totalProtein, unit: 'g' },
                  { label: 'Carbs', value: analysis.totalCarbs, unit: 'g' },
                  { label: 'Fat', value: analysis.totalFat, unit: 'g' },
                ].map(item => (
                  <div key={item.label} className="text-center p-2.5 bg-ios-gray6 rounded-xl">
                    <p className="text-[18px] font-bold text-gray-900">{item.value}{item.unit}</p>
                    <p className="text-[11px] text-ios-gray1 uppercase tracking-wider mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <Button onClick={addAllFoods} variant="secondary" icon={Plus} className="w-full mt-4">
                Add All to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Button>
            </div>

            {/* Individual Foods */}
            <div className="ios-section">
              <h3 className="ios-headline text-gray-900 px-4 pt-4 pb-2">Detected Foods</h3>
              {analysis.foods.map((food, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <div className="ios-separator" />}
                  <div className="flex items-center px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[15px] font-medium text-gray-900">{food.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          food.confidence > 0.8 ? 'bg-ios-green/10 text-ios-green' 
                          : food.confidence > 0.6 ? 'bg-ios-orange/10 text-ios-orange' 
                          : 'bg-ios-red/10 text-ios-red'
                        }`}>
                          {Math.round(food.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[12px] text-ios-gray2">
                        {food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                      </p>
                    </div>
                    <Button onClick={() => addFoodToDiet(food)} icon={Plus} size="sm" variant="secondary">
                      Add
                    </Button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAnalyzer;