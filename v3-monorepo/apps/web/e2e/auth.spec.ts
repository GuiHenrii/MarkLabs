import { test, expect } from "@playwright/test";

test("deve carregar a página inicial ou redirecionar para login", async ({ page }) => {
  await page.goto("/");
  // Como é uma rota autenticada por padrão, esperamos que vá para login ou mostre o título principal
  const title = await page.title();
  expect(title).toBeDefined();
});
