# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: screenshot-test.spec.ts >> V2 App Screenshots >> Screenshot at 1280x800 - Capture Screen
- Location: screenshot-test.spec.ts:67:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:1420/
Call log:
  - navigating to "http://127.0.0.1:1420/", waiting until "networkidle"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | import * as path from 'path';
  4   | import { fileURLToPath } from 'url';
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = path.dirname(__filename);
  8   | const evidenceDir = path.join(__dirname, 'simulator-evidence');
  9   | 
  10  | test.describe('V2 App Screenshots', () => {
  11  |   test.beforeAll(async () => {
  12  |     if (!fs.existsSync(evidenceDir)) {
  13  |       fs.mkdirSync(evidenceDir, { recursive: true });
  14  |     }
  15  |   });
  16  | 
  17  |   test('Screenshot at 1280x800 - Start Screen', async ({ page }) => {
  18  |     await page.setViewportSize({ width: 1280, height: 800 });
  19  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
  20  |     await page.waitForTimeout(2000);
  21  |     await page.screenshot({ 
  22  |       path: path.join(evidenceDir, '1280x800-start-screen.png'),
  23  |       fullPage: true 
  24  |     });
  25  |   });
  26  | 
  27  |   test('Screenshot at 1920x1200 - Start Screen', async ({ page }) => {
  28  |     await page.setViewportSize({ width: 1920, height: 1200 });
  29  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
  30  |     await page.waitForTimeout(2000);
  31  |     await page.screenshot({ 
  32  |       path: path.join(evidenceDir, '1920x1200-start-screen.png'),
  33  |       fullPage: true 
  34  |     });
  35  |   });
  36  | 
  37  |   test('Screenshot at 1280x800 - Studio Mode', async ({ page }) => {
  38  |     await page.setViewportSize({ width: 1280, height: 800 });
  39  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
  40  |     await page.waitForTimeout(1000);
  41  |     
  42  |     // Click Start button to begin session
  43  |     await page.click('button:has-text("Bắt đầu")');
  44  |     await page.waitForTimeout(2000);
  45  |     
  46  |     await page.screenshot({ 
  47  |       path: path.join(evidenceDir, '1280x800-studio-mode.png'),
  48  |       fullPage: true 
  49  |     });
  50  |   });
  51  | 
  52  |   test('Screenshot at 1920x1200 - Studio Mode', async ({ page }) => {
  53  |     await page.setViewportSize({ width: 1920, height: 1200 });
  54  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
  55  |     await page.waitForTimeout(1000);
  56  |     
  57  |     // Click Start button to begin session
  58  |     await page.click('button:has-text("Bắt đầu")');
  59  |     await page.waitForTimeout(2000);
  60  |     
  61  |     await page.screenshot({ 
  62  |       path: path.join(evidenceDir, '1920x1200-studio-mode.png'),
  63  |       fullPage: true 
  64  |     });
  65  |   });
  66  | 
  67  |   test('Screenshot at 1280x800 - Capture Screen', async ({ page }) => {
  68  |     await page.setViewportSize({ width: 1280, height: 800 });
> 69  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:1420/
  70  |     await page.waitForTimeout(1000);
  71  |     
  72  |     // Click Start button to begin session
  73  |     await page.click('button:has-text("Bắt đầu")');
  74  |     await page.waitForTimeout(1000);
  75  |     
  76  |     // Click Continue to go to capture
  77  |     await page.click('button:has-text("Tiếp tục")');
  78  |     await page.waitForTimeout(3000);
  79  |     
  80  |     await page.screenshot({ 
  81  |       path: path.join(evidenceDir, '1280x800-capture-screen.png'),
  82  |       fullPage: true 
  83  |     });
  84  |   });
  85  | 
  86  |   test('Screenshot at 1920x1200 - Capture Screen', async ({ page }) => {
  87  |     await page.setViewportSize({ width: 1920, height: 1200 });
  88  |     await page.goto('http://127.0.0.1:1420/', { waitUntil: 'networkidle' });
  89  |     await page.waitForTimeout(1000);
  90  |     
  91  |     // Click Start button to begin session
  92  |     await page.click('button:has-text("Bắt đầu")');
  93  |     await page.waitForTimeout(1000);
  94  |     
  95  |     // Click Continue to go to capture
  96  |     await page.click('button:has-text("Tiếp tục")');
  97  |     await page.waitForTimeout(3000);
  98  |     
  99  |     await page.screenshot({ 
  100 |       path: path.join(evidenceDir, '1920x1200-capture-screen.png'),
  101 |       fullPage: true 
  102 |     });
  103 |   });
  104 | });
```