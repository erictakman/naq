import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CreateEventDialog } from "@/components/create-event-dialog"
import type { EventItem } from "@/lib/events"

function Harness({ onCreate }: { onCreate: (event: EventItem) => void }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return <CreateEventDialog onCreate={onCreate} onOpenChange={setOpen} />
}

async function stageTitle(
  user: ReturnType<typeof userEvent.setup>,
  title: string
) {
  await user.click(screen.getByText("Title"))
  await user.type(screen.getByRole("combobox"), title)
  await user.keyboard("{Enter}")
}

async function stageDateTime(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Date & time"))
  await user.click(screen.getByText("Today"))
}

describe("CreateEventDialog", () => {
  it("renders the command palette by default with a dimmed backdrop", () => {
    render(<Harness onCreate={vi.fn()} />)

    expect(
      screen.getByRole("combobox", { name: "Type a command" })
    ).toBeInTheDocument()
  })

  it("stages a free-text Title clause and expands into the review form on Apply", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await stageTitle(user, "Renewal check-in — Q4 kickoff")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    expect(screen.getByRole("button", { name: "Commands" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Event title" })).toHaveValue(
      "Renewal check-in — Q4 kickoff"
    )
  })

  it("merges multiple staged commands into the same draft on the review form", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await stageTitle(user, "Kickoff")
    await stageDateTime(user)
    await user.click(screen.getByText("Notes"))
    await user.type(screen.getByRole("combobox"), "Bring the deck")
    await user.keyboard("{Enter}")
    await user.click(
      screen.getByRole("button", { name: /Apply 3 staged commands/ })
    )

    expect(screen.getByRole("textbox", { name: "Event title" })).toHaveValue(
      "Kickoff"
    )
    expect(screen.getByLabelText("Date")).toHaveValue(
      new Date().toISOString().slice(0, 10)
    )
    expect(screen.getByLabelText("Start time")).toHaveValue("09:00")
    expect(screen.getByLabelText("Notes")).toHaveValue("Bring the deck")
  })

  it("keeps Alex Kim as an organizer that cannot be removed, while other attendees can be", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await user.click(screen.getByText("Attendees"))
    await user.click(screen.getByText("Sarah Chen"))
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    expect(screen.getByText("Alex Kim")).toBeInTheDocument()
    expect(screen.getByText("Organizer")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Remove Alex Kim" })
    ).not.toBeInTheDocument()

    expect(screen.getByText("Sarah Chen")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Remove Sarah Chen" }))
    expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument()
  })

  it("disables Create event until title, date, and start time are present, then fires onCreate", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<Harness onCreate={onCreate} />)

    await stageTitle(user, "Untitled draft")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    const createButton = screen.getByRole("button", { name: "Create event" })
    expect(createButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-11-01" },
    })
    expect(createButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "09:00" },
    })
    expect(createButton).toBeEnabled()

    await user.click(createButton)

    expect(onCreate).toHaveBeenCalledTimes(1)
    const created = onCreate.mock.calls[0][0] as EventItem
    expect(created.title).toBe("Untitled draft")
    expect(created.owner).toBe("Alex Kim")
    expect(created.status).toBe("Scheduled")
    expect(created.start).toBe("2026-11-01T09:00:00.000Z")
  })

  it("returns to the palette via Back to commands and preserves the draft", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await stageTitle(user, "Preserved title")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )
    await user.click(screen.getByRole("button", { name: "Commands" }))

    expect(
      screen.getByRole("combobox", { name: "Type a command" })
    ).toBeInTheDocument()

    await stageDateTime(user)
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    expect(screen.getByRole("textbox", { name: "Event title" })).toHaveValue(
      "Preserved title"
    )
    expect(screen.getByLabelText("Date")).toHaveValue(
      new Date().toISOString().slice(0, 10)
    )
  })

  it("discards the draft when closed via the X button", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    function ControlledHarness() {
      const [open, setOpen] = useState(true)
      if (!open) return null
      return (
        <CreateEventDialog
          onCreate={vi.fn()}
          onOpenChange={(next) => {
            onOpenChange(next)
            setOpen(next)
          }}
        />
      )
    }

    render(<ControlledHarness />)

    await stageTitle(user, "Will be discarded")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )
    await user.click(screen.getByRole("button", { name: "Close" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    await waitFor(() => {
      expect(screen.queryByText("Create event")).not.toBeInTheDocument()
    })
  })

  it("discards the draft when the backdrop is clicked", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    function ControlledHarness() {
      const [open, setOpen] = useState(true)
      if (!open) return null
      return (
        <CreateEventDialog
          onCreate={vi.fn()}
          onOpenChange={(next) => {
            onOpenChange(next)
            setOpen(next)
          }}
        />
      )
    }

    const { container } = render(<ControlledHarness />)

    const backdrop = container.querySelector('[role="presentation"] > div')
    expect(backdrop).not.toBeNull()
    await user.click(backdrop as Element)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
