import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Dumbbell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import Input from '../UI/Input';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      if (response?.data?.mustResetPassword) {
        localStorage.setItem('fitai_reset_email', email);
        navigate('/resetPassword');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-ios-bg">
      <div className="max-w-sm w-full space-y-6 ios-animate-fade-in">
        {/* App Icon & Title */}
        <div className="text-center pt-8">
          <div className="w-16 h-16 bg-ios-blue rounded-[18px] flex items-center justify-center mx-auto mb-5 shadow-ios-lg">
            <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="ios-large-title text-gray-900 mb-1">Welcome Back</h1>
          <p className="text-[15px] text-ios-gray1">Sign in to FitAI</p>
        </div>

        {/* Form Card */}
        <div className="ios-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-ios-red/8 border border-ios-red/20 text-ios-red px-4 py-3 rounded-xl text-[14px]">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={Lock}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[15px] text-ios-gray1">
              Don't have an account?{' '}
              <Link to="/register" className="text-ios-blue font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[12px] text-ios-gray2 pb-6">
          <p>Design and Developed By <a href='https://thamaraiselvan.novacodex.in/' className="text-ios-blue">Thamaraiselvan</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;