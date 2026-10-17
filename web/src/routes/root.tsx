import { createRootRoute, Link, Outlet } from "@tanstack/react-router"

import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"

function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <Empty>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          <Link className="underline underline-offset-4" to="/events">
            Go to events
          </Link>
        </EmptyDescription>
      </Empty>
    </main>
  )
}

export const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
})
