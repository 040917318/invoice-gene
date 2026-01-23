import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Specific replacement for the API Key
      // Use empty string fallback so the code is valid even if built without the key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Polyfill process.env to an empty object to prevent "process is not defined" crashes
      'process.env': {}
    }
  };
});