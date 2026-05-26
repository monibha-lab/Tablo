import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('unauthenticated access to /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin/timetable')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /teacher redirects to /login', async ({ page }) => {
    await page.goto('/teacher/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 })
  })
})
