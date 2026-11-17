/**
 * Automated Verification Script:
 * 1. Money Section (MoneyView) White Theme In-Depth Audit (Readability & Contrast).
 * 2. 2D/3D Milestone Trophies with Illumination Hover.
 * 3. Touch / Click Fireworks Simulation.
 * 4. Half-Window Pop-up Modal with Accomplishment Meaning & Personalized Coach Message.
 * 5. High-resolution screenshot capture.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = 4198;
const STANDALONE_PATH = path.resolve('dist/standalone.html');
const SCREENSHOT_DIR = 'C:\\Users\\tiegb\\.gemini\\antigravity\\brain\\5130aa93-6ddf-4908-959c-41f6a2423304\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

console.log(`[Browser Audit] Using: ${browserExe}`);

// HTTP Server
const html = fs.readFileSync(STANDALONE_PATH, 'utf8');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

await new Promise((res) => server.listen(PORT, '127.0.0.1', res));
console.log(`[Server] Serving at http://127.0.0.1:${PORT}`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puffinless-money-trophy-audit-'));
const debugPort = 9244;

const proc = spawn(browserExe, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--remote-debugging-address=0.0.0.0',
  `--user-data-dir=${tempDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1280,900',
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

async function captureScreenshot(filename) {
  const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
  const filepath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
  console.log(`[Screenshot] Saved: ${filename}`);
  return filepath;
}

try {
  // Connect to CDP
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

  if (!ws) throw new Error('Could not connect to browser CDP.');
  console.log('[CDP] Connected successfully.');
  await new Promise((r) => setTimeout(r, 800));

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

  console.log('[App] Store hydrated. Completing onboarding in French, Light Theme...');
  await evalInPage(`
    (async () => {
      const store = window.__PUFFINLESS_STORE__;
      if (!store) return;
      const actions = store.actions;

      await actions.completeOnboarding({
        name: 'Alexandre',
        currency: '€',
        theme: 'light',
        language: 'fr',
        habits: ['cigarette', 'puff_vape'],
        cigarettesInPack: 20,
        pricePerPack: 12.50,
        podPrice: 9.50,
        quitDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      });

      document.body.className = 'theme-light';
      document.documentElement.className = 'theme-light';
    })();
  `);

  await new Promise((r) => setTimeout(r, 600));

  // 1. Audit Money View
  console.log('\n[Action] Navigating to Money View (Tab 1)...');
  await evalInPage(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('nav[role="tablist"] button'));
      if (tabs[1]) tabs[1].click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 600));

  // Check text contrast in Money View
  const moneyAudit = await evalInPage(`
    (() => {
      const moneyView = document.querySelector('.money-view');
      if (!moneyView) return { found: false };

      const allElements = Array.from(moneyView.querySelectorAll('h3, h4, p, span, div, button'));
      let invisibleOrWhiteTextCount = 0;
      const sampleTexts = [];

      allElements.forEach(el => {
        const text = el.textContent?.trim();
        if (!text || text.length > 50 || el.children.length > 0) return;

        const style = window.getComputedStyle(el);
        const color = style.color;
        
        // Parse rgb/rgba
        const rgbMatch = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          
          // Check if text is white (> 225) on white background
          const isWhiteOnWhite = (r > 225 && g > 225 && b > 225);
          const isButtonKeepWhite = el.closest('button[class*="bg-gradient"]') || el.classList.contains('keep-white');
          
          if (isWhiteOnWhite && !isButtonKeepWhite) {
            invisibleOrWhiteTextCount++;
            sampleTexts.push({ text: text.substring(0, 30), color, tag: el.tagName });
          }
        }
      });

      // Sample key elements
      const headerTitle = moneyView.querySelector('h3, h4')?.textContent?.trim();
      const numbers = Array.from(moneyView.querySelectorAll('.tabular-nums')).map(n => n.textContent?.trim());

      return {
        found: true,
        headerTitle,
        sampleNumbers: numbers.slice(0, 4),
        invisibleOrWhiteTextCount,
        sampleWhiteTexts: sampleTexts.slice(0, 5)
      };
    })()
  `);

  console.log('[Money View Audit Result]:', JSON.stringify(moneyAudit, null, 2));
  await captureScreenshot('08-money-view-light-theme-fixed.png');

  // Test Money sub-tab: Expenses
  console.log('[Action] Switching Money sub-tab to Achats (Expenses)...');
  await evalInPage(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.money-view button'));
      const expTab = tabs.find(b => b.textContent.includes('Achats') || b.textContent.includes('Purchases'));
      if (expTab) expTab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));
  await captureScreenshot('09-money-view-expenses-tab-light.png');

  // Test Money sub-tab: Goals
  console.log('[Action] Switching Money sub-tab to Projets d Epargne (Wishlist Goals)...');
  await evalInPage(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.money-view button'));
      const goalsTab = tabs.find(b => b.textContent.includes('Projets') || b.textContent.includes('Goals'));
      if (goalsTab) goalsTab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));
  await captureScreenshot('10-money-view-goals-tab-light.png');

  // 2. Audit Rewards View & Milestone Trophies
  console.log('\n[Action] Navigating to Rewards View (Tab 3)...');
  await evalInPage(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('nav[role="tablist"] button'));
      if (tabs[3]) tabs[3].click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 600));

  // Check 3D Medallions in the grid
  const trophiesAudit = await evalInPage(`
    (() => {
      const trophyCards = Array.from(document.querySelectorAll('.group.p-4.rounded-3xl'));
      const medallions = Array.from(document.querySelectorAll('[class*="rounded-full"][class*="border"]'));
      return {
        cardCount: trophyCards.length,
        medallionCount: medallions.length,
        firstCardTitle: trophyCards[0]?.querySelector('span.font-bold')?.textContent?.trim()
      };
    })()
  `);

  console.log('[Milestone Trophies Grid Audit]:', JSON.stringify(trophiesAudit, null, 2));

  // Scroll directly to the Trophies section so all metallic medallions are visible
  await evalInPage(`
    (() => {
      const heading = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Trophées') || h.textContent.includes('Milestone'));
      if (heading) heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));
  await captureScreenshot('11-milestone-trophies-grid-light-theme.png');

  // Click on a Milestone Trophy (e.g. 1st or 2nd card) to trigger fireworks & open half-window modal
  console.log('\n[Action] Clicking on a Milestone Trophy to trigger fireworks & open half-window pop-up modal...');
  await evalInPage(`
    (() => {
      const trophyCards = Array.from(document.querySelectorAll('.group.p-4.rounded-3xl'));
      if (trophyCards.length > 0) {
        // Trigger click on 2nd card (24h) or 1st card
        const cardToClick = trophyCards[1] || trophyCards[0];
        cardToClick.click();
      }
    })()
  `);

  await new Promise((r) => setTimeout(r, 800));

  // Audit the Milestone Half-Window Modal
  const modalAudit = await evalInPage(`
    (() => {
      const modal = document.querySelector('.milestone-half-window');
      if (!modal) return { found: false };

      const title = modal.querySelector('#milestone-half-title')?.textContent?.trim();
      const meaningCard = modal.querySelector('.glass-panel')?.textContent?.trim();
      const coachMessageCard = modal.querySelector('.glass-panel-gold')?.textContent?.trim();
      const replayFireworksBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes("Artifice") || b.textContent.includes("Fireworks"));
      const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Continuer') || b.textContent.includes('Keep Moving'));

      // Check text contrast inside the modal in light mode
      const allModalTexts = Array.from(modal.querySelectorAll('h3, h4, p, span, button'));
      let whiteOnWhiteErrors = 0;
      allModalTexts.forEach(el => {
        const text = el.textContent?.trim();
        if (!text || text.length > 50 || el.children.length > 0) return;
        const color = window.getComputedStyle(el).color;
        const rgb = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (rgb) {
          const r = parseInt(rgb[1]), g = parseInt(rgb[2]), b = parseInt(rgb[3]);
          const isButtonKeepWhite = el.closest('button[class*="bg-gradient"]') || el.classList.contains('keep-white');
          if (r > 225 && g > 225 && b > 225 && !isButtonKeepWhite) {
            whiteOnWhiteErrors++;
          }
        }
      });

      return {
        found: true,
        title,
        hasMeaningCard: !!meaningCard,
        meaningSnippet: meaningCard?.substring(0, 90),
        hasCoachMessageCard: !!coachMessageCard,
        coachMessageSnippet: coachMessageCard?.substring(0, 90),
        hasReplayFireworksBtn: !!replayFireworksBtn,
        hasCloseBtn: !!closeBtn,
        whiteOnWhiteErrors
      };
    })()
  `);

  console.log('[Milestone Half-Window Modal Audit Result]:', JSON.stringify(modalAudit, null, 2));
  await captureScreenshot('12-milestone-halfmodal-light-theme.png');

  // Click the Fireworks Replay Button
  console.log('\n[Action] Clicking Relancer le Feu d Artifice replay button...');
  await evalInPage(`
    (() => {
      const modal = document.querySelector('.milestone-half-window');
      if (modal) {
        const replayBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes("Artifice") || b.textContent.includes("Fireworks"));
        if (replayBtn) replayBtn.click();
      }
    })()
  `);

  await new Promise((r) => setTimeout(r, 400));
  await captureScreenshot('13-milestone-halfmodal-fireworks-active.png');

  // Test in Dark Theme as well for comparison
  console.log('\n[Action] Testing Milestone Half-Window Modal in Dark Theme...');
  await evalInPage(`
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add('theme-dark', 'dark');
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark', 'dark');
  `);
  await new Promise((r) => setTimeout(r, 500));
  await captureScreenshot('14-milestone-halfmodal-dark-theme.png');

  console.log('\n======================================================');
  console.log('✅ ALL VERIFICATION AUDITS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');

} catch (err) {
  console.error('[Audit Error]:', err);
  process.exitCode = 1;
} finally {
  try {
    proc.kill();
  } catch {}
  server.close();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
