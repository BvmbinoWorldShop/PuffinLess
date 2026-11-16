import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4180;
const WEBSITE_DIR = path.resolve('website');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  // Normalize URL by removing query parameters
  const cleanUrl = req.url.split('?')[0];
  let reqPath = cleanUrl === '/' ? '/index.html' : cleanUrl;
  let filePath = path.join(WEBSITE_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(WEBSITE_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PuffinLess Commercial Website running at http://localhost:${PORT}`);
});
