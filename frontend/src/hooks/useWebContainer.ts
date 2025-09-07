import { useState, useEffect } from 'react';
import { webContainerService } from '../services/webContainer';
import BrowserCompatibilityChecker from '../utils/browserCompatibility';

export interface UseWebContainerReturn {
  isSupported: boolean;
  isInitialized: boolean;
  error: string | null;
  webContainer: typeof webContainerService;
  initializeContainer: () => Promise<void>;
  resetError: () => void;
}

export const useWebContainer = (): UseWebContainerReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = () => {
    try {
      console.log('🔍 Checking WebContainer browser support...');
      
      // Suppress Chrome extension errors by overriding console.error temporarily
      const originalConsoleError = console.error;
      const extensionErrorFilter = (message: any, ...args: any[]) => {
        const messageStr = String(message);
        if (
          messageStr.includes('Could not establish connection') ||
          messageStr.includes('Receiving end does not exist') ||
          messageStr.includes('Extension context invalidated') ||
          messageStr.includes('chrome-extension://')
        ) {
          // Suppress extension-related errors
          return;
        }
        originalConsoleError(message, ...args);
      };
      console.error = extensionErrorFilter;
      
      // Restore original console.error after a delay
      setTimeout(() => {
        console.error = originalConsoleError;
      }, 5000);
      
      // Use our enhanced compatibility checker
      const compatInfo = BrowserCompatibilityChecker.checkWebContainerCompatibility();
      
      console.log('Browser compatibility check:', compatInfo);
      
      if (!compatInfo.isSupported) {
        const errorMessage = BrowserCompatibilityChecker.getWebContainerFallbackMessage(compatInfo);
        throw new Error(errorMessage);
      }

      setIsSupported(true);
      console.log('🎉 WebContainer is supported!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'WebContainer not supported in this environment';
      console.error('❌ WebContainer support check failed:', errorMessage);
      setError(errorMessage);
      setIsSupported(false);
      return false;
    }
  };

  const initializeContainer = async () => {
    try {
      setError(null);
      
      if (!checkSupport()) {
        return;
      }

      console.log('🚀 Initializing WebContainer...');
      await webContainerService.initialize();
      setIsInitialized(true);
      console.log('✅ WebContainer initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebContainer';
      setError(errorMessage);
      setIsInitialized(false);
      console.error('❌ WebContainer initialization error:', err);
    }
  };

  const resetError = () => {
    setError(null);
  };

  useEffect(() => {
    // Delay the support check to ensure all resources are loaded
    const timer = setTimeout(() => {
      checkSupport();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    isSupported,
    isInitialized,
    error,
    webContainer: webContainerService,
    initializeContainer,
    resetError,
  };
};
