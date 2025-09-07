import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

interface SmartAuthButtonProps {
  provider: 'google' | 'github';
  className?: string;
}

const SmartAuthButton: React.FC<SmartAuthButtonProps> = ({ provider, className }) => {
  const { signInWithGoogle, signInWithGitHub, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'popup' | 'redirect'>('popup');
  const [showFallback, setShowFallback] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      clearError();

      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      // If popup was blocked or closed, show fallback options
      if (error.message.includes('popup') && authMethod === 'popup') {
        setShowFallback(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRedirect = () => {
    setAuthMethod('redirect');
    setShowFallback(false);
    // The authService will automatically handle redirect fallback
    handleSignIn();
  };

  if (provider === 'google') {
    return (
      <div className="space-y-4">
        <GoogleAuthButton
          onClick={handleSignIn}
          isLoading={isLoading}
          disabled={isLoading}
        />
        
        {showFallback && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Sign-in popup was blocked or closed
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Try one of these alternatives:
                </p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={switchToRedirect}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Try redirect method
                  </button>
                  <div className="text-xs text-yellow-600">
                    Or allow popups for this site and try again
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && error.includes('popup') && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
                {!showFallback && (
                  <button
                    onClick={() => setShowFallback(true)}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-800 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Show alternatives
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // GitHub version would be similar but with different styling
  return (
    <div className="space-y-4">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex items-center justify-center space-x-3 px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 w-full"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
        <span>
          {isLoading ? 'Connecting...' : 'Continue with GitHub'}
        </span>
      </button>
      
      {showFallback && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Sign-in popup was blocked or closed
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Try the redirect method instead:
              </p>
              <button
                onClick={switchToRedirect}
                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Try redirect method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAuthButton;
