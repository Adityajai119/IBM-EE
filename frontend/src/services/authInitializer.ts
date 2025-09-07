import { auth } from '../config/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

class AuthInitializer {
  private static instance: AuthInitializer;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): AuthInitializer {
    if (!AuthInitializer.instance) {
      AuthInitializer.instance = new AuthInitializer();
    }
    return AuthInitializer.instance;
  }

  async waitForInit(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      console.log('AuthInitializer: Starting Firebase initialization...');
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('AuthInitializer: Firebase auth state ready, user:', user?.email || 'null');
        
        this.currentUser = user;
        this.isInitialized = true;
        
        // Notify all listeners about the initial auth state
        this.authStateListeners.forEach(listener => {
          try {
            listener(user);
          } catch (error) {
            console.error('AuthInitializer: Error in auth state listener:', error);
          }
        });
        
        unsubscribe();
        resolve();
      });

      // Safety timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (!this.isInitialized) {
          console.warn('AuthInitializer: Initialization timeout reached, proceeding anyway');
          this.isInitialized = true;
          unsubscribe();
          resolve();
        }
      }, 10000);

      // Clear timeout if initialization completes normally
      this.initPromise?.then(() => {
        clearTimeout(timeout);
      });
    });

    return this.initPromise;
  }

  // Get current user (available after initialization)
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if initialized
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  // Add auth state listener (called once during initialization)
  addAuthStateListener(listener: (user: User | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // If already initialized, call listener immediately
    if (this.isInitialized) {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('AuthInitializer: Error in immediate auth state listener call:', error);
      }
    }
    
    // Return cleanup function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Reset for testing purposes (optional)
  reset(): void {
    this.isInitialized = false;
    this.initPromise = null;
    this.currentUser = null;
    this.authStateListeners = [];
  }
}

export default AuthInitializer;