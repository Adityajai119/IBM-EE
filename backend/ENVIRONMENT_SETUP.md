# DevSensei Environment Setup Guide

## 🔧 Complete Environment Configuration

This guide will help you set up all the required environment variables for DevSensei backend.

---

## 📋 **Required Configuration (Must Fill)**

### 1. **🤖 Gemini API Key** (Required)
```bash
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key
4. Replace `your_gemini_api_key_here` with your actual key

### 2. **🐙 GitHub Token** (Required for GitHub features)
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo`, `read:user`, `user:email`
4. Copy the generated token

### 3. **🔥 Firebase Configuration** (Required for Authentication)

#### Option A: Service Account File (Recommended for Development)
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=C:/path/to/your/firebase-service-account.json
```

#### Option B: JSON String (Recommended for Production/Deployment)
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40your-project.iam.gserviceaccount.com"}
```

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file OR copy the JSON content

#### Firebase Project Settings
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**How to get these values:**
1. In Firebase Console, go to Project Settings > General
2. Copy the values from "Your apps" section

---

## ⚙️ **Optional Configuration (Can Use Defaults)**

### 4. **🔒 Security Configuration**
```bash
# Generate a strong secret key (keep this secret!)
SECRET_KEY=your-super-secret-256-bit-key-here-change-in-production-make-it-long-and-random
ALGORITHM=HS256
```

**How to generate SECRET_KEY:**
```python
import secrets
print(secrets.token_urlsafe(64))
```

### 5. **🌐 API Configuration**
```bash
API_BASE_URL=http://localhost:8000
ENVIRONMENT=development
```

For production:
```bash
API_BASE_URL=https://api.yourapp.com
ENVIRONMENT=production
```

### 6. **🔗 CORS Configuration**
```bash
# Development (allow multiple ports)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Production (specific domain only)
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

### 7. **🗄️ Database Configuration**
```bash
# SQLite (default for development)
DATABASE_URL=sqlite:///./devsensei.db

# PostgreSQL (recommended for production)
DATABASE_URL=postgresql://username:password@localhost:5432/devsensei

# Vector database path
VECTOR_DB_PATH=./vector_db
```

### 8. **🚀 Redis Configuration** (Optional but recommended)
```bash
# Local Redis
REDIS_URL=redis://localhost:6379/0

# Redis with password
REDIS_URL=redis://:password@localhost:6379/0

# Redis Cloud
REDIS_URL=redis://username:password@redis-host:port/0
```

### 9. **📁 File Upload Configuration**
```bash
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=uploads
```

### 10. **🔍 RAG Configuration**
```bash
CHUNK_SIZE=1000         # Text chunk size for vector processing
CHUNK_OVERLAP=200       # Overlap between chunks
```

### 11. **⚡ Performance Configuration**
```bash
MAX_EXECUTION_TIME=30           # Code execution timeout (seconds)
MAX_MEMORY=268435456           # 256MB memory limit
MAX_OUTPUT_SIZE=1048576        # 1MB output limit
```

### 12. **🛡️ Rate Limiting Configuration**
```bash
DEFAULT_REQUESTS_PER_MINUTE=60
DEFAULT_REQUESTS_PER_HOUR=1000
DEFAULT_CODE_EXECUTIONS_PER_MINUTE=10
DEFAULT_AI_REQUESTS_PER_MINUTE=20
```

### 13. **📊 Monitoring Configuration**
```bash
PERFORMANCE_MONITORING=true
SYSTEM_MONITORING_INTERVAL=60    # seconds
CACHE_CLEANUP_INTERVAL=300       # seconds
```

### 14. **📝 Logging Configuration**
```bash
LOG_LEVEL=INFO                   # DEBUG, INFO, WARNING, ERROR
LOG_FILE=logs/app.log
```

### 15. **📧 Email Configuration** (Optional)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # Use App Password for Gmail
```

### 16. **🚀 Production Settings**
```bash
WORKERS=4                        # Number of worker processes
RELOAD=false                     # Auto-reload on code changes
HOST=0.0.0.0                    # Bind to all interfaces
PORT=8000
```

### 17. **🗂️ ChromaDB Configuration**
```bash
CHROMA_TELEMETRY_ENABLED=FALSE
CHROMA_ANONYMIZED_TELEMETRY=FALSE
```

---

## 📝 **Example Complete .env File**

Create a `.env` file in your backend directory with these values:

```bash
# DevSensei Backend Environment Configuration

# API Keys (Required)
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase Authentication Configuration (Required)
FIREBASE_SERVICE_ACCOUNT_PATH=C:/Users/yourname/DevSensei/firebase-service-account.json
FIREBASE_PROJECT_ID=devsensei-12345
FIREBASE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=devsensei-12345.firebaseapp.com
FIREBASE_STORAGE_BUCKET=devsensei-12345.appspot.com

# Security Configuration
SECRET_KEY=your-generated-256-bit-secret-key-here
ALGORITHM=HS256

# API Configuration
API_BASE_URL=http://localhost:8000
ENVIRONMENT=development

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database Configuration
DATABASE_URL=sqlite:///./devsensei.db
VECTOR_DB_PATH=./vector_db

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379/0

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Performance Configuration
MAX_EXECUTION_TIME=30
MAX_MEMORY=268435456
MAX_OUTPUT_SIZE=1048576

# Rate Limiting
DEFAULT_REQUESTS_PER_MINUTE=60
DEFAULT_CODE_EXECUTIONS_PER_MINUTE=10

# Monitoring
PERFORMANCE_MONITORING=true
SYSTEM_MONITORING_INTERVAL=60

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Production Settings
WORKERS=4
RELOAD=false
HOST=0.0.0.0
PORT=8000

# ChromaDB
CHROMA_TELEMETRY_ENABLED=FALSE
CHROMA_ANONYMIZED_TELEMETRY=FALSE
```

---

## 🚨 **Security Best Practices**

1. **Never commit `.env` to version control**
2. **Use different keys for development/production**
3. **Regularly rotate API keys**
4. **Use environment-specific configurations**
5. **Keep Firebase service account files secure**

---

## 🔧 **Quick Setup Commands**

1. **Copy example file:**
```bash
cp .env.example .env
```

2. **Edit the file:**
```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

3. **Generate secret key (Python):**
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

4. **Test configuration:**
```bash
python -c "from app.config import config; print('Config loaded successfully!')"
```

---

## ✅ **Verification Checklist**

- [ ] Gemini API key obtained and set
- [ ] GitHub token generated and configured
- [ ] Firebase project created and credentials downloaded
- [ ] Secret key generated and set
- [ ] CORS origins match your frontend URLs
- [ ] All required directories exist (uploads, logs, vector_db)
- [ ] Configuration loads without errors

Your DevSensei backend is now ready to run! 🚀
