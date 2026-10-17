import { useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vite-plus/test"

import { FloatingNav } from "@/components/blocks/events/floating-nav"
import type { EventItem } from "@/lib/events"

function Harness({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const onCreate = vi.fn<(event: EventItem) => void>()
  return (
    <FloatingNav onCreate={onCreate} onQueryChange={setQuery} query={query} />
  )
}

describe("FloatingNav rest state", () => {
  it("renders a create-event button and a search button", () => {
    render(<Harness />)

    expect(
      screen.getByRole("button", { name: "Create event" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Search events" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("searchbox", { name: "Search event names" })
    ).not.toBeInTheDocument()
  })

  it("opens the create-event dialog on click", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Create event" }))

    expect(
      screen.getByRole("combobox", { name: "Type a command" })
    ).toBeInTheDocument()
  })
})

describe("FloatingNav create dialog", () => {
  it("closes the palette on a second click instead of stranding its focus", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const createButton = screen.getByRole("button", { name: "Create event" })

    await user.click(createButton)
    expect(
      screen.getByRole("combobox", { name: "Type a command" })
    ).toBeInTheDocument()

    await user.click(createButton)

    await waitFor(() => {
      expect(
        screen.queryByRole("combobox", { name: "Type a command" })
      ).not.toBeInTheDocument()
    })
    expect(createButton).toHaveFocus()
  })

  it("still closes on Escape after the button has been clicked twice", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const createButton = screen.getByRole("button", { name: "Create event" })

    await user.click(createButton)
    await user.click(createButton)
    await user.click(createButton)
    await user.keyboard("{Escape}")

    await waitFor(() => {
      expect(
        screen.queryByRole("combobox", { name: "Type a command" })
      ).not.toBeInTheDocument()
    })
  })

  it("hands the keyboard to the search field, closing the palette", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Create event" }))
    await user.click(screen.getByRole("button", { name: "Search events" }))

    expect(
      screen.getByRole("searchbox", { name: "Search event names" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: "Type a command" })
    ).not.toBeInTheDocument()

    // The morph must hold: the old behaviour folded the field straight back
    // the moment it noticed the create flow.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Close search" })
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole("searchbox", { name: "Search event names" })
    ).toBeInTheDocument()
  })
})

describe("FloatingNav search morph", () => {
  it("morphs the search button into an input and hides the create button", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Search events" }))

    expect(
      screen.getByRole("searchbox", { name: "Search event names" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Close search" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Create event" })
      ).not.toBeInTheDocument()
    })
  })

  it("calls onQueryChange as the user types", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Search events" }))
    const input = screen.getByRole("searchbox", { name: "Search event names" })
    await user.type(input, "renewal")

    expect(input).toHaveValue("renewal")
  })

  it("clears the query and returns to rest state on Escape", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Search events" }))
    const input = screen.getByRole("searchbox", { name: "Search event names" })
    await user.type(input, "renewal")
    await user.keyboard("{Escape}")

    // The collapse plays out over a short delay, mirroring search-expand-nav's
    // staged close (panel folds, then the bar itself shrinks back).
    await waitFor(() => {
      expect(
        screen.queryByRole("searchbox", { name: "Search event names" })
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole("button", { name: "Create event" })
    ).toBeInTheDocument()
  })

  it("clears the query and returns to rest state on close button click", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Search events" }))
    const input = screen.getByRole("searchbox", { name: "Search event names" })
    await user.type(input, "renewal")
    await user.click(screen.getByRole("button", { name: "Close search" }))

    await waitFor(() => {
      expect(
        screen.queryByRole("searchbox", { name: "Search event names" })
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole("button", { name: "Create event" })
    ).toBeInTheDocument()
  })
})
