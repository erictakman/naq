import { CalendarDays } from "lucide-react"
import { useId } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDayMonth, type UpcomingEvent } from "@/lib/paper"

type UpcomingEventsCardProps = {
  events: UpcomingEvent[]
  audience: string
  bookingHref: string
  className?: string
}

/**
 * Events from Manager surfaced on Paper. The gradient frame is a 1px padded
 * wrapper, because `border-image` cannot follow a border radius.
 */
export function UpcomingEventsCard({
  events,
  audience,
  bookingHref,
  className,
}: UpcomingEventsCardProps): React.ReactElement {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-[28px] bg-linear-to-b from-info-muted from-40% to-border p-px shadow-floating",
        className
      )}
    >
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-4">
        <header className="flex flex-col gap-0.5 px-1">
          <h2 id={headingId} className="text-sm leading-4.5 font-semibold">
            Upcoming events
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            Planned events for {audience}
          </p>
        </header>

        <ul className="flex flex-col gap-1">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-muted"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-xl bg-info-muted text-info-foreground"
                >
                  <CalendarDays className="size-5" strokeWidth={1.5} />
                </span>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm leading-4.5 font-medium">
                    {event.title}
                  </p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    <time dateTime={event.date}>
                      {formatDayMonth(event.date)}
                    </time>
                    {" · "}
                    {event.venue}
                  </p>
                </div>
              </div>
              <Button
                variant="raised"
                size="sm"
                aria-label={`Book seat: ${event.title}`}
              >
                Book seat
              </Button>
            </li>
          ))}
        </ul>

        <footer className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs leading-4 text-muted-foreground">
            Would you like a private talk?
          </p>
          <a
            href={bookingHref}
            className="rounded-sm text-xs leading-4 font-semibold text-primary underline-offset-4 outline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Request booking
          </a>
        </footer>
      </div>
    </section>
  )
}
