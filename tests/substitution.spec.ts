import { test, expect } from '@playwright/test'

test.describe('Substitution system', () => {
  test('substitutions page is accessible to admin', async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires admin session')
    await page.goto('/admin/substitutions')
    await expect(page.getByText('Substitutions')).toBeVisible()
  })

  test('three columns are visible: Open, Filled, Escalated', async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires admin session')
    await page.goto('/admin/substitutions')
    await expect(page.getByText('open').or(page.getByText('Open'))).toBeVisible()
    await expect(page.getByText('filled').or(page.getByText('Filled'))).toBeVisible()
    await expect(page.getByText('escalated').or(page.getByText('Escalated'))).toBeVisible()
  })
})
