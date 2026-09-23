import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

async function runE2ETest() {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('🚀 Starting Vite preview/dev server...');
  const server = spawn('npm', ['run', 'preview', '--workspace=@tokenpilot/desktop', '--', '--port', '5173'], {
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log(`[Vite] ${d}`));
  server.stderr.on('data', (d) => console.error(`[Vite ERR] ${d}`));

  // Wait for server to start
  await new Promise((r) => setTimeout(r, 2000));

  console.log('🌐 Launching Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 840 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  try {
    console.log('📸 1. Navigating to Dashboard...');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '01_dashboard.png') });
    console.log('   Saved 01_dashboard.png');

    console.log('📸 2. Clicking "USE MY CREDIT" CTA...');
    await page.click('button:has-text("USE MY CREDIT")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '02_wizard_step1.png') });
    console.log('   Saved 02_wizard_step1.png');

    console.log('📸 3. Progressing through configuration...');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '03_wizard_configure.png') });
    console.log('   Saved 03_wizard_configure.png');

    await page.click('button:has-text("Select Account")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Security Review")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '04_wizard_security.png') });
    console.log('   Saved 04_wizard_security.png');

    console.log('📸 4. Running Preflight checks...');
    await page.click('button:has-text("Run Preflight Checks")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '05_preflight_passed.png') });
    console.log('   Saved 05_preflight_passed.png');

    console.log('📸 5. Advancing to Final Authorization Screen...');
    await page.click('button:has-text("Proceed to Final Authorization")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '06_run_job_screen.png') });
    console.log('   Saved 06_run_job_screen.png');

    console.log('📸 6. Authorizing job with RUN JOB click...');
    await page.click('button:has-text("RUN JOB")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '07_job_console_running.png') });
    console.log('   Saved 07_job_console_running.png');

    console.log('⏳ Waiting for job completion (sandbox simulation)...');
    await page.waitForSelector('button:has-text("View Results")', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '08_job_console_completed.png') });
    console.log('   Saved 08_job_console_completed.png');

    console.log('📸 7. Viewing Results...');
    await page.click('button:has-text("View Results")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '09_job_results.png') });
    console.log('   Saved 09_job_results.png');

    console.log('📸 8. Navigating to System Doctor...');
    await page.click('button:has-text("Doctor")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '10_system_doctor.png') });
    console.log('   Saved 10_system_doctor.png');

    console.log('📸 9. Navigating to Audit Log...');
    await page.click('button:has-text("Audit Log")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '11_audit_log.png') });
    console.log('   Saved 11_audit_log.png');

    console.log('🎉 E2E TEST COMPLETED SUCCESSFULLY! All screenshots captured.');
  } finally {
    await browser.close();
    server.kill();
  }
}

runE2ETest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
