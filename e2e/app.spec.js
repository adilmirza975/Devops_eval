import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ShopSmart/i);

  // Check for the actual hero heading
  await expect(page.getByText(/Shop Smarter, Live Better/i)).toBeVisible();
});

test('can filter products', async ({ page }) => {
  await page.goto('/');

  // Click on a category filter (e.g., Electronics)
  // The app loads 'All' by default, then fetches categories
  const electronicsButton = page.getByRole('button', { name: 'Electronics' });
  await expect(electronicsButton).toBeVisible({ timeout: 10000 });
  await electronicsButton.click();

  // Verify that products are visible
  await expect(page.locator('.product-card').first()).toBeVisible();
});

