import React, { useState } from 'react';
import { User, Ruler, Weight, Target, Mail, Save, LogOut, Bell, ChevronRight } from 'lucide-react';
import { Switch } from 'antd';
import { toast } from 'react-hot-toast';
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfilePictureUpdate = async (newPictureUrl: string) => {
    await updateProfile({ profilePicture: newPictureUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
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
    if (isNaN(bmiValue)) return { category: 'N/A', color: 'text-ios-gray1' };
    if (bmiValue < 18.5) return { category: 'Underweight', color: 'text-ios-blue' };
    if (bmiValue < 25) return { category: 'Normal', color: 'text-ios-green' };
    if (bmiValue < 30) return { category: 'Overweight', color: 'text-ios-orange' };
    return { category: 'Obese', color: 'text-ios-red' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="ios-large-title text-gray-900">Profile</h1>
        </div>

        {/* Profile Picture */}
        <div className="ios-card p-6 mb-4">
          <ProfilePictureUpload currentPicture={user?.profilePicture} onUpdate={handleProfilePictureUpdate} />
          <p className="text-center text-[17px] font-semibold text-gray-900 mt-3">{user?.name}</p>
          <p className="text-center text-[14px] text-ios-gray1">{user?.email}</p>
        </div>

        {/* Health Stats */}
        <div className="mb-4">
          <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">Health</p>
          <div className="ios-section">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-gray-900">BMI</span>
              <div className="text-right">
                <span className="text-[15px] font-semibold text-gray-900 mr-2">{bmi}</span>
                <span className={`text-[13px] font-medium ${bmiCategory.color}`}>{bmiCategory.category}</span>
              </div>
            </div>
            <div className="ios-separator" />
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-gray-900">Status</span>
              <span className={`text-[14px] font-medium ${user?.isApproved ? 'text-ios-green' : 'text-ios-orange'}`}>
                {user?.isApproved ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="mb-4">
          <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">Personal Information</p>
          <div className="ios-card p-5">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} icon={User} required />
              <Input label="Email" value={user?.email || ''} icon={Mail} disabled className="opacity-60" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Height (cm)" name="height" type="number" value={formData.height} onChange={handleInputChange} placeholder="170" icon={Ruler} />
                <Input label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleInputChange} placeholder="70" icon={Weight} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-1.5 ml-1">Fitness Goals</label>
                <div className="relative">
                  <Target className="absolute left-3.5 top-3.5 h-[18px] w-[18px] text-ios-gray2" strokeWidth={2} />
                  <textarea name="fitnessGoals" value={formData.fitnessGoals} onChange={handleInputChange}
                    placeholder="Describe your fitness goals..." className="ios-input pl-11 resize-none" rows={3} />
                </div>
              </div>
              <Button type="submit" loading={loading} icon={Save} className="w-full" size="lg">Save Changes</Button>
            </form>
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-4">
          <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">Preferences</p>
          <div className="ios-section">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ios-red/10 rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-ios-red" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[15px] text-gray-900">Notifications</p>
                  <p className="text-[12px] text-ios-gray2">Daily reminders</p>
                </div>
              </div>
              <Switch 
                checked={user?.notificationsEnabled ?? true}
                onChange={async (checked) => {
                  try {
                    await updateProfile({ notificationsEnabled: checked });
                    toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
                  } catch (error) {
                    toast.error('Failed to update notifications preference');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div>
          <div className="ios-section">
            <button onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3.5 text-ios-red text-[15px] font-medium active:bg-ios-red/5 transition-colors">
              <LogOut className="h-4 w-4 mr-2" strokeWidth={2.2} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;