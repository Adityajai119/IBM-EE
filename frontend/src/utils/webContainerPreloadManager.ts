/**
 * WebContainer Preload Manager
 * Handles preload warnings and optimizes resource loading for WebContainer
 */

export class WebContainerPreloadManager {
  private static instance: WebContainerPreloadManager;
  private suppressedWarnings: Set<string> = new Set();

  private constructor() {
    this.initializePreloadOptimization();
  }

  public static getInstance(): WebContainerPreloadManager {
    if (!WebContainerPreloadManager.instance) {
      WebContainerPreloadManager.instance = new WebContainerPreloadManager();
    }
    return WebContainerPreloadManager.instance;
  }

  private initializePreloadOptimization(): void {
    // Override console methods to filter WebContainer-specific warnings
    this.setupPreloadWarningFilter();
    
    // Monitor and manage WebContainer resource loading
    this.setupResourceMonitoring();
    
    // Optimize preload attributes for WebContainer resources
    this.optimizeWebContainerPreloads();
  }

  private setupPreloadWarningFilter(): void {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (this.isWebContainerPreloadWarning(message)) {
        this.handleSuppressedWarning(message);
        return; // Suppress the warning
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (this.isWebContainerPreloadWarning(message)) {
        this.handleSuppressedWarning(message);
        return; // Suppress the error
      }
      originalError.apply(console, args);
    };
  }

  private isWebContainerPreloadWarning(message: string): boolean {
    const webContainerPatterns = [
      'w-corp-staticblitz.com',
      'fetch.worker',
      '.worker.js',
      'staticblitz',
      'webcontainer',
      'was preloaded using link preload but not used within a few seconds',
      'Please make sure it has an appropriate `as` value',
      'preloaded intentionally'
    ];

    return webContainerPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private handleSuppressedWarning(message: string): void {
    // Log suppressed warnings for debugging if needed
    if (!this.suppressedWarnings.has(message)) {
      this.suppressedWarnings.add(message);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[WebContainer] Suppressed preload warning:', message);
      }
    }
  }

  private setupResourceMonitoring(): void {
    // Monitor for WebContainer resource loads
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('staticblitz') || entry.name.includes('webcontainer')) {
          // These resources are loaded by WebContainer internally
          // No action needed, just monitoring
        }
      });
    });

    if ('observe' in observer) {
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private optimizeWebContainerPreloads(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.processPreloadLinks());
    } else {
      this.processPreloadLinks();
    }
  }

  private processPreloadLinks(): void {
    // Find and optimize any preload links that might interfere with WebContainer
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    
    preloadLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.includes('staticblitz') || href.includes('webcontainer') || href.includes('worker'))) {
        // Remove problematic preload links for WebContainer resources
        link.remove();
        console.debug('[WebContainer] Removed conflicting preload link:', href);
      }
    });
  }

  public suppressWebContainerWarnings(): void {
    // Method to explicitly enable WebContainer warning suppression
    console.debug('[WebContainer] Warning suppression enabled for WebContainer resources');
  }

  public getSupressedWarningCount(): number {
    return this.suppressedWarnings.size;
  }

  public getSuppressedWarnings(): string[] {
    return Array.from(this.suppressedWarnings);
  }
}

// Auto-initialize when module is imported
const webContainerPreloadManager = WebContainerPreloadManager.getInstance();
webContainerPreloadManager.suppressWebContainerWarnings();

export default webContainerPreloadManager;
