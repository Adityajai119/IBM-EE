import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Play, Loader2, Layout, Save, Download, Share2, 
  FolderOpen, Terminal, Maximize, Check, 
  Star, Sparkles, FileText, Zap, Bug, RefreshCw,
  Globe, Smartphone, Monitor, Palette, Rocket
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { codeApi } from '../services/api';
import MatrixBackground from '../components/MatrixBackground';
import BackButton from '../components/ui/BackButton';
import StarButton from '../components/ui/StarButton';
import WebContainerFallback from '../components/WebContainerFallback';
import { webContainerService } from '../services/webContainer';
import { useWebContainer } from '../hooks/useWebContainer';

interface Framework {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  template: string;
}

interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
}

interface Project {
  id: string;
  name: string;
  framework: string;
  files: ProjectFile[];
  lastModified: Date;
  isRunning: boolean;
}

interface WebContainerInstance {
  mount: (files: any) => Promise<void>;
  spawn: (command: string, args: string[]) => Promise<any>;
  fs: {
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
  };
  on: (event: string, callback: (data: any) => void) => void;
}

const frameworks: Framework[] = [
  { 
    id: 'vanilla', 
    name: 'Vanilla JS', 
    icon: '🟨',
    color: 'from-yellow-400 to-yellow-600',
    description: 'Pure JavaScript with HTML/CSS',
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla JS App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World!</h1>
        <p>Your app starts here...</p>
    </div>
    <script>
        console.log('Hello from Vanilla JS!');
    </script>
</body>
</html>`
  },
  { 
    id: 'react', 
    name: 'React', 
    icon: '⚛️',
    color: 'from-blue-400 to-cyan-600',
    description: 'Modern React with JSX',
    template: `import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>React App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`
  },
  { 
    id: 'vue', 
    name: 'Vue.js', 
    icon: '💚',
    color: 'from-green-400 to-emerald-600',
    description: 'Progressive Vue.js framework',
    template: `<template>
  <div class="app">
    <h1>Vue.js App</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  }
};
</script>

<style>
.app {
  padding: 20px;
  font-family: Arial, sans-serif;
}
</style>`
  },
  { 
    id: 'angular', 
    name: 'Angular', 
    icon: '🔴',
    color: 'from-red-400 to-red-600',
    description: 'Enterprise Angular framework',
    template: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div style="padding: 20px; font-family: Arial;">
      <h1>Angular App</h1>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  \`
})
export class AppComponent {
  count = 0;

  increment() {
    this.count++;
  }
}`
  }
];

const codeTemplates = [
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Interactive todo list with CRUD operations',
    framework: 'vanilla',
    prompt: 'Create a beautiful todo app with add, edit, delete, and mark complete features. Include local storage persistence and smooth animations.'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Scientific calculator with modern UI',
    framework: 'react',
    prompt: 'Build a scientific calculator with a sleek dark theme, button animations, and advanced mathematical operations including trigonometry and logarithms.'
  },
  {
    id: 'weather-dashboard',
    name: 'Weather Dashboard',
    description: 'Real-time weather app with charts',
    framework: 'vue',
    prompt: 'Create a weather dashboard showing current conditions, 5-day forecast, interactive charts, and location search with beautiful animations.'
  },
  {
    id: 'game-snake',
    name: 'Snake Game',
    description: 'Classic snake game with scoring',
    framework: 'vanilla',
    prompt: 'Build the classic Snake game with smooth movement, score tracking, high scores, and retro pixel art styling.'
  },
  {
    id: 'chat-interface',
    name: 'Chat Interface',
    description: 'Modern chat UI with emoji support',
    framework: 'react',
    prompt: 'Design a modern chat interface with message bubbles, emoji picker, typing indicators, and smooth scroll animations.'
  },
  {
    id: 'portfolio',
    name: 'Portfolio Site',
    description: 'Developer portfolio with animations',
    framework: 'vue',
    prompt: 'Create a stunning developer portfolio with hero section, project showcase, skills visualization, and parallax scrolling effects.'
  }
];

export const FrontendPlayground: React.FC = () => {
  // WebContainer hook
  const { isSupported, isInitialized, error: webContainerError, initializeContainer } = useWebContainer();
  
  // Core state
  const [prompt, setPrompt] = useState('');
  const [framework, setFramework] = useState('vanilla');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Premium features state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'running' | 'error'>('idle');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  // WebContainer diagnostics & retry state
  const [showWebContainerDiagnostics, setShowWebContainerDiagnostics] = useState(false);
  const [retryingWebContainer, setRetryingWebContainer] = useState(false);
  
  // Premium UI state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [animationStep, setAnimationStep] = useState(0);
  
  const previewRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate inline preview for frameworks when WebContainer is mocked
  const generateInlinePreview = (project: Project, framework: string): string => {
    if (framework === 'angular') {
      // For Angular, find the component file and create a simple HTML preview
      const componentFile = project.files.find(f => f.name.includes('.ts') || f.name.includes('.component'));
      const templateContent = componentFile?.content || '';
      
      // Extract template content from Angular component
      const templateMatch = templateContent.match(/template:\s*`([^`]*)`/);
      const template = templateMatch ? templateMatch[1] : '<div><h1>Angular Component</h1><p>Component preview</p></div>';
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angular Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: #f5f5f5;
        }
        .angular-preview {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            background: #dd0031;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 8px 4px;
        }
        button:hover { background: #b20029; }
    </style>
</head>
<body>
    <div class="angular-preview">
        <div style="color: #dd0031; font-weight: bold; margin-bottom: 16px;">🔴 Angular Preview</div>
        ${template}
        <script>
            // Simple interactivity for Angular preview
            let count = 0;
            function increment() {
                count++;
                const countElement = document.querySelector('[data-count]');
                if (countElement) {
                    countElement.textContent = count;
                }
            }
            // Auto-wire click events
            document.addEventListener('DOMContentLoaded', function() {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent.toLowerCase().includes('increment')) {
                        btn.onclick = increment;
                    }
                });
            });
        </script>
    </div>
</body>
</html>`;
    } else if (framework === 'react') {
      // For React, find JSX content and create HTML equivalent
      const jsxFile = project.files.find(f => f.name.includes('.jsx') || f.name.includes('.tsx'));
      const jsxContent = jsxFile?.content || '';
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: #282c34;
            color: white;
        }
        .react-preview {
            background: #282c34;
            padding: 20px;
            border-radius: 8px;
        }
        button {
            background: #61dafb;
            color: #282c34;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 8px 4px;
            font-weight: bold;
        }
        button:hover { background: #21b7e8; }
    </style>
</head>
<body>
    <div class="react-preview">
        <div style="color: #61dafb; font-weight: bold; margin-bottom: 16px;">⚛️ React Preview</div>
        <div id="root">
            <h1>React Component Preview</h1>
            <p>Generated from JSX content</p>
            <button onclick="alert('React component interaction!')">Click me</button>
        </div>
    </div>
</body>
</html>`;
    } else if (framework === 'vue') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: #f0f8f0;
        }
        .vue-preview {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #4fc08d;
        }
        button {
            background: #4fc08d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 8px 4px;
        }
        button:hover { background: #42a070; }
    </style>
</head>
<body>
    <div class="vue-preview">
        <div style="color: #4fc08d; font-weight: bold; margin-bottom: 16px;">🟢 Vue Preview</div>
        <h1>Vue Component Preview</h1>
        <p>Generated from Vue template</p>
        <button onclick="alert('Vue component interaction!')">Click me</button>
    </div>
</body>
</html>`;
    } else {
      // Vanilla HTML/CSS/JS
      const htmlFile = project.files.find(f => f.name.includes('.html'));
      if (htmlFile) {
        return htmlFile.content;
      }
    }
    
    return '<div style="padding: 20px; text-align: center;"><h3>No preview available</h3></div>';
  };

  // Initialize WebContainer
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        console.log('🚀 Initializing real WebContainer...');
        
        if (!isSupported) {
          setError('WebContainer is not supported in this browser');
          return;
        }

        await initializeContainer();
        console.log('✅ WebContainer initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebContainer';
        setError(errorMessage);
        setConsoleLogs(prev => [...prev, `❌ WebContainer Error: ${errorMessage}`]);
      }
    };

    initWebContainer();
  }, [isSupported, initializeContainer]);

  // Auto-save functionality
  useEffect(() => {
    if (activeFile && currentProject) {
      const timeoutId = setTimeout(() => {
        saveCurrentFile();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [generatedCode, activeFile]);
  
  // Premium mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Confetti animation trigger
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Manual retry for WebContainer initialization with diagnostics logging
  const handleRetryWebContainer = async () => {
    try {
      setRetryingWebContainer(true);
      setError('');
      setConsoleLogs(prev => [...prev, '🔄 Manual WebContainer retry requested...']);
      await initializeContainer();
      setConsoleLogs(prev => [...prev, '✅ Retry complete']);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown retry failure';
      setConsoleLogs(prev => [...prev, `❌ Retry failed: ${msg}`]);
    } finally {
      setRetryingWebContainer(false);
    }
  };

  // Success toast notification
  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log('Fullscreen not supported or failed:', error);
      // Fallback to visual fullscreen
      setIsFullscreen(!isFullscreen);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            runProject();
            break;
          case 's':
            e.preventDefault();
            saveCurrentFile();
            break;
          case 'n':
            e.preventDefault();
            createNewProject();
            break;
          case 'Enter':
            e.preventDefault();
            if (prompt.trim()) generateFrontendCode();
            break;
        }
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyboard);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [prompt, isFullscreen]);

  // Sync files to WebContainer when project changes or WebContainer becomes ready
  useEffect(() => {
    if (currentProject && isInitialized && currentProject.isRunning) {
      syncProjectToWebContainer();
    }
  }, [currentProject, isInitialized]);

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const createNewProject = () => {
    const selectedFramework = frameworks.find(f => f.id === framework)!;
    const newProject: Project = {
      id: Date.now().toString(),
      name: `${selectedFramework.name} Project`,
      framework,
      files: [
        {
          id: '1',
          name: framework === 'vanilla' ? 'index.html' : 'App.jsx',
          content: selectedFramework.template,
          language: framework === 'vanilla' ? 'html' : 'javascript',
          path: framework === 'vanilla' ? '/index.html' : '/src/App.jsx'
        }
      ],
      lastModified: new Date(),
      isRunning: false
    };
    
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setActiveFile(newProject.files[0]);
    setGeneratedCode(newProject.files[0].content);
    triggerSuccess();
  };

  const saveCurrentFile = () => {
    if (activeFile && currentProject) {
      const updatedFiles = currentProject.files.map(f =>
        f.id === activeFile.id ? { ...f, content: generatedCode } : f
      );
      const updatedProject = { ...currentProject, files: updatedFiles, lastModified: new Date() };
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      triggerSuccess();
    }
  };

  const generateFrontendCode = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setBuildStatus('building');
    setAnimationStep(1);
    
    try {
      // Use the new multi-file project generation
      const result = await codeApi.generateProject(prompt, framework);
      
      if (!result.success || !result.project || !result.project.files) {
        throw new Error('Failed to generate project files');
      }

      const project = result.project;
      const projectFiles = Object.entries(project.files).map(([filename, content], index) => {
        // Determine language based on file extension
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        let language = 'plaintext';
        
        if (ext === 'html') language = 'html';
        else if (ext === 'css') language = 'css';
        else if (ext === 'js' || ext === 'jsx') language = 'javascript';
        else if (ext === 'ts' || ext === 'tsx') language = 'typescript';
        else if (ext === 'vue') language = 'vue';
        else if (ext === 'json') language = 'json';

        return {
          id: (index + 1).toString(),
          name: filename,
          content: content as string,
          language,
          path: filename // Use filename directly instead of adding slash
        };
      });

      // Set the first file as generated code for the editor
      const mainFile = projectFiles[0];
      setGeneratedCode(mainFile?.content || '');
      
      // Create new project with multiple files
      const newProject: Project = {
        id: Date.now().toString(),
        name: prompt.substring(0, 30) + '...',
        framework,
        files: projectFiles,
        lastModified: new Date(),
        isRunning: false
      };
      
      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      setActiveFile(mainFile);
      setBuildStatus('idle');
      setAnimationStep(2);
      
      // Premium success effects
      triggerConfetti();
      showSuccessToast(`✨ Generated ${framework} project with ${projectFiles.length} files!`);
      triggerSuccess();
      setPrompt('');
      
      // Show console with file information
      setConsoleLogs([
        `📁 Generated ${projectFiles.length} files:`,
        ...projectFiles.map(f => `   📄 ${f.name} (${f.language})`),
        '✅ Project ready for development!'
      ]);
      setShowConsole(true);
      
    } catch (err) {
      console.error('Frontend generation error:', err);
      setError(`Failed to generate frontend project: ${err.message || 'Unknown error'}`);
      setBuildStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const syncProjectToWebContainer = async () => {
    if (!currentProject || !isInitialized) return;
    
    try {
      console.log('🔄 Syncing project files to WebContainer...');
      const filesToSync = currentProject.files.map(file => ({
        path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
        content: file.content
      }));
      
      await webContainerService.syncProjectFiles(filesToSync);
      console.log('✅ Project files synchronized successfully');
    } catch (error) {
      console.warn('⚠️ Failed to sync project files:', error);
    }
  };

  const runProject = async () => {
    if (!currentProject) return;

    setBuildStatus('building');
    setConsoleLogs(['🚀 Starting development server...']);
    setShowConsole(true);

    try {
      // Check if WebContainer is available and initialized
      if (!isSupported || !isInitialized) {
        setConsoleLogs(prev => [...prev, '⚠️ WebContainer not available, using fallback preview mode...']);
        
        // Use inline preview as fallback
        const inlinePreview = generateInlinePreview(currentProject, framework);
        setGeneratedCode(inlinePreview);
        setServerUrl(''); // No server URL for fallback mode
        setBuildStatus('running');
        setConsoleLogs(prev => [...prev, '✅ Fallback preview ready']);
        
        const updatedProject = { ...currentProject, isRunning: true };
        setCurrentProject(updatedProject);
        setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
        return;
      }

      // Use real WebContainer
      setConsoleLogs(prev => [...prev, '🚀 Using WebContainer for live development...']);
      
      // Convert project files to simple format - ensure proper file paths
      const files: Record<string, string> = {};
      currentProject.files.forEach(file => {
        // Remove leading slash and ensure proper file path
        const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        files[filePath] = file.content;
      });

      setConsoleLogs(prev => [...prev, `📝 Writing ${Object.keys(files).length} files to WebContainer...`]);
      setConsoleLogs(prev => [...prev, `📄 Files: ${Object.keys(files).join(', ')}`]);
      
      await webContainerService.writeFiles(files);
      
      // Install dependencies if needed (for React, Vue, Angular)
      if (framework !== 'vanilla' && framework !== 'html') {
        setConsoleLogs(prev => [...prev, `📦 Installing ${framework} dependencies...`]);
        await webContainerService.installDependencies(framework);
      }
      
      setConsoleLogs(prev => [...prev, `🚀 Starting ${framework} development server...`]);
      
      // Start development server and get the URL
      const serverUrl = await webContainerService.startDevServer(framework);
      
      setServerUrl(serverUrl);
      setBuildStatus('running');
      setConsoleLogs(prev => [...prev, `✅ Server running at ${serverUrl}`]);
      
      const updatedProject = { ...currentProject, isRunning: true };
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start server';
      setBuildStatus('error');
      setError(errorMessage);
      setConsoleLogs(prev => [...prev, `❌ Error: ${errorMessage}`]);
      console.error('Project run error:', err);
    }
  };

  const stopProject = () => {
    if (currentProject) {
      setBuildStatus('idle');
      setServerUrl('');
      const updatedProject = { ...currentProject, isRunning: false };
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
      setConsoleLogs(prev => [...prev, 'Server stopped']);
    }
  };

  const shareProject = async () => {
    if (!currentProject) return;
    
    const shareData = {
      name: currentProject.name,
      framework: currentProject.framework,
      files: currentProject.files
    };
    
    const encodedData = btoa(JSON.stringify(shareData));
    const url = `${window.location.origin}/shared-project/${encodedData}`;
    
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadProject = () => {
    if (!currentProject) return;
    
    currentProject.files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const loadTemplate = (template: any) => {
    setPrompt(template.prompt);
    setFramework(template.framework);
    triggerSuccess();
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80 h-[568px]';
      case 'tablet': return 'w-[768px] h-[1024px]';
      default: return 'w-full h-full';
    }
  };

  return (
    <div className={`min-h-screen bg-black text-white transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[200] p-4' : 'pt-20 px-8 pb-8'} relative overflow-hidden`}>
      {/* Matrix Background Animation */}
      <MatrixBackground />
      
      {/* Premium Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 1, 
                y: -100, 
                x: Math.random() * window.innerWidth,
                rotate: 0,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                opacity: 0, 
                y: window.innerHeight + 100, 
                rotate: 360,
                transition: { 
                  duration: Math.random() * 2 + 2,
                  ease: "easeOut"
                }
              }}
              className={`absolute w-3 h-3 ${
                ['bg-purple-400', 'bg-blue-400', 'bg-pink-400', 'bg-yellow-400', 'bg-green-400'][i % 5]
              } rounded-full`}
            />
          ))}
        </div>
      )}
      
      {/* Premium Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-6 right-6 z-50 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Check size={18} />
            Success!
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Back Button - Top Left Corner */}
      {!isFullscreen && (
        <div className="absolute top-20 left-4 z-20">
          <BackButton />
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-2 text-center min-w-0 w-full"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              className="inline-block flex-shrink-0"
            >
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-orange-400 drop-shadow-lg" />
            </motion.div>
            <span className="break-words hyphens-auto min-w-0 flex-shrink">Frontend Playground Pro</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block flex-shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white shadow-lg">
                ⚛
              </div>
            </motion.div>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-300 text-xl mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Build, test, and deploy frontend applications with AI-powered code generation
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Preview</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Multi-Framework</span>
            </div>
          </motion.div>
        </motion.div>
        
        <div className="flex items-center justify-between mb-6 mt-8">
          <div className="flex-1">
            {/* Removed AI Assistant button */}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Code Templates"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => {}}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Project Manager"
            >
              <FolderOpen size={18} />
            </button>
            <button
              onClick={shareProject}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Share Project"
            >
              {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
            </button>
            <button
              onClick={downloadProject}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Download Project"
            >
              <Download size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Project Tabs */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project);
                  setActiveFile(project.files[0]);
                  setGeneratedCode(project.files[0].content);
                }}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 ${
                  currentProject?.id === project.id 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${project.isRunning ? 'bg-green-400' : 'bg-gray-500'}`} />
                {project.name}
                {project.isRunning && <Rocket size={12} />}
              </button>
            ))}
          </div>
        )}

        {/* AI Generation Section */}
        <div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="text-yellow-400" />
            AI Code Generation
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Describe your frontend project</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a modern todo app with drag & drop, dark theme, and animations..."
              className="w-full h-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Enhanced Framework Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-gray-300">Choose Framework</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {frameworks.map((fw, index) => (
                <motion.button
                  key={fw.id}
                  onClick={() => setFramework(fw.id)}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden
                    ${framework === fw.id 
                      ? `border-cyan-500 bg-gradient-to-br ${fw.color} shadow-lg shadow-cyan-500/25` 
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                    }
                  `}
                  style={{
                    boxShadow: framework === fw.id 
                      ? '0 10px 30px rgba(6, 182, 212, 0.3)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Selection glow effect */}
                  {framework === fw.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl animate-pulse"></div>
                  )}
                  
                  {/* Hover shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      animate={framework === fw.id ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      className="text-3xl mb-2"
                    >
                      {fw.icon}
                    </motion.div>
                    <div className={`font-semibold mb-1 ${framework === fw.id ? 'text-white' : 'text-gray-300'}`}>
                      {fw.name}
                    </div>
                    <div className={`text-xs ${framework === fw.id ? 'text-white/80' : 'text-gray-500'}`}>
                      {fw.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <StarButton
              onClick={generateFrontendCode}
              disabled={loading || !prompt.trim()}
              $$allowVisualHover={true}
              className="flex-1"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Code size={18} />}
              Generate Code
            </StarButton>
            <StarButton
              onClick={createNewProject}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <FolderOpen size={18} />
              New Project
            </StarButton>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-800 rounded-lg flex items-center gap-2">
            <Bug className="text-red-400" />
            {error}
          </div>
        )}

        {webContainerError && (
          <WebContainerFallback
            error={webContainerError}
            onRetry={handleRetryWebContainer}
            showDiagnostics={showWebContainerDiagnostics}
            onToggleDiagnostics={() => setShowWebContainerDiagnostics(v => !v)}
          />
        )}

        {!isSupported && !webContainerError && (
          <div className="mb-4 p-4 bg-blue-900/50 border border-blue-800 rounded-lg flex items-center gap-2">
            <Globe className="text-blue-400" />
            <div className="flex-1">
              <div className="font-semibold text-blue-400">Browser Compatibility</div>
              <div className="text-sm text-blue-300">
                For the best experience with live development servers, use Chrome, Firefox, or Safari with SharedArrayBuffer support.
              </div>
              <div className="text-xs text-blue-400 mt-1">
                Current mode: Static preview (still fully functional!)
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Development Environment */}
        {currentProject && activeFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Premium Code Editor */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl p-4 rounded-xl border border-gray-700/50">
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-semibold flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-cyan-500/20 rounded-lg"
                  >
                    <Code className="text-cyan-400 w-6 h-6" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Code Editor Pro
                  </span>
                </motion.h2>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveCurrentFile}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 transition-all duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={runProject}
                    disabled={loading || buildStatus === 'building'}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {buildStatus === 'building' ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : buildStatus === 'running' ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {buildStatus === 'running' ? 'Restart' : 'Run'}
                  </motion.button>
                </div>
              </div>

              {/* File Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {currentProject.files.map(file => (
                  <button
                    key={file.id}
                    onClick={async () => {
                      setActiveFile(file);
                      setGeneratedCode(file.content);
                      
                      // If WebContainer is running, sync all files to ensure consistency
                      if (isInitialized && currentProject.isRunning) {
                        try {
                          console.log('🔄 Syncing files after file switch...');
                          const filesToSync = currentProject.files.map(f => ({
                            path: f.path.startsWith('/') ? f.path.slice(1) : f.path,
                            content: f.content
                          }));
                          await webContainerService.syncProjectFiles(filesToSync);
                          console.log('✅ Files synced successfully');
                        } catch (error) {
                          console.warn('⚠️ Failed to sync files:', error);
                        }
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${
                      activeFile.id === file.id 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
              
              <div className="h-[600px] rounded-lg overflow-hidden border border-gray-700">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={activeFile.language}
                  value={generatedCode}
                  onChange={async (value: string | undefined) => {
                    const newCode = value || '';
                    setGeneratedCode(newCode);
                    
                    // Update the file content in the project
                    if (activeFile) {
                      const updatedFiles = currentProject.files.map(file =>
                        file.id === activeFile.id ? { ...file, content: newCode } : file
                      );
                      updateProject({ ...currentProject, files: updatedFiles });
                      
                      // Sync the updated file to WebContainer in real-time (with debouncing)
                      if (isInitialized && currentProject.isRunning) {
                        try {
                          const filePath = activeFile.path.startsWith('/') ? activeFile.path.slice(1) : activeFile.path;
                          await webContainerService.updateFile(filePath, newCode);
                          console.log('🔄 File synced to WebContainer:', filePath);
                        } catch (error) {
                          console.warn('⚠️ Failed to sync file:', error);
                        }
                      }
                    }
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                  }}
                />
              </div>
            </motion.div>

            {/* Preview Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Layout className="text-green-400" />
                  Live Preview
                  {buildStatus === 'running' && (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live
                    </div>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Device Preview Toggle */}
                  <div className="flex bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1 rounded ${previewMode === 'desktop' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
                      title="Desktop"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewMode('tablet')}
                      className={`p-1 rounded ${previewMode === 'tablet' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
                      title="Tablet"
                    >
                      <Layout size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1 rounded ${previewMode === 'mobile' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}
                      title="Mobile"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowConsole(!showConsole)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Console"
                  >
                    <Terminal size={14} />
                  </button>
                </div>
              </div>
              
              <div className="h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
                <div className={`bg-white rounded-lg transition-all duration-300 ${getPreviewDimensions()}`}>
                  {buildStatus === 'running' && serverUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={serverUrl}
                      className="w-full h-full rounded-lg"
                      title="Live Preview"
                      sandbox="allow-scripts allow-forms"
                    />
                  ) : generatedCode ? (
                    <iframe
                      srcDoc={generatedCode}
                      className="w-full h-full rounded-lg"
                      title="Static Preview"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 h-full">
                      <Globe size={48} className="mb-4" />
                      <p>Generate or load code to see preview</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Console Panel */}
        {showConsole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gray-900 border border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <Terminal size={16} />
                Console
              </h3>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="p-3 h-32 overflow-y-auto font-mono text-sm">
              {consoleLogs.map((log, index) => (
                <div key={index} className="text-green-400">
                  {log}
                </div>
              ))}
              {consoleLogs.length === 0 && (
                <div className="text-gray-500">Console output will appear here...</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Templates Section */}
        {!currentProject && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Palette className="text-purple-400" />
              Featured Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {codeTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${frameworks.find(f => f.id === template.framework)?.color}`} />
                    <h4 className="font-semibold">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {frameworks.find(f => f.id === template.framework)?.name}
                    </span>
                    <StarButton
                      onClick={() => loadTemplate(template)}
                      $$allowVisualHover={true}
                      className="text-xs"
                    >
                      <Rocket size={12} />
                      Use
                    </StarButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FrontendPlayground; 