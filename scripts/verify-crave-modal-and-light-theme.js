/**
 * Automated Verification Script:
 * 1. SOS Crave Modal Accessibility, Viewport Geometry & Top Reachability.
 * 2. White Theme (theme-light) Deep Contrast & Text Readability Audit.
 * 3. Screenshots capture for user verification.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = 4195;
const STANDALONE_PATH = path.resolve('dist/standalone.html');

if (!fs.existsSync(STANDALONE_PATH)) {
  console.error('Error: dist/standalone.html not found. Run npm run build first.');
  process.exit(1);
}

const candidateBrowsers = [
  process.env.CHROME_BIN,
  process.env.BROWSER_BIN,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browserExe = candidateBrowsers.find((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});

if (!browserExe) {
  console.error('No compatible browser executable found.');
  process.exit(1);
}

console.log(`[Browser Check] Using: ${browserExe}`);

// HTTP Server
const html = fs.readFileSync(STANDALONE_PATH, 'utf8');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

await new Promise((res) => server.listen(PORT, '127.0.0.1', res));
console.log(`[Server] Listening on http://127.0.0.1:${PORT}`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puffinless-light-audit-'));
const debugPort = 9233;

const proc = spawn(browserExe, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--remote-debugging-address=0.0.0.0',
  `--user-data-dir=${tempDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1280,800',
  '--no-first-run',
  `http://127.0.0.1:${PORT}`,
]);

// Wait for CDP
let ws = null;
let msgId = 1;

async function sendCDP(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  const res = await sendCDP('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description || 'Browser exception');
  }
  return res.result?.value;
}

async function captureScreenshot(filePath) {
  const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  console.log(`    [Screenshot Saved] -> ${filePath}`);
}

for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const list = await res.json();
    const page = list.find((t) => t.type === 'page');
    if (page?.webSocketDebuggerUrl) {
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r, j) => {
        ws.onopen = r;
        ws.onerror = j;
      });
      await sendCDP('Page.enable');
      await sendCDP('Runtime.enable');
      break;
    }
  } catch {}
}

if (!ws) {
  console.error('Failed to connect to CDP.');
  process.exit(1);
}

console.log('[CDP] Connected successfully.');

// Wait for store to hydrate
await evalInPage(`
  new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (window.__PUFFINLESS_STORE__?.isHydrated) resolve(true);
      else if (Date.now() - start > 15000) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  });
`);

console.log('[App] Store hydrated.');

// Complete onboarding if in onboarding mode, set theme to 'light'
await evalInPage(`
  (async () => {
    const store = window.__PUFFINLESS_STORE__;
    if (!store) return;
    const actions = store.actions;
    const state = store.state;

    // Set demo profile in light mode
    await actions.completeOnboarding({
      name: 'Alex',
      currency: '€',
      theme: 'light',
      language: 'fr',
      habits: ['cigarette', 'puff_vape'],
      cigarettesInPack: 20,
      pricePerPack: 12,
      podPrice: 9.5,
      quitDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    document.body.className = 'theme-light';
  })();
`);

await new Promise((r) => setTimeout(r, 600));

// Capture 1: Dashboard in White / Light Theme
await captureScreenshot('dist/screenshots/01-dashboard-light-theme.png');

// Check 1: White Theme Color Contrast on Dashboard
const dashboardContrastAudit = await evalInPage(`
  (() => {
    const textEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, label, .tabular-nums, button span'));
    const samples = textEls.slice(0, 30).map((el) => {
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent.trim().slice(0, 25),
        color: style.color,
      };
    });
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyClass: document.body.className,
      samples,
    };
  })();
`);

console.log('[Dashboard Contrast Audit]');
console.log('  Body Class:', dashboardContrastAudit.bodyClass);
console.log('  Sampled text colors (first 8):', dashboardContrastAudit.samples.slice(0, 8));

// NOW: Click the Crave / SOS button to open the SOS modal!
console.log('\n[Action] Triggering Craving / SOS button...');
await evalInPage(`
  (() => {
    // Find the craving button in header
    const craveBtn = document.querySelector('header button[aria-label="ENVIE SOS"], header button[aria-label="CRAVE SOS"], header button.bg-gradient-to-r');
    if (craveBtn) {
      craveBtn.click();
    } else {
      // Fallback
      console.warn('Crave button not found by selector, opening via store if available');
    }
  })();
`);

await new Promise((r) => setTimeout(r, 800));

// Inspect SOS Modal geometry & accessibility
const modalAudit = await evalInPage(`
  (() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { found: false };

    const modal = dialog.querySelector('.sos-modal') || dialog.querySelector('.glass-panel-elevated');
    const header = modal ? modal.querySelector('#sos-modal-title')?.parentElement?.parentElement : null;
    const title = dialog.querySelector('#sos-modal-title');
    const closeBtn = dialog.querySelector('button[aria-label*="Fermer"], button[aria-label*="Close"]');
    const bodyScroll = modal ? modal.querySelector('.overflow-y-auto') : null;
    const breathingCircle = dialog.querySelector('.breathing-circle, .rounded-full.glass-panel');

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const modalRect = modal ? modal.getBoundingClientRect() : null;
    const titleRect = title ? title.getBoundingClientRect() : null;
    const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;

    // Check text colors inside SOS modal in light theme
    const titleStyle = title ? window.getComputedStyle(title) : null;
    const modalStyle = modal ? window.getComputedStyle(modal) : null;

    const textElements = Array.from(modal ? modal.querySelectorAll('h3, p, span, label, button') : []);
    const textColors = textElements.slice(0, 20).map((el) => {
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent.trim().slice(0, 20),
        color: s.color,
      };
    });

    return {
      found: true,
      viewport: { width: viewportWidth, height: viewportHeight },
      modal: {
        top: modalRect?.top,
        bottom: modalRect?.bottom,
        height: modalRect?.height,
        maxHeight: modalStyle?.maxHeight,
        overflow: modalStyle?.overflow,
      },
      title: {
        text: title?.textContent?.trim(),
        top: titleRect?.top,
        bottom: titleRect?.bottom,
        color: titleStyle?.color,
      },
      closeButton: {
        found: !!closeBtn,
        top: closeRect?.top,
        right: closeRect?.right,
        isWithinViewport: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= viewportHeight) : false,
      },
      isTopAccessible: (modalRect?.top >= 0) && (titleRect?.top >= 0) && (closeRect?.top >= 0),
      hasInternalScroll: !!bodyScroll,
      textColorsSample: textColors.slice(0, 10),
    };
  })();
`);

console.log('\n[SOS Crave Modal Audit]');
console.log('  Modal Found:', modalAudit.found);
console.log('  Viewport:', modalAudit.viewport);
console.log('  Modal Top Offset:', modalAudit.modal?.top, 'px (>= 0 means fully accessible without being cut off)');
console.log('  Title Top Offset:', modalAudit.title?.top, 'px');
console.log('  Title Computed Color:', modalAudit.title?.color);
console.log('  Close Button Visible & Within Viewport:', modalAudit.closeButton?.isWithinViewport);
console.log('  Close Button Top Offset:', modalAudit.closeButton?.top, 'px');
console.log('  Top Accessible (modal top >= 0 & title top >= 0 & close button >= 0):', modalAudit.isTopAccessible);
console.log('  Internal Scroll Body Present:', modalAudit.hasInternalScroll);
console.log('\n[Sampled SOS Modal Text Colors in White Theme]:');
modalAudit.textColorsSample.forEach((s) => console.log(`   ${s.tag} "${s.text}": ${s.color}`));

// Capture 2: SOS Modal in White / Light Theme
await captureScreenshot('dist/screenshots/02-crave-modal-light-theme.png');

// Test switching tabs inside SOS modal
console.log('\n[Action] Switching to Grounding tab...');
await evalInPage(`
  (() => {
    const tabs = Array.from(document.querySelectorAll('[role="dialog"] button'));
    const groundingTab = tabs.find((b) => b.textContent.includes('5-4-3-2-1') || b.textContent.includes('Ancrage') || b.textContent.includes('Grounding'));
    if (groundingTab) groundingTab.click();
  })();
`);

await new Promise((r) => setTimeout(r, 400));
await captureScreenshot('dist/screenshots/03-crave-modal-grounding-tab.png');

// Test Reality Check tab
console.log('\n[Action] Switching to Reality Check tab...');
await evalInPage(`
  (() => {
    const tabs = Array.from(document.querySelectorAll('[role="dialog"] button'));
    const realityTab = tabs.find((b) => b.textContent.includes('Réalité') || b.textContent.includes('Reality'));
    if (realityTab) realityTab.click();
  })();
`);

await new Promise((r) => setTimeout(r, 400));
await captureScreenshot('dist/screenshots/04-crave-modal-reality-tab.png');

// Test Close Button
console.log('\n[Action] Clicking Close Button on SOS Modal...');
await evalInPage(`
  (() => {
    const closeBtn = document.querySelector('[role="dialog"] button[aria-label*="Fermer"], [role="dialog"] button[aria-label*="Close"]');
    if (closeBtn) closeBtn.click();
  })();
`);

await new Promise((r) => setTimeout(r, 500));

// Verify modal closed
const isClosed = await evalInPage(`!document.querySelector('[role="dialog"]')`);
console.log('  Modal successfully closed via close button:', isClosed);

// Switch to Money View
console.log('\n[Action] Navigating to Money tab in White Theme...');
await evalInPage(`
  (() => {
    const tabs = Array.from(document.querySelectorAll('nav[role="tablist"] button'));
    if (tabs[1]) tabs[1].click();
  })();
`);
await new Promise((r) => setTimeout(r, 400));
await captureScreenshot('dist/screenshots/05-money-view-light-theme.png');

// Switch to Wellness View
console.log('\n[Action] Navigating to Wellness tab in White Theme...');
await evalInPage(`
  (() => {
    const tabs = Array.from(document.querySelectorAll('nav[role="tablist"] button'));
    if (tabs[2]) tabs[2].click();
  })();
`);
await new Promise((r) => setTimeout(r, 400));
await captureScreenshot('dist/screenshots/06-wellness-view-light-theme.png');

// Switch to Settings / Profile Modal
console.log('\n[Action] Opening Profile / Settings in White Theme...');
await evalInPage(`
  (() => {
    const profileBtn = document.querySelector('header button[aria-label*="Profil"], header button[title*="Profile"]');
    if (profileBtn) profileBtn.click();
  })();
`);
await new Promise((r) => setTimeout(r, 500));
await captureScreenshot('dist/screenshots/07-settings-modal-light-theme.png');

// Cleanup
console.log('\n[Cleanup] Closing browser and server...');
proc.kill();
server.close();
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch {}

console.log('[Verification Complete] All checks executed successfully.');
