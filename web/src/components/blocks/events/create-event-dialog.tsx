"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  ChevronLeftIcon,
  FileTextIcon,
  TagIcon,
  TextIcon,
  UserPlusIcon,
  UsersIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import {
  DATE_PRESETS,
  DateField,
  TimeField,
} from "@/components/blocks/events/date-time-fields"
import {
  MentionField,
  type MentionPerson,
} from "@/components/blocks/events/mention-field"
import CommandPalette, {
  type Command,
  type CommandOption,
} from "@/components/lab/command-palette"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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

// Who the two @mention fields offer: customer contacts (hinted with the company
// they belong to) for Contact, teammates for Attendees.
const KNOWN_CONTACTS: MentionPerson[] = KNOWN_ACCOUNTS.map(
  ([account, contact]) => ({ name: contact, hint: account })
)

const TEAMMATES: MentionPerson[] = eventOwners.map((name) => ({ name }))

const OPEN_FORM_ID = "open-form"

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
  // The escape hatch: no slots and never staged - picking it carries whatever
  // is staged into the draft and opens the form, so the palette is a shortcut
  // rather than a toll gate. Handled by onPickCommand, not ✓ Apply.
  {
    id: OPEN_FORM_ID,
    label: "Open the full form",
    icon: <ArrowRightIcon className="size-3.5" />,
    slots: [],
    message: () => "Opened the full form",
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

  // Escape listens on the document, not on the panel, so it still closes the
  // dialog when focus has drifted onto something outside it. The palette gets
  // first say - it preventDefaults every Escape it consumes (clearing the
  // query, popping a chip), and only an untouched one belongs to the dialog.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (step !== "review" && !paletteIdle) return
      event.preventDefault()
      close()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paletteIdle])

  // A minimal Tab trap: keep keyboard focus cycling inside the dialog instead
  // of leaking out to the dimmed page behind it.
  function handleDialogKeyDown(event: React.KeyboardEvent) {
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

  function applyClauses(
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

  // The palette's escape hatch row: fold in whatever is staged and go straight
  // to the form, no ✓ Apply. Everything else stays the palette's business.
  function handlePickCommand(
    command: Command,
    staged: { command: Command; values: CommandOption[] }[]
  ): boolean {
    if (command.id !== OPEN_FORM_ID) return false
    applyClauses(staged)
    return true
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
    // Two layers of give, so a short window never hides part of the dialog:
    // the overlay itself scrolls (the panel is pushed off the top by `mt-auto`,
    // which collapses to 0 the moment there is no slack - unlike `justify-end`,
    // which would strand the overflow above the scroll origin), and the review
    // form additionally caps its own height and scrolls inside.
    <div
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain"
      role="presentation"
    >
      <div className="fixed inset-0 bg-black/32" onClick={close} />
      {/* Click-through, so the empty space around the panel still reaches the
          backdrop underneath it. */}
      <div className="pointer-events-none relative flex min-h-full flex-col items-center px-4 pt-4 pb-24">
        <div
          aria-label="Create event"
          aria-modal="true"
          // The wrapper carries the width so both steps stay centred on the
          // page: a roomy palette, a slightly tighter review form.
          className={cn(
            "pointer-events-auto relative z-10 mt-auto flex min-h-0 w-full flex-col",
            step === "palette"
              ? "max-w-[24rem]"
              : "max-h-[calc(100dvh-7rem)] max-w-[44rem]"
          )}
          onKeyDown={handleDialogKeyDown}
          ref={panelRef}
          role="dialog"
        >
          {step === "palette" ? (
            <CommandPalette
              commands={COMMANDS}
              onApply={applyClauses}
              onPickCommand={handlePickCommand}
              onStateChange={(state) =>
                setPaletteIdle(state.query === "" && state.chips.length === 0)
              }
              width="max-w-full"
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
    </div>
  )
}

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
  const [attendeeQuery, setAttendeeQuery] = React.useState("")

  // Alex Kim organises, so they are never a suggestion and never removable.
  const available = TEAMMATES.filter(
    (person) =>
      person.name !== "Alex Kim" && !draft.attendees.includes(person.name)
  )

  function addAttendee(name: string) {
    const trimmed = name.trim()
    if (trimmed === "" || trimmed === "Alex Kim") return
    if (draft.attendees.includes(trimmed)) return
    onChange("attendees", [...draft.attendees, trimmed])
  }

  function removeAttendee(name: string) {
    onChange(
      "attendees",
      draft.attendees.filter((attendee) => attendee !== name)
    )
  }

  return (
    // Header and footer are pinned; everything between them scrolls, so a short
    // window can never park Create event out of reach.
    <div className="flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_24px_48px_rgb(0_0_0/22%),0_2px_8px_rgb(0_0_0/10%)]">
      <div className="flex flex-none items-center justify-between gap-3 px-7 pt-6 pb-3.5">
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

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-3.5 px-7 pb-5">
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
            <Select
              onValueChange={(value) => onChange("location", value as string)}
              value={draft.location === "" ? null : draft.location}
            >
              <SelectTrigger aria-label="Platform" className="flex-1">
                <SelectValue placeholder="Choose platform" />
              </SelectTrigger>
              <SelectPopup>
                {PLATFORM_OPTIONS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t px-7 py-4.5">
          <div className="flex flex-col gap-1.25">
            <span className={LABEL}>Date &amp; time</span>
            <div className="flex gap-2">
              <DateField
                className="flex-[1.4]"
                onValueChange={(value) => onChange("date", value)}
                value={draft.date}
              />
              <TimeField
                className="flex-1"
                label="Start time"
                onValueChange={(value) => onChange("startTime", value)}
                value={draft.startTime}
              />
              <TimeField
                className="flex-1"
                label="End time"
                onValueChange={(value) => onChange("endTime", value)}
                value={draft.endTime}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.25">
            <span className={LABEL}>Company &amp; contact</span>
            <div className="flex gap-2">
              <Input
                aria-label="Company"
                className="flex-1"
                nativeInput
                onChange={(event) => onChange("account", event.target.value)}
                placeholder="Company"
                value={draft.account}
              />
              <MentionField
                ariaLabel="Contact"
                className="flex-1"
                onValueChange={(value) => onChange("contact", value)}
                people={KNOWN_CONTACTS}
                placeholder="Contact · @ to search"
                value={draft.contact}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t px-7 py-4.5">
          <div className="flex items-center justify-between">
            <span className={LABEL}>Attendees</span>
            <span className="text-[11px] text-muted-foreground">
              {draft.attendees.length + 1}{" "}
              {draft.attendees.length === 0 ? "person" : "people"}
            </span>
          </div>
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
              <div
                className="flex items-center gap-2.5 px-0.5 py-1.5"
                key={name}
              >
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

          {/* @ pops the teammate list; a plain name plus Enter adds whoever
              is not on it. */}
          <MentionField
            ariaLabel="Add attendee"
            onPick={(person) => addAttendee(person.name)}
            onSubmitFreeText={addAttendee}
            onValueChange={setAttendeeQuery}
            people={available}
            placeholder="Loop in teammates · @ to search"
            startAddon={<UserPlusIcon />}
            value={attendeeQuery}
          />
        </div>

        <div className="flex flex-col gap-1.25 px-7 pt-0.5 pb-5">
          <span className={LABEL}>Notes</span>
          <Textarea
            aria-label="Notes"
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Add notes…"
            value={draft.notes}
          />
        </div>
      </div>

      <div className="flex flex-none items-center justify-between gap-2.5 rounded-b-2xl border-t bg-muted px-7 py-4">
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
