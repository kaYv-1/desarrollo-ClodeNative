import { expect, test } from '@playwright/test';

test('explains denied access and returns the user to the landing page', async ({ page }) => {
  await page.goto('/403');
  await expect(page.getByText('403', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acceso restringido' })).toBeVisible();

  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Iniciar Sesión Azure AD' })).toBeVisible();

  const protectedResponse = await page.request.get('http://localhost:8080/api/me');
  expect(protectedResponse.status()).toBe(401);
});
