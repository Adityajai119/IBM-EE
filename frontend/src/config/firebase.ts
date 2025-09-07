// Firebase configuration for DevSensei Frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAM6gY8Jxq4QMebFUofX2TaU48uw9JQ3Zo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "devsensei-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "devsensei-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "devsensei-app.firebasestorage.app"
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.warn('Firebase configuration missing fields:', missingFields);
    console.warn('Authentication may not work properly. Please check your environment variables.');
  } else {
    console.log('Firebase configuration validated successfully');
  }
};

// Validate configuration
validateFirebaseConfig();

// Initialize Firebase
console.log('Firebase: Initializing app with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
console.log('Firebase: App initialized successfully');

// Initialize Firebase Authentication
export const auth = getAuth(app);
console.log('Firebase: Auth initialized successfully');
console.log('Firebase: Auth object:', auth);

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();


// Configure providers with basic settings
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set custom parameters to improve user experience
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'online'
});

githubProvider.addScope('user:email');
githubProvider.addScope('read:user');


export default app;
