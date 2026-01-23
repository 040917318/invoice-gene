import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the dist directory (output of vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: serve index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  fs.readFile(indexPath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html', err);
      return res.status(500).send('Internal Server Error');
    }

    // Inject the API key into the HTML head at runtime.
    // This allows the key to be managed securely via Cloud Run environment variables
    // without rebuilding the container.
    const apiKey = process.env.API_KEY || '';
    const injectedHtml = htmlData.replace(
      '</head>',
      `<script>window.RUNTIME_API_KEY = "${apiKey}";</script></head>`
    );

    res.send(injectedHtml);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});