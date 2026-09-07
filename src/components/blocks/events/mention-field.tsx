"use client"

import * as React from "react"

import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/autocomplete"
import { cn } from "@/lib/utils"

// A text field that pops a people list when you type "@".
//
// It is a coss Autocomplete with the filtering taken away from it (mode="none",
// `open` controlled): the list is not a filter over the whole field, it is a
// filter over the @token under the caret, so the rest of the text stays
// free-form. Two ways to land a pick, chosen by the caller:
//
//   · insert (default) - the token is replaced by the name in place, for a
//     field whose VALUE is the person, like Contact.
//   · onPick - the pick is handed over and the field clears itself, for a field
//     that FEEDS a list, like Attendees.

export interface MentionPerson {
  name: string
  hint?: string
}

interface Token {
  start: number
  query: string
}

// The @token under the caret: an "@" that opens the text or follows whitespace,
// plus everything typed between it and the caret. Names carry spaces ("Sarah
// Chen"), so the query deliberately does not stop at the first one - it just
// stops matching anything.
function findToken(text: string, caret: number): Token | null {
  const before = text.slice(0, caret)
  const start = before.lastIndexOf("@")
  if (start === -1) return null
  if (start > 0 && !/\s/.test(before[start - 1])) return null
  const query = before.slice(start + 1)
  if (query.length > 32) return null
  return { start, query }
}

// Name-prefix beats word-prefix beats substring, with the hint (a company) last
// so typing a name never loses to someone else's company.
function rank(people: MentionPerson[], query: string): MentionPerson[] {
  const needle = query.trim().toLowerCase()
  if (needle === "") return people
  const scored: { person: MentionPerson; score: number }[] = []
  for (const person of people) {
    const name = person.name.toLowerCase()
    const hint = person.hint?.toLowerCase() ?? ""
    let score = -1
    if (name.startsWith(needle)) score = 3
    else if (name.split(/[\s.]+/).some((word) => word.startsWith(needle)))
      score = 2
    else if (name.includes(needle)) score = 1
    else if (hint.includes(needle)) score = 0
    if (score >= 0) scored.push({ person, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.map((entry) => entry.person)
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

export function MentionField({
  ariaLabel,
  className,
  onPick,
  onSubmitFreeText,
  onValueChange,
  people,
  placeholder,
  startAddon,
  value,
}: {
  ariaLabel: string
  className?: string
  /** Takes the pick instead of inserting it - the field clears itself. */
  onPick?: (person: MentionPerson) => void
  /** Enter on text the list did not claim. */
  onSubmitFreeText?: (value: string) => void
  onValueChange: (value: string) => void
  people: MentionPerson[]
  placeholder?: string
  startAddon?: React.ReactNode
  value: string
}): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [caret, setCaret] = React.useState(0)
  // Escape dismisses the list for the token it was open on, not forever: a
  // fresh "@" elsewhere in the field opens it again.
  const [dismissedAt, setDismissedAt] = React.useState<number | null>(null)

  const token = findToken(value, Math.min(caret, value.length))
  const matches = token ? rank(people, token.query) : []
  const open =
    token !== null && matches.length > 0 && dismissedAt !== token.start

  function setCaretFromInput(fallback: number) {
    setCaret(inputRef.current?.selectionStart ?? fallback)
  }

  function pick(person: MentionPerson) {
    if (onPick) {
      onPick(person)
      onValueChange("")
      setCaret(0)
      return
    }
    if (!token) {
      onValueChange(person.name)
      setCaret(person.name.length)
      return
    }
    // token.start + "@" + query is exactly the caret, so the tail survives.
    const head = value.slice(0, token.start)
    const tail = value.slice(token.start + 1 + token.query.length)
    const at = head.length + person.name.length
    onValueChange(head + person.name + tail)
    setCaret(at)
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(at, at))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || open || !onSubmitFreeText) return
    const text = value.trim()
    if (text === "") return
    event.preventDefault()
    onSubmitFreeText(text)
    onValueChange("")
    setCaret(0)
  }

  // The wrapper takes the caller's layout: the group Autocomplete renders around
  // the input is always w-full, so a flex-1 handed to the input itself would sit
  // one level too deep to size the field.
  return (
    <div className={cn("min-w-0", className)}>
      <Autocomplete
        items={matches}
        itemToStringValue={(person: MentionPerson) => person.name}
        mode="none"
        onOpenChange={(next) => {
          setDismissedAt(next ? null : (token?.start ?? null))
        }}
        onValueChange={(next: string, details) => {
          if (details.reason === "item-press") {
            const person = matches.find((entry) => entry.name === next)
            if (person) {
              pick(person)
              return
            }
          }
          onValueChange(next)
          setCaretFromInput(next.length)
        }}
        open={open}
        value={value}
      >
        <AutocompleteInput
          aria-label={ariaLabel}
          onClick={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
          placeholder={placeholder}
          ref={inputRef}
          startAddon={startAddon}
        />
        <AutocompletePopup>
          <AutocompleteEmpty>No matches.</AutocompleteEmpty>
          <AutocompleteList>
            {(person: MentionPerson) => (
              <AutocompleteItem
                className="gap-2.5"
                key={person.name}
                value={person}
              >
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-semibold tracking-[0.02em] text-muted-foreground"
                >
                  {initials(person.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{person.name}</span>
                  {person.hint && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {person.hint}
                    </span>
                  )}
                </span>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompletePopup>
      </Autocomplete>
    </div>
  )
}
