import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  className = '',
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-ios-gray2 pointer-events-none" strokeWidth={2} />
        )}
        <input
          type={inputType}
          className={`ios-input w-full ${Icon ? 'pl-11' : ''} ${isPasswordType ? 'pr-11' : ''} ${
            error ? 'border-ios-red focus:border-ios-red focus:ring-ios-red/20' : ''
          } ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-ios-gray2 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-full h-full" strokeWidth={2} /> : <Eye className="w-full h-full" strokeWidth={2} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-[13px] text-ios-red ml-1">{error}</p>
      )}
    </div>
  );
};

export default Input;