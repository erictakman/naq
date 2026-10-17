import { render } from "@testing-library/react"
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"

import { createAppRouter } from "@/router"

export async function renderApp(url = "/events") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [url] }))
  await router.load()

  return { router, ...render(<RouterProvider router={router} />) }
}
