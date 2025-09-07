// Simple Firebase Authentication Test
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAM6gY8Jxq4QMebFUofX2TaU48uw9JQ3Zo",
  authDomain: "devsensei-app.firebaseapp.com",
  projectId: "devsensei-app",
  storageBucket: "devsensei-app.firebasestorage.app",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Test function
export const testGoogleAuth = async () => {
  try {
    console.log('Testing Firebase Google Auth...');
    const result = await signInWithPopup(auth, provider);
    console.log('Success! User:', result.user.email);
    return result.user;
  } catch (error) {
    console.error('Firebase Auth Test Failed:', error);
    throw error;
  }
};

// Add to window for testing
(window as any).testGoogleAuth = testGoogleAuth;

export default { testGoogleAuth };
