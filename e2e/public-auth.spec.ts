import { expect, test } from '@playwright/test'

test.describe('public authentication surfaces', () => {
  test('gestor login renders without requiring an authenticated session', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('portal login renders the CPF flow', async ({ page }) => {
    await page.goto('/portal/login')

    await expect(page.getByRole('button', { name: /acessar/i })).toBeVisible()
    await expect(page.locator('input[name="cpf"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })
})
