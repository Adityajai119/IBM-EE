import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, GitBranch, Code, Layout as LayoutIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <nav className="bg-black text-white shadow-sm border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-white">
                  DevSensei
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-white hover:text-gray-300"
                >
                  <Home className="mr-2 w-5 h-5" />
                  Home
                </Link>
                <Link
                  to="/repo-search"
                  className="inline-flex items-center px-1 pt-1 text-white hover:text-gray-300"
                >
                  <Search className="mr-2 w-5 h-5" />
                  Repo Search
                </Link>
                <Link
                  to="/repository-explorer"
                  className="inline-flex items-center px-1 pt-1 text-white hover:text-gray-300"
                >
                  <GitBranch className="mr-2 w-5 h-5" />
                  Interact with Repo
                </Link>
                <Link
                  to="/code-playground"
                  className="inline-flex items-center px-1 pt-1 text-white hover:text-gray-300"
                >
                  <Code className="mr-2 w-5 h-5" />
                  AI Compiler
                </Link>
                <Link
                  to="/frontend-playground"
                  className="inline-flex items-center px-1 pt-1 text-white hover:text-gray-300"
                >
                  <LayoutIcon className="mr-2 w-5 h-5" />
                  Frontend Playground
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2024 DevSensei. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 