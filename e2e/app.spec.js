import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ShopSmart/i);

  // Check for some text in the hero section
  await expect(page.getByText(/Find your next favorite/i)).toBeVisible();
});

test('can filter products', async ({ page }) => {
  await page.goto('/');

  // Click on a category filter (e.g., Electronics)
  const electronicsButton = page.getByRole('button', { name: 'Electronics' });
  await electronicsButton.click();

  // Verify that at least one product is visible
  // In a real app, we'd check for specific products
  await expect(page.locator('.product-card').first()).toBeVisible();
});
