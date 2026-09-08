"use client"

import * as React from "react"
import { CalendarIcon, ClockIcon } from "lucide-react"

import WheelList from "@/components/lab/inertial-wheel-list"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// The two halves of "date & time" for the create/edit event forms.
//
// Both are a button that says what is currently set plus a popover that changes
// it: a coss Calendar with the same presets the command palette offers, and the
// inertial wheel for the time - a fifteen-minute grid is a drum, not a text
// field, and the wheel commits when its snap settles.
//
// Values stay plain strings on the draft: "YYYY-MM-DD" and 24-hour "HH:MM".

const TRIGGER =
  "flex min-h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-[calc(--spacing(3)-1px)] text-left text-sm text-foreground shadow-xs/5 ring-ring/24 transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] sm:min-h-8 dark:bg-input/32"

const pad = (value: number) => String(value).padStart(2, "0")

// Local parts, not toISOString: the calendar hands back local midnight, and in
// any timezone east of UTC that serialises as the day before.
export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateValue(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function addDays(offset: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date
}

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

export function formatDateValue(value: string): string {
  const date = fromDateValue(value)
  return date ? dateLabelFormatter.format(date) : ""
}

export const DATE_PRESETS = [
  { value: "Today", offset: 0 },
  { value: "Tomorrow", offset: 1 },
  { value: "Next week", offset: 7 },
  { value: "Next month", offset: 30 },
].map((preset) => ({
  ...preset,
  hint: dateLabelFormatter.format(addDays(preset.offset)),
  date: toDateValue(addDays(preset.offset)),
}))

// Every quarter hour of the day. The wheel takes labels, so the value grid and
// the label grid are built together and indexed by position.
export const TIME_VALUES: string[] = []
export const TIME_LABELS: string[] = []
for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
  const hour = Math.floor(minutes / 60)
  TIME_VALUES.push(`${pad(hour)}:${pad(minutes % 60)}`)
  TIME_LABELS.push(
    `${hour % 12 === 0 ? 12 : hour % 12}:${pad(minutes % 60)} ${hour < 12 ? "AM" : "PM"}`
  )
}

export function formatTimeValue(value: string): string {
  const index = TIME_VALUES.indexOf(value)
  if (index !== -1) return TIME_LABELS[index]
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return ""
  const hour = Number(match[1])
  return `${hour % 12 === 0 ? 12 : hour % 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`
}

// The nearest quarter hour at or before the value - the wheel has to land
// somewhere even when the draft carries a time off the grid.
function timeIndex(value: string): number {
  const exact = TIME_VALUES.indexOf(value)
  if (exact !== -1) return exact
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return 36 // 09:00
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return Math.min(Math.floor(minutes / 15), TIME_VALUES.length - 1)
}

export function DateField({
  className,
  label = "Date",
  onValueChange,
  value,
}: {
  className?: string
  label?: string
  onValueChange: (value: string) => void
  value: string
}): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const selected = fromDateValue(value)

  function commit(next: string) {
    onValueChange(next)
    setOpen(false)
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label={value ? `${label}: ${formatDateValue(value)}` : label}
        className={cn(TRIGGER, className)}
      >
        <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn("truncate", value === "" && "text-muted-foreground/72")}
        >
          {value === "" ? "Pick a date" : formatDateValue(value)}
        </span>
      </PopoverTrigger>
      {/* The popup pads itself down to p-2 once it sees a calendar inside. */}
      <PopoverPopup align="start">
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-1 pb-2">
            {DATE_PRESETS.map((preset) => (
              <button
                className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                key={preset.value}
                onClick={() => commit(preset.date)}
                title={preset.hint}
                type="button"
              >
                {preset.value}
              </button>
            ))}
          </div>
          <Calendar
            defaultMonth={selected}
            mode="single"
            onSelect={(date: Date | undefined) => {
              if (date) commit(toDateValue(date))
            }}
            selected={selected}
          />
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export function TimeField({
  className,
  label,
  onValueChange,
  value,
}: {
  className?: string
  label: string
  onValueChange: (value: string) => void
  value: string
}): React.ReactElement {
  const [open, setOpen] = React.useState(false)

  // The wheel reports every frame it moves; only a settled snap is a choice.
  const handleWheelState = React.useCallback(
    (state: { index: number; settled: boolean }) => {
      if (!state.settled) return
      const next = TIME_VALUES[state.index]
      if (next && next !== value) onValueChange(next)
    },
    [onValueChange, value]
  )

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label={value ? `${label}: ${formatTimeValue(value)}` : label}
        className={cn(TRIGGER, className)}
      >
        <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn("truncate", value === "" && "text-muted-foreground/72")}
        >
          {value === "" ? "Pick a time" : formatTimeValue(value)}
        </span>
      </PopoverTrigger>
      <PopoverPopup align="start">
        <WheelList
          initialIndex={timeIndex(value)}
          items={TIME_LABELS}
          label={label}
          onStateChange={handleWheelState}
        />
      </PopoverPopup>
    </Popover>
  )
}
