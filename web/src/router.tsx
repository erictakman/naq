import { createRouter, type RouterHistory } from "@tanstack/react-router"

import { eventsRoute } from "@/routes/events"
import { indexRoute } from "@/routes/index"
import { paperArticleRoute, paperRoute } from "@/routes/paper"
import { rootRoute } from "@/routes/root"

const routeTree = rootRoute.addChildren([
  indexRoute,
  eventsRoute,
  paperRoute,
  paperArticleRoute,
])

export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
