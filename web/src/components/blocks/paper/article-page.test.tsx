import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderApp } from "@/test/render-app"

describe("Paper article page", () => {
  it("redirects /paper to the latest article", async () => {
    const { router } = await renderApp("/paper")

    expect(router.state.location.pathname).toBe(
      "/paper/nordhavn-freight-lifts-guidance"
    )
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Nordhavn Freight lifts its outlook/,
      })
    ).toBeInTheDocument()
  })

  it("labels the trade suggestion and the sentiment for assistive tech", async () => {
    await renderApp("/paper/nordhavn-freight-lifts-guidance")

    const suggestions = await screen.findAllByRole("region", {
      name: /Suggestion for Nordhavn Freight \(NHVN\)/,
    })
    expect(suggestions.length).toBeGreaterThan(0)
    expect(
      within(suggestions[0]).getByText("Previous price")
    ).toBeInTheDocument()

    expect(
      screen.getByRole("img", { name: /Sell 8%, Hold 20%, Buy 52%/ })
    ).toBeInTheDocument()
  })

  it("shows the not-found page for an unknown article", async () => {
    await renderApp("/paper/does-not-exist")

    expect(await screen.findByText("Page not found")).toBeInTheDocument()
  })
})
