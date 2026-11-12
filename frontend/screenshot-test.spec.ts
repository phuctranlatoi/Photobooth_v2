import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.join(__dirname, 'simulator-evidence');

test.describe('V2 App Screenshots', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }
  });

  test('Screenshot at 1280x800 - Start Screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(evidenceDir, '1280x800-start-screen.png'),
      fullPage: true 
    });
  });

  test('Screenshot at 1920x1200 - Start Screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(evidenceDir, '1920x1200-start-screen.png'),
      fullPage: true 
    });
  });

  test('Screenshot at 1280x800 - Studio Mode', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Click Start button to begin session
    await page.click('button:has-text("Bắt đầu")');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(evidenceDir, '1280x800-studio-mode.png'),
      fullPage: true 
    });
  });

  test('Screenshot at 1920x1200 - Studio Mode', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Click Start button to begin session
    await page.click('button:has-text("Bắt đầu")');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(evidenceDir, '1920x1200-studio-mode.png'),
      fullPage: true 
    });
  });

  test('Screenshot at 1280x800 - Capture Screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Click Start button to begin session
    await page.click('button:has-text("Bắt đầu")');
    await page.waitForTimeout(1000);
    
    // Click Continue to go to capture
    await page.click('button:has-text("Tiếp tục")');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(evidenceDir, '1280x800-capture-screen.png'),
      fullPage: true 
    });
  });

  test('Screenshot at 1920x1200 - Capture Screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Click Start button to begin session
    await page.click('button:has-text("Bắt đầu")');
    await page.waitForTimeout(1000);
    
    // Click Continue to go to capture
    await page.click('button:has-text("Tiếp tục")');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(evidenceDir, '1920x1200-capture-screen.png'),
      fullPage: true 
    });
  });
});