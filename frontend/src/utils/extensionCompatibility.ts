// Chrome Extension Compatibility Helper
// This file helps prevent Chrome extension conflicts and warnings

export class ExtensionCompatibilityHelper {
  private static instance: ExtensionCompatibilityHelper;
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;

  private constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.setupErrorFiltering();
  }

  public static getInstance(): ExtensionCompatibilityHelper {
    if (!ExtensionCompatibilityHelper.instance) {
      ExtensionCompatibilityHelper.instance = new ExtensionCompatibilityHelper();
    }
    return ExtensionCompatibilityHelper.instance;
  }

  private setupErrorFiltering(): void {
    // Filter out known Chrome extension errors that don't affect our app
    console.error = (message: any, ...args: any[]) => {
      const messageStr = String(message);
      
      // Filter out extension-related errors
      if (this.isExtensionError(messageStr)) {
        return; // Suppress the error
      }

      // Filter out preload warnings from StackBlitz/WebContainer
      if (this.isPreloadWarning(messageStr)) {
        return; // Suppress the warning
      }

      // Call original console.error for legitimate errors
      this.originalConsoleError(message, ...args);
    };

    console.warn = (message: any, ...args: any[]) => {
      const messageStr = String(message);
      
      // Filter out resource preload warnings
      if (this.isPreloadWarning(messageStr)) {
        return; // Suppress the warning
      }

      // Call original console.warn for legitimate warnings
      this.originalConsoleWarn(message, ...args);
    };
  }

  private isExtensionError(message: string): boolean {
    const extensionErrorPatterns = [
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'ms-browser-extension://',
      'Script \'content',
      'content script',
      'background script',
      'Unable to establish connection on receiving end',
    ];

    return extensionErrorPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isPreloadWarning(message: string): boolean {
    const preloadWarningPatterns = [
      'resource was preloaded using link preload but not used',
      'preloaded but not used',
      'fetch.worker',
      'staticblitz.com',
      'w-corp-staticblitz.com',
      'webcontainer',
      'The resource was preloaded',
      'link preload',
      '.worker.js',
      'worker.96435430.js',
      'was preloaded using link preload but not used within a few seconds',
      'Please make sure it has an appropriate `as` value',
      'preloaded intentionally'
    ];

    return preloadWarningPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  public restoreOriginalConsole(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  public suppressExtensionErrors(): void {
    // Additional method to explicitly suppress extension errors
    window.addEventListener('error', (event) => {
      if (this.isExtensionError(event.message)) {
        event.preventDefault();
        return false;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && this.isExtensionError(String(event.reason))) {
        event.preventDefault();
        return false;
      }
    });
  }

  public logCleanStartup(): void {
    console.log('🧹 Extension compatibility helper initialized');
    console.log('🔇 Filtered out extension errors and preload warnings');
    console.log('✨ Console is now clean for development');
  }
}

// Auto-initialize the helper
const extensionHelper = ExtensionCompatibilityHelper.getInstance();
extensionHelper.suppressExtensionErrors();
extensionHelper.logCleanStartup();

export default extensionHelper;
