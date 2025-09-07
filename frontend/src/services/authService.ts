import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  roles?: string[];
};

export type AuthResponse = {
  success: boolean;
  user: any;
  message: string;
  status?: number;
  errorType?: 'network' | 'timeout' | 'unauthorized' | 'rate_limited' | 'server' | 'unknown';
};

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      // Listen for auth state changes
      onAuthStateChanged(auth, async (user) => {
        console.log('AuthService: Auth state changed', user?.email || 'null');
        
        this.currentUser = user;
        if (user) {
          try {
            // Get the Firebase ID token and store it
            const token = await user.getIdToken();
            this.authToken = token;
            this.setupAxiosInterceptor();
            
            console.log('AuthService: Token obtained and stored');
          } catch (error) {
            console.error('AuthService: Failed to get ID token:', error);
            this.authToken = null;
          }
        } else {
          this.authToken = null;
          this.clearStoredToken();
        }

        if (!this.isInitialized) {
          this.isInitialized = true;
          console.log('AuthService: Initialized');
          resolve();
        }
      });
    });

    return this.initPromise;
  }

  // Wait for auth service to be initialized
  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }
    return this.initPromise || Promise.resolve();
  }

  private clearStoredToken() {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.warn('AuthService: Failed to clear localStorage:', error);
    }
  }

  private setupAxiosInterceptor() {
    // Clear existing interceptors to avoid duplicates
    axios.interceptors.request.clear();
    axios.interceptors.response.clear();

    // Add request interceptor to include auth token
    axios.interceptors.request.use(
      (config) => {
        const token = this.authToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.currentUser) {
          try {
            console.log('AuthService: Token expired, refreshing...');
            const newToken = await this.currentUser.getIdToken(true);
            this.authToken = newToken;
            
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios.request(error.config);
          } catch (refreshError) {
            console.error('AuthService: Token refresh failed:', refreshError);
            // Refresh failed, sign out user
            this.signOut();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Google Sign In with improved error handling
  async signInWithGoogle(): Promise<AuthUser | null> {
    try {
      console.log('AuthService: Starting Google sign-in...');
      
      // Ensure auth service is initialized
      await this.waitForInitialization();
      
      // Try popup with better timeout handling
      try {
        console.log('AuthService: Attempting popup...');
        
        const result = await this.signInWithTimeout(
          signInWithPopup(auth, googleProvider),
          15000 // 15 second timeout
        );
        
        return await this.handleAuthResult(result);
      } catch (popupError: any) {
        console.log('AuthService: Popup failed, trying redirect:', popupError.code);
        
        // Handle specific popup failures
        if (this.shouldFallbackToRedirect(popupError)) {
          console.log('AuthService: Falling back to redirect...');
          await signInWithRedirect(auth, googleProvider);
          return null; // Page will reload
        }
        
        throw popupError;
      }
    } catch (error: any) {
      console.error('AuthService: Google sign-in error:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  // GitHub Sign In with improved error handling
  async signInWithGitHub(): Promise<AuthUser | null> {
    try {
      console.log('AuthService: Starting GitHub sign-in...');
      
      // Ensure auth service is initialized
      await this.waitForInitialization();
      
      // Try popup with better timeout handling
      try {
        console.log('AuthService: Attempting popup...');
        
        const result = await this.signInWithTimeout(
          signInWithPopup(auth, githubProvider),
          15000 // 15 second timeout
        );
        
        return await this.handleAuthResult(result);
      } catch (popupError: any) {
        console.log('AuthService: Popup failed, trying redirect:', popupError.code);
        
        // Handle specific popup failures
        if (this.shouldFallbackToRedirect(popupError)) {
          console.log('AuthService: Falling back to redirect...');
          await signInWithRedirect(auth, githubProvider);
          return null; // Page will reload
        }
        
        throw popupError;
      }
    } catch (error: any) {
      console.error('AuthService: GitHub sign-in error:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  // Helper method for popup with timeout
  private async signInWithTimeout(
    popupPromise: Promise<UserCredential>,
    timeoutMs: number
  ): Promise<UserCredential> {
    return Promise.race([
      popupPromise,
      new Promise<UserCredential>((_, reject) =>
        setTimeout(() => reject(new Error('POPUP_TIMEOUT')), timeoutMs)
      )
    ]);
  }

  // Check if error should fallback to redirect
  private shouldFallbackToRedirect(error: any): boolean {
    const fallbackCodes = [
      'auth/popup-closed-by-user',
      'auth/popup-blocked',
      'auth/cancelled-popup-request',
      'auth/network-request-failed'
    ];
    
    return fallbackCodes.includes(error.code) || 
           error.message?.includes('POPUP_TIMEOUT');
  }

  // Handle auth result consistently
  private async handleAuthResult(result: UserCredential): Promise<AuthUser> {
    const user = result.user;
    console.log('AuthService: Sign-in successful, verifying with backend...');
    
    // Get Firebase ID token with retry
    const idToken = await this.getIdTokenWithRetry(user);
    
    // Verify with backend
    const authResponse = await this.verifyWithBackend(idToken);
    
    if (!authResponse.success) {
      throw new Error(authResponse.message);
    }
    
    console.log('AuthService: Backend verification successful');
    return this.mapFirebaseUser(user);
  }

  // Get ID token with retry logic
  private async getIdTokenWithRetry(user: User, maxAttempts: number = 3): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          const delay = attempt * 1000; // 1s, 2s, 3s
          console.log(`AuthService: Waiting ${delay}ms before token retry ${attempt}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`AuthService: Getting ID token (attempt ${attempt}/${maxAttempts})`);
        const token = await user.getIdToken(attempt > 1); // Force refresh on retry
        return token;
      } catch (error) {
        lastError = error;
        console.error(`AuthService: Token attempt ${attempt} failed:`, error);
      }
    }
    
    throw lastError;
  }

  // Handle redirect result with better error handling
  async handleRedirectResult(): Promise<AuthUser | null> {
    try {
      console.log('AuthService: Checking redirect result...');
      
      // Ensure auth service is initialized
      await this.waitForInitialization();
      
      const result = await getRedirectResult(auth);
      
      if (!result) {
        console.log('AuthService: No redirect result found');
        return null;
      }
      
      console.log('AuthService: Redirect result found:', result.user?.email);
      return await this.handleAuthResult(result);
      
    } catch (error: any) {
      console.error('AuthService: Redirect result error:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  // Email/Password Sign In
  async signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
    try {
      await this.waitForInitialization();
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      return await this.handleAuthResult(result);
    } catch (error: any) {
      console.error('AuthService: Email sign-in error:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  // Email/Password Sign Up
  async signUpWithEmail(email: string, password: string): Promise<AuthUser | null> {
    try {
      await this.waitForInitialization();
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return await this.handleAuthResult(result);
    } catch (error: any) {
      console.error('AuthService: Email sign-up error:', error);
      throw this.createUserFriendlyError(error);
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      console.log('AuthService: Signing out...');
      await signOut(auth);
      this.authToken = null;
      this.clearStoredToken();
      console.log('AuthService: Sign out successful');
    } catch (error: any) {
      console.error('AuthService: Sign out error:', error);
      throw error;
    }
  }

  // Verify Firebase token with backend (unchanged but with better logging)
  async verifyWithBackend(idToken: string): Promise<AuthResponse> {
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        if (attempt > 0) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          console.log(`AuthService: Backend verify retry ${attempt + 1}/${maxAttempts} after ${backoff}ms`);
          await new Promise(res => setTimeout(res, backoff));
        }
        attempt++;
        
        console.log(`AuthService: Backend verification attempt ${attempt}/${maxAttempts}`);
        const response = await axios.post(`${API_BASE_URL}/api/auth/firebase/verify`, 
          { id_token: idToken },
          { timeout: 10000 }
        );
        
        console.log('AuthService: Backend verification successful');
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        if (!axios.isAxiosError(error)) {
          console.error(`AuthService: Non-Axios error on verify attempt ${attempt}:`, error);
          break;
        }

        const status = error.response?.status;
        
        console.error(`AuthService: Verify attempt ${attempt}/${maxAttempts} failed`, {
          status,
          code: error.code,
          message: error.message
        });

        // Break early for non-retryable errors
        if (status === 401 || status === 403 || status === 400 || status === 429) {
          console.log('AuthService: Non-retryable error, breaking:', status);
          break;
        }
      }
    }

    // Classify error type
    let errorType: AuthResponse['errorType'] = 'unknown';
    let status: number | undefined = undefined;
    
    if (axios.isAxiosError(lastError)) {
      status = lastError.response?.status;
      if (!lastError.response) errorType = 'network';
      else if (lastError.code === 'ECONNABORTED') errorType = 'timeout';
      else if (status === 401) errorType = 'unauthorized';
      else if (status === 429) errorType = 'rate_limited';
      else if (status && status >= 500) errorType = 'server';
    }

    return {
      success: false,
      user: null,
      message: 'Failed to verify with backend',
      status,
      errorType
    };
  }

  // Create user-friendly error messages
  private createUserFriendlyError(error: any): Error {
    const code = error.code;
    
    if (code === 'auth/popup-closed-by-user') {
      return new Error('Sign-in was cancelled. Please try again.');
    } else if (code === 'auth/popup-blocked') {
      return new Error('Popup was blocked by your browser. Please allow popups and try again.');
    } else if (code === 'auth/network-request-failed') {
      return new Error('Network error. Please check your internet connection.');
    } else if (code === 'auth/too-many-requests') {
      return new Error('Too many failed attempts. Please wait before trying again.');
    } else if (code === 'auth/user-not-found') {
      return new Error('No account found with this email address.');
    } else if (code === 'auth/wrong-password') {
      return new Error('Incorrect password.');
    } else if (code === 'auth/email-already-in-use') {
      return new Error('An account already exists with this email address.');
    } else if (code === 'auth/weak-password') {
      return new Error('Password is too weak. Please choose a stronger password.');
    } else if (code === 'auth/invalid-email') {
      return new Error('Invalid email address.');
    } else if (code === 'auth/account-exists-with-different-credential') {
      return new Error('An account already exists with the same email but different sign-in method.');
    }
    
    return error;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Map Firebase user to AuthUser interface
  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }

  // Get user profile from backend
  async getUserProfile(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      return response.data;
    } catch (error) {
      console.error('AuthService: Get user profile error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // Check if auth service is ready
  isReady(): boolean {
    return this.isInitialized;
  }

  // Health check with timeout
  async waitForBackendHealth(maxWaitMs = 4000): Promise<boolean> {
    const start = Date.now();
    const endpoint = `${API_BASE_URL}/api/auth/health`;
    
    while (Date.now() - start < maxWaitMs) {
      try {
        const res = await axios.get(endpoint, { timeout: 1500 });
        if (res.status === 200) {
          console.log('AuthService: Backend health check passed');
          return true;
        }
      } catch (error) {
        console.log('AuthService: Backend health check failed, retrying...');
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.warn('AuthService: Backend health check timed out');
    return false;
  }

  // Google Redirect Sign In
  async signInWithGoogleRedirect(): Promise<void> {
    try {
      console.log('AuthService: Starting Google redirect sign-in...');
      await signInWithRedirect(auth, googleProvider);
      // The page will reload and handle the redirect result
    } catch (error: any) {
      console.error('AuthService: Google redirect sign in error:', error);
      throw error;
    }
  }

  // GitHub Redirect Sign In
  async signInWithGitHubRedirect(): Promise<void> {
    try {
      console.log('AuthService: Starting GitHub redirect sign-in...');
      await signInWithRedirect(auth, githubProvider);
      // The page will reload and handle the redirect result
    } catch (error: any) {
      console.error('AuthService: GitHub redirect sign in error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;