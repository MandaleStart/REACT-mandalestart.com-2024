import { expect, test } from '@playwright/test';

test('nested client invoice route can be opened directly', async ({ page }) => {
  const response = await page.goto('/area-cliente/invoices/invoice-123');

  expect(response?.status()).toBe(200);
  await expect(page.locator('#contenido')).toBeVisible();
  await expect(page.locator('#root')).not.toBeEmpty();
});

test('nested admin client route can be opened directly', async ({ page }) => {
  const response = await page.goto('/administracion/clients');

  expect(response?.status()).toBe(200);
  await expect(page.locator('#contenido')).toBeVisible();
  await expect(page.locator('#root')).not.toBeEmpty();
});
