import React, { useState, useRef } from 'react';
import { User, Ruler, Weight, Target, Mail, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import Input from '../UI/Input';
import ProfilePictureUpload from './ProfilePictureUpload';

const Profile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    fitnessGoals: user?.fitnessGoals || '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilePictureUpdate = async (newPictureUrl: string) => {
    await updateProfile({ profilePicture: newPictureUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
      };

      await updateProfile(updateData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (user?.height && user?.weight) {
      const heightInM = user.height / 100;
      return (user.weight / (heightInM * heightInM)).toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi: string) => {
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return { category: 'N/A', color: 'text-gray-600' };
    
    if (bmiValue < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmiValue < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmiValue < 30) return { category: 'Overweight', color: 'text-orange-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Profile Picture */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <ProfilePictureUpload
            currentPicture={user?.profilePicture}
            onUpdate={handleProfilePictureUpdate}
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              icon={User}
              required
            />

            <Input
              label="Email"
              value={user?.email || ''}
              icon={Mail}
              disabled
              className="bg-gray-100"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Height (cm)"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="170"
                icon={Ruler}
              />

              <Input
                label="Weight (kg)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="70"
                icon={Weight}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fitness Goals
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="fitnessGoals"
                  value={formData.fitnessGoals}
                  onChange={handleInputChange}
                  placeholder="Describe your fitness goals..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" loading={loading} icon={Save} className="w-full">
              Save Changes
            </Button>
          </form>
        </div>

        {/* Health Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-sm text-gray-600 font-medium">BMI</p>
              <p className="text-2xl font-bold text-gray-900">{bmi}</p>
              <p className={`text-sm font-medium ${bmiCategory.color}`}>{bmiCategory.category}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <p className="text-sm text-gray-600 font-medium">Status</p>
              <p className="text-lg font-bold text-green-600">
                {user?.isApproved ? 'Approved' : 'Pending'}
              </p>
              <p className="text-sm text-gray-500">Account Status</p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
          <Button
            onClick={logout}
            variant="outline"
            icon={LogOut}
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;