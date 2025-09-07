import React from 'react';

interface GoogleAuthButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onClick, disabled, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center justify-center space-x-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 w-full relative overflow-hidden group"
    >
      {/* Animated Color Waves - Sequential from left to right */}
      <div className="absolute inset-0">
        {/* Blue wave from left */}
        <div className="absolute top-0 left-0 w-full h-full bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out rounded-xl" />
        {/* Green wave */}
        <div className="absolute top-0 left-0 w-full h-full bg-green-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-out delay-100 rounded-xl" />
        {/* Yellow wave */}
        <div className="absolute top-0 left-0 w-full h-full bg-yellow-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-200 rounded-xl" />
        {/* Red wave - final */}
        <div className="absolute top-0 left-0 w-full h-full bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-800 ease-out delay-300 rounded-xl" />
      </div>

      {/* Google SVG Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid" 
        viewBox="0 0 256 262" 
        className="w-5 h-5 z-10 relative transition-all duration-300 group-hover:scale-110"
      >
        <path 
          fill="#4285F4" 
          d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" 
          className="transition-all duration-300 group-hover:brightness-200 delay-200"
        />
        <path 
          fill="#34A853" 
          d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" 
          className="transition-all duration-300 group-hover:brightness-200 delay-300"
        />
        <path 
          fill="#FBBC05" 
          d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" 
          className="transition-all duration-300 group-hover:brightness-200 delay-400"
        />
        <path 
          fill="#EB4335" 
          d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" 
          className="transition-all duration-300 group-hover:brightness-200 delay-500"
        />
      </svg>

      {/* Text */}
      <span className="z-10 relative group-hover:text-white transition-colors duration-300 delay-400">
        {isLoading ? 'Connecting...' : 'Continue with Google'}
      </span>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin z-10 relative group-hover:border-white group-hover:border-t-transparent transition-colors duration-300" />
      )}
    </button>
  );
};

export default GoogleAuthButton;
