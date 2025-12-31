# End-to-End (E2E) Test Plan with Playwright

This document outlines the E2E test script for the core user journey in the "Study Buddy AI" application.

## Test Objective
To verify that a user can successfully create a study set from raw text, review the generated items, and export the set for external use.

## Framework
- **Tool**: Playwright
- **Language**: TypeScript

## Prerequisites
- A running instance of the application.
- Playwright installed in the project.
- The app should be in a state where the dashboard is visible (i.e., not the landing page).

## Test Script (`tests/e2e/main-flow.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Main User Flow: Import -> Generate -> Study -> Export', () => {

  test('should complete the full user journey successfully', async ({ page }) => {
    // Start at the root of the application
    await page.goto('/');

    // --- 1. Import & Generation ---

    // Assume the app starts on the Dashboard. Find and click the 'Create New Set' button.
    await page.getByRole('button', { name: 'Create New Set' }).click();
    await expect(page).toHaveURL(/#import/); // A way to check state, assuming URL hash changes or similar.
    await expect(page.getByRole('heading', { name: 'Create a New Study Set' })).toBeVisible();

    // The default import method is 'Paste Text'.
    // Enter some text into the textarea.
    const studyText = 'The mitochondria is the powerhouse of the cell. It generates most of the cell\'s supply of adenosine triphosphate (ATP).';
    await page.getByPlaceholder('Paste your lecture notes...').fill(studyText);
    
    // Click the 'Generate Study Set' button.
    await page.getByRole('button', { name: 'Generate Study Set' }).click();

    // Wait for the generation to complete. This involves waiting for the loading spinner to disappear
    // and for the document detail view to appear. The timeout may need to be long for real API calls.
    await expect(page.getByRole('heading', { name: 'Crafting Your Study Set...' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Crafting Your Study Set...' })).toBeHidden({ timeout: 30000 });
    
    // Check that we've landed on the Document Detail page.
    // The title should be derived from the pasted text.
    await expect(page.getByRole('heading', { name: /My Notes/ })).toBeVisible();
    await expect(page.getByText('Generated Items')).toBeVisible();

    // --- 2. Study Session ---

    // Click the 'Study this Set' button.
    await page.getByRole('button', { name: 'Study this Set' }).click();
    await expect(page.getByText(/How well did you know this?/)).not.toBeVisible(); // Answer controls shouldn't be visible yet.

    // The first card is displayed. It should be a flashcard from our text.
    await expect(page.getByText(/mitochondria/i)).toBeVisible();

    // Click 'Show Answer'.
    await page.getByRole('button', { name: 'Show Answer' }).click();
    await expect(page.getByText(/powerhouse of the cell/i)).toBeVisible();
    
    // The SRS feedback buttons should now be visible.
    await expect(page.getByText('How well did you know this?')).toBeVisible();

    // Click "I know".
    await page.getByRole('button', { name: 'Je sais' }).click();

    // This should advance to the next card or the end screen. Assuming 2 cards generated.
    // Let's click "I don't know" for the second card.
    await page.getByRole('button', { name: 'Show Answer' }).click();
    await page.getByRole('button', { name: 'Je ne sais pas' }).click();

    // After the last card, we should see the completion screen.
    await expect(page.getByRole('heading', { name: 'All Done for Now!' })).toBeVisible();

    // Click to go back to the dashboard.
    await page.getByRole('button', { name: 'Back to Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // --- 3. Export ---

    // Go to the Settings page.
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Find the exported set and trigger a JSON download.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON' }).click();
    const download = await downloadPromise;

    // Verify the download.
    expect(download.suggestedFilename()).toContain('_My_Notes');
    const path = await download.path();
    expect(path).not.toBeNull();

    console.log(`File downloaded to: ${path}`);
  });
});
```
