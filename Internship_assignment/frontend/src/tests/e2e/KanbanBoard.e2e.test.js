import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ══════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Authenticate as the seeded admin user
  const loginHeader = page.getByText('System Login');
  if (await loginHeader.isVisible()) {
    await page.fill('input[placeholder="Enter email or username"]', 'sarthak');
    await page.fill('input[placeholder="Enter password"]', 'sarthak_1204');
    await page.click('button:has-text("ACCESS BOARD")');
    // Wait for the board to load
    await page.waitForSelector('.task-board-container', { state: 'visible' });
  }
});

async function openAddModal(page) {
  await page.click('#add-task-header-btn');
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
}

async function fillAndSubmitTask(page, { title, description = '', priority = 'Medium', category = 'Feature', status = 'To Do' } = {}) {
  await page.fill('#task-title', title);
  if (description) await page.fill('#task-description', description);
  await page.selectOption('#task-priority', priority);
  await page.selectOption('#task-category', category);
  await page.selectOption('#task-status', status);
  await page.click('#submit-task-btn');
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
}

// ══════════════════════════════════════════════════════════════════════
// Section 1 — Page load & layout
// ══════════════════════════════════════════════════════════════════════

test.describe('Page layout', () => {
  test('loads the app and shows the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/VYORIUS/i)).toBeVisible();
  });

  test('shows all three column headings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('shows progress stat cards on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.chart-section')).toBeVisible();
    await expect(page.locator('.stat-card.total')).toBeVisible();
  });

  test('shows WebSocket status indicator', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ws-status')).toBeVisible();
  });

  test('"New Task" button is present in the header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#add-task-header-btn')).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 2 — Kanban board – task creation
// ══════════════════════════════════════════════════════════════════════

test.describe('Task creation', () => {
  test('can open the add-task modal', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('New Task');
  });

  test('can create a task and see it on the board', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'E2E created task' });
    await expect(page.getByText('E2E created task')).toBeVisible();
  });

  test('creates task in the correct column based on status dropdown', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'In-progress task', status: 'In Progress' });

    const inProgressCol = page.locator('.column-inprogress');
    await expect(inProgressCol.getByText('In-progress task')).toBeVisible();
  });

  test('task appears with correct priority badge', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'High priority thing', priority: 'High' });

    await expect(page.locator('.priority-badge.High').first()).toBeVisible();
  });

  test('task appears with correct category badge', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'A bug fix', category: 'Bug' });

    await expect(page.locator('.category-badge').first()).toHaveText('Bug');
  });

  test('submit button is disabled when title is empty', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await expect(page.locator('#submit-task-btn')).toBeDisabled();
  });

  test('modal closes on Cancel', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('column + button opens modal with correct default status', async ({ page }) => {
    await page.goto('/');
    await page.click('#add-task-btn-in-progress');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await expect(page.locator('#task-status')).toHaveValue('In Progress');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 3 — Task deletion
// ══════════════════════════════════════════════════════════════════════

test.describe('Task deletion', () => {
  test('can delete a task and it disappears from the board', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Delete me please' });

    const card = page.locator('.task-card').filter({ hasText: 'Delete me please' });
    await card.hover();
    await card.locator('[aria-label="Delete task"]').click();

    await expect(page.getByText('Delete me please')).toBeHidden();
  });

  test('task count decreases after deletion', async ({ page }) => {
    await page.goto('/');

    // Create two tasks
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Task Alpha' });
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Task Beta' });

    // Delete first
    const card = page.locator('.task-card').filter({ hasText: 'Task Alpha' });
    await card.hover();
    await card.locator('[aria-label="Delete task"]').click();

    await expect(page.getByText('Task Alpha')).toBeHidden();
    await expect(page.locator('.stat-card.total .stat-card-value')).toHaveText('1');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 4 — Task editing
// ══════════════════════════════════════════════════════════════════════

test.describe('Task editing', () => {
  test('can open edit modal and see pre-filled values', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Original title', priority: 'Low', category: 'Feature' });

    const card = page.locator('.task-card').filter({ hasText: 'Original title' });
    await card.hover();
    await card.locator('[aria-label="Edit task"]').click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await expect(page.locator('#task-title')).toHaveValue('Original title');
    await expect(page.locator('#task-priority')).toHaveValue('Low');
  });

  test('can save edited title and see it updated', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Before edit' });

    const card = page.locator('.task-card').filter({ hasText: 'Before edit' });
    await card.hover();
    await card.locator('[aria-label="Edit task"]').click();

    await page.waitForSelector('[role="dialog"]');
    await page.fill('#task-title', 'After edit');
    await page.click('#submit-task-btn');

    await expect(page.getByText('After edit')).toBeVisible();
    await expect(page.getByText('Before edit')).toBeHidden();
  });

  test('can change task priority via edit modal', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Priority change task', priority: 'Low' });

    const card = page.locator('.task-card').filter({ hasText: 'Priority change task' });
    await card.hover();
    await card.locator('[aria-label="Edit task"]').click();

    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('#task-priority', 'High');
    await page.click('#submit-task-btn');

    await expect(card.locator('.priority-badge.High')).toBeVisible();
  });

  test('can change task category via edit modal', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Category change task', category: 'Feature' });

    const card = page.locator('.task-card').filter({ hasText: 'Category change task' });
    await card.hover();
    await card.locator('[aria-label="Edit task"]').click();

    await page.waitForSelector('[role="dialog"]');
    await page.selectOption('#task-category', 'Bug');
    await page.click('#submit-task-btn');

    await expect(card.locator('.category-badge')).toHaveText('Bug');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 5 — Dropdown select testing
// ══════════════════════════════════════════════════════════════════════

test.describe('Dropdown selects', () => {
  test('can select all priority levels', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    for (const p of ['Low', 'Medium', 'High']) {
      await page.selectOption('#task-priority', p);
      await expect(page.locator('#task-priority')).toHaveValue(p);
    }
  });

  test('can select all category options', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    for (const c of ['Feature', 'Bug', 'Enhancement']) {
      await page.selectOption('#task-category', c);
      await expect(page.locator('#task-category')).toHaveValue(c);
    }
  });

  test('can select all status column options', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    for (const s of ['To Do', 'In Progress', 'Done']) {
      await page.selectOption('#task-status', s);
      await expect(page.locator('#task-status')).toHaveValue(s);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 6 — File upload testing
// ══════════════════════════════════════════════════════════════════════

test.describe('File upload', () => {
  test('file upload zone is visible in the modal', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await expect(page.locator('#file-upload-zone')).toBeVisible();
  });

  test('uploading a valid image shows a preview', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);

    // Create a tiny valid PNG programmatically via the browser
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/png');
    });

    // Use setInputFiles for the hidden file input
    const fileInput = page.locator('#task-file-input');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });

    await expect(page.locator('#attachment-preview')).toBeVisible();
  });

  test('uploading an invalid file type shows an error', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);

    await page.locator('#task-file-input').setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ'),
    });

    await expect(page.locator('#file-error-msg')).toBeVisible();
    await expect(page.locator('#file-error-msg')).toContainText(/unsupported/i);
  });

  test('task with attachment shows attachment indicator on card', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);

    // Upload a PDF
    await page.locator('#task-file-input').setInputFiles({
      name: 'report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake'),
    });

    await page.fill('#task-title', 'Task with PDF');
    await page.click('#submit-task-btn');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    const card = page.locator('.task-card').filter({ hasText: 'Task with PDF' });
    await expect(card.locator('.task-attachment-pill')).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 7 — Graph / progress chart
// ══════════════════════════════════════════════════════════════════════

test.describe('Progress chart', () => {
  test('total task count updates when a task is added', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.stat-card.total .stat-card-value')).toHaveText('0');

    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Chart test task' });

    await expect(page.locator('.stat-card.total .stat-card-value')).toHaveText('1');
  });

  test('done count updates when task is created in Done column', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Already done', status: 'Done' });

    await expect(page.locator('.stat-card.done .stat-card-value')).toHaveText('1');
  });

  test('in-progress count reflects tasks in that column', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Ongoing task', status: 'In Progress' });

    await expect(page.locator('.stat-card.inprogress .stat-card-value')).toHaveText('1');
  });

  test('progress bar widths are visible after tasks are added', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Bar chart task', status: 'Done' });

    const doneBar = page.locator('.progress-bar-fill.done');
    await expect(doneBar).toBeVisible();
    const width = await doneBar.evaluate((el) => el.style.width);
    expect(width).toBe('100%');
  });

  test('chart re-renders dynamically as tasks are added and deleted', async ({ page }) => {
    await page.goto('/');

    // Add then delete
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Transient task' });
    await expect(page.locator('.stat-card.total .stat-card-value')).toHaveText('1');

    const card = page.locator('.task-card').filter({ hasText: 'Transient task' });
    await card.hover();
    await card.locator('[aria-label="Delete task"]').click();

    await expect(page.locator('.stat-card.total .stat-card-value')).toHaveText('0');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 8 — Drag and drop
// ══════════════════════════════════════════════════════════════════════

test.describe('Drag and drop', () => {
  test('can drag a task from To Do to In Progress', async ({ page }) => {
    await page.goto('/');
    await openAddModal(page);
    await fillAndSubmitTask(page, { title: 'Draggable task' });

    const card = page.locator('.task-card').filter({ hasText: 'Draggable task' });
    await expect(card).toBeVisible();
    
    // The drag handle is the inner card element or the card itself.
    // Using Playwright's dragTo API to move it to the In Progress column.
    const inProgressColumn = page.locator('.column-inprogress .column-content');
    await card.dragTo(inProgressColumn);

    // Verify it moved to the In Progress column
    await expect(inProgressColumn.locator('.task-card').filter({ hasText: 'Draggable task' })).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 9 — Multi-browser Real-time Sync
// ══════════════════════════════════════════════════════════════════════

test.describe('Multi-browser real-time sync', () => {
  test('task creation syncs to a second browser window automatically', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/');
    await page2.goto('/');

    // Login page1
    const loginHeader1 = page1.getByText('System Login');
    if (await loginHeader1.isVisible()) {
      await page1.fill('input[placeholder="Enter email or username"]', 'sarthak');
      await page1.fill('input[placeholder="Enter password"]', 'sarthak_1204');
      await page1.click('button:has-text("ACCESS BOARD")');
      await page1.waitForSelector('.task-board-container', { state: 'visible' });
    }

    // Login page2
    const loginHeader2 = page2.getByText('System Login');
    if (await loginHeader2.isVisible()) {
      await page2.fill('input[placeholder="Enter email or username"]', 'sarthak');
      await page2.fill('input[placeholder="Enter password"]', 'sarthak_1204');
      await page2.click('button:has-text("ACCESS BOARD")');
      await page2.waitForSelector('.task-board-container', { state: 'visible' });
    }

    const uniqueTitle = 'Sync Task ' + Date.now();

    // Create task in page1
    await page1.click('#add-task-header-btn');
    await page1.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page1.fill('#task-title', uniqueTitle);
    await page1.click('#submit-task-btn');
    await page1.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Verify it appears in page2 automatically without refreshing
    await expect(page2.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });
});
