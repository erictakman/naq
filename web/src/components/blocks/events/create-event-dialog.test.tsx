import { useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vite-plus/test"

import { CreateEventDialog } from "@/components/blocks/events/create-event-dialog"
import {
  formatDateValue,
  toDateValue,
} from "@/components/blocks/events/date-time-fields"
import type { EventItem } from "@/lib/events"

const TODAY = toDateValue(new Date())
// The date and time fields are pickers now, so what they hold reads off their
// accessible name rather than an input value.
const dateButton = () => screen.getByRole("button", { name: /^Date/ })

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

// The palette's escape hatch is the shortest way to the form itself.
async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Open the full form"))
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
    expect(dateButton()).toHaveAccessibleName(`Date: ${formatDateValue(TODAY)}`)
    expect(
      screen.getByRole("button", { name: "Start time: 9:00 AM" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Notes")).toHaveValue("Bring the deck")
  })

  it("opens the review form straight from the palette, no Apply needed", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await user.click(screen.getByText("Open the full form"))

    expect(screen.getByRole("button", { name: "Commands" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Event title" })).toHaveValue("")
  })

  it("carries already staged clauses into the form when skipping Apply", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await stageTitle(user, "Straight through")
    await stageDateTime(user)
    await user.click(screen.getByText("Open the full form"))

    expect(screen.getByRole("textbox", { name: "Event title" })).toHaveValue(
      "Straight through"
    )
    expect(dateButton()).toHaveAccessibleName(`Date: ${formatDateValue(TODAY)}`)
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

  it("disables Create event until a date and start time exist, then fires onCreate", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<Harness onCreate={onCreate} />)

    await stageTitle(user, "Untitled draft")
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )

    const createButton = screen.getByRole("button", { name: "Create event" })
    expect(createButton).toBeDisabled()

    // A date alone is not enough - the event still has no start time.
    await user.click(dateButton())
    await user.click(screen.getByRole("button", { name: "Today" }))
    expect(dateButton()).toHaveAccessibleName(`Date: ${formatDateValue(TODAY)}`)
    expect(createButton).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Commands" }))
    await stageDateTime(user)
    await user.click(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    )
    expect(screen.getByRole("button", { name: "Create event" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Create event" }))

    expect(onCreate).toHaveBeenCalledTimes(1)
    const created = onCreate.mock.calls[0][0] as EventItem
    expect(created.title).toBe("Untitled draft")
    expect(created.owner).toBe("Alex Kim")
    expect(created.status).toBe("Scheduled")
    expect(created.start).toBe(`${TODAY}T09:00:00.000Z`)
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
    expect(dateButton()).toHaveAccessibleName(`Date: ${formatDateValue(TODAY)}`)
  })

  it("picks the platform from a select", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    const trigger = screen.getByRole("combobox", { name: "Platform" })
    expect(trigger).toHaveTextContent("Choose platform")

    await user.click(trigger)
    await user.click(screen.getByRole("option", { name: "Zoom" }))

    expect(
      screen.getByRole("combobox", { name: "Platform" })
    ).toHaveTextContent("Zoom")
  })

  it("offers a wheel of times behind the start time field", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    await user.click(screen.getByRole("button", { name: /^Start time/ }))

    expect(
      screen.getByRole("listbox", { name: "Start time" })
    ).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "9:00 AM" })).toBeInTheDocument()
  })

  it("completes a contact from an @ mention", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    const contact = screen.getByRole("combobox", { name: "Contact" })
    await user.type(contact, "@lind")

    await user.click(await screen.findByRole("option", { name: /Lindström/ }))

    expect(contact).toHaveValue("A. Lindström")
  })

  it("adds an attendee from an @ mention, then removes them", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    const field = screen.getByRole("combobox", { name: "Add attendee" })
    await user.type(field, "@sarah")
    await user.click(await screen.findByRole("option", { name: /Sarah Chen/ }))

    expect(
      screen.getByRole("button", { name: "Remove Sarah Chen" })
    ).toBeInTheDocument()
    // The field feeds the list rather than holding the pick.
    expect(field).toHaveValue("")

    await user.click(screen.getByRole("button", { name: "Remove Sarah Chen" }))
    expect(
      screen.queryByRole("button", { name: "Remove Sarah Chen" })
    ).not.toBeInTheDocument()
  })

  it("adds an attendee typed as free text on Enter", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    await user.type(
      screen.getByRole("combobox", { name: "Add attendee" }),
      "Nadia Rossi{Enter}"
    )

    expect(
      screen.getByRole("button", { name: "Remove Nadia Rossi" })
    ).toBeInTheDocument()
  })

  it("keeps notes in a textarea that grows with its content", async () => {
    const user = userEvent.setup()
    render(<Harness onCreate={vi.fn()} />)

    await openForm(user)
    const notes = screen.getByLabelText("Notes")
    await user.type(notes, "Bring the deck")

    expect(notes).toHaveValue("Bring the deck")
    expect(notes).toHaveClass("field-sizing-content")
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
