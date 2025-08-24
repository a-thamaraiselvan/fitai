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
      const response = await api.post('/ai/analyze-meal', {
        image: selectedImage,
        mealType: mealType
      });

      setAnalysis(response.data.analysis);
      toast.success('Meal analyzed successfully! 🍽️');
    } catch (error) {
      console.error('Failed to analyze meal:', error);
      toast.error('Failed to analyze meal. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const addFoodToDiet = async (food: AnalyzedFood) => {
    try {
      await api.post('/diet/entries', {
        foodName: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        quantity: 1,
        mealType: mealType
      });

      toast.success(`${food.name} added to your ${mealType}! ✅`);
    } catch (error) {
      console.error('Failed to add food:', error);
      toast.error('Failed to add food to diet tracker');
    }
  };

  const addAllFoods = async () => {
    if (!analysis) return;

    try {
      const promises = analysis.foods.map(food => 
        api.post('/diet/entries', {
          foodName: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          quantity: 1,
          mealType: mealType
        })
      );

      await Promise.all(promises);
      toast.success(`All foods added to your ${mealType}! 🎉`);
      
      // Reset form
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Meal Analyzer</h1>
          <p className="text-gray-600">Upload a photo and let AI analyze your meal's nutrition</p>
        </div>

        {/* Meal Type Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Meal Type</h3>
          <div className="grid grid-cols-4 gap-3">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  mealType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload Section */}
        {!selectedImage && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 transition-colors duration-300">
                <div className="flex justify-center space-x-4 mb-6">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    icon={Camera}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    Take Photo
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    icon={Upload}
                    variant="outline"
                  >
                    Upload Image
                  </Button>
                </div>
                <p className="text-gray-500">Take a photo or upload an image of your meal</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview & Analysis */}
        {selectedImage && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Meal Image</h3>
              <Button
                onClick={resetAnalysis}
                variant="ghost"
                icon={X}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            </div>

            <div className="mb-6">
              <img
                src={selectedImage}
                alt="Selected meal"
                className="w-full max-w-md mx-auto rounded-xl shadow-md"
              />
            </div>

            {!analysis && (
              <div className="text-center">
                <Button
                  onClick={analyzeImage}
                  loading={analyzing}
                  icon={analyzing ? Loader2 : Sparkles}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Nutrition Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analysis.totalCalories}</p>
                  <p className="text-sm opacity-90">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analysis.totalProtein}g</p>
                  <p className="text-sm opacity-90">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analysis.totalCarbs}g</p>
                  <p className="text-sm opacity-90">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analysis.totalFat}g</p>
                  <p className="text-sm opacity-90">Fat</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button
                  onClick={addAllFoods}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  icon={Plus}
                >
                  Add All to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Button>
              </div>
            </div>

            {/* Individual Foods */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Foods</h3>
              <div className="space-y-4">
                {analysis.foods.map((food, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-gray-900 mr-2">{food.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          food.confidence > 0.8 
                            ? 'bg-green-100 text-green-800' 
                            : food.confidence > 0.6 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(food.confidence * 100)}% confident
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">Calories</p>
                          <p>{food.calories}</p>
                        </div>
                        <div>
                          <p className="font-medium">Protein</p>
                          <p>{food.protein}g</p>
                        </div>
                        <div>
                          <p className="font-medium">Carbs</p>
                          <p>{food.carbs}g</p>
                        </div>
                        <div>
                          <p className="font-medium">Fat</p>
                          <p>{food.fat}g</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => addFoodToDiet(food)}
                      icon={Plus}
                      size="sm"
                      className="ml-4 shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAnalyzer;