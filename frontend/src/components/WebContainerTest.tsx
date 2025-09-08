import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Eye, Code, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useWebContainer } from '../hooks/useWebContainer';
import { WebContainerStatus } from './WebContainerStatus';

interface TestProject {
  name: string;
  framework: string;
  files: Record<string, string>;
}

export const WebContainerTest: React.FC = () => {
  const { 
    isSupported, 
    isInitialized, 
    error, 
    webContainer, 
    initializeContainer,
    resetError 
  } = useWebContainer();
  
  const [testProject, setTestProject] = useState<TestProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const generateTestProject = async () => {
    setIsGenerating(true);
    addLog('Generating test project...');
    
    try {
      // Create a simple test project
      const files = {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebContainer Test</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div class="container">
        <h1>🚀 WebContainer Test</h1>
        <p>If you can see this styled page, WebContainer is working!</p>
        <button onclick="testFunction()">Test JavaScript</button>
        <div id="output"></div>
    </div>
    <script src="./script.js"></script>
</body>
</html>`,
        'style.css': `body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    text-align: center;
    max-width: 500px;
}

h1 {
    color: #333;
    margin-bottom: 1rem;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    margin: 1rem 0;
    transition: background 0.3s;
}

button:hover {
    background: #5a67d8;
}

#output {
    margin-top: 1rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 5px;
    min-height: 50px;
}`,
        'script.js': `function testFunction() {
    const output = document.getElementById('output');
    const now = new Date().toLocaleTimeString();
    output.innerHTML = \`
        <h3>✅ JavaScript is working!</h3>
        <p>Current time: \${now}</p>
        <p>WebContainer successfully executed this script.</p>
    \`;
    console.log('WebContainer test function executed at:', now);
}`
      };

      setTestProject({
        name: 'WebContainer Test',
        framework: 'vanilla',
        files
      });
      
      addLog('✅ Test project generated');
    } catch (err) {
      addLog(`❌ Failed to generate project: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const runProject = async () => {
    if (!testProject || !isInitialized) {
      addLog('❌ Cannot run project - WebContainer not ready');
      return;
    }

    setIsRunning(true);
    addLog('🚀 Starting project in WebContainer...');

    try {
      // Write files to WebContainer
      addLog('📝 Writing files to WebContainer...');
      await webContainer.writeFiles(testProject.files);
      addLog('✅ Files written successfully');

      // Install dependencies
      addLog('📦 Installing dependencies...');
      await webContainer.installDependencies(testProject.framework);
      addLog('✅ Dependencies installed');

      // Start dev server
      addLog('🌐 Starting development server...');
      const url = await webContainer.startDevServer(testProject.framework);
      setPreviewUrl(url);
      addLog(`✅ Server started at: ${url}`);
      
    } catch (err) {
      addLog(`❌ Failed to run project: ${err}`);
      console.error('WebContainer run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadProject = () => {
    if (!testProject) return;

    // Create a zip-like structure for download
    const projectData = {
      name: testProject.name,
      files: testProject.files,
      framework: testProject.framework
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${testProject.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog('📥 Project downloaded as JSON');
  };

  return (
    <div className="space-y-6">
      {/* WebContainer Status */}
      <WebContainerStatus onRetry={handleRetry} showDetails={true} />

      {/* Test Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Play className="w-5 h-5 mr-2" />
          WebContainer Test Suite
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateTestProject}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Code className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate Test Project'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runProject}
            disabled={!testProject || !isInitialized || isRunning}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? 'Running...' : 'Run in WebContainer'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadProject}
            disabled={!testProject}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Project</span>
          </motion.button>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Live Preview
              </h4>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Open in new tab →
              </a>
            </div>
            <div className="bg-white rounded-lg overflow-hidden" style={{ height: '300px' }}>
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="WebContainer Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Activity Log</h4>
            <div className="bg-black/50 rounded-lg p-3 font-mono text-sm max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebContainerTest;