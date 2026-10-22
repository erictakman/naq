import { createRoute } from "@tanstack/react-router"

import { ShowcasePage } from "@/components/blocks/showcase/showcase-page"
import { ToastProvider } from "@/components/ui/toast"
import { rootRoute } from "@/routes/root"

export const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/components",
  component: ComponentsPage,
})

// Toasts need a provider above the buttons that raise them. It lives here,
// not in main.tsx, until the app itself starts using toasts.
function ComponentsPage() {
  return (
    <ToastProvider>
      <ShowcasePage />
    </ToastProvider>
  )
}
