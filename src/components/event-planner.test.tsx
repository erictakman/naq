import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { EventPlanner } from "@/components/event-planner"

describe("EventPlanner", () => {
  it("filters the event list as the floating nav search box is used", async () => {
    const user = userEvent.setup()
    render(<EventPlanner />)

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
    render(<EventPlanner />)

    await user.click(screen.getByRole("button", { name: "Create event" }))
    await user.click(screen.getByText("Title"))
    await user.type(screen.getByRole("combobox"), "Brand new sync")
    await user.keyboard("{Enter}")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-08-01" },
    })
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "09:00" },
    })

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
    render(<EventPlanner />)

    await user.click(screen.getByText("Weekly sales standup"))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Weekly sales standup")).toBeInTheDocument()
  })
})
