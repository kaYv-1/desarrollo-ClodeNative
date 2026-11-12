import { expect, test } from '@playwright/test';

test('recovers from an unknown URL without exposing protected content', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Bienvenido a Pedidos360 Cloud Native' }))
    .toBeVisible();

  const protectedResponse = await page.request.get('http://localhost:8080/api/productos');
  expect(protectedResponse.status()).toBe(401);
  await expect(page.getByRole('button', { name: 'Iniciar Sesión Azure AD' })).toBeVisible();
});
