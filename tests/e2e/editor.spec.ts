import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'artifacts/screenshots');

test.describe('Agentic Cinema E2E Studio Suite', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });

  test('navigate through workspaces and 3D studio with soldier', async ({ page }) => {
    test.setTimeout(120000);

    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR]: ${err.message}`));

    // 1. Navigate to the running Vite server
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Ensure main layout is mounted
    const railWrite = page.locator('[data-testid="rail-mode-write"]');
    await expect(railWrite).toBeVisible({ timeout: 15000 });

    // 2. Screenshot: Write Workspace
    const writePath = path.join(SCREENSHOTS_DIR, 'write-workspace.png');
    await page.screenshot({ path: writePath, fullPage: true, animations: 'disabled' });
    fs.copyFileSync(writePath, path.join(SCREENSHOTS_DIR, 'write.png'));

    // 3. Screenshot: Home Desk
    const railHome = page.locator('[data-testid="rail-mode-home"]');
    if (await railHome.isVisible()) {
      await railHome.click();
      await page.waitForTimeout(800);
      const homePath = path.join(SCREENSHOTS_DIR, 'home.png');
      await page.screenshot({ path: homePath, fullPage: true, animations: 'disabled' });
    }

    // 4. Screenshot: Produce Workspace
    const railProduce = page.locator('[data-testid="rail-mode-produce"]');
    if (await railProduce.isVisible()) {
      await railProduce.click();
      await page.waitForTimeout(800);
      const producePath = path.join(SCREENSHOTS_DIR, 'produce.png');
      await page.screenshot({ path: producePath, fullPage: true, animations: 'disabled' });
    }

    // 5. Screenshot: Perform Workspace
    const railPerform = page.locator('[data-testid="rail-mode-perform"]');
    if (await railPerform.isVisible()) {
      await railPerform.click();
      await page.waitForTimeout(800);
      const performPath = path.join(SCREENSHOTS_DIR, 'perform.png');
      await page.screenshot({ path: performPath, fullPage: true, animations: 'disabled' });
    }

    // 6. Screenshot: Visualize Workspace
    const railVisualize = page.locator('[data-testid="rail-mode-visualize"]');
    await expect(railVisualize).toBeVisible();
    await railVisualize.click();
    await page.waitForTimeout(1000);

    const visualizePath = path.join(SCREENSHOTS_DIR, 'visualize.png');
    await page.screenshot({ path: visualizePath, fullPage: true, animations: 'disabled' });

    // 7. Click 3D Studio Tab
    const tab3DStudio = page.locator('[data-testid="tab-3d-studio"]');
    await expect(tab3DStudio).toBeVisible({ timeout: 10000 });
    await tab3DStudio.click();
    await page.waitForTimeout(1500);

    // 8. Locate Asset Browser Panel & Take Screenshot
    const assetBrowser = page.locator('[data-testid="asset-browser-panel"]');
    await expect(assetBrowser).toBeVisible({ timeout: 10000 });
    const assetBrowserPath = path.join(SCREENSHOTS_DIR, 'asset-browser-panel.png');
    await assetBrowser.screenshot({ path: assetBrowserPath, animations: 'disabled' });
    fs.copyFileSync(assetBrowserPath, path.join(SCREENSHOTS_DIR, 'asset-browser.png'));

    // 9. Spawn a Soldier
    const soldierCard = page.locator('[data-testid="asset-card-soldier"]');
    await expect(soldierCard).toBeVisible({ timeout: 10000 });
    await soldierCard.click();
    await page.waitForTimeout(2000);

    // 10. Verify Soldier is selected and Inspector Panel updates
    const inspector = page.locator('[data-testid="inspector-3d-panel"]');
    await expect(inspector).toBeVisible({ timeout: 10000 });

    // 11. Move the Soldier by adjusting position inputs & using transform keys
    const posXInput = page.locator('[data-testid="input-position-x"]');
    if (await posXInput.isVisible()) {
      await posXInput.fill('2.50');
      await posXInput.dispatchEvent('change');
      await page.waitForTimeout(400);
    }

    const posZInput = page.locator('[data-testid="input-position-z"]');
    if (await posZInput.isVisible()) {
      await posZInput.fill('1.00');
      await posZInput.dispatchEvent('change');
      await page.waitForTimeout(400);
    }

    // Trigger translate shortcut 'w' to activate gizmo
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(1000);

    // 12. Screenshot: Inspector Panel
    const inspectorPath = path.join(SCREENSHOTS_DIR, 'inspector-panel.png');
    await inspector.screenshot({ path: inspectorPath, animations: 'disabled' });
    fs.copyFileSync(inspectorPath, path.join(SCREENSHOTS_DIR, 'inspector.png'));
    fs.copyFileSync(inspectorPath, path.join(SCREENSHOTS_DIR, 'object-inspector.png'));

    // 13. Screenshot: 3D Studio Workspace (with soldier spawned and moved)
    const studio3DPath = path.join(SCREENSHOTS_DIR, '3d-studio-workspace.png');
    await page.screenshot({ path: studio3DPath, fullPage: true, animations: 'disabled' });
    fs.copyFileSync(studio3DPath, path.join(SCREENSHOTS_DIR, '3d-studio.png'));

    // Verify all screenshots were created
    expect(fs.existsSync(writePath)).toBe(true);
    expect(fs.existsSync(studio3DPath)).toBe(true);
    expect(fs.existsSync(assetBrowserPath)).toBe(true);
    expect(fs.existsSync(inspectorPath)).toBe(true);
  });
});
