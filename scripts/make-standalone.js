import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const distDir = path.resolve('dist');
const distHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(distHtmlPath)) {
  console.error('dist/index.html not found, run npm run build first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtmlPath, 'utf8');

// Find CSS file in dist/assets
const cssMatch = html.match(/<link rel="stylesheet"[^>]*href="(?:\.\/|\/)?assets\/([^"]+)"[^>]*>/);
if (cssMatch && cssMatch[1]) {
  const cssPath = path.join(distDir, 'assets', cssMatch[1]);
  if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');

    // Inline local font files into base64 data URIs for 100% offline standalone portability
    const fontFiles = [
      { name: '/fonts/plus-jakarta-sans-latin.woff2', file: path.resolve('public/fonts/plus-jakarta-sans-latin.woff2') },
      { name: '/fonts/space-grotesk-latin.woff2', file: path.resolve('public/fonts/space-grotesk-latin.woff2') }
    ];
    for (const font of fontFiles) {
      if (fs.existsSync(font.file)) {
        const fontB64 = fs.readFileSync(font.file).toString('base64');
        cssContent = cssContent.split(font.name).join(`data:font/woff2;base64,${fontB64}`);
      }
    }

    html = html.replace(cssMatch[0], `<style>\n${cssContent}\n</style>`);
  }
}

// Find JS file in dist/assets & apply advanced anti-reverse engineering obfuscation
const jsMatch = html.match(/<script type="module"[^>]*src="(?:\.\/|\/)?assets\/([^"]+)"[^>]*><\/script>/);
if (jsMatch && jsMatch[1]) {
  const jsPath = path.join(distDir, 'assets', jsMatch[1]);
  if (fs.existsSync(jsPath)) {
    console.log('🔒 Applying anti-reverse engineering & AI code protection (Control Flow Flattening, Base64 String Tables, Hex Mangles)...');
    const rawJs = fs.readFileSync(jsPath, 'utf8');
    const startTime = Date.now();

    const obfuscationResult = JavaScriptObfuscator.obfuscate(rawJs, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.15,
      numbersToExpressions: true,
      simplify: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      splitStrings: true,
      splitStringsChunkLength: 6,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false
    });

    const protectedJs = obfuscationResult.getObfuscatedCode();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Protection applied in ${duration}s. Size: ${(rawJs.length / 1024).toFixed(0)} KB -> ${(protectedJs.length / 1024).toFixed(0)} KB (obfuscated)`);

    // Update the dist asset so web deployment is also protected
    fs.writeFileSync(jsPath, protectedJs, 'utf8');

    // Embed into standalone single-file HTML
    html = html.replace(jsMatch[0], `<script>\n${protectedJs}\n</script>`);
  }
}

// Write standalone version
const standalonePath = path.join(distDir, 'standalone.html');
fs.writeFileSync(standalonePath, html, 'utf8');
console.log('Standalone single-file HTML generated at:', standalonePath);

// Sync to Desktop folder if present
const desktopFolder = 'C:\\Users\\tiegb\\Desktop\\final version 1';
if (fs.existsSync(desktopFolder)) {
  try {
    fs.writeFileSync(path.join(desktopFolder, 'PuffinLess_App.html'), html, 'utf8');
    fs.writeFileSync(path.join(desktopFolder, 'standalone.html'), html, 'utf8');
    
    // Also sync index.html and assets directory to Desktop
    fs.copyFileSync(distHtmlPath, path.join(desktopFolder, 'index.html'));
    const desktopAssetsDir = path.join(desktopFolder, 'assets');
    if (!fs.existsSync(desktopAssetsDir)) {
      fs.mkdirSync(desktopAssetsDir, { recursive: true });
    }
    const distAssetsDir = path.join(distDir, 'assets');
    for (const f of fs.readdirSync(distAssetsDir)) {
      fs.copyFileSync(path.join(distAssetsDir, f), path.join(desktopAssetsDir, f));
    }

    console.log('Synchronized protected app (PuffinLess_App.html, standalone.html & assets) to Desktop folder:', desktopFolder);
  } catch (err) {
    console.warn('Could not sync to desktop:', err);
  }
}
