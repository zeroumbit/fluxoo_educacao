import { expect, test } from '@playwright/test'

const gestorEmail = process.env.E2E_GESTOR_EMAIL
const gestorPassword = process.env.E2E_GESTOR_PASSWORD
const professorEmail = process.env.E2E_PROFESSOR_EMAIL
const professorPassword = process.env.E2E_PROFESSOR_PASSWORD

test.describe('critical authenticated flows', () => {
  test.skip(!gestorEmail || !gestorPassword, 'Set E2E_GESTOR_EMAIL and E2E_GESTOR_PASSWORD to run gestor flows.')

  test('gestor can sign in and reach the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(gestorEmail || '')
    await page.locator('input[name="password"]').fill(gestorPassword || '')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page).toHaveURL(/\/dashboard|\/admin\/dashboard/)
    await expect(page.getByText(/Total de Alunos|Dashboard|Painel/i).first()).toBeVisible()
  })

  test('gestor can open finance reports without losing existing report UI', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(gestorEmail || '')
    await page.locator('input[name="password"]').fill(gestorPassword || '')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.goto('/financeiro-relatorios')

    await expect(page.getByText(/Relat.rio/i).first()).toBeVisible()
    await expect(page.getByText(/Fechamento Mensal/i)).toBeVisible()
  })

  test.skip(!professorEmail || !professorPassword, 'Set E2E_PROFESSOR_EMAIL and E2E_PROFESSOR_PASSWORD to run professor flows.')

  test('professor can sign in and reach the professor dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(professorEmail || '')
    await page.locator('input[name="password"]').fill(professorPassword || '')
    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page).toHaveURL(/\/professores\/dashboard/)
    await expect(page.getByText(/Agenda de Hoje|Pend.ncias|Sa.de das Turmas/i).first()).toBeVisible()
  })
})
