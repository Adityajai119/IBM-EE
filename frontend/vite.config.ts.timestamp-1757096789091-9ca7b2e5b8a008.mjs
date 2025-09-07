// vite.config.ts
import { defineConfig } from "file:///C:/Users/tumma/OneDrive/Desktop/IBM%20project%20EE/DevSensei/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/tumma/OneDrive/Desktop/IBM%20project%20EE/DevSensei/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Required headers for WebContainer/SharedArrayBuffer support
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
      // Additional headers for better compatibility
      "Cross-Origin-Resource-Policy": "cross-origin",
      // Ensure proper MIME type handling
      "X-Content-Type-Options": "nosniff"
    },
    // Enable HTTPS for better WebContainer support (optional)
    // https: true,
    host: true,
    // Allow external connections
    port: 5174
  },
  define: {
    // Ensure SharedArrayBuffer is available
    global: "globalThis"
  },
  optimizeDeps: {
    exclude: ["@webcontainer/api"],
    include: []
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          webcontainer: ["@webcontainer/api"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJjOlxcXFxVc2Vyc1xcXFx0dW1tYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXElCTSBwcm9qZWN0IEVFXFxcXERldlNlbnNlaVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiYzpcXFxcVXNlcnNcXFxcdHVtbWFcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxJQk0gcHJvamVjdCBFRVxcXFxEZXZTZW5zZWlcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2M6L1VzZXJzL3R1bW1hL09uZURyaXZlL0Rlc2t0b3AvSUJNJTIwcHJvamVjdCUyMEVFL0RldlNlbnNlaS9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuXHJcbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgLy8gUmVxdWlyZWQgaGVhZGVycyBmb3IgV2ViQ29udGFpbmVyL1NoYXJlZEFycmF5QnVmZmVyIHN1cHBvcnRcclxuICAgICAgJ0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAncmVxdWlyZS1jb3JwJyxcclxuICAgICAgJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JzogJ3NhbWUtb3JpZ2luJyxcclxuICAgICAgLy8gQWRkaXRpb25hbCBoZWFkZXJzIGZvciBiZXR0ZXIgY29tcGF0aWJpbGl0eVxyXG4gICAgICAnQ3Jvc3MtT3JpZ2luLVJlc291cmNlLVBvbGljeSc6ICdjcm9zcy1vcmlnaW4nLFxyXG4gICAgICAvLyBFbnN1cmUgcHJvcGVyIE1JTUUgdHlwZSBoYW5kbGluZ1xyXG4gICAgICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcclxuICAgIH0sXHJcbiAgICAvLyBFbmFibGUgSFRUUFMgZm9yIGJldHRlciBXZWJDb250YWluZXIgc3VwcG9ydCAob3B0aW9uYWwpXHJcbiAgICAvLyBodHRwczogdHJ1ZSxcclxuICAgIGhvc3Q6IHRydWUsIC8vIEFsbG93IGV4dGVybmFsIGNvbm5lY3Rpb25zXHJcbiAgICBwb3J0OiA1MTc0LFxyXG4gIH0sXHJcbiAgZGVmaW5lOiB7XHJcbiAgICAvLyBFbnN1cmUgU2hhcmVkQXJyYXlCdWZmZXIgaXMgYXZhaWxhYmxlXHJcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgZXhjbHVkZTogWydAd2ViY29udGFpbmVyL2FwaSddLFxyXG4gICAgaW5jbHVkZTogW10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICB3ZWJjb250YWluZXI6IFsnQHdlYmNvbnRhaW5lci9hcGknXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlZLFNBQVMsb0JBQW9CO0FBQ3RhLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sU0FBUztBQUFBO0FBQUEsTUFFUCxnQ0FBZ0M7QUFBQSxNQUNoQyw4QkFBOEI7QUFBQTtBQUFBLE1BRTlCLGdDQUFnQztBQUFBO0FBQUEsTUFFaEMsMEJBQTBCO0FBQUEsSUFDNUI7QUFBQTtBQUFBO0FBQUEsSUFHQSxNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsbUJBQW1CO0FBQUEsSUFDN0IsU0FBUyxDQUFDO0FBQUEsRUFDWjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osY0FBYyxDQUFDLG1CQUFtQjtBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
