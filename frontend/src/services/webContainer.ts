import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree as WebContainerFileSystemTree } from '@webcontainer/api';

export interface FileSystemTree {
  [name: string]: {
    file?: {
      contents: string;
    };
    directory?: FileSystemTree;
  };
}

export interface WebContainerInstance {
  mount: (files: FileSystemTree) => Promise<void>;
  spawn: (command: string, args: string[]) => Promise<any>;
  fs: {
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
  };
  on: (event: string, callback: (data: any) => void) => void;
  url: string;
}

export class RealWebContainerService {
  private webcontainer: WebContainer | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private serverUrl: string | null = null;

  async initialize(): Promise<void> {
    // Prevent double initialization and double boot
    if (this.isInitialized && this.webcontainer) return;
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('🚀 Initializing WebContainer...');
      
      // Check browser support
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error('SharedArrayBuffer is not available. Please use a supported browser with proper headers.');
      }

      this.webcontainer = await WebContainer.boot();
      this.isInitialized = true;
      console.log('✅ WebContainer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WebContainer:', error);
      throw new Error(`WebContainer initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async writeFiles(files: Record<string, string>): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log('📝 Writing files to WebContainer:', Object.keys(files));

    const fileSystemTree: WebContainerFileSystemTree = {};
    
    // Convert files to WebContainer format
    for (const [path, content] of Object.entries(files)) {
      const pathParts = path.split('/').filter(part => part !== '');
      let current = fileSystemTree;
      
      // Create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ('directory' in node && node.directory) {
          current = node.directory;
        }
      }
      
      // Add file
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: content,
        },
      };
    }

    await this.webcontainer.mount(fileSystemTree);
    
    // For vanilla projects, ensure we have proper file linking
    const hasHtmlFile = Object.keys(files).some(path => path.endsWith('.html'));
    const hasCssFile = Object.keys(files).some(path => path.endsWith('.css'));
    const hasJsFile = Object.keys(files).some(path => path.endsWith('.js'));
    
    if (hasHtmlFile && (hasCssFile || hasJsFile)) {
      console.log('📝 Detected vanilla HTML project - ensuring proper file linking...');
      
      // Get the main HTML file (prefer index.html or first HTML file)
      const htmlFilePath = Object.keys(files).find(path => 
        path.endsWith('index.html') || path === 'index.html'
      ) || Object.keys(files).find(path => path.endsWith('.html'));
      
      if (htmlFilePath) {
        let htmlContent = files[htmlFilePath];
        let updated = false;
        
        // Ensure CSS files are linked
        if (hasCssFile) {
          const cssFiles = Object.keys(files).filter(path => path.endsWith('.css'));
          cssFiles.forEach(cssPath => {
            const cssFileName = cssPath.split('/').pop() || cssPath;
            // Check if this CSS file is already linked
            if (!htmlContent.includes(cssFileName) && !htmlContent.includes(`href="${cssFileName}"`)) {
              const headCloseTag = htmlContent.indexOf('</head>');
              if (headCloseTag !== -1) {
                const cssLink = `    <link rel="stylesheet" href="./${cssFileName}">\n`;
                htmlContent = htmlContent.slice(0, headCloseTag) + cssLink + htmlContent.slice(headCloseTag);
                updated = true;
                console.log(`🔗 Linked CSS file: ${cssFileName}`);
              }
            }
          });
        }
        
        // Ensure JS files are linked
        if (hasJsFile) {
          const jsFiles = Object.keys(files).filter(path => path.endsWith('.js'));
          jsFiles.forEach(jsPath => {
            const jsFileName = jsPath.split('/').pop() || jsPath;
            // Check if this JS file is already linked
            if (!htmlContent.includes(jsFileName) && !htmlContent.includes(`src="${jsFileName}"`)) {
              const bodyCloseTag = htmlContent.lastIndexOf('</body>');
              if (bodyCloseTag !== -1) {
                const jsScript = `    <script src="./${jsFileName}"></script>\n`;
                htmlContent = htmlContent.slice(0, bodyCloseTag) + jsScript + htmlContent.slice(bodyCloseTag);
                updated = true;
                console.log(`🔗 Linked JS file: ${jsFileName}`);
              }
            }
          });
        }
        
        // Write the updated HTML file if changes were made
        if (updated) {
          await this.webcontainer.fs.writeFile(htmlFilePath, htmlContent);
          console.log('✅ Updated HTML file with proper asset links');
        }
      }
    }
    
    console.log('✅ Files written successfully');
  }

  // New method to update a single file in real-time
  async updateFile(filePath: string, content: string): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log(`📝 Updating file: ${filePath}`);
    
    try {
      await this.webcontainer.fs.writeFile(filePath, content);
      console.log(`✅ File updated: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to update file ${filePath}:`, error);
      throw error;
    }
  }

  // New method to read a file from WebContainer
  async readFile(filePath: string): Promise<string> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      const content = await this.webcontainer.fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`❌ Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  // New method to sync all project files with WebContainer
  async syncProjectFiles(files: Array<{path: string, content: string}>): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log('🔄 Syncing project files...');
    
    for (const file of files) {
      try {
        await this.updateFile(file.path, file.content);
      } catch (error) {
        console.warn(`⚠️ Failed to sync file ${file.path}:`, error);
      }
    }
    
    console.log('✅ Project files synced');
  }

  // New method to get the current server URL
  getServerUrl(): string | null {
    return this.serverUrl;
  }

  async installDependencies(framework: string): Promise<void> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log(`📦 Installing dependencies for ${framework}...`);

    // Check if package.json already exists (from template)
    let hasPackageJson = false;
    try {
      await this.webcontainer.fs.readFile('package.json');
      hasPackageJson = true;
      console.log('✅ Found existing package.json');
    } catch (e) {
      console.log('ℹ️  No existing package.json found, creating one');
    }

    if (framework === 'vanilla' || framework === 'html') {
      if (!hasPackageJson) {
        // For vanilla projects, just ensure serve is available and create package.json
        const packageJson = {
          "name": "vanilla-project",
          "version": "1.0.0",
          "private": true,
          "scripts": {
            "start": "serve . -p 3000 --single",
            "dev": "serve . -p 3000 --single"
          },
          "devDependencies": {
            "serve": "^14.2.1"
          }
        };
        
        await this.webcontainer.fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Created package.json for vanilla project');
      }
      
      // Install serve package
      const installProcess = await this.webcontainer!.spawn('npm', ['install']);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('npm install timeout after 180 seconds'));
        }, 180000); // 3 minutes timeout

        let streamClosed = false;
        installProcess.output.pipeTo(
          new WritableStream({
            write: (data) => {
              if (!streamClosed) {
                try {
                  console.log('npm install:', data.toString());
                } catch (e) {
                  streamClosed = true;
                  console.warn('install output stream closed:', e);
                }
              }
            },
            close() {
              streamClosed = true;
            },
            abort(err) {
              streamClosed = true;
              console.warn('install output stream aborted:', err);
            }
          })
        ).catch((err) => {
          streamClosed = true;
          console.warn('install output pipeTo error:', err);
        });

        installProcess.exit.then((code) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log('✅ Dependencies installed successfully');
            resolve();
          } else {
            reject(new Error(`npm install failed with code ${code}`));
          }
        });
      });
    }

    // For React/Vue/Angular projects
    if (!hasPackageJson) {
      const dependencies = this.getDependenciesForFramework(framework);
      
      // Create package.json only if it doesn't exist
      const packageJson = {
        name: 'devsensei-project',
        type: 'module',
        version: '1.0.0',
        scripts: this.getScriptsForFramework(framework),
        dependencies,
        devDependencies: this.getDevDependenciesForFramework(framework),
      };

      await this.webcontainer.fs.writeFile('/package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Created package.json for framework project');
    }

    // Install dependencies
    return new Promise(async (resolve, reject) => {
      // Increased timeout for large dependency sets (Angular, etc.)
      const timeout = setTimeout(() => {
        reject(new Error('npm install timeout after 180 seconds'));
      }, 180000);

      let streamClosed = false;
      let installProcess;
      try {
        installProcess = await this.webcontainer!.spawn('npm', ['install']);
      } catch (err) {
        clearTimeout(timeout);
        return reject(new Error('Failed to spawn npm install process: ' + err));
      }

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            if (!streamClosed) {
              try {
                console.log('npm install:', data);
              } catch (e) {
                streamClosed = true;
                console.warn('npm install output stream closed:', e);
              }
            }
          },
          close() {
            streamClosed = true;
          },
          abort(err) {
            streamClosed = true;
            console.warn('npm install output stream aborted:', err);
          }
        })
      ).catch((err) => {
        streamClosed = true;
        console.warn('npm install output pipeTo error:', err);
      });

      installProcess.exit.then((code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log('✅ Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  async startDevServer(framework: string): Promise<string> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log(`🚀 Starting dev server for ${framework}...`);

    const { command, args } = this.getServerCommand(framework);
    const serverProcess = await this.webcontainer.spawn(command, args);

    // Listen for server ready and return the URL
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Dev server startup timeout after 60 seconds for ${framework}`));
      }, 60000);

      let streamClosed = false;
      let serverUrl = '';
      
      serverProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            if (!streamClosed) {
              try {
                const output = data.toString();
                console.log(`${framework} server:`, output);
                
                // Look for server ready indicators
                if (
                  output.includes('ready') ||
                  output.includes('Local:') ||
                  output.includes('localhost:') ||
                  output.includes('compiled') ||
                  output.includes('Local web server') ||
                  output.includes('webpack compiled') ||
                  output.includes('App running at')
                ) {
                  clearTimeout(timeout);
                  // Try to get preview URL from WebContainer
                  this.webcontainer!.on('server-ready', (_port: number, url: string) => {
                    serverUrl = url;
                    this.serverUrl = url; // Store the server URL
                    resolve(url);
                  });
                  
                  // Fallback: construct URL from default port
                  if (!serverUrl) {
                    const defaultPort = framework === 'vanilla' || framework === 'html' ? 3000 : 5173;
                    // For WebContainer, we typically get a URL like https://xyz.webcontainer.io
                    // but we'll need to detect this dynamically
                    setTimeout(() => {
                      if (!serverUrl) {
                        // This is a fallback - in real WebContainer the URL will be provided
                        const fallbackUrl = `http://localhost:${defaultPort}`;
                        this.serverUrl = fallbackUrl; // Store the server URL
                        resolve(fallbackUrl);
                      }
                    }, 2000);
                  }
                }
              } catch (e) {
                streamClosed = true;
                console.warn('dev server output stream closed:', e);
              }
            }
          },
          close() {
            streamClosed = true;
          },
          abort(err) {
            streamClosed = true;
            console.warn('dev server output stream aborted:', err);
          }
        })
      ).catch((err) => {
        streamClosed = true;
        console.warn('dev server output pipeTo error:', err);
      });

      // For some frameworks, resolve after a short delay with default URL
      if (framework === 'vanilla' || framework === 'html') {
        setTimeout(() => {
          if (!serverUrl) {
            clearTimeout(timeout);
            // Fallback URL for vanilla projects
            const fallbackUrl = 'http://localhost:3000';
            this.serverUrl = fallbackUrl; // Store the server URL
            resolve(fallbackUrl);
          }
        }, 3000);
      }
    });
  }

  private getDependenciesForFramework(framework: string): Record<string, string> {
    switch (framework.toLowerCase()) {
      case 'react':
        return {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
        };
      case 'vue':
        return {
          'vue': '^3.3.0',
        };
      case 'angular':
        return {
          '@angular/core': '^16.0.0',
          '@angular/common': '^16.0.0',
          '@angular/platform-browser': '^16.0.0',
          '@angular/platform-browser-dynamic': '^16.0.0',
          'rxjs': '^7.8.0',
          'zone.js': '^0.13.0',
        };
      default:
        return {};
    }
  }

  private getDevDependenciesForFramework(framework: string): Record<string, string> {
    switch (framework.toLowerCase()) {
      case 'react':
        return {
          '@vitejs/plugin-react': '^4.0.0',
          'vite': '^4.4.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'typescript': '^5.0.0',
        };
      case 'vue':
        return {
          '@vitejs/plugin-vue': '^4.2.0',
          'vite': '^4.4.0',
          'typescript': '^5.0.0',
        };
      case 'angular':
        return {
          '@angular/cli': '^16.0.0',
          '@angular-devkit/build-angular': '^16.0.0',
          'typescript': '^5.0.0',
        };
      default:
        return {
          'serve': '^14.2.0',
        };
    }
  }

  private getScriptsForFramework(framework: string): Record<string, string> {
    switch (framework.toLowerCase()) {
      case 'react':
        return {
          'dev': 'vite',
          'build': 'vite build',
          'preview': 'vite preview',
        };
      case 'vue':
        return {
          'dev': 'vite',
          'build': 'vite build',
          'preview': 'vite preview',
        };
      case 'angular':
        return {
          'start': 'ng serve --port 4200 --host 0.0.0.0',
          'build': 'ng build',
          'serve': 'ng serve',
        };
      case 'vanilla':
      case 'html':
      default:
        return {
          'start': 'serve . -p 3000 --single',
          'serve': 'serve . -p 3000 --single',
          'dev': 'serve . -p 3000 --single'
        };
    }
  }

  private getServerCommand(framework: string): { command: string; args: string[] } {
    switch (framework.toLowerCase()) {
      case 'react':
        return { command: 'npm', args: ['run', 'dev'] };
      case 'vue':
        return { command: 'npm', args: ['run', 'dev'] };
      case 'angular':
        return { command: 'npm', args: ['start'] };
      case 'vanilla':
      case 'html':
      default:
        // Use serve with proper configuration for SPA-like behavior
        return { command: 'npx', args: ['serve', '.', '-p', '3000', '--single'] };
    }
  }

  async executeCommand(command: string, args: string[]): Promise<string> {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    console.log(`🔧 Executing command: ${command} ${args.join(' ')}`);

    const process = await this.webcontainer.spawn(command, args);
    
    return new Promise((resolve, reject) => {
      let output = '';
      
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            output += data;
          },
        })
      );

      process.exit.then((code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });
    });
  }

  getUrl(): string {
    if (!this.webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    // Return a default URL since WebContainer.url doesn't exist in the API
    return 'http://localhost:3000';
  }

  isReady(): boolean {
    return this.isInitialized && this.webcontainer !== null;
  }

  async dispose(): Promise<void> {
    if (this.webcontainer) {
      console.log('🧹 Disposing WebContainer...');
      await this.webcontainer.teardown();
      this.webcontainer = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const webContainerService = new RealWebContainerService();