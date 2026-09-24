import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none active:scale-[0.97]';
  
  const variants = {
    primary: 'bg-ios-blue text-white hover:brightness-110 active:brightness-90 rounded-xl shadow-ios',
    secondary: 'bg-ios-blue/10 text-ios-blue hover:bg-ios-blue/15 active:bg-ios-blue/20 rounded-xl',
    outline: 'border border-ios-separator text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-xl',
    ghost: 'text-ios-blue hover:bg-black/[0.04] active:bg-black/[0.06] rounded-xl',
    destructive: 'bg-ios-red/10 text-ios-red hover:bg-ios-red/15 active:bg-ios-red/20 rounded-xl',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[13px] gap-1.5',
    md: 'px-4 py-2.5 text-[15px] gap-2',
    lg: 'px-6 py-3 text-[17px] gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        isDisabled ? 'opacity-40 cursor-not-allowed !active:scale-100' : ''
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className={`${iconSizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={iconSizes[size]} strokeWidth={2.2} />
      ) : null}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={iconSizes[size]} strokeWidth={2.2} />
      )}
    </button>
  );
};

export default Button;