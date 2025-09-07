import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import authService from '../services/authService';
import type { AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  handleRedirectResult: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      console.log('AuthContext: Initializing with AuthInitializer...');
      
      try {
        // Wait for AuthService (which uses AuthInitializer) to initialize
        await authService.waitForInitialization();
        
        if (!isMounted) return;

        // Check for redirect result first
        try {
          const redirectUser = await authService.handleRedirectResult();
          if (redirectUser && isMounted) {
            console.log('AuthContext: Redirect result processed:', redirectUser.email);
            setUser(redirectUser);
            setError(null);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }
        } catch (redirectError) {
          console.error('AuthContext: Redirect result error:', redirectError);
          if (isMounted) {
            setError(redirectError instanceof Error ? redirectError.message : 'Authentication failed');
          }
        }

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!isMounted) return;
          
          console.log('AuthContext: Auth state changed:', firebaseUser?.email || 'null');
          
          try {
            if (firebaseUser) {
              // User is signed in, map to our AuthUser type
              const authUser: AuthUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified
              };
              
              setUser(authUser);
              setError(null);
            } else {
              // User is signed out
              setUser(null);
            }
          } catch (error) {
            console.error('AuthContext: Error processing auth state:', error);
            if (isMounted) {
              setError(error instanceof Error ? error.message : 'Authentication error');
              setUser(null);
            }
          } finally {
            if (isMounted && !isInitialized) {
              setIsLoading(false);
              setIsInitialized(true);
              console.log('AuthContext: Initialization complete');
            }
          }
        });

        // Reduced timeout since AuthInitializer handles the heavy lifting
        initTimeout = setTimeout(() => {
          if (!isInitialized && isMounted) {
            console.warn('AuthContext: Initialization timeout reached (using AuthInitializer)');
            setIsLoading(false);
            setIsInitialized(true);
          }
        }, 12000); // 12 seconds timeout (AuthInitializer has 10s + buffer)

        // Store unsubscribe function
        return unsubscribe;
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  // Update loading state when initialization is complete
  useEffect(() => {
    if (isInitialized && isLoading) {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  const handleAuthAction = async (action: () => Promise<AuthUser | null>, actionName: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log(`AuthContext: Starting ${actionName}...`);
      const result = await action();
      
      if (result) {
        console.log(`AuthContext: ${actionName} successful:`, result.email);
        setUser(result);
      } else {
        console.log(`AuthContext: ${actionName} returned null (likely redirect)`);
        // Don't set loading to false here - redirect will reload the page
      }
    } catch (error) {
      console.error(`AuthContext: ${actionName} error:`, error);
      const errorMessage = error instanceof Error ? error.message : `${actionName} failed`;
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await handleAuthAction(
      () => authService.signInWithGoogle(),
      'Google sign-in'
    );
  };

  const signInWithGitHub = async () => {
    await handleAuthAction(
      () => authService.signInWithGitHub(),
      'GitHub sign-in'
    );
  };

  const signInWithEmail = async (email: string, password: string) => {
    await handleAuthAction(
      () => authService.signInWithEmail(email, password),
      'Email sign-in'
    );
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await handleAuthAction(
      () => authService.signUpWithEmail(email, password),
      'Email sign-up'
    );
  };

  const signOut = async () => {
    setError(null);
    try {
      console.log('AuthContext: Signing out...');
      await authService.signOut();
      setUser(null);
      console.log('AuthContext: Sign out successful');
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleRedirectResult = async () => {
    setError(null);
    try {
      console.log('AuthContext: Handling redirect result...');
      const result = await authService.handleRedirectResult();
      if (result) {
        console.log('AuthContext: Redirect result processed:', result.email);
        setUser(result);
      }
    } catch (error) {
      console.error('AuthContext: Redirect result error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Redirect authentication failed';
      setError(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signInWithGoogle,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearError,
    handleRedirectResult
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;