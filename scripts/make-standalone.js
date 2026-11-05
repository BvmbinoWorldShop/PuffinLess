import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const distHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(distHtmlPath)) {
  console.error('dist/index.html not found, run npm run build first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtmlPath, 'utf8');

// Find CSS file in dist/assets
const cssMatch = html.match(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+)"[^>]*>/);
if (cssMatch && cssMatch[1]) {
  const cssPath = path.join(distDir, 'assets', cssMatch[1]);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    html = html.replace(cssMatch[0], `<style>\n${cssContent}\n</style>`);
  }
}

// Find JS file in dist/assets
const jsMatch = html.match(/<script type="module"[^>]*src="\.\/assets\/([^"]+)"[^>]*><\/script>/);
if (jsMatch && jsMatch[1]) {
  const jsPath = path.join(distDir, 'assets', jsMatch[1]);
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    html = html.replace(jsMatch[0], `<script>\n${jsContent}\n</script>`);
  }
}

// Write standalone version
const standalonePath = path.join(distDir, 'standalone.html');
fs.writeFileSync(standalonePath, html, 'utf8');
console.log('Standalone single-file HTML generated at:', standalonePath);
