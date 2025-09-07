# DevSensei - AI-Powered Development Assistant

A comprehensive development platform that combines AI-powered code generation, multi-language code execution, repository analysis, and advanced developer tools.

## 🚀 Quick Start

### Windows Users
```bash
# Simply double-click or run:
start_devsensei.bat
```

### Linux/Mac Users
```bash
# Make the script executable (first time only)
chmod +x start_devsensei.sh

# Run the startup script
./start_devsensei.sh
```

The startup scripts will:
1. Check for required dependencies (Python 3.9+, Node.js)
2. Install/update all packages
3. Start both backend and frontend servers
4. Open the application in your browser

## 📋 Prerequisites

- **Python 3.9+** - [Download](https://www.python.org/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

## 🛠️ Manual Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/DevSensei.git
cd DevSensei
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
# Copy .env file and update with your API keys
# Required: GEMINI_API_KEY and GITHUB_TOKEN
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# The .env file will be automatically created
# It uses the backend at http://localhost:8000
```

### 4. Start the Services

#### Backend Server
```bash
cd backend
# Activate virtual environment first
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Server
```bash
cd frontend
npm run dev
```

## 🔧 Configuration

### Backend Configuration (backend/.env)

```env
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here

# Firebase (Optional - for authentication)
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain

# Server Configuration
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Frontend Configuration (frontend/.env)

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Firebase Configuration (must match backend)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🧪 Testing the Connection

Run the connection test script to verify everything is working:

```bash
python test_connection.py
```

This will check:
- Backend server health
- Frontend server status
- API endpoints availability
- CORS configuration
- Authentication setup

## 📚 API Documentation

Once the backend is running, visit:
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🌟 Features

### Backend Services
- **AI Code Generation**: Multi-language code generation using Gemini AI
- **Code Execution**: Sandboxed execution for 12+ programming languages
- **Repository Analysis**: GitHub integration for code analysis
- **Authentication**: Firebase-based authentication with role management
- **Rate Limiting**: Intelligent rate limiting for API protection
- **Performance Monitoring**: Real-time system metrics and health checks

### Frontend Features
- **Modern UI**: React + TypeScript with Tailwind CSS
- **Code Playground**: Interactive code editor with syntax highlighting
- **Repository Explorer**: Browse and analyze GitHub repositories
- **Authentication**: Google and GitHub OAuth integration
- **Real-time Updates**: Live code execution and results

## 🔐 Security

- JWT-based authentication
- Firebase integration for secure user management
- Rate limiting to prevent abuse
- Input validation and sanitization
- Sandboxed code execution environment

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check for port conflicts
netstat -an | findstr :8000
```

### Frontend Won't Start
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
netstat -an | findstr :5173
```

### Connection Issues
1. Ensure both servers are running
2. Check firewall settings
3. Verify CORS configuration in backend
4. Run `python test_connection.py` for diagnostics

### Firebase Authentication Issues
1. Verify Firebase project configuration
2. Check service account file path
3. Ensure Firebase API keys match between frontend and backend
4. For development, use demo tokens if Firebase is not configured

## 📖 API Endpoints

### Authentication
- `POST /api/auth/firebase/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/roles` - Get user roles and permissions

### AI Services
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/generate-code` - Generate code from prompt
- `POST /api/ai/explain-code` - Explain code snippet
- `POST /api/ai/analyze-code` - Analyze code with NLP

### Code Execution
- `POST /api/code/execute` - Execute code in sandbox
- `POST /api/code/debug` - Debug code with AI assistance
- `POST /api/code/optimize` - Optimize code performance
- `GET /api/code/supported-languages` - Get supported languages

### GitHub Integration
- `POST /api/github/repo/info` - Get repository information
- `POST /api/github/repo/files` - Get repository files
- `POST /api/github/repo/search-code` - Search code in repository
- `GET /api/github/search` - Search GitHub repositories

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for code generation
- GitHub API for repository integration
- Firebase for authentication services
- FastAPI for backend framework
- React + Vite for frontend framework

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@devsensei.dev
- Documentation: http://localhost:8000/docs

---

**Made with ❤️ by the DevSensei Team**