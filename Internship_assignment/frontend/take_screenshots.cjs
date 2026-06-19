const { chromium } = require('@playwright/test');
const path = require('path');

const outDir = path.join(__dirname, '..', 'screenshots');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const fs = require('fs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  try {
    // 1. Login Page
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '01_login.png') });

    // 2. Sign Up Page
    console.log('Switching to Sign Up...');
    await page.click('text=Request Access');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '02_signup.png') });

    // Login as admin
    console.log('Logging in as admin...');
    await page.click('text=Authenticate');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="Enter email or username"]', 'sarthak');
    await page.fill('input[type="password"]', 'sarthak_1204');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.task-board-wrapper');
    await page.waitForTimeout(1500); // let sockets sync

    // 3. Main Board (Empty or whatever is there)
    console.log('Taking screenshot of main board...');
    await page.screenshot({ path: path.join(outDir, '03_main_board.png') });

    // 4. Add Task Modal
    console.log('Opening Add Task Modal...');
    await page.click('text=+ New Task');
    await page.waitForSelector('.modal-box');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '04_add_task_modal.png') });

    // Close modal
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(500);

    // 5. Add 6-7 tasks (if not enough exist)
    console.log('Adding sample tasks...');
    const tasksToAdd = [
      { t: 'Integrate WebSockets', p: 'High', c: 'Feature' },
      { t: 'Fix drag and drop bug', p: 'High', c: 'Bug' },
      { t: 'Design Brutalist UI', p: 'Medium', c: 'Feature' },
      { t: 'Write E2E Tests', p: 'Low', c: 'Enhancement' },
      { t: 'Setup MongoDB schema', p: 'Medium', c: 'Enhancement' },
      { t: 'Configure Vitest', p: 'Low', c: 'Enhancement' }
    ];

    for (let t of tasksToAdd) {
      await page.click('text=+ New Task', { force: true });
      await page.waitForSelector('.modal-box');
      await page.fill('#task-title', t.t);
      await page.selectOption('#task-priority', t.p);
      await page.selectOption('#task-category', t.c);
      await page.click('button:has-text("Save Task")', { force: true });
      await page.waitForTimeout(500); // allow save to sync
    }

    // 6. Board populated
    console.log('Taking screenshot of populated board...');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '05_populated_board.png') });

    // 7. Search and Filters
    console.log('Applying search and filters...');
    await page.fill('input[placeholder="Search tasks..."]', 'bug');
    await page.click('text=High Priority');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '06_search_and_filters.png') });

    console.log('Done capturing screenshots!');
  } catch (err) {
    console.error('Error during screenshot generation:', err);
  } finally {
    await browser.close();
  }
})();
