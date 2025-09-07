# 🔥 Firebase Setup ## Step 3: Set up GitHub OAuth (for GitHub login)

### For Development:
1. **Go to [GitHub Developer Settings](https://github.com/settings/developers)**
2. **Click "New OAuth App"**
3. **Fill in:**
   - Application name: `DevSensei Development`
   - Homepage URL: `http://localhost:5173` (Vite default port)
   - Authorization callback URL: `https://your-project-id.firebaseapp.com/__/auth/handler`
4. **Copy Client ID and Client Secret**
5. **In Firebase Console → Authentication → Sign-in method → GitHub:**
   - Paste Client ID and Client Secret
   - Copy the redirect URL and update your GitHub OAuth app

### For Production Deployment:
When you deploy, you'll need to create a SEPARATE GitHub OAuth app:

1. **Create another OAuth App** with:
   - Application name: `DevSensei Production`
   - Homepage URL: `https://yourdomain.com` (your actual domain)
   - Authorization callback URL: `https://your-project-id.firebaseapp.com/__/auth/handler` (same as dev)
2. **Update Firebase with production credentials**
3. **Use environment variables** to switch between dev/prod configsvSensei

## Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name:** `devsensei-app` (or your preferred name)
4. **Disable Google Analytics** (not needed for this project)
5. **Click "Create project"**

## Step 2: Enable Authentication

1. **In Firebase Console, go to "Authentication"**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable these providers:**
   - ✅ **Google** - Click "Enable" → Add your email as test user
   - ✅ **GitHub** - Click "Enable" → You'll need GitHub OAuth App (see below)
   - ✅ **Email/Password** - Click "Enable" (for fallback)

## Step 3: Set up GitHub OAuth (for GitHub login)

1. **Go to [GitHub Developer Settings](https://github.com/settings/developers)**
2. **Click "New OAuth App"**
3. **Fill in:**
   - Application name: `DevSensei`
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `https://your-project-id.firebaseapp.com/__/auth/handler`
4. **Copy Client ID and Client Secret**
5. **In Firebase Console → Authentication → Sign-in method → GitHub:**
   - Paste Client ID and Client Secret
   - Copy the redirect URL and update your GitHub OAuth app

## Step 4: Configure Web App

1. **In Firebase Console, go to Project Settings (gear icon)**
2. **Scroll down to "Your apps"**
3. **Click the web icon `</>`**
4. **Register app:**
   - App nickname: `devsensei-web`
   - ✅ Check "Also set up Firebase Hosting"
   - Click "Register app"
5. **Copy the config object** (you'll need this for frontend)

## Step 5: Generate Service Account

1. **In Firebase Console → Project Settings → Service accounts**
2. **Click "Generate new private key"**
3. **Download the JSON file**
4. **Save it as `firebase-service-account.json` in your backend folder**
5. **Update your `.env` file with the path**

## Step 6: Update Your .env File

Copy the values from Firebase Console:

```bash
# From Project Settings > General
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Path to your downloaded service account file
FIREBASE_SERVICE_ACCOUNT_PATH=C:/Users/yourusername/DevSensei/backend/firebase-service-account.json
```

## Step 7: Frontend Firebase Config

Add this to your frontend (you'll get this from step 4):

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};

export default firebaseConfig;
```

## Step 8: Test Authentication

1. **Start your backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

2. **Test with demo token** (if Firebase not configured):
```bash
curl -X POST http://localhost:8000/api/auth/dev/demo-token
```

3. **Test Firebase verification:**
```bash
curl -X POST http://localhost:8000/api/auth/firebase/verify \
  -H "Content-Type: application/json" \
  -d '{"id_token": "your_firebase_id_token"}'
```

## 🚨 Security Notes

- **Keep `firebase-service-account.json` secret**
- **Add it to `.gitignore`**
- **Use environment variables in production**
- **Enable Firebase security rules**

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Google authentication enabled
- [ ] GitHub OAuth app created and configured
- [ ] Service account key downloaded
- [ ] `.env` file updated with Firebase config
- [ ] Backend starts without Firebase errors
- [ ] Authentication endpoints respond correctly

## 🚀 Production Deployment Changes

### What You Need to Change for Deployment:

1. **Create Production GitHub OAuth App:**
   ```
   Application name: DevSensei Production
   Homepage URL: https://your-actual-domain.com
   Authorization callback URL: https://your-project-id.firebaseapp.com/__/auth/handler
   ```

2. **Update Environment Variables:**
   ```bash
   # Development
   CORS_ORIGINS=http://localhost:5173
   ENVIRONMENT=development
   
   # Production
   CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
   ENVIRONMENT=production
   ```

3. **Firebase Console Updates:**
   - Go to Authentication → Sign-in method → GitHub
   - Update with production Client ID and Secret
   - Add your production domain to authorized domains

4. **Frontend Config:**
   - Update Firebase config with production settings
   - Ensure your domain is added to Firebase authorized domains

### 📝 Deployment Checklist:
- [ ] Production GitHub OAuth app created
- [ ] Firebase updated with production credentials  
- [ ] CORS origins updated for production domain
- [ ] Environment variables configured for production
- [ ] Firebase authorized domains updated

Your Firebase authentication is now ready! 🎉
