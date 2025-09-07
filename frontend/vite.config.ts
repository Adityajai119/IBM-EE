import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Required headers for WebContainer/SharedArrayBuffer support
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Additional headers for better compatibility
      'Cross-Origin-Resource-Policy': 'cross-origin',
      // Ensure proper MIME type handling
      'X-Content-Type-Options': 'nosniff',
    },
    // Enable HTTPS for better WebContainer support (optional)
    // https: true,
    host: true, // Allow external connections
    port: 5174,
  },
  define: {
    // Ensure SharedArrayBuffer is available
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@webcontainer/api'],
    include: [],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          webcontainer: ['@webcontainer/api'],
        },
      },
    },
    // Completely disable module preload to avoid WebContainer/StackBlitz warnings
    modulePreload: false,
    // Optimize for better resource loading
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
  // Disable preload links generation to prevent WebContainer conflicts
  experimental: {
    renderBuiltUrl(filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) {
      // Don't generate preload links for WebContainer-related resources
      if (filename.includes('worker') || filename.includes('webcontainer')) {
        return filename;
      }
      return filename;
    }
  }
})
