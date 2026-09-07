"use client"

import * as React from "react"
import {
  Building2Icon,
  CalendarIcon,
  ChevronDownIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBackdrop,
  DialogPortal,
  DialogPrimitive,
  DialogViewport,
} from "@/components/ui/dialog"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectPrimitive,
  SelectValue,
} from "@/components/ui/select"
import {
  type EventItem,
  type EventStatus,
  type EventType,
  eventOwners,
  eventStatuses,
  eventTypes,
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/events"
import { cn } from "@/lib/utils"

const statusDotClassName: Record<EventStatus, string> = {
  Scheduled: "bg-info",
  "In progress": "bg-warning",
  Done: "bg-success",
}

interface Attendee {
  id: string
  name: string
  email: string
  organizer?: boolean
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
}

function accountDomain(account: string): string {
  if (account === "—") return "naq.com"
  const slug = account
    .toLowerCase()
    .replace(
      /\b(inc|llc|ab|oy|co|properties|partners|facilities|installers)\b\.?/g,
      ""
    )
    .replace(/[^a-z0-9]+/g, "")
  return `${slug || "customer"}.com`
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const FIELD_ROW = "flex items-center gap-2.25 rounded-md bg-muted px-3 py-2.25"

const LABEL =
  "font-medium text-[11px] text-muted-foreground uppercase tracking-[0.04em]"

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  event: EventItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: EventItem) => void
  onDelete: (id: string) => void
}): React.ReactElement | null {
  const [form, setForm] = React.useState<EventItem | null>(event)
  const [attendees, setAttendees] = React.useState<Attendee[]>([])
  const [mentionQuery, setMentionQuery] = React.useState("")

  React.useEffect(() => {
    if (!open || !event) return
    setForm(event)
    const seeded: Attendee[] = [
      {
        id: "organizer",
        name: event.owner,
        email: `${slugify(event.owner)}@naq.com`,
        organizer: true,
      },
    ]
    if (event.contact !== "—") {
      seeded.push({
        id: "contact",
        name: event.contact,
        email: `${slugify(event.contact)}@${accountDomain(event.account)}`,
      })
    }
    setAttendees(seeded)
    setMentionQuery("")
  }, [open, event])

  if (!form) return null

  function updateField<K extends keyof EventItem>(key: K, value: EventItem[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  const suggestions = eventOwners
    .filter(
      (name) =>
        !attendees.some((attendee) => attendee.name === name) &&
        name.toLowerCase().includes(mentionQuery.trim().toLowerCase())
    )
    .slice(0, 4)

  function addAttendee(name: string) {
    setAttendees((current) => [
      ...current,
      { id: crypto.randomUUID(), name, email: `${slugify(name)}@naq.com` },
    ])
    setMentionQuery("")
  }

  function removeAttendee(id: string) {
    setAttendees((current) => current.filter((attendee) => attendee.id !== id))
  }

  function handleSave() {
    if (!form) return
    onSave(form)
    onOpenChange(false)
  }

  function handleDelete() {
    if (!form) return
    onDelete(form.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPrimitive.Popup
            // The status bar and the footer are pinned and everything between
            // them scrolls: on a short window the popup would otherwise clip
            // its own tail, taking Save changes with it.
            className="relative row-start-2 flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-120 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_24px_48px_rgb(0_0_0/22%),0_2px_8px_rgb(0_0_0/10%)] outline-none"
            data-slot="dialog-popup"
          >
            {/* Header */}
            <div className="flex flex-none items-center justify-between gap-3 px-7 pt-6 pb-3.5">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as EventStatus)
                }
              >
                <SelectPrimitive.Trigger className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1.5 pr-2 pl-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      statusDotClassName[form.status]
                    )}
                  />
                  <span className="text-xs font-medium text-foreground">
                    <SelectValue />
                  </span>
                  <SelectPrimitive.Icon>
                    <ChevronDownIcon className="size-3 shrink-0 opacity-70" />
                  </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPopup>
                  {eventStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>

              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-3" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              <div className="flex flex-col gap-3.5 px-7 pb-5">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.75">
                  <input
                    aria-label="Event title"
                    className="min-w-0 flex-1 bg-transparent text-[19px] font-semibold tracking-[-0.01em] text-foreground outline-none"
                    value={form.title}
                    onChange={(event_) =>
                      updateField("title", event_.target.value)
                    }
                  />
                  <PencilIcon className="size-3.5 shrink-0 text-muted-foreground" />
                </div>

                <div className="flex gap-2">
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      updateField("type", value as EventType)
                    }
                  >
                    <SelectPrimitive.Trigger className="flex flex-1 items-center justify-between gap-1.5 rounded-md bg-muted px-2.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="text-xs font-medium tracking-[0.02em] text-foreground">
                        <SelectValue />
                      </span>
                      <SelectPrimitive.Icon>
                        <ChevronDownIcon className="size-3 shrink-0 opacity-70" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPopup>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>

                  <div className="flex flex-1 items-center rounded-md bg-muted px-2.5 py-2">
                    <input
                      aria-label="Location"
                      className="w-full min-w-0 bg-transparent text-xs font-medium tracking-[0.02em] text-foreground outline-none"
                      value={form.location}
                      onChange={(event_) =>
                        updateField("location", event_.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-3 border-t px-7 py-4.5">
                <div className="flex flex-col gap-1.25">
                  <span className={LABEL}>Date &amp; time</span>
                  <div className={FIELD_ROW}>
                    <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-foreground">
                      {formatEventDate(form.start)} ·{" "}
                      {formatEventTimeRange(form.start, form.end)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.25">
                  <span className={LABEL}>Company &amp; contact</span>
                  <div className={FIELD_ROW}>
                    <Building2Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {form.account} — {form.contact}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.25">
                  <span className={LABEL}>Location detail</span>
                  <div className={FIELD_ROW}>
                    <VideoIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-[12.5px] text-foreground">
                      {form.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="relative flex flex-col gap-2 border-t px-7 py-4.5">
                <div className="flex items-center justify-between">
                  <span className={LABEL}>Attendees</span>
                  <span className="text-[11px] text-muted-foreground">
                    {attendees.length}{" "}
                    {attendees.length === 1 ? "person" : "people"}
                  </span>
                </div>

                <div className="flex flex-col">
                  {attendees.map((attendee) => (
                    <div
                      className="flex items-center gap-2.5 px-0.5 py-1.5"
                      key={attendee.id}
                    >
                      <span
                        className={cn(
                          "flex size-6.5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold tracking-[0.02em]",
                          attendee.organizer
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/10 text-muted-foreground"
                        )}
                      >
                        {initials(attendee.name)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {attendee.name}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {attendee.email}
                        </span>
                      </span>
                      {attendee.organizer ? (
                        <span className="shrink-0 pr-0.5 text-[11px] text-muted-foreground">
                          Organizer
                        </span>
                      ) : (
                        <button
                          aria-label={`Remove ${attendee.name}`}
                          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => removeAttendee(attendee.id)}
                          type="button"
                        >
                          <XIcon className="size-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-0.5 flex flex-col gap-1.25">
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.25 has-focus-within:shadow-[inset_0_0_0_1.5px_var(--ring)]">
                    <UserPlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                      aria-label="Loop in teammates"
                      className="w-full min-w-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                      onChange={(event_) =>
                        setMentionQuery(event_.target.value)
                      }
                      onKeyDown={(event_) => {
                        if (event_.key === "Enter" && suggestions[0]) {
                          event_.preventDefault()
                          addAttendee(suggestions[0])
                        }
                      }}
                      placeholder="Loop in teammates…"
                      value={mentionQuery}
                    />
                  </div>

                  {mentionQuery.trim() !== "" && suggestions.length > 0 && (
                    <div className="absolute top-[calc(100%-1.75rem)] left-7 z-10 flex w-50 flex-col gap-0.5 rounded-xl border bg-popover p-1 shadow-lg/5">
                      {suggestions.map((name) => (
                        <button
                          className="flex items-center gap-2.25 rounded-md px-2 py-1.5 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                          key={name}
                          onClick={() => addAttendee(name)}
                          type="button"
                        >
                          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold tracking-[0.02em] text-foreground/80">
                            {initials(name)}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="text-[12px] font-medium text-foreground">
                              {name}
                            </span>
                            <span className="text-[10.5px] text-muted-foreground">
                              @{slugify(name).replace(/\./g, "")}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.25 px-7 pt-0.5 pb-5">
                <span className={LABEL}>Notes</span>
                <textarea
                  aria-label="Notes"
                  className="min-h-20 w-full resize-none rounded-md bg-muted px-3 py-2.5 text-[13px] leading-[150%] text-foreground outline-none placeholder:text-muted-foreground"
                  onChange={(event_) =>
                    updateField("notes", event_.target.value)
                  }
                  value={form.notes}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-none items-center justify-between gap-2.5 rounded-b-2xl border-t bg-muted px-7 py-4">
              <button
                className="flex items-center gap-1.5 rounded-sm px-1 py-2 text-[13px] font-medium text-destructive transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleDelete}
                type="button"
              >
                <Trash2Icon className="size-3.5" />
                Delete event
              </button>
              <div className="flex items-center gap-2.5">
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save changes</Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  )
}
