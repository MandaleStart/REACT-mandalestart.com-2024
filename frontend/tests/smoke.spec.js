import { expect, test } from '@playwright/test';

test('home page renders the main branding and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /M MandaleStart/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Diseño tu web/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pedir presupuesto' }).nth(1)).toBeVisible();
});

test('services page loads the catalog with its public heading', async ({ page }) => {
    await page.goto('/services');

    await expect(page).toHaveURL(/\/services$/);
    await expect(page.getByRole('heading', { name: /Servicios web y soporte técnico/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Desarrollo web' })).toBeVisible();
});
