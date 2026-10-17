import { createRoute } from "@tanstack/react-router"

import { EventPlanner } from "@/components/blocks/events/event-planner"
import { type EventStatus, eventStatuses } from "@/lib/events"
import { rootRoute } from "@/routes/root"

export type EventsSearch = {
  q?: string
  status?: EventStatus
  event?: string
}

// Search params come straight from the URL, so anything unexpected is dropped
// rather than trusted.
function parseEventsSearch(search: Record<string, unknown>): EventsSearch {
  const { q, status, event } = search

  return {
    q: typeof q === "string" && q !== "" ? q : undefined,
    status: eventStatuses.find((value) => value === status),
    event: typeof event === "string" && event !== "" ? event : undefined,
  }
}

export const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events",
  validateSearch: parseEventsSearch,
  component: EventsPage,
})

function EventsPage() {
  const search = eventsRoute.useSearch()
  const navigate = eventsRoute.useNavigate()

  // Typing and filtering replace the current history entry. Opening an event
  // pushes one, so the back button closes the details dialog.
  function updateSearch(next: Partial<EventsSearch>, replace = true) {
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace })
  }

  return (
    <main className="flex min-h-svh justify-center px-6 py-16 sm:items-center">
      <EventPlanner
        query={search.q ?? ""}
        onQueryChange={(q) => updateSearch({ q: q || undefined })}
        statusFilter={search.status ?? "All"}
        onStatusFilterChange={(status) =>
          updateSearch({ status: status === "All" ? undefined : status })
        }
        selectedEventId={search.event ?? null}
        onSelectedEventIdChange={(id) =>
          updateSearch({ event: id ?? undefined }, id === null)
        }
      />
    </main>
  )
}
