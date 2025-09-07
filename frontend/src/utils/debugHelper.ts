// Development Debug Helper
// Use this to debug and troubleshoot Chrome extension and preload issues

export class DebugHelper {
  private static instance: DebugHelper;
  
  private constructor() {}

  public static getInstance(): DebugHelper {
    if (!DebugHelper.instance) {
      DebugHelper.instance = new DebugHelper();
    }
    return DebugHelper.instance;
  }

  public analyzeEnvironment(): void {
    console.group('🔍 Environment Analysis');
    
    // Browser information
    console.log('Browser:', {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
    });

    // Security context
    console.log('Security Context:', {
      isSecureContext: window.isSecureContext,
      crossOriginIsolated: (window as any).crossOriginIsolated,
      location: window.location.href,
      protocol: window.location.protocol,
    });

    // WebContainer requirements
    console.log('WebContainer Requirements:', {
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webWorker: typeof Worker !== 'undefined',
    });

    // Extension detection
    this.detectExtensions();
    
    console.groupEnd();
  }

  private detectExtensions(): void {
    console.log('Extension Detection:');
    
    // Check for common extension indicators
    const extensionIndicators = [
      'chrome-extension',
      'moz-extension',
      'ms-browser-extension',
      'safari-extension'
    ];

    const scripts = Array.from(document.scripts);
    const links = Array.from(document.links);
    
    const extensionScripts = scripts.filter(script => 
      extensionIndicators.some(indicator => script.src.includes(indicator))
    );

    const extensionLinks = links.filter(link => 
      extensionIndicators.some(indicator => link.href.includes(indicator))
    );

    console.log('  - Extension scripts detected:', extensionScripts.length);
    console.log('  - Extension links detected:', extensionLinks.length);
    
    if (extensionScripts.length > 0 || extensionLinks.length > 0) {
      console.warn('⚠️ Browser extensions detected that may interfere with WebContainer');
    } else {
      console.log('✅ No problematic extensions detected');
    }
  }

  public monitorErrors(): void {
    let errorCount = 0;
    let warningCount = 0;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      errorCount++;
      if (errorCount === 1) {
        console.log('🚨 First error detected, starting monitoring...');
      }
      originalError(...args);
    };

    console.warn = (...args) => {
      warningCount++;
      if (warningCount === 1) {
        console.log('⚠️ First warning detected, starting monitoring...');
      }
      originalWarn(...args);
    };

    // Report every 30 seconds
    setInterval(() => {
      if (errorCount > 0 || warningCount > 0) {
        console.log(`📊 Error/Warning Report - Errors: ${errorCount}, Warnings: ${warningCount}`);
      }
    }, 30000);
  }

  public testWebContainerCompatibility(): Promise<boolean> {
    return new Promise((resolve) => {
      console.group('🧪 WebContainer Compatibility Test');
      
      const tests = [
        {
          name: 'Secure Context',
          test: () => window.isSecureContext,
          required: true
        },
        {
          name: 'Cross-Origin Isolation',
          test: () => (window as any).crossOriginIsolated,
          required: true
        },
        {
          name: 'SharedArrayBuffer',
          test: () => typeof SharedArrayBuffer !== 'undefined',
          required: true
        },
        {
          name: 'WebAssembly',
          test: () => typeof WebAssembly !== 'undefined',
          required: true
        },
        {
          name: 'Service Worker',
          test: () => 'serviceWorker' in navigator,
          required: false
        },
        {
          name: 'Web Worker',
          test: () => typeof Worker !== 'undefined',
          required: false
        }
      ];

      let allRequiredPassed = true;

      tests.forEach(({ name, test, required }) => {
        const passed = test();
        const icon = passed ? '✅' : '❌';
        const status = required ? (passed ? 'PASS' : 'FAIL') : (passed ? 'SUPPORTED' : 'NOT SUPPORTED');
        
        console.log(`${icon} ${name}: ${status}`);
        
        if (required && !passed) {
          allRequiredPassed = false;
        }
      });

      if (allRequiredPassed) {
        console.log('🎉 WebContainer should work in this environment!');
      } else {
        console.log('💥 WebContainer requirements not met');
      }

      console.groupEnd();
      resolve(allRequiredPassed);
    });
  }
}

// Auto-initialize in development mode
if (import.meta.env.DEV) {
  const debugHelper = DebugHelper.getInstance();
  
  // Run analysis when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        debugHelper.analyzeEnvironment();
        debugHelper.testWebContainerCompatibility();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      debugHelper.analyzeEnvironment();
      debugHelper.testWebContainerCompatibility();
    }, 1000);
  }
  
  // Start error monitoring
  debugHelper.monitorErrors();
}

export default DebugHelper;
