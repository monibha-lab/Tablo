import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Onboarding wizard', () => {
  test('step 1 requires school name', async ({ page }) => {
    // This test requires an admin session — skip in CI without test credentials
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var')

    await page.goto('/admin/setup')
    // Try clicking Continue without entering a name
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('School name is required')).toBeVisible()
  })

  test('Excel import shows preview table', async ({ page }) => {
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var')

    await page.goto('/admin/setup')
    // Navigate to step 4 (teachers)
    // Fill step 1
    await page.getByLabel('School name').fill('Test School')
    await page.getByRole('button', { name: 'Continue' }).click()
    // Skip step 2
    await page.getByRole('button', { name: 'Continue' }).click()
    // Skip step 3
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4 - import xlsx
    const xlsxPath = path.join(__dirname, 'fixtures', 'sample-import.xlsx')
    await page.locator('input[type="file"]').setInputFiles(xlsxPath)
    await expect(page.getByText('3 teachers found')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Alice Smith')).toBeVisible()
  })
})
