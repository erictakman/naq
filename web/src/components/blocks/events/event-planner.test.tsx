import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vite-plus/test"

import { renderApp } from "@/test/render-app"

describe("EventPlanner", () => {
  it("filters the event list as the floating nav search box is used", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Search events" }))
    await user.type(
      screen.getByRole("searchbox", { name: "Search event names" }),
      "renewal check-in"
    )

    expect(screen.getByText("Renewal check-in")).toBeInTheDocument()
    expect(screen.queryByText("Weekly sales standup")).not.toBeInTheDocument()
  })

  it("adds an event created via the floating nav to the sorted list", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByRole("button", { name: "Create event" }))
    await user.click(screen.getByText("Title"))
    await user.type(screen.getByRole("combobox"), "Brand new sync")
    await user.keyboard("{Enter}")
    // Date & time seeds the draft with a date and a 09:00 start, which is what
    // makes the event creatable.
    await user.click(screen.getByText("Date & time"))
    await user.click(screen.getByText("Today"))
    await user.click(
      screen.getByRole("button", { name: /Apply 2 staged commands/ })
    )

    const dialogRoot = document.querySelector('[role="presentation"]')
    expect(dialogRoot).not.toBeNull()
    await user.click(
      within(dialogRoot as HTMLElement).getByRole("button", {
        name: "Create event",
      })
    )

    expect(screen.getByText("Brand new sync")).toBeInTheDocument()
    expect(screen.getByText(/events? scheduled/)).toBeInTheDocument()
  })

  it("still opens the event details dialog when a row is clicked", async () => {
    const user = userEvent.setup()
    await renderApp()

    await user.click(screen.getByText("Weekly sales standup"))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Weekly sales standup")).toBeInTheDocument()
  })
})

describe("EventPlanner URL state", () => {
  it("restores the search, status filter and open event from the URL", async () => {
    await renderApp("/events?q=standup&status=Scheduled&event=evt-standup")

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Weekly sales standup")).toBeInTheDocument()
    expect(
      screen.queryByText("Q3 Pipeline Review — North Region")
    ).not.toBeInTheDocument()
  })

  it("writes the selected event to the URL and closes it on back", async () => {
    const user = userEvent.setup()
    const { router } = await renderApp()

    await user.click(screen.getByText("Weekly sales standup"))
    expect(router.state.location.search).toEqual({ event: "evt-standup" })

    router.history.back()

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(router.state.location.search).toEqual({})
  })

  it("ignores invalid search params", async () => {
    const { router } = await renderApp("/events?status=Bogus")

    expect(router.state.location.search).toEqual({})
    expect(screen.getByText("Weekly sales standup")).toBeInTheDocument()
  })

  it("redirects / to /events", async () => {
    const { router } = await renderApp("/")

    expect(router.state.location.pathname).toBe("/events")
  })
})
