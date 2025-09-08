import { useState, useEffect } from 'react';
import { webContainerService } from '../services/webContainer';
import BrowserCompatibilityChecker from '../utils/browserCompatibility';
import type { BrowserCompatibilityInfo } from '../utils/browserCompatibility';

export interface UseWebContainerReturn {
  isSupported: boolean;
  isInitialized: boolean;
  error: string | null;
  webContainer: typeof webContainerService;
  initializeContainer: () => Promise<void>;
  getStatus: () => { isInitialized: boolean; isBooting: boolean; hasContainer: boolean };
  compatibilityInfo: BrowserCompatibilityInfo | null;
  resetError: () => void;
}

export const useWebContainer = (): UseWebContainerReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityInfo, setCompatibilityInfo] = useState<BrowserCompatibilityInfo | null>(null);

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
      
      setCompatibilityInfo(compatInfo);
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
      setIsInitialized(false);
      
      if (!checkSupport()) {
        return;
      }

      console.log('🚀 Initializing WebContainer...');
      await webContainerService.initialize();
      
      // Wait a bit to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Double-check that it's actually ready
      setIsInitialized(true);
      console.log('✅ WebContainer initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebContainer';
      setError(errorMessage);
      setIsInitialized(false);
      console.error('❌ WebContainer initialization error:', err);
    }
  };

  const getStatus = () => {
    return webContainerService.getStatus();
  };

  const resetError = () => {
    setError(null);
  };

  useEffect(() => {
    // Delay the support check to ensure all resources are loaded
    const timer = setTimeout(() => {
      // Check support first
      checkSupport();
      
      // Update initialization status based on service state
      const status = webContainerService.getStatus();
      if (status.isInitialized && !status.isBooting) {
        setIsInitialized(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    isSupported,
    isInitialized,
    error,
    webContainer: webContainerService,
    initializeContainer,
    getStatus,
    compatibilityInfo,
    resetError,
  };
};
