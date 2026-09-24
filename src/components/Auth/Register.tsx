import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Button from '../UI/Button';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-ios-bg">
      <div className="max-w-sm w-full space-y-6 ios-animate-fade-in">
        {/* App Icon & Title */}
        <div className="text-center pt-8">
          <div className="w-16 h-16 bg-ios-blue rounded-[18px] flex items-center justify-center mx-auto mb-5 shadow-ios-lg">
            <Lock className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="ios-large-title text-gray-900 mb-1">Registration Disabled</h1>
        </div>

        {/* Form Card */}
        <div className="ios-card p-6 text-center">
          <p className="text-[15px] text-ios-gray1 mb-6 leading-relaxed">
            FitAI accounts are created by your gym. Please contact your gym administrator to get your account.
          </p>
          
          <Link to="/login">
            <Button className="w-full" size="lg">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;