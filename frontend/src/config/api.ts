export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // GitHub endpoints (updated to match backend)
  github: {
    repoInfo: '/api/github/repo/info',
    repoFiles: '/api/github/repo/files',
    repoStructure: '/api/github/repo/structure',
    searchCode: '/api/github/repo/search-code',
    search: '/api/github/search',
    userRepos: '/api/github/user/repos',
    repositoryDetail: '/api/github/repository-detail',
    repoSearch: '/api/repo-search',
  },
  
  // AI endpoints (updated to match backend)
  ai: {
    chat: '/api/ai/chat',
    analyzeCode: '/api/ai/analyze-code',
    generateCode: '/api/ai/generate-code',
    explainCode: '/api/ai/explain-code',
  },
  
  // Code builder endpoints (updated to match backend)
  code: {
    generate: '/api/code/generate',
    debug: '/api/code/debug',
    execute: '/api/code/execute',
    optimize: '/api/code/optimize',
    explain: '/api/code/explain',
    generateFrontend: '/api/code/generate-frontend',
    supportedLanguages: '/api/code/languages',
    analyze: '/api/code/analyze',
  },
  
  // Documentation endpoints
  documentation: {
    generateProjectDocs: '/api/documentation/generate-project-docs',
    generateCodebaseMap: '/api/documentation/generate-codebase-map',
    chatWithRepo: '/api/documentation/chat-with-repo',
    generatePdf: '/api/documentation/generate-pdf',
  },
  
  // Authentication endpoints
  auth: {
    verifyFirebase: '/api/auth/firebase/verify',
    me: '/api/auth/me',
    roles: '/api/auth/roles',
    logout: '/api/auth/logout',
    health: '/api/auth/health',
    demoToken: '/api/auth/dev/demo-token',
  },
  
  // Monitoring endpoints
  monitoring: {
    health: '/api/monitoring/health',
  },
} as const; 