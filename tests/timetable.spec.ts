import { test, expect } from '@playwright/test'

test.describe('Timetable grid', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires admin session')
  })

  test('admin can view the timetable grid', async ({ page }) => {
    await page.goto('/admin/timetable')
    await expect(page.getByText('Timetables')).toBeVisible()
  })

  test('admin can click a cell and open the edit panel', async ({ page }) => {
    await page.goto('/admin/timetable')
    // Navigate to first timetable if available
    const viewBtn = page.getByRole('button', { name: 'View' }).first()
    if (await viewBtn.isVisible()) {
      await viewBtn.click()
      const cell = page.locator('[data-testid="timetable-cell"]').first()
      if (await cell.isVisible()) {
        await cell.click()
        await expect(page.getByText('Assign period').or(page.getByText('Edit period'))).toBeVisible()
      }
    }
  })
})
