import { render } from "@testing-library/react"
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"

import { ThemeProvider } from "@/components/theme-provider"
import { createAppRouter } from "@/router"

// Mirrors main.tsx: the same providers, with in-memory history.
export async function renderApp(url = "/events") {
  const router = createAppRouter(
    createMemoryHistory({ initialEntries: [url] })
  )
  await router.load()

  return {
    router,
    ...render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    ),
  }
}
