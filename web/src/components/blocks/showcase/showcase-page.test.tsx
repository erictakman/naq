import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderApp } from "@/test/render-app"

describe("Component showcase", () => {
  it("renders every chapter with a matching sidebar link", async () => {
    await renderApp("/components")

    const chapterTitles = [
      "Foundations",
      "Actions",
      "Labels and status",
      "Forms",
      "Feedback",
      "Overlays",
      "Navigation and disclosure",
      "Data display",
      "Paper blocks",
      "Lab",
    ]
    for (const title of chapterTitles) {
      expect(
        await screen.findByRole("heading", { level: 2, name: title })
      ).toBeInTheDocument()
    }

    const actionsLink = screen.getByRole("link", { name: "Actions" })
    expect(actionsLink).toHaveAttribute("href", "#actions")
    expect(document.getElementById("actions")).not.toBeNull()
  })
})
