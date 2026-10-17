import { createRoute, redirect } from "@tanstack/react-router"

import { rootRoute } from "@/routes/root"

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/events", replace: true })
  },
})
