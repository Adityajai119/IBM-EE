/**
 * Browser compatibility utilities for WebContainer
 */

export interface BrowserCompatibilityInfo {
  isSupported: boolean;
  isChromeBased: boolean;
  hasSharedArrayBuffer: boolean;
  hasSecureContext: boolean;
  hasCrossOriginIsolation: boolean;
  browserName: string;
  suggestions: string[];
  errorMessages: string[];
}

export class BrowserCompatibilityChecker {
  static checkWebContainerCompatibility(): BrowserCompatibilityInfo {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    
    const browserName = isChrome ? 'Chrome' : 
                       isEdge ? 'Edge' : 
                       isFirefox ? 'Firefox' : 
                       isSafari ? 'Safari' : 'Unknown';
    
    const isChromeBased = isChrome || isEdge;
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const hasSecureContext = window.isSecureContext;
    const hasCrossOriginIsolation = (window as any).crossOriginIsolated || false;
    
    const suggestions: string[] = [];
    const errorMessages: string[] = [];
    
    // Check for basic requirements
    if (!hasSecureContext) {
      errorMessages.push('Secure context required (HTTPS or localhost)');
      suggestions.push('Access the site via HTTPS instead of HTTP');
      suggestions.push('Use localhost for development');
    }
    
    if (!hasSharedArrayBuffer) {
      errorMessages.push('SharedArrayBuffer is not available');
      if (isChromeBased) {
        suggestions.push('Enable "Experimental Web Platform features" in chrome://flags');
        suggestions.push('Start Chrome with --enable-features=SharedArrayBuffer flag');
      } else if (isFirefox) {
        suggestions.push('Enable SharedArrayBuffer in Firefox preferences');
        suggestions.push('Set dom.postMessage.sharedArrayBuffer.withCOOP_COEP to true');
      } else {
        suggestions.push('Use Chrome, Edge, or Firefox for better WebContainer support');
      }
    }
    
    if (!hasCrossOriginIsolation) {
      errorMessages.push('Cross-origin isolation not enabled');
      suggestions.push('Server needs to send proper COOP/COEP headers');
      suggestions.push('Contact site administrator to configure security headers');
    }
    
    if (!isChromeBased && !isFirefox) {
      errorMessages.push('Browser may have limited WebContainer support');
      suggestions.push('Use Chrome, Edge, or Firefox for best experience');
    }
    
    const isSupported = hasSecureContext && hasSharedArrayBuffer && hasCrossOriginIsolation;
    
    return {
      isSupported,
      isChromeBased,
      hasSharedArrayBuffer,
      hasSecureContext,
      hasCrossOriginIsolation,
      browserName,
      suggestions,
      errorMessages
    };
  }
  
  static getWebContainerFallbackMessage(compatInfo: BrowserCompatibilityInfo): string {
    if (!compatInfo.hasSecureContext) {
      return 'WebContainer requires a secure context. Please access this site via HTTPS or localhost.';
    }
    
    if (!compatInfo.hasSharedArrayBuffer) {
      return 'SharedArrayBuffer is not available. WebContainer requires this browser feature for security.';
    }
    
    if (!compatInfo.hasCrossOriginIsolation) {
      return 'Cross-origin isolation is not enabled. The server needs proper COOP/COEP headers.';
    }
    
    if (!compatInfo.isChromeBased) {
      return `WebContainer has limited support in ${compatInfo.browserName}. Consider using Chrome or Edge.`;
    }
    
    return 'WebContainer is not supported in this environment.';
  }
  
  static async testWebContainerAvailability(): Promise<boolean> {
    try {
      // Try to import WebContainer API
      const { WebContainer } = await import('@webcontainer/api');
      
      // Basic compatibility check
      const compatInfo = this.checkWebContainerCompatibility();
      if (!compatInfo.isSupported) {
        return false;
      }
      
      // Try to boot WebContainer with timeout
      const bootPromise = WebContainer.boot();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('WebContainer boot timeout')), 10000)
      );
      
      const webcontainer = await Promise.race([bootPromise, timeoutPromise]);
      
      if (webcontainer) {
        console.log('✅ WebContainer test boot successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('❌ WebContainer test failed:', error);
      return false;
    }
  }
}

export default BrowserCompatibilityChecker;
