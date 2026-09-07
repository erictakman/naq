import { expect, test, type Page } from "@playwright/test"

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

async function openCreateEvent(page: Page) {
  await page.getByRole("button", { name: "Create event" }).click()
}

// Date & time seeds the draft with a date plus a 09:00-09:30 slot, which is the
// quickest way past the create button's guards.
async function stageDateTime(page: Page) {
  await page.getByText("Date & time", { exact: true }).click()
  await page.getByRole("option", { name: /Today/ }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test.describe("Floating nav — rest state", () => {
  test("shows a create-event pill and a search button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Create event" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Search events" })
    ).toBeVisible()
  })

  test("produces no console errors on load", async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await page.reload()
    await expect(
      page.getByRole("button", { name: "Create event" })
    ).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe("Create event — command palette", () => {
  test("dims the page with a backdrop and keeps the nav visible", async ({
    page,
  }) => {
    await openCreateEvent(page)

    const combobox = page.getByRole("combobox")
    await expect(combobox).toBeVisible()
    await expect(combobox).toHaveAccessibleName("Type a command")
    await expect(
      page.getByRole("button", { name: "Search events" })
    ).toBeVisible()
  })

  test("fuzzy-filters commands as you type", async ({ page }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await combobox.fill("dt")
    await expect(page.getByText("Date & time")).toBeVisible()
    await expect(page.getByText("Attendees")).not.toBeVisible()
  })

  test("stages a free-text Title clause on Enter", async ({ page }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await combobox.click()
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Renewal check-in — Q4 kickoff")
    await expect(page.getByText(/Press Enter to use/)).toBeVisible()
    await combobox.press("Enter")

    await expect(
      page.getByRole("button", { name: /Change Renewal check-in/ })
    ).toBeVisible()
  })

  test("stages a free-text Notes clause on Enter", async ({ page }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Notes", { exact: true }).click()
    await combobox.fill("Bring the deck")
    await expect(page.getByText(/Press Enter to use/)).toBeVisible()
    await combobox.press("Enter")

    await expect(
      page.getByRole("button", { name: /Change Bring the deck/ })
    ).toBeVisible()
  })

  test("supports keyboard selection for list-based commands", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Category", { exact: true }).click()
    await expect(page.getByRole("listbox")).toBeVisible()
    await combobox.press("ArrowDown")
    await combobox.press("Enter")

    await expect(
      page.getByRole("button", { name: /Change Customer call/ })
    ).toBeVisible()
  })

  test("supports mouse selection for list-based commands", async ({ page }) => {
    await openCreateEvent(page)

    await page.getByText("Platform", { exact: true }).click()
    await page.getByRole("option", { name: "Zoom" }).click()

    await expect(
      page.getByRole("button", { name: "Change Zoom" })
    ).toBeVisible()
  })

  test("joins multiple staged commands with 'and'", async ({ page }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Kickoff")
    await combobox.press("Enter")

    await page.getByText("Category", { exact: true }).click()
    await page.getByRole("option", { name: "Internal" }).click()

    await expect(page.getByText("and", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Apply 2 staged commands/ })
    ).toBeVisible()
  })

  test("Backspace on an empty query pops the last staged chip", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Category", { exact: true }).click()
    await page.getByRole("option", { name: "Internal" }).click()
    await expect(
      page.getByRole("button", { name: /Apply 1 staged command/ })
    ).toBeVisible()

    await combobox.press("Backspace")

    await expect(
      page.getByRole("button", { name: /Apply 0 staged commands/ })
    ).toBeDisabled()
  })

  test("clicking a chip rewinds to that step", async ({ page }) => {
    await openCreateEvent(page)

    await page.getByText("Category", { exact: true }).click()
    await page.getByRole("option", { name: "Internal" }).click()
    await page.getByRole("button", { name: "Change Internal" }).click()

    await expect(page.getByRole("listbox")).toBeVisible()
    await expect(page.getByRole("option", { name: "Internal" })).toBeVisible()
  })

  test("commands can be staged in any order and skipped freely", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Company", { exact: true }).click()
    await page.getByRole("option", { name: /NordicSpray AB/ }).click()
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Order independence check")
    await combobox.press("Enter")

    await expect(
      page.getByRole("button", { name: /Apply 2 staged commands/ })
    ).toBeVisible()
  })

  test("Apply expands into the review form pre-filled with staged values", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Renewal check-in — Q4 kickoff")
    await combobox.press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Renewal check-in — Q4 kickoff")
  })

  test("⌘/Ctrl+Enter also applies staged commands", async ({ page }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Shortcut apply")
    await combobox.press("Enter")
    await combobox.press("Control+Enter")

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Shortcut apply")
  })
})

test.describe("Create event — review form", () => {
  async function applyTitleAndDateTime(page: Page) {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Renewal check-in — Q4 kickoff")
    await combobox.press("Enter")

    await page.getByText("Date & time", { exact: true }).click()
    await page.getByRole("option", { name: /Today/ }).click()

    await page.getByText("Attendees", { exact: true }).click()
    await page.getByRole("option", { name: "Sarah Chen" }).click()

    await page.getByRole("button", { name: /Apply 3 staged commands/ }).click()
  }

  test("shows staged values in the right fields", async ({ page }) => {
    await applyTitleAndDateTime(page)
    const dialog = page.locator('[role="presentation"]')

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Renewal check-in — Q4 kickoff")
    await expect(
      page.getByRole("button", { name: "Start time: 9:00 AM" })
    ).toBeVisible()
    await expect(dialog.getByText("Sarah Chen", { exact: true })).toBeVisible()
  })

  test("allows direct edits to every field", async ({ page }) => {
    await applyTitleAndDateTime(page)

    await page
      .getByRole("textbox", { name: "Event title" })
      .fill("Edited title")
    await page.getByLabel("Notes").fill("Edited notes")
    await page.getByLabel("Company").fill("Acme Co")

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Edited title")
    await expect(page.getByLabel("Notes")).toHaveValue("Edited notes")
    await expect(page.getByLabel("Company")).toHaveValue("Acme Co")
  })

  test("keeps the organizer and allows removing other attendees", async ({
    page,
  }) => {
    await applyTitleAndDateTime(page)
    const dialog = page.locator('[role="presentation"]')

    await expect(dialog.getByText("Alex Kim")).toBeVisible()
    await expect(dialog.getByText("Organizer")).toBeVisible()
    await expect(
      dialog.getByRole("button", { name: "Remove Alex Kim" })
    ).toHaveCount(0)

    await dialog.getByRole("button", { name: "Remove Sarah Chen" }).click()
    await expect(dialog.getByText("Sarah Chen", { exact: true })).toHaveCount(0)
  })

  test("Back to commands preserves the draft when re-applying more", async ({
    page,
  }) => {
    await applyTitleAndDateTime(page)

    await page.getByRole("button", { name: "Back to commands" }).click()
    await expect(page.getByRole("combobox")).toBeVisible()

    await page.getByText("Notes", { exact: true }).click()
    await page.getByRole("combobox").fill("Added after going back")
    await page.getByRole("combobox").press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Renewal check-in — Q4 kickoff")
    await expect(page.getByLabel("Notes")).toHaveValue("Added after going back")
  })

  test("Create event is disabled until title, date, and start time exist", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Untitled draft")
    await combobox.press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()

    const dialog = page.locator('[role="presentation"]')
    const createButton = dialog.getByRole("button", { name: "Create event" })
    await expect(createButton).toBeDisabled()

    // A date on its own leaves the event without a start time.
    await page.getByRole("button", { name: /^Date/ }).click()
    await page.getByRole("button", { name: "Tomorrow" }).click()
    await expect(createButton).toBeDisabled()

    await page.getByRole("button", { name: /^Start time/ }).click()
    await page.getByRole("option", { name: "10:00 AM" }).click()
    await expect(
      page.getByRole("button", { name: "Start time: 10:00 AM" })
    ).toBeVisible()
    await expect(createButton).toBeEnabled()
  })

  test("Create event adds the event to the list, sorted by date, and closes the flow", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Playwright created event")
    await combobox.press("Enter")
    await stageDateTime(page)
    await page.getByRole("button", { name: /Apply 2 staged commands/ }).click()

    await page
      .locator('[role="presentation"]')
      .getByRole("button", { name: "Create event" })
      .click()

    await expect(page.getByRole("combobox")).toHaveCount(0)
    await expect(page.getByText("Playwright created event")).toBeVisible()
  })

  test("Open the full form skips Apply and carries the staged clause", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")

    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Straight to the form")
    await combobox.press("Enter")
    await page.getByText("Open the full form", { exact: true }).click()

    await expect(
      page.getByRole("textbox", { name: "Event title" })
    ).toHaveValue("Straight to the form")
  })

  test("stays fully reachable on a short viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 560 })
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Short viewport")
    await combobox.press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()

    const dialog = page.locator('[role="presentation"]')
    // Header and footer are pinned...
    await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport()
    await expect(
      dialog.getByRole("button", { name: "Create event" })
    ).toBeInViewport()
    // ...and the middle scrolls rather than falling off the screen.
    await page.getByLabel("Notes").scrollIntoViewIfNeeded()
    await expect(page.getByLabel("Notes")).toBeInViewport()
  })

  test("X close and backdrop click both discard the draft", async ({
    page,
  }) => {
    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Should be discarded")
    await combobox.press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()
    await page.getByRole("button", { name: "Close" }).click()

    await expect(page.getByText("Should be discarded")).toHaveCount(0)

    await openCreateEvent(page)
    await page.getByText("Title", { exact: true }).click()
    await page.getByRole("combobox").fill("Also discarded")
    await page.getByRole("combobox").press("Enter")
    await page.getByRole("button", { name: /Apply 1 staged command/ }).click()

    // Click the dimmed backdrop, outside the review form card.
    await page.mouse.click(4, 4)

    await expect(page.getByText("Also discarded")).toHaveCount(0)
  })
})

test.describe("Create event — form fields", () => {
  async function openForm(page: Page) {
    await openCreateEvent(page)
    await page.getByText("Open the full form", { exact: true }).click()
  }

  test("platform is a select, not free text", async ({ page }) => {
    await openForm(page)

    const trigger = page.getByRole("combobox", { name: "Platform" })
    await expect(trigger).toHaveText("Choose platform")
    await trigger.click()
    await page.getByRole("option", { name: "Google Meet" }).click()

    await expect(trigger).toHaveText("Google Meet")
  })

  test("the date field offers presets and a calendar", async ({ page }) => {
    await openForm(page)

    await page.getByRole("button", { name: /^Date/ }).click()
    await expect(page.getByRole("button", { name: "Next week" })).toBeVisible()
    await expect(page.getByRole("grid")).toBeVisible()

    // Pick a day off the calendar itself, not just a preset.
    await page.getByRole("gridcell").filter({ hasText: /^15$/ }).click()
    await expect(page.getByRole("button", { name: /^Date: / })).toBeVisible()
  })

  test("the time field is a wheel that commits when it settles", async ({
    page,
  }) => {
    await openForm(page)

    await page.getByRole("button", { name: /^End time/ }).click()
    await page.getByRole("option", { name: "11:30 AM" }).click()

    await expect(
      page.getByRole("button", { name: "End time: 11:30 AM" })
    ).toBeVisible()
  })

  test("@ completes a known contact", async ({ page }) => {
    await openForm(page)

    const contact = page.getByRole("combobox", { name: "Contact" })
    await contact.fill("@lind")
    await page.getByRole("option", { name: /Lindström/ }).click()

    await expect(contact).toHaveValue("A. Lindström")
  })

  test("@ adds an attendee, and so does Enter on a plain name", async ({
    page,
  }) => {
    await openForm(page)
    const field = page.getByRole("combobox", { name: "Add attendee" })

    await field.fill("@priya")
    await page.getByRole("option", { name: /Priya Sharma/ }).click()
    await expect(
      page.getByRole("button", { name: "Remove Priya Sharma" })
    ).toBeVisible()
    await expect(field).toHaveValue("")

    await field.fill("Nadia Rossi")
    await field.press("Enter")
    await expect(
      page.getByRole("button", { name: "Remove Nadia Rossi" })
    ).toBeVisible()

    await page.getByRole("button", { name: "Remove Priya Sharma" }).click()
    await expect(
      page.getByRole("button", { name: "Remove Priya Sharma" })
    ).toHaveCount(0)
  })

  test("the notes textarea grows with its content", async ({ page }) => {
    await openForm(page)

    const notes = page.getByLabel("Notes")
    const before = (await notes.boundingBox())!.height
    await notes.fill(["One", "Two", "Three", "Four", "Five", "Six"].join("\n"))

    expect((await notes.boundingBox())!.height).toBeGreaterThan(before)
  })
})

test.describe("Create event — the nav in front of it", () => {
  test("a second click on Create event closes the palette", async ({
    page,
  }) => {
    await openCreateEvent(page)
    await expect(page.getByRole("combobox")).toBeVisible()

    // The button is aria-hidden behind the open dialog but still on top of it,
    // so it has to be addressed by selector rather than by role.
    await page.locator('button[aria-label="Create event"]').click()

    await expect(page.getByRole("combobox")).toHaveCount(0)
  })

  test("the search button takes the palette's place instead of bouncing", async ({
    page,
  }) => {
    await openCreateEvent(page)
    await page.getByRole("button", { name: "Search events" }).click()

    const navSearch = page.getByRole("searchbox", {
      name: "Search event names",
    })
    await expect(navSearch).toBeVisible()
    await expect(page.getByRole("combobox")).toHaveCount(0)

    // The morph used to play and then roll straight back: give it the full
    // open-and-grow sequence and check the field is still there.
    await page.waitForTimeout(1000)
    await expect(navSearch).toBeVisible()
    await expect(navSearch).toBeFocused()
  })
})

test.describe("Search morph", () => {
  test("morphs the search button into an input with a close button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Search events" }).click()

    await expect(
      page.getByRole("searchbox", { name: "Search event names" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Close search" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create event" })
    ).toHaveCount(0)
  })

  test("filters the event list and stays in sync with the header search box", async ({
    page,
  }) => {
    const headerSearch = page.getByRole("searchbox", { name: "Search events" })
    await page.getByRole("button", { name: "Search events" }).click()
    const navSearch = page.getByRole("searchbox", {
      name: "Search event names",
    })

    await navSearch.fill("renewal check-in")
    await expect(headerSearch).toHaveValue("renewal check-in")
    await expect(page.getByText("Renewal check-in")).toBeVisible()
    await expect(page.getByText("Weekly sales standup")).toHaveCount(0)
  })

  test("Escape clears the query and returns to rest state", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Search events" }).click()
    const navSearch = page.getByRole("searchbox", {
      name: "Search event names",
    })
    await navSearch.fill("renewal")
    await navSearch.press("Escape")

    await expect(navSearch).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Create event" })
    ).toBeVisible()
    await expect(
      page.getByRole("searchbox", { name: "Search events" })
    ).toHaveValue("")
  })

  test("the close button clears the query and returns to rest state", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Search events" }).click()
    const navSearch = page.getByRole("searchbox", {
      name: "Search event names",
    })
    await navSearch.fill("renewal")
    await page.getByRole("button", { name: "Close search" }).click()

    await expect(navSearch).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Create event" })
    ).toBeVisible()
    await expect(
      page.getByRole("searchbox", { name: "Search events" })
    ).toHaveValue("")
  })
})

test.describe("Regression", () => {
  test("the existing header New event dialog still works", async ({ page }) => {
    await page.getByRole("button", { name: "New event" }).click()
    await expect(page.getByRole("heading", { name: "New event" })).toBeVisible()
  })

  test("clicking a row still opens the event details modal", async ({
    page,
  }) => {
    await page.getByText("Weekly sales standup").click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel("Event title")).toHaveValue(
      "Weekly sales standup"
    )
  })

  test("the event details modal scrolls on a short viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 520 })
    await page.getByText("Weekly sales standup").click()

    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("button", { name: "Save changes" })
    ).toBeInViewport()
    await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport()

    await dialog.getByLabel("Notes").scrollIntoViewIfNeeded()
    await expect(dialog.getByLabel("Notes")).toBeInViewport()
  })

  test("produces no console errors across the full create-event flow", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page)

    await openCreateEvent(page)
    const combobox = page.getByRole("combobox")
    await page.getByText("Title", { exact: true }).click()
    await combobox.fill("Console check")
    await combobox.press("Enter")
    await stageDateTime(page)
    await page.getByRole("button", { name: /Apply 2 staged commands/ }).click()
    await page
      .locator('[role="presentation"]')
      .getByRole("button", { name: "Create event" })
      .click()

    await page.getByRole("button", { name: "Search events" }).click()
    await page.getByRole("searchbox", { name: "Search event names" }).fill("x")
    await page.getByRole("button", { name: "Close search" }).click()

    expect(errors).toEqual([])
  })

  test("no overlap between the floating nav and the event list on a narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 380, height: 800 })

    const nav = page.getByRole("button", { name: "Create event" })
    await expect(nav).toBeVisible()

    const navBox = await nav.boundingBox()
    expect(navBox).not.toBeNull()
    expect(navBox!.x).toBeGreaterThanOrEqual(0)
    expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(380)
  })
})
