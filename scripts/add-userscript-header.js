import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const header = `// ==UserScript==
// @name         Agent Browser - AI Web Automation
// @namespace    https://github.com/agent-browser/agent-browser
// @version      1.0.0
// @description  AI-powered web automation using ReAct agents with DOM manipulation
// @author       Agent Browser
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      api.openai.com
// @connect      api.anthropic.com
// @connect      *
// @run-at       document-idle
// @license      Apache-2.0
// ==/UserScript==

`;

const bundlePath = path.join(process.cwd(), 'userscript-dist', 'agent-browser.iife.js');
const outputPath = path.join(process.cwd(), 'userscript-dist', 'agent-browser.user.js');

try {
  // Read the bundled file
  const bundle = fs.readFileSync(bundlePath, 'utf-8');

  // Prepend userscript header
  const userscript = header + bundle;

  // Write the final userscript
  fs.writeFileSync(outputPath, userscript);

  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);

  console.log('✓ Userscript generated successfully!');
  console.log(`  Output: ${outputPath}`);
  console.log(`  Size: ${fileSizeKB} KB`);

  if (stats.size > 500 * 1024) {
    console.warn(`  ⚠ Warning: File size exceeds 500KB (${fileSizeKB} KB)`);
  }
} catch (error) {
  console.error('✗ Failed to generate userscript:', error.message);
  process.exit(1);
}
