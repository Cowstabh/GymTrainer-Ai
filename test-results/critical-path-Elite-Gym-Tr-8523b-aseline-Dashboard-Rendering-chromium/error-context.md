# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-path.spec.ts >> Elite Gym Trainer - Automated Test Suite >> Positive Flow: Natural Language Baseline & Dashboard Rendering
- Location: tests/critical-path.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Journey Type')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Journey Type')

```

```yaml
- link "Back to Home":
  - /url: /
- heading "Welcome Back" [level=2]
- paragraph: Enter your credentials to access your account
- text: Username
- textbox
- text: Password
- textbox
- button "Sign In"
- button "Don't have an account? Sign up"
- alert
- button
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Elite Gym Trainer - Automated Test Suite', () => {
  4  | 
  5  |   test.beforeEach(async ({ page, context }) => {
  6  |     // 1. Set the NextAuth session token cookie to bypass local auth checks
  7  |     await context.addCookies([
  8  |       {
  9  |         name: 'next-auth.session-token',
  10 |         value: 'mock-token',
  11 |         domain: 'localhost',
  12 |         path: '/',
  13 |       }
  14 |     ]);
  15 | 
  16 |     // 2. Mock the NextAuth session API so useSession returns a valid user
  17 |     await page.route('**/api/auth/session', async route => {
  18 |       await route.fulfill({
  19 |         status: 200,
  20 |         contentType: 'application/json',
  21 |         body: JSON.stringify({
  22 |           user: { name: 'TestUser', email: 'test@example.com', id: 'test-user-123' },
  23 |           expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  24 |         })
  25 |       });
  26 |     });
  27 |   });
  28 | 
  29 |   test('Positive Flow: Natural Language Baseline & Dashboard Rendering', async ({ page }) => {
  30 |     await page.route('/api/onboarding/veteran', async route => {
  31 |       await route.fulfill({ json: { success: true } });
  32 |     });
  33 | 
  34 |     await page.goto('/onboarding');
> 35 |     await expect(page.locator('text=Journey Type')).toBeVisible({ timeout: 5000 });
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  36 | 
  37 |     await page.fill('input[name="age"]', '28');
  38 |     await page.fill('input[name="height"]', '175');
  39 |     await page.fill('input[name="weight"]', '82');
  40 |     await page.selectOption('select[name="goal"]', 'Build Muscle');
  41 |     await page.fill('input[name="timeframe"]', '6');
  42 |     await page.fill('input[name="daysPerWeek"]', '4');
  43 |     
  44 |     await page.click('input[value="resuming"]');
  45 |     await page.click('button[type="submit"]');
  46 | 
  47 |     await expect(page.locator('text=Operational Situation Report')).toBeVisible();
  48 |     await page.fill('textarea[name="rawText"]', 'Bench press 70kg 4x8, Squats 100kg 3x5. No injuries.');
  49 |     await page.click('button[type="submit"]');
  50 | 
  51 |     await expect(page).toHaveURL(/.*dashboard/);
  52 |     await expect(page.locator('text=GENERATE NEW TACTICAL MATRIX')).toBeVisible();
  53 | 
  54 |     await page.route('/api/ai/schedule', async route => {
  55 |       await route.fulfill({
  56 |         json: {
  57 |           plan: {
  58 |             preFlightIgnition: "Prepare for combat.",
  59 |             tacticalExecutionMatrix: [
  60 |               {
  61 |                 day: "Monday",
  62 |                 focus: "Kinetic Strike: Chest",
  63 |                 durationMinutes: 45,
  64 |                 intensity: "Maximum",
  65 |                 exercises: [
  66 |                   { 
  67 |                     name: "Tactical Bench Press", 
  68 |                     sets: 4, 
  69 |                     reps: "8-10", 
  70 |                     targetWeight: "70kg",
  71 |                     progressiveOverloadLogic: "Overload established." 
  72 |                   }
  73 |                 ]
  74 |               }
  75 |             ]
  76 |           }
  77 |         }
  78 |       });
  79 |     });
  80 | 
  81 |     await page.click('button:has-text("GENERATE NEW TACTICAL MATRIX")');
  82 |     await expect(page.locator('text=Kinetic Strike: Chest')).toBeVisible();
  83 |     await expect(page.locator('text=Tactical Bench Press')).toBeVisible();
  84 |     await expect(page.locator('text=70kg')).toBeVisible();
  85 |   });
  86 | 
  87 |   test('Negative Flow: Missing Local Storage Rejects Generation', async ({ page }) => {
  88 |     await page.goto('/dashboard');
  89 |     // Ensure we see the 'Complete Profile' warning because localStorage has no bioData
  90 |     await expect(page.locator('text=Complete Profile to Generate')).toBeVisible();
  91 |     const generateBtn = page.locator('button:has-text("GENERATE NEW TACTICAL MATRIX")');
  92 |     await expect(generateBtn).toHaveCount(0);
  93 |   });
  94 | 
  95 | });
  96 | 
```