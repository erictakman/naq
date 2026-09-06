"use client"

import * as React from "react"
import {
  Building2Icon,
  CalendarIcon,
  ChevronLeftIcon,
  FileTextIcon,
  TagIcon,
  TextIcon,
  UsersIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import CommandPalette, {
  type Command,
  type CommandOption,
} from "@/components/lab/command-palette"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type EventItem,
  type EventType,
  eventOwners,
  eventTypes,
  initialEvents,
} from "@/lib/events"
import { cn } from "@/lib/utils"

const PLATFORM_OPTIONS = [
  "Zoom",
  "Google Meet",
  "Phone",
  "Email",
  "In-person",
  "Notion",
]

const KNOWN_ACCOUNTS: [string, string][] = Array.from(
  new Map(
    initialEvents
      .filter((event) => event.account !== "—")
      .map((event) => [event.account, event.contact] as const)
  )
)

function dateFmt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function addDays(offset: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const DATE_PRESETS = [
  { value: "Today", offset: 0 },
  { value: "Tomorrow", offset: 1 },
  { value: "Next week", offset: 7 },
  { value: "Next month", offset: 30 },
].map((preset) => ({
  ...preset,
  hint: dateFmt(addDays(preset.offset)),
  date: isoDate(addDays(preset.offset)),
}))

const COMMANDS: Command[] = [
  {
    id: "title",
    label: "Title",
    icon: <TextIcon className="size-3.5" />,
    slots: [
      { name: "title", prompt: "Name this event", kind: "text", options: [] },
    ],
    message: (v) => `Titled "${v[0].value}"`,
  },
  {
    id: "category",
    label: "Category",
    icon: <TagIcon className="size-3.5" />,
    slots: [
      {
        name: "category",
        prompt: "Which category",
        kind: "plain",
        options: eventTypes.map((type) => ({ value: type })),
      },
    ],
    message: (v) => `Category ${v[0].value}`,
  },
  {
    id: "datetime",
    label: "Date & time",
    icon: <CalendarIcon className="size-3.5" />,
    slots: [
      {
        name: "datetime",
        prompt: "When is it",
        kind: "plain",
        options: DATE_PRESETS.map(({ value, hint }) => ({ value, hint })),
      },
    ],
    message: (v) => `Set for ${v[0].value.toLowerCase()}`,
  },
  {
    id: "platform",
    label: "Platform",
    icon: <VideoIcon className="size-3.5" />,
    slots: [
      {
        name: "platform",
        prompt: "Where does it happen",
        kind: "plain",
        options: PLATFORM_OPTIONS.map((value) => ({ value })),
      },
    ],
    message: (v) => `Platform ${v[0].value}`,
  },
  {
    id: "company",
    label: "Company",
    icon: <Building2Icon className="size-3.5" />,
    slots: [
      {
        name: "company",
        prompt: "Which company",
        kind: "plain",
        options: KNOWN_ACCOUNTS.map(([account, contact]) => ({
          value: account,
          hint: contact,
        })),
      },
    ],
    message: (v) => `Company ${v[0].value}`,
  },
  {
    id: "attendees",
    label: "Attendees",
    icon: <UsersIcon className="size-3.5" />,
    slots: [
      {
        name: "attendee",
        prompt: "Loop in who",
        kind: "person",
        options: eventOwners.map((name) => ({ value: name })),
      },
    ],
    message: (v) => `Looped in ${v[0].value}`,
  },
  {
    id: "notes",
    label: "Notes",
    icon: <FileTextIcon className="size-3.5" />,
    slots: [{ name: "notes", prompt: "Add a note", kind: "text", options: [] }],
    message: (v) => `Noted "${v[0].value}"`,
  },
]

interface Draft {
  title: string
  type: EventType
  location: string
  account: string
  contact: string
  date: string
  startTime: string
  endTime: string
  notes: string
  attendees: string[]
}

const emptyDraft: Draft = {
  title: "",
  type: "Sales meeting",
  location: "",
  account: "",
  contact: "",
  date: "",
  startTime: "",
  endTime: "",
  notes: "",
  attendees: [],
}

function buildIso(date: string, time: string): string {
  return `${date}T${time}:00.000Z`
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
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

export function CreateEventDialog({
  onOpenChange,
  onCreate,
}: {
  onOpenChange: (open: boolean) => void
  onCreate: (event: EventItem) => void
}): React.ReactElement {
  const [step, setStep] = React.useState<"palette" | "review">("palette")
  const [draft, setDraft] = React.useState<Draft>(emptyDraft)
  const [paletteIdle, setPaletteIdle] = React.useState(true)
  const panelRef = React.useRef<HTMLDivElement>(null)

  function close() {
    onOpenChange(false)
  }

  // A minimal Tab trap: keep keyboard focus cycling inside the dialog instead
  // of leaking out to the dimmed page behind it. Escape only closes the whole
  // dialog once the palette has nothing left of its own to pop (empty query,
  // no open command, nothing staged) - otherwise the palette's own handler
  // gets first say, matching how it behaves everywhere else it's used.
  function handleDialogKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      if (step === "review" || paletteIdle) {
        event.preventDefault()
        close()
      }
      return
    }
    if (event.key !== "Tab") return
    const root = panelRef.current
    if (!root) return
    const focusables = [
      ...root.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ),
    ]
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    } else if (!active || !focusables.includes(active)) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    }
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleApply(
    clauses: { command: Command; values: CommandOption[] }[]
  ) {
    setDraft((current) => {
      const next = { ...current }
      for (const clause of clauses) {
        const value = clause.values[0]?.value
        if (value === undefined) continue
        switch (clause.command.id) {
          case "title":
            next.title = value
            break
          case "category":
            next.type = value as EventType
            break
          case "datetime": {
            const preset = DATE_PRESETS.find((option) => option.value === value)
            if (preset) {
              next.date = preset.date
              next.startTime = "09:00"
              next.endTime = "09:30"
            }
            break
          }
          case "platform":
            next.location = value
            break
          case "company": {
            const match = KNOWN_ACCOUNTS.find(([account]) => account === value)
            next.account = value
            next.contact = match?.[1] ?? ""
            break
          }
          case "attendees":
            if (!next.attendees.includes(value))
              next.attendees = [...next.attendees, value]
            break
          case "notes":
            next.notes = value
            break
          default:
            break
        }
      }
      return next
    })
    setStep("review")
  }

  function handleCreate() {
    if (!draft.title.trim() || !draft.date || !draft.startTime) return
    const endTime = draft.endTime || draft.startTime
    onCreate({
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      type: draft.type,
      status: "Scheduled",
      start: buildIso(draft.date, draft.startTime),
      end: buildIso(draft.date, endTime),
      account: draft.account.trim() || "—",
      contact: draft.contact.trim() || "—",
      location: draft.location.trim() || "—",
      owner: "Alex Kim",
      notes: draft.notes.trim(),
    })
    close()
  }

  const canCreate =
    draft.title.trim() !== "" && draft.date !== "" && draft.startTime !== ""

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center pb-24"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/32" onClick={close} />
      <div
        aria-label="Create event"
        aria-modal="true"
        className="relative z-10"
        onKeyDown={handleDialogKeyDown}
        ref={panelRef}
        role="dialog"
      >
        {step === "palette" ? (
          <CommandPalette
            commands={COMMANDS}
            onApply={handleApply}
            onStateChange={(state) =>
              setPaletteIdle(state.query === "" && state.chips.length === 0)
            }
            width="max-w-[46rem]"
          />
        ) : (
          <ReviewForm
            canCreate={canCreate}
            draft={draft}
            onBack={() => setStep("palette")}
            onChange={updateDraft}
            onClose={close}
            onCreate={handleCreate}
          />
        )}
      </div>
    </div>
  )
}

const FIELD_ROW = "flex items-center gap-2.25 rounded-md bg-muted px-3 py-2.25"
const LABEL =
  "font-medium text-[11px] text-muted-foreground uppercase tracking-[0.04em]"

function ReviewForm({
  draft,
  canCreate,
  onChange,
  onBack,
  onClose,
  onCreate,
}: {
  draft: Draft
  canCreate: boolean
  onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void
  onBack: () => void
  onClose: () => void
  onCreate: () => void
}): React.ReactElement {
  function removeAttendee(name: string) {
    onChange(
      "attendees",
      draft.attendees.filter((attendee) => attendee !== name)
    )
  }

  return (
    <div className="flex w-120 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_24px_48px_rgb(0_0_0/22%),0_2px_8px_rgb(0_0_0/10%)]">
      <div className="flex flex-col gap-3.5 px-7 pt-6 pb-5">
        <div className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onBack}
            type="button"
          >
            <ChevronLeftIcon className="size-3" />
            Commands
          </button>
          <button
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        </div>

        <span className={LABEL}>Create event</span>

        <div className="flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.75">
          <input
            aria-label="Event title"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[19px] font-semibold tracking-[-0.01em] text-foreground outline-none placeholder:text-muted-foreground/70"
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Untitled event"
            value={draft.title}
          />
        </div>

        <div className="flex gap-2">
          <Select
            onValueChange={(value) => onChange("type", value as EventType)}
            value={draft.type}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <input
            aria-label="Platform"
            className="min-w-0 flex-1 rounded-md bg-muted px-2.5 py-2 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Choose platform"
            value={draft.location}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t px-7 py-4.5">
        <div className="flex flex-col gap-1.25">
          <span className={LABEL}>Date &amp; time</span>
          <div className="flex gap-2">
            <input
              aria-label="Date"
              className={cn(
                FIELD_ROW,
                "flex-[1.4] text-[13px] text-foreground outline-none"
              )}
              onChange={(event) => onChange("date", event.target.value)}
              type="date"
              value={draft.date}
            />
            <input
              aria-label="Start time"
              className={cn(
                FIELD_ROW,
                "flex-1 text-[13px] text-foreground outline-none"
              )}
              onChange={(event) => onChange("startTime", event.target.value)}
              type="time"
              value={draft.startTime}
            />
            <input
              aria-label="End time"
              className={cn(
                FIELD_ROW,
                "flex-1 text-[13px] text-foreground outline-none"
              )}
              onChange={(event) => onChange("endTime", event.target.value)}
              type="time"
              value={draft.endTime}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.25">
          <span className={LABEL}>Company &amp; contact</span>
          <div className="flex gap-2">
            <input
              aria-label="Company"
              className={cn(
                FIELD_ROW,
                "flex-1 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
              )}
              onChange={(event) => onChange("account", event.target.value)}
              placeholder="Company"
              value={draft.account}
            />
            <input
              aria-label="Contact"
              className={cn(
                FIELD_ROW,
                "flex-1 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
              )}
              onChange={(event) => onChange("contact", event.target.value)}
              placeholder="Contact"
              value={draft.contact}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t px-7 py-4.5">
        <span className={LABEL}>Attendees</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 px-0.5 py-1.5">
            <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold tracking-[0.02em] text-primary-foreground">
              {initials("Alex Kim")}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium text-foreground">
                Alex Kim
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                alex.kim@naq.com
              </span>
            </span>
            <span className="shrink-0 pr-0.5 text-[11px] text-muted-foreground">
              Organizer
            </span>
          </div>
          {draft.attendees.map((name) => (
            <div className="flex items-center gap-2.5 px-0.5 py-1.5" key={name}>
              <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold tracking-[0.02em] text-muted-foreground">
                {initials(name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {name}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {slugify(name)}@naq.com
                </span>
              </span>
              <button
                aria-label={`Remove ${name}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => removeAttendee(name)}
                type="button"
              >
                <XIcon className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.25 px-7 pt-0.5 pb-5">
        <span className={LABEL}>Notes</span>
        <textarea
          aria-label="Notes"
          className="min-h-20 w-full resize-none rounded-md bg-muted px-3 py-2.5 text-[13px] leading-[150%] text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Add notes…"
          value={draft.notes}
        />
      </div>

      <div className="flex items-center justify-between gap-2.5 rounded-b-2xl border-t bg-muted px-7 py-4">
        <Button onClick={onBack} variant="outline">
          <ChevronLeftIcon className="size-3.5" />
          Back to commands
        </Button>
        <Button disabled={!canCreate} onClick={onCreate}>
          Create event
        </Button>
      </div>
    </div>
  )
}
