import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../UI/Button';
import Input from '../UI/Input';
import api from '../../services/api';

const ResetFirstPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const email = localStorage.getItem('fitai_reset_email');
    if (!email) {
      setError('Session expired. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    try {
      await api.post('/Auth/ResetFirstPassword', { email, newPassword });
      toast.success('Password reset successfully! Please login with your new password.');
      localStorage.removeItem('fitai_reset_email');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-ios-bg">
      <div className="max-w-sm w-full space-y-6 ios-animate-fade-in">
        <div className="text-center pt-8">
          <div className="w-16 h-16 bg-ios-blue rounded-[18px] flex items-center justify-center mx-auto mb-5 shadow-ios-lg">
            <KeyRound className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="ios-large-title text-gray-900 mb-1">Reset Password</h1>
          <p className="text-[15px] text-ios-gray1">Create a new password for your account</p>
        </div>

        <div className="ios-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-ios-red/8 border border-ios-red/20 text-ios-red px-4 py-3 rounded-xl text-[14px]">
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-ios-gray2 hover:text-ios-gray1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                icon={Lock}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={KeyRound}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetFirstPassword;
