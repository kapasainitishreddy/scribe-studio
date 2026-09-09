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

  test('full behavioral acceptance journey', async ({ page }) => {
    test.setTimeout(360000); // 6 minutes for the full journey

    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

    // 1. Open application
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const railHome = page.locator('[data-testid="rail-mode-home"]');
    if (await railHome.isVisible()) {
      await railHome.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-hero-home.png'), fullPage: true, animations: 'disabled' });
    }

    const railWrite = page.locator('[data-testid="rail-mode-write"]');
    await railWrite.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-hero-write.png'), fullPage: true, animations: 'disabled' });

    // 2. Navigate Visualize
    const railVisualize = page.locator('[data-testid="rail-mode-visualize"]');
    await railVisualize.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-hero-visualize.png'), fullPage: true, animations: 'disabled' });

    // 3. Open 3D Studio
    const tab3DStudio = page.locator('button', { hasText: '3D Studio' });
    await expect(tab3DStudio).toBeVisible({ timeout: 10000 });
    await tab3DStudio.click();
    await page.waitForTimeout(1500);

    // Initial check
    let proj = await page.evaluate(() => (window as any).__getProjectStore());
    let initialObjectsCount = proj.scene3DObjects?.length || 0;

    // Take 1920x1080 screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-hero-3d-studio.png'), fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. Add Soldier
    const soldierCard = page.locator('[data-testid="asset-card-soldier"]');
    await soldierCard.click({ force: true });
    await page.waitForTimeout(1000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DObjects.length).toBe(initialObjectsCount + 1);
    expect(proj.scene3DObjects[proj.scene3DObjects.length - 1].kind).toBe('actor');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-add-soldier.png'), fullPage: true, animations: 'disabled' });

    // 5. Add Michelle
    const michelleCard = page.locator('[data-testid="asset-card-michelle"]');
    await michelleCard.click({ force: true });
    await page.waitForTimeout(1000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DObjects.length).toBe(initialObjectsCount + 2);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-add-michelle.png'), fullPage: true, animations: 'disabled' });

    // 6. Test duplicate shortcut
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(1000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DObjects.length).toBe(initialObjectsCount + 3);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-duplicate.png'), fullPage: true, animations: 'disabled' });

    // 7. Test delete shortcut
    await page.keyboard.press('Delete');
    await page.waitForTimeout(1000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DObjects.length).toBe(initialObjectsCount + 2);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-delete.png'), fullPage: true, animations: 'disabled' });

    // 8. Test undo shortcut
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DObjects.length).toBe(initialObjectsCount + 3);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-undo.png'), fullPage: true, animations: 'disabled' });

    // 9. Add Camera
    const cameraCard = page.locator('[data-testid="asset-card-cam-35"]');
    await cameraCard.click({ force: true });
    await page.waitForTimeout(1000);
    
    // 10. Add Light
    const lightCard = page.locator('[data-testid="asset-card-light-point"]');
    await lightCard.click({ force: true });
    await page.waitForTimeout(1000);

    // 11. Auto Block another scene
    const autoBlockBtn = page.getByText('Auto Block', { exact: true });
    await autoBlockBtn.click();
    await page.waitForTimeout(2000);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    const sceneObjects = proj.scene3DObjects;
    expect(sceneObjects.length).toBeGreaterThan(initialObjectsCount + 5); // Auto block adds camera, 2 lights, 2 actors, props
    expect(sceneObjects.some((o: any) => o.kind === 'camera')).toBeTruthy();
    expect(sceneObjects.some((o: any) => o.kind === 'light')).toBeTruthy();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-auto-block.png'), fullPage: true, animations: 'disabled' });

    // 12. Save Shot
    const saveShotBtn = page.getByText('SAVE SHOT', { exact: true });
    await saveShotBtn.click();
    await page.waitForTimeout(1500);
    
    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(proj.scene3DShots.length).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-save-shot.png'), fullPage: true, animations: 'disabled' });

    // 13. Capture Frame
    const captureFrameBtn = page.getByText('CAPTURE FRAME', { exact: true });
    await captureFrameBtn.click();
    await page.waitForTimeout(1500);

    proj = await page.evaluate(() => (window as any).__getProjectStore());
    expect(Object.keys(proj.storyboardSequences || {}).length).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-capture-frame.png'), fullPage: true, animations: 'disabled' });

    // 14. Open Storyboard (Storyboard mode tab)
    const tabStoryboard = page.locator('button', { hasText: 'Storyboard' });
    await tabStoryboard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-storyboard.png'), fullPage: true, animations: 'disabled' });

    // 15. Navigate Produce
    const railProduce = page.locator('[data-testid="rail-mode-produce"]');
    await railProduce.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-produce.png'), fullPage: true, animations: 'disabled' });

  });
});
