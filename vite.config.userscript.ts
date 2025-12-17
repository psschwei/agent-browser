import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './userscript/main.ts',
      name: 'AgentBrowserUserscript',
      fileName: 'agent-browser',
      formats: ['iife'] // Single self-contained file
    },
    outDir: 'userscript-dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Single file bundle (no code splitting)
        inlineDynamicImports: true,
        // Banner: userscript header will be prepended by build script
      }
    }
  }
});
