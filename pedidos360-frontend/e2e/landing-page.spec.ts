import { expect, test } from '@playwright/test';

test('renders the sign-in entry point and configured local API', async ({ page }) => {
  const configResponse = await page.request.get('/runtime-config.json');
  expect(configResponse.ok()).toBeTruthy();
  await expect(configResponse.json()).resolves.toMatchObject({
    apiGatewayUrl: 'http://localhost:8080',
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Bienvenido a Pedidos360 Cloud Native' }))
    .toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar Sesión Azure AD' }))
    .toBeVisible();
  await expect(page.getByText('Cloud commerce')).toBeVisible();
});
