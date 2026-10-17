import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vite-plus/test"

import CommandPalette, { type Command } from "@/components/lab/command-palette"

const TEXT_COMMAND: Command = {
  id: "title",
  label: "Title",
  slots: [
    { name: "title", prompt: "Name this event", kind: "text", options: [] },
  ],
  message: (v) => `Titled "${v[0].value}"`,
}

const PLAIN_COMMAND: Command = {
  id: "category",
  label: "Category",
  slots: [
    {
      name: "category",
      prompt: "Which category",
      kind: "plain",
      options: [{ value: "Sales meeting" }, { value: "Internal" }],
    },
  ],
  message: (v) => `Category ${v[0].value}`,
}

function getInput() {
  return screen.getByRole("combobox")
}

describe("CommandPalette text slot", () => {
  it("shows a hint to type a value before anything is typed", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[TEXT_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Title"))
    expect(await screen.findByText("Type a value")).toBeInTheDocument()
  })

  it("shows 'Press Enter to use' the typed value and stages it as a chip on Enter", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[TEXT_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Title"))
    await screen.findByText("Type a value")
    await user.type(getInput(), "Renewal check-in — Q4 kickoff")

    expect(screen.getByText(/Press Enter to use/)).toBeInTheDocument()

    fireEvent.keyDown(getInput(), { key: "Enter" })

    expect(
      await screen.findByRole("button", { name: /Change Renewal check-in/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Apply 1 staged command/ })
    ).toBeInTheDocument()
  })

  it("does not stage anything on Enter when the query is empty", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[TEXT_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Title"))
    await screen.findByText("Type a value")
    fireEvent.keyDown(getInput(), { key: "Enter" })

    expect(screen.getByText("Type a value")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Apply 0 staged commands/ })
    ).toBeDisabled()
  })

  it("applies staged text clauses via onApply", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<CommandPalette commands={[TEXT_COMMAND]} onApply={onApply} />)

    await user.click(screen.getByText("Title"))
    await screen.findByText("Type a value")
    await user.type(getInput(), "Hello world")
    fireEvent.keyDown(getInput(), { key: "Enter" })

    const applyButton = await screen.findByRole("button", {
      name: /Apply 1 staged command/,
    })
    await user.click(applyButton)

    expect(onApply).toHaveBeenCalledTimes(1)
    const clauses = onApply.mock.calls[0][0]
    expect(clauses).toHaveLength(1)
    expect(clauses[0].command.id).toBe("title")
    expect(clauses[0].values[0].value).toBe("Hello world")
  })
})

describe("CommandPalette plain slot (regression)", () => {
  it("supports mouse click selection and stages the clause", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[PLAIN_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Category"))
    await user.click(await screen.findByText("Internal"))

    expect(
      await screen.findByRole("button", { name: /Change Internal/ })
    ).toBeInTheDocument()
  })

  it("supports arrow-key navigation and Enter selection", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[PLAIN_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Category"))
    await screen.findByRole("listbox", { name: "Which category" })

    fireEvent.keyDown(getInput(), { key: "ArrowDown" })
    fireEvent.keyDown(getInput(), { key: "Enter" })

    expect(
      await screen.findByRole("button", { name: /Change Internal/ })
    ).toBeInTheDocument()
  })

  it("pops the last chip on Backspace with an empty query", async () => {
    const user = userEvent.setup()
    render(<CommandPalette commands={[PLAIN_COMMAND]} onApply={vi.fn()} />)

    await user.click(screen.getByText("Category"))
    await user.click(await screen.findByText("Sales meeting"))
    expect(
      await screen.findByRole("button", { name: /Apply 1 staged command/ })
    ).toBeInTheDocument()

    fireEvent.keyDown(getInput(), { key: "Backspace" })

    expect(await screen.findByText("Category")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Apply 0 staged commands/ })
    ).toBeDisabled()
  })

  it("joins multiple staged clauses with 'and'", async () => {
    const user = userEvent.setup()
    render(
      <CommandPalette
        commands={[PLAIN_COMMAND, TEXT_COMMAND]}
        onApply={vi.fn()}
      />
    )

    await user.click(screen.getByText("Category"))
    await user.click(await screen.findByText("Internal"))
    await user.click(await screen.findByText("Title"))
    await screen.findByText("Type a value")
    await user.type(getInput(), "Standup")
    fireEvent.keyDown(getInput(), { key: "Enter" })

    expect(await screen.findByText("and")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Apply 2 staged commands/ })
    ).toBeInTheDocument()
  })
})
