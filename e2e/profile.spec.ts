/**
 * Respondent Profile — end-to-end tests
 *
 * Covers the Welcome step and all four branches of the Profile step
 * (Government, Technology, Food Processing, Other).  Each test starts
 * fresh at localhost:3000 so state never leaks between cases.
 *
 * Selector notes:
 *  - "Next" button: must use { exact: true } because Next.js dev tools injects
 *    a button labelled "Open Next.js Dev Tools" that partially matches "Next".
 *  - Select dropdowns: FieldLabel renders a <span>, not a <label>, so there is
 *    no HTML label association.  We target them as comboboxes by DOM order.
 *    (This is also filed as an accessibility bug — see bottom of file.)
 *  - Yes / No radio-style buttons: RadioOption renders <button>; use
 *    getByRole('button', { name, exact: true }) to avoid partial matches.
 */

import { test, expect, type Page } from "@playwright/test";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Exact-match locator for the "Next" submit button (avoids Next.js dev tools). */
const nextBtn = (page: Page) => page.getByRole("button", { name: "Next", exact: true });

/** Select a value from the nth combobox (0-based) currently visible on the page. */
const nthSelect = (page: Page, n: number) => page.getByRole("combobox").nth(n);

/** Click a radio-style Yes/No button by exact label. */
const radioClick = (page: Page, label: "Yes" | "No") =>
  page.getByRole("button", { name: label, exact: true }).first().click();

/** Accept both consent checkboxes and click "Get started". */
async function acceptAndStart(page: Page) {
  await page.getByLabel(/Terms.*Conditions/i).check();
  await page.getByLabel(/consent.*collection/i).check();
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { name: "Respondent profile" })).toBeVisible();
}

// ── Welcome step ─────────────────────────────────────────────────────────────

test.describe("Welcome step", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows 'Get started' disabled until both checkboxes are ticked", async ({ page }) => {
    const btn = page.getByRole("button", { name: "Get started" });
    await expect(btn).toBeDisabled();

    await page.getByLabel(/Terms.*Conditions/i).check();
    await expect(btn).toBeDisabled();

    await page.getByLabel(/Terms.*Conditions/i).uncheck();
    await page.getByLabel(/consent.*collection/i).check();
    await expect(btn).toBeDisabled();

    await page.getByLabel(/Terms.*Conditions/i).check();
    await expect(btn).toBeEnabled();
  });

  test("navigates to Profile step when both consents are given", async ({ page }) => {
    await acceptAndStart(page);
    await expect(page.getByText("What kind of organization do you work for?")).toBeVisible();
  });
});

// ── Profile step — common ────────────────────────────────────────────────────

test.describe("Profile step — org card selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
  });

  test("Next button is disabled until an org type is chosen", async ({ page }) => {
    await expect(nextBtn(page)).toBeDisabled();
  });

  test("selecting an org card reveals follow-up branch fields", async ({ page }) => {
    await page.getByText("Food Processing Business").click();
    await expect(page.getByText(/Does your business make.*food products/i)).toBeVisible();
  });

  test("switching org type hides the previous branch and shows the new one", async ({ page }) => {
    await page.getByText("Food Processing Business").click();
    await expect(page.getByText(/Does your business make.*food products/i)).toBeVisible();

    await page.getByText("Government or Business Support").click();
    await expect(page.getByText(/Does your business make.*food products/i)).not.toBeVisible();
    await expect(page.getByText(/Which organization do you work for/i)).toBeVisible();
  });
});

// ── Government path ──────────────────────────────────────────────────────────

test.describe("Profile — Government path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
    await page.getByText("Government or Business Support").click();
  });

  test("Next remains disabled until all gov fields are filled", async ({ page }) => {
    await expect(nextBtn(page)).toBeDisabled();

    // Filling only the org dropdown is not enough
    await nthSelect(page, 0).selectOption("DTI");
    await expect(nextBtn(page)).toBeDisabled();
  });

  test("completing all gov fields enables Next and advances to Register", async ({ page }) => {
    // govOrg dropdown is the first combobox
    await nthSelect(page, 0).selectOption("DTI");
    await page.getByPlaceholder(/Export Marketing Bureau/i).fill("Export Marketing Bureau");
    await radioClick(page, "Yes");

    await expect(nextBtn(page)).toBeEnabled();
    await nextBtn(page).click();
    await expect(page.getByRole("heading", { name: "Register your details" })).toBeVisible();
  });
});

// ── Technology path ──────────────────────────────────────────────────────────

test.describe("Profile — Technology / Equipment path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
    await page.getByText("Technology, Equipment, or Service Provider").click();
  });

  test("Next disabled until at least one tech type and a Yes/No answer are provided", async ({
    page,
  }) => {
    await expect(nextBtn(page)).toBeDisabled();

    await page.getByText("Packaging Company").click();
    await expect(nextBtn(page)).toBeDisabled(); // still needs techSells
  });

  test("completing all tech fields enables Next and advances to Register", async ({ page }) => {
    await page.getByText("Machinery & Equipment Supplier").click();
    await radioClick(page, "Yes");

    await expect(nextBtn(page)).toBeEnabled();
    await nextBtn(page).click();
    await expect(page.getByRole("heading", { name: "Register your details" })).toBeVisible();
  });

  test("selecting 'No' for selling to food businesses is still valid", async ({ page }) => {
    await page.getByText("Packaging Company").click();
    await radioClick(page, "No");

    await expect(nextBtn(page)).toBeEnabled();
  });

  test("multiple tech types can be selected and deselected independently", async ({ page }) => {
    await page.getByText("Packaging Company").click();
    await page.getByText("Laboratory Testing Services").click();

    // Deselect Packaging Company
    await page.getByText("Packaging Company").click();

    // Laboratory Testing Services should still be selected; complete the form
    await radioClick(page, "No");

    await expect(nextBtn(page)).toBeEnabled();
  });
});

// ── Food Processing path ─────────────────────────────────────────────────────

test.describe("Profile — Food Processing path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
    await page.getByText("Food Processing Business").click();
  });

  test("'No' to food-makes shows the disqualification screen", async ({ page }) => {
    await radioClick(page, "No");
    await expect(page.getByText("This survey may not apply to you")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Done — return to start" }),
    ).toBeVisible();
    // The normal profile form should be gone
    await expect(nextBtn(page)).not.toBeVisible();
  });

  test("can return to org card selection from the disqualification screen", async ({ page }) => {
    await radioClick(page, "No");
    await expect(page.getByText("This survey may not apply to you")).toBeVisible();
    await page.getByRole("button", { name: "Choose a different category" }).click();
    await expect(page.getByText("What kind of organization do you work for?")).toBeVisible();
  });

  test("sub-fields appear only after answering 'Yes' to food-makes", async ({ page }) => {
    await expect(page.getByPlaceholder(/dried mangoes/i)).not.toBeVisible();
    await radioClick(page, "Yes");
    await expect(page.getByPlaceholder(/dried mangoes/i)).toBeVisible();
  });

  test("Next is disabled when the products field is left empty", async ({ page }) => {
    await radioClick(page, "Yes");
    // Fill everything except products
    await page.getByText("10–99 employees").click();
    await page.getByText("Owner").click();
    await expect(nextBtn(page)).toBeDisabled();
  });

  test("completing all food fields enables Next and advances to Register", async ({ page }) => {
    await radioClick(page, "Yes");
    await page.getByPlaceholder(/dried mangoes/i).fill("Banana chips");
    await page.getByText("10–99 employees").click();
    await page.getByText("Owner").click();

    await expect(nextBtn(page)).toBeEnabled();
    await nextBtn(page).click();
    await expect(page.getByRole("heading", { name: "Register your details" })).toBeVisible();
  });
});

// ── Other path ───────────────────────────────────────────────────────────────

test.describe("Profile — Other path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
    await page.getByText("Other", { exact: true }).click();
  });

  test("org name field appears for Other category", async ({ page }) => {
    await expect(page.getByPlaceholder("Your organization or business name")).toBeVisible();
  });

  test("Next is disabled when org name is empty", async ({ page }) => {
    await expect(nextBtn(page)).toBeDisabled();
  });

  test("entering an org name enables Next", async ({ page }) => {
    await page.getByPlaceholder("Your organization or business name").fill("Test Org");
    await expect(nextBtn(page)).toBeEnabled();
  });

  test("clicking Next on Other shows the review / block screen", async ({ page }) => {
    await page.getByPlaceholder("Your organization or business name").fill("Test Org");
    await nextBtn(page).click();
    await expect(page.getByText("Thanks for your interest")).toBeVisible();
    await expect(page.getByRole("button", { name: "Done — return to start" })).toBeVisible();
  });

  test("'Done — return to start' is enabled once org name is provided on block screen", async ({
    page,
  }) => {
    await page.getByPlaceholder("Your organization or business name").fill("Test Org");
    await nextBtn(page).click();
    await expect(page.getByText("Thanks for your interest")).toBeVisible();
    await expect(page.getByRole("button", { name: "Done — return to start" })).toBeEnabled();
  });

  test("can return from Other block screen to choose a different category", async ({ page }) => {
    await page.getByPlaceholder("Your organization or business name").fill("Test Org");
    await nextBtn(page).click();
    await page.getByRole("button", { name: "Choose a different category" }).click();
    await expect(page.getByText("What kind of organization do you work for?")).toBeVisible();
  });
});

// ── Exit confirmation ─────────────────────────────────────────────────────────

test.describe("Exit survey modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await acceptAndStart(page);
  });

  test("clicking 'Exit survey' shows the confirmation modal", async ({ page }) => {
    await page.getByRole("button", { name: /Exit survey/i }).click();
    await expect(page.getByRole("heading", { name: "Exit the survey?" })).toBeVisible();
  });

  test("'Keep going' dismisses the modal without leaving the profile step", async ({ page }) => {
    await page.getByRole("button", { name: /Exit survey/i }).click();
    await page.getByRole("button", { name: "Keep going" }).click();
    await expect(page.getByRole("heading", { name: "Exit the survey?" })).not.toBeVisible();
    await expect(page.getByText("Respondent profile")).toBeVisible();
  });

  test("'Yes, exit' returns the user to the Welcome screen", async ({ page }) => {
    await page.getByRole("button", { name: /Exit survey/i }).click();
    await page.getByRole("button", { name: "Yes, exit" }).click();
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  });
});

/*
 * ── BUGS FOUND ────────────────────────────────────────────────────────────────
 *
 * BUG 1 — Accessibility: <FieldLabel> renders a <span>, not a <label>.
 *   Affected: govOrg select, govDept input, foodProducts input,
 *             and all other inputs/selects wrapped by <FieldLabel> in ProfileStep.tsx.
 *   Impact:  Screen readers cannot associate the label text with the control.
 *            Playwright's getByLabel() also fails (confirmed by test failures 6–12
 *            before this fix), so keyboard-only and AT users are affected.
 *   Fix:     Change FieldLabel's root element from <span> to <label>, or add
 *            htmlFor / aria-labelledby on each control.
 */
