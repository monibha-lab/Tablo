import { test, expect } from '@playwright/test'

test.describe('Sharing & export', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('PDF export returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/export/pdf/test-id/test-section')
    expect(res.status()).toBe(401)
  })

  test('expired/invalid share link returns 404', async ({ page }) => {
    await page.goto('/share/invalid-token-xyz')
    // Next.js notFound() renders a 404 page
    await expect(page).toHaveTitle(/404|Not Found/i)
  })
})
