import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-bg">
      <div className="text-center">
        <div className="relative w-10 h-10 mx-auto mb-4">
          <div 
            className="w-10 h-10 rounded-full border-[3px] border-ios-gray5 border-t-ios-gray1"
            style={{ animation: 'ios-spin 0.8s linear infinite' }}
          />
        </div>
        <p className="text-ios-gray1 text-[15px]">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;