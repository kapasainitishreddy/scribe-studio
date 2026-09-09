import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'artifacts/screenshots');

test.describe('Agentic Cinema E2E Master Journey', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });

  test('full hackathon master journey', async ({ page }) => {
    test.setTimeout(360000); // 6 minutes for the full journey

    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

    // 1. Open application
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // 2. Navigate Home
    const railHome = page.locator('[data-testid="rail-mode-home"]');
    if (await railHome.isVisible()) {
      await railHome.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-hero-home.png'), fullPage: true, animations: 'disabled' });
    }

    // 3. Navigate Write
    const railWrite = page.locator('[data-testid="rail-mode-write"]');
    await railWrite.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-hero-write.png'), fullPage: true, animations: 'disabled' });

    // 4. Navigate Visualize
    const railVisualize = page.locator('[data-testid="rail-mode-visualize"]');
    await railVisualize.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-hero-visualize.png'), fullPage: true, animations: 'disabled' });

    // 5. Open 3D Studio
    const tab3DStudio = page.locator('button', { hasText: '3D Studio' });
    await expect(tab3DStudio).toBeVisible({ timeout: 10000 });
    await tab3DStudio.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-hero-3d-studio.png'), fullPage: true, animations: 'disabled' });

    // 6. Add Soldier
    const soldierCard = page.locator('[data-testid="asset-card-soldier"]');
    await soldierCard.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-add-soldier.png'), fullPage: true, animations: 'disabled' });

    // 7. Add Michelle
    const michelleCard = page.locator('[data-testid="asset-card-michelle"]');
    await michelleCard.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-add-michelle.png'), fullPage: true, animations: 'disabled' });

    // 8. Transform W
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-transform-translate.png'), fullPage: true, animations: 'disabled' });

    // 9. Transform E
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-transform-rotate.png'), fullPage: true, animations: 'disabled' });

    // 10. Transform R
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-transform-scale.png'), fullPage: true, animations: 'disabled' });

    // 11. Add Camera
    const cameraCard = page.locator('[data-testid="asset-card-cam-35"]');
    await cameraCard.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-add-camera.png'), fullPage: true, animations: 'disabled' });

    // 12. Add Light
    const lightCard = page.locator('[data-testid="asset-card-light-point"]');
    await lightCard.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-add-light.png'), fullPage: true, animations: 'disabled' });

    // 13. Auto Block another scene
    const autoBlockBtn = page.getByText('Auto Block', { exact: true });
    await autoBlockBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-auto-block.png'), fullPage: true, animations: 'disabled' });

    // 14. Save Shot
    const saveShotBtn = page.getByText('SAVE SHOT', { exact: true });
    await saveShotBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-save-shot.png'), fullPage: true, animations: 'disabled' });

    // 15. Capture Frame
    const captureFrameBtn = page.getByText('CAPTURE FRAME', { exact: true });
    await captureFrameBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-capture-frame.png'), fullPage: true, animations: 'disabled' });

    // 16. Test Undo
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-undo.png'), fullPage: true, animations: 'disabled' });

    // 17. Test Redo
    await page.keyboard.press('Control+Shift+Z');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-redo.png'), fullPage: true, animations: 'disabled' });

    // 18. Test Duplicate
    await page.keyboard.press('d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-duplicate.png'), fullPage: true, animations: 'disabled' });

    // 19. Open Storyboard (Storyboard mode tab)
    const tabStoryboard = page.locator('button', { hasText: 'Storyboard' });
    await tabStoryboard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18-storyboard.png'), fullPage: true, animations: 'disabled' });

    // 20. Navigate Produce
    const railProduce = page.locator('[data-testid="rail-mode-produce"]');
    await railProduce.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19-produce.png'), fullPage: true, animations: 'disabled' });

  });
});
