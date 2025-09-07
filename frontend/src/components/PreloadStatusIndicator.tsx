import React, { useEffect, useState } from 'react';
import webContainerPreloadManager from '../utils/webContainerPreloadManager';

export const PreloadStatusIndicator: React.FC = () => {
  const [suppressedCount, setSuppressedCount] = useState(0);
  const [suppressedWarnings, setSuppressedWarnings] = useState<string[]>([]);

  useEffect(() => {
    const updateStatus = () => {
      setSuppressedCount(webContainerPreloadManager.getSupressedWarningCount());
      setSuppressedWarnings(webContainerPreloadManager.getSuppressedWarnings());
    };

    // Update immediately
    updateStatus();

    // Update periodically
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-900/80 backdrop-blur-sm text-green-200 text-xs p-3 rounded-lg border border-green-700 max-w-sm">
      <div className="font-semibold mb-1">🛡️ Preload Protection</div>
      <div>Suppressed warnings: {suppressedCount}</div>
      {suppressedCount > 0 && (
        <div className="mt-2 text-green-300">
          <div className="font-medium">Recent suppressions:</div>
          {suppressedWarnings.slice(-2).map((warning, index) => (
            <div key={index} className="truncate text-green-400 opacity-75">
              • {warning.slice(0, 50)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreloadStatusIndicator;
