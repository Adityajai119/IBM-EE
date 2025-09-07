import React, { useEffect, useState } from 'react';
import { AlertTriangle, Chrome, Shield, Globe, RefreshCw, Info } from 'lucide-react';
import BrowserCompatibilityChecker, { type BrowserCompatibilityInfo } from '../utils/browserCompatibility';

interface WebContainerFallbackProps {
  error: string;
  onRetry?: () => void;
  showDiagnostics?: boolean;
  onToggleDiagnostics?: () => void;
}

export const WebContainerFallback: React.FC<WebContainerFallbackProps> = ({
  error,
  onRetry,
  showDiagnostics,
  onToggleDiagnostics
}) => {
  const [compatInfo, setCompatInfo] = useState<BrowserCompatibilityInfo | null>(null);

  useEffect(() => {
    const info = BrowserCompatibilityChecker.checkWebContainerCompatibility();
    setCompatInfo(info);
  }, []);

  if (!compatInfo) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 mx-4 my-4">
        <div className="flex items-center space-x-3">
          <Info className="text-gray-500" size={20} />
          <span>Checking browser compatibility...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mx-4 my-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="text-red-500 mt-1" size={20} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            WebContainer Not Supported
          </h3>
          
          <p className="text-red-700 mb-4">
            {error}
          </p>

          {/* Browser-specific solutions */}
          <div className="space-y-3 mb-4">
            {!compatInfo.hasSharedArrayBuffer && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-blue-600" size={16} />
                  <span className="font-medium text-blue-800">SharedArrayBuffer Issue</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  Your browser has disabled SharedArrayBuffer for security reasons.
                </p>
                <div className="text-xs text-blue-600 space-y-1">
                  {compatInfo.suggestions.map((suggestion, index) => (
                    <p key={index}>• {suggestion}</p>
                  ))}
                </div>
              </div>
            )}

            {!compatInfo.hasCrossOriginIsolation && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="text-purple-600" size={16} />
                  <span className="font-medium text-purple-800">Cross-Origin Isolation Required</span>
                </div>
                <p className="text-sm text-purple-700 mb-2">
                  The site needs to be configured with proper security headers.
                </p>
                <div className="text-xs text-purple-600 space-y-1">
                  <p>• COOP: Cross-Origin-Opener-Policy</p>
                  <p>• COEP: Cross-Origin-Embedder-Policy</p>
                  <p>• These headers enable WebContainer's security features</p>
                </div>
              </div>
            )}

            {!compatInfo.hasSecureContext && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-green-600" size={16} />
                  <span className="font-medium text-green-800">Secure Context Required</span>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  WebContainer requires HTTPS or localhost.
                </p>
                <div className="text-xs text-green-600 space-y-1">
                  <p>• Try accessing via https:// instead of http://</p>
                  <p>• Or use localhost for development</p>
                </div>
              </div>
            )}
          </div>

          {/* Browser recommendations */}
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Chrome className="text-blue-600" size={16} />
              <span className="font-medium text-blue-800">Browser Compatibility</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              Current browser: <strong>{compatInfo.browserName}</strong>
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              {compatInfo.isChromeBased ? (
                <p>✅ Chrome/Edge detected - Should work with proper headers</p>
              ) : (
                <>
                  <p>⚠️ WebContainer works best in Chrome-based browsers</p>
                  <p>• Try Chrome, Edge, or Chromium</p>
                  <p>• Firefox and Safari have limited support</p>
                </>
              )}
            </div>
          </div>

          {/* Fallback options */}
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Alternative Options:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• Code will still be generated and displayed</p>
              <p>• Use "Download Project" to run locally</p>
              <p>• Copy code to your preferred development environment</p>
              <p>• Try the direct download feature for complete projects</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            )}
            
            {onToggleDiagnostics && (
              <button
                onClick={onToggleDiagnostics}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <span>{showDiagnostics ? 'Hide' : 'Show'} Diagnostics</span>
              </button>
            )}
          </div>

          {/* Diagnostics info */}
          {showDiagnostics && (
            <div className="mt-4 bg-gray-800 text-green-400 rounded-lg p-3 text-xs font-mono">
              <div className="mb-2 text-white font-bold">🔧 Browser Diagnostics</div>
              <div>User Agent: {navigator.userAgent}</div>
              <div>Secure Context: {compatInfo.hasSecureContext ? '✅' : '❌'}</div>
              <div>SharedArrayBuffer: {compatInfo.hasSharedArrayBuffer ? '✅' : '❌'}</div>
              <div>Cross-Origin Isolated: {compatInfo.hasCrossOriginIsolation ? '✅' : '❌'}</div>
              <div>Protocol: {window.location.protocol}</div>
              <div>Host: {window.location.host}</div>
              <div className="mt-2 text-yellow-400">
                Detected Issues: {compatInfo.errorMessages.join(', ') || 'None'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebContainerFallback;
