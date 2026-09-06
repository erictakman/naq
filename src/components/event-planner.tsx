import * as React from "react"
import { CalendarIcon, MapPinIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { EventDetailsDialog } from "@/components/event-details-dialog"
import { FloatingNav } from "@/components/floating-nav"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import {
  RadioGroupPrimitive,
  RadioPrimitive,
} from "@/components/ui/radio-group"
import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control"
import {
  type EventItem,
  type EventStatus,
  formatEventDate,
  formatEventTimeRange,
  initialEvents,
} from "@/lib/events"

type StatusFilter = "all" | EventStatus

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "In progress", label: "In progress" },
  { value: "Done", label: "Done" },
]

const statusBadgeVariant: Record<
  EventStatus,
  NonNullable<React.ComponentProps<typeof Badge>["variant"]>
> = {
  Scheduled: "info",
  "In progress": "warning",
  Done: "success",
}

function StatusSegmentedFilter({
  value,
  onChange,
}: {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}): React.ReactElement {
  return (
    <RadioGroupPrimitive
      aria-label="Filter by status"
      className={segmentedControlRootClassName}
      value={value}
      onValueChange={(next) => onChange(next as StatusFilter)}
    >
      {statusFilters.map((filter) => (
        <RadioPrimitive.Root
          key={filter.value}
          value={filter.value}
          className={segmentedControlItemVariants({ state: "checked" })}
        >
          {filter.label}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  )
}

export function EventPlanner(): React.ReactElement {
  const [events, setEvents] = React.useState<EventItem[]>(initialEvents)
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null
  )

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null

  const filteredEvents = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter
      const matchesQuery =
        normalizedQuery === "" ||
        [event.title, event.account, event.contact, event.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [events, query, statusFilter])

  function handleCreate(event: EventItem) {
    setEvents((current) =>
      [...current, event].sort((a, b) => a.start.localeCompare(b.start))
    )
  }

  function handleUpdate(updated: EventItem) {
    setEvents((current) =>
      current
        .map((event) => (event.id === updated.id ? updated : event))
        .sort((a, b) => a.start.localeCompare(b.start))
    )
  }

  function handleDelete(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id))
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Event Planner
          </span>
          <CardTitle className="text-2xl">Upcoming events</CardTitle>
          <CardDescription>
            {events.length} event{events.length === 1 ? "" : "s"} scheduled over
            the next two weeks
          </CardDescription>
        </div>
      </CardHeader>

      <div className="flex items-center justify-end border-t px-6 py-4">
        <StatusSegmentedFilter
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <CardPanel className="p-0">
        {filteredEvents.length === 0 ? (
          <Empty className="py-12">
            <EmptyTitle>No events found</EmptyTitle>
            <EmptyDescription>
              Try a different search term or status filter.
            </EmptyDescription>
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {filteredEvents.map((event) => (
              <li
                key={event.id}
                className="flex cursor-pointer flex-col gap-3 px-6 py-4 transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
                onClick={() => setSelectedEventId(event.id)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                    keyEvent.preventDefault()
                    setSelectedEventId(event.id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="sm:w-24 sm:shrink-0">
                  <Badge variant={statusBadgeVariant[event.status]}>
                    {event.status}
                  </Badge>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    <span>{event.type}</span>
                    <span aria-hidden="true">·</span>
                    <MapPinIcon className="size-3 shrink-0 opacity-70" />
                    <span className="truncate tracking-normal normal-case">
                      {event.location}
                    </span>
                  </p>
                </div>

                <div className="sm:w-40 sm:shrink-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                    <UserIcon className="size-3.5 shrink-0 opacity-70" />
                    {event.account}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {event.contact}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Owner: {event.owner}
                  </p>
                </div>

                <div className="sm:w-32 sm:shrink-0 sm:text-right">
                  <p className="flex items-center gap-1.5 font-mono text-xs text-foreground sm:justify-end">
                    <CalendarIcon className="size-3.5 shrink-0 opacity-70" />
                    {formatEventDate(event.start)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatEventTimeRange(event.start, event.end)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>

      <EventDetailsDialog
        event={selectedEvent}
        onDelete={handleDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedEventId(null)
        }}
        onSave={handleUpdate}
        open={selectedEvent !== null}
      />

      <FloatingNav
        onCreate={handleCreate}
        onQueryChange={setQuery}
        query={query}
      />
    </Card>
  )
}
