import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Monitor,
  Shield,
  Globe,
  Chrome
} from 'lucide-react';
import { useWebContainer } from '../hooks/useWebContainer';
import type { BrowserCompatibilityInfo } from '../utils/browserCompatibility';

interface WebContainerStatusProps {
  onRetry?: () => void;
  showDetails?: boolean;
}

export const WebContainerStatus: React.FC<WebContainerStatusProps> = ({ 
  onRetry, 
  showDetails = false 
}) => {
  const { 
    isSupported, 
    isInitialized, 
    error, 
    initializeContainer, 
    getStatus,
    compatibilityInfo,
    resetError 
  } = useWebContainer();
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [status, setStatus] = useState({ isInitialized: false, isBooting: false, hasContainer: false });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getStatus());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [getStatus]);

  const handleRetry = async () => {
    resetError();
    if (onRetry) {
      onRetry();
    } else {
      await initializeContainer();
    }
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="w-5 h-5 text-red-500" />;
    if (status.isBooting) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (isInitialized && status.hasContainer) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isSupported) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (error) return 'WebContainer Error';
    if (status.isBooting) return 'Initializing WebContainer...';
    if (isInitialized && status.hasContainer) return 'WebContainer Ready';
    if (isSupported) return 'WebContainer Supported';
    return 'WebContainer Not Supported';
  };

  const getStatusColor = () => {
    if (error) return 'border-red-500/50 bg-red-500/10';
    if (status.isBooting) return 'border-blue-500/50 bg-blue-500/10';
    if (isInitialized && status.hasContainer) return 'border-green-500/50 bg-green-500/10';
    if (isSupported) return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-red-500/50 bg-red-500/10';
  };

  if (!showDetails && isInitialized && !error) {
    return null; // Don't show when everything is working
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 backdrop-blur-sm ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-white">{getStatusText()}</h3>
            {error && (
              <p className="text-sm text-red-300 mt-1">{error}</p>
            )}
            {status.isBooting && (
              <p className="text-sm text-blue-300 mt-1">
                Setting up development environment...
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {error && (
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          )}
          
          {compatibilityInfo && (
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <Monitor size={14} />
              <span>Info</span>
            </button>
          )}
        </div>
      </div>

      {/* Diagnostics Panel */}
      <AnimatePresence>
        {showDiagnostics && compatibilityInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-600/50"
          >
            <h4 className="font-medium text-white mb-3 flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              Browser Diagnostics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Browser:</span>
                  <span className="text-white font-medium">{compatibilityInfo.browserName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Secure Context:</span>
                  <div className="flex items-center">
                    {compatibilityInfo.hasSecureContext ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">SharedArrayBuffer:</span>
                  <div className="flex items-center">
                    {compatibilityInfo.hasSharedArrayBuffer ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Cross-Origin Isolation:</span>
                  <div className="flex items-center">
                    {compatibilityInfo.hasCrossOriginIsolation ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Chrome-based:</span>
                  <div className="flex items-center">
                    {compatibilityInfo.isChromeBased ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Overall Support:</span>
                  <div className="flex items-center">
                    {compatibilityInfo.isSupported ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {compatibilityInfo.suggestions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h5 className="font-medium text-blue-300 mb-2">Suggestions:</h5>
                <ul className="text-sm text-blue-200 space-y-1">
                  {compatibilityInfo.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WebContainerStatus;