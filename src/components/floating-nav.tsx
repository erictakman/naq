"use client"

import * as React from "react"
import { ClockIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { motion } from "motion/react"

import { CreateEventDialog } from "@/components/create-event-dialog"
import type { EventItem } from "@/lib/events"

const EASE = [0.22, 1, 0.36, 1] as const
const MORPH = { duration: 0.32, ease: EASE }
const GROW = { duration: 0.34, ease: EASE }
const MORPH_MS = 300
const COLLAPSE_MS = 280
const MAX_RECENT = 5
const REST_WIDTH = 48
const OPEN_WIDTH = 340

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return (
    !!element &&
    (element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.isContentEditable)
  )
}

export function FloatingNav({
  query,
  onQueryChange,
  onCreate,
}: {
  query: string
  onQueryChange: (value: string) => void
  onCreate: (event: EventItem) => void
}): React.ReactElement {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [recent, setRecent] = React.useState<string[]>([])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const createButtonRef = React.useRef<HTMLButtonElement>(null)
  const searchButtonRef = React.useRef<HTMLButtonElement>(null)
  const queryRef = React.useRef(query)
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    queryRef.current = query
  }, [query])

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function openSearch() {
    clearTimer()
    setOpen(true)
    timerRef.current = window.setTimeout(() => setExpanded(true), MORPH_MS)
  }

  function closeSearch() {
    clearTimer()
    setExpanded(false)
    const trimmed = queryRef.current.trim()
    if (trimmed) {
      setRecent((list) =>
        [trimmed, ...list.filter((value) => value !== trimmed)].slice(
          0,
          MAX_RECENT
        )
      )
    }
    onQueryChange("")
    timerRef.current = window.setTimeout(() => {
      setOpen(false)
      searchButtonRef.current?.focus()
    }, COLLAPSE_MS)
  }

  function openCreate() {
    setCreateOpen(true)
  }

  function closeCreate(next: boolean) {
    setCreateOpen(next)
    if (!next) createButtonRef.current?.focus()
  }

  function pickRecent(value: string) {
    onQueryChange(value)
    inputRef.current?.focus()
  }

  React.useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  React.useEffect(() => clearTimer, [])

  // Click-outside and Escape close the search, matching search-expand-nav.
  React.useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeSearch()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearch()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Global keybinds: ⌘K / Ctrl+K opens Create event from anywhere on the
  // page; "/" opens search unless the user is already typing somewhere else.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (open) return
        if (createOpen) closeCreate(false)
        else openCreate()
        return
      }
      if (
        event.key === "/" &&
        !open &&
        !createOpen &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault()
        openSearch()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, createOpen])

  return (
    <>
      <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
        <div className="flex items-center gap-3" ref={rootRef}>
          <motion.button
            animate={
              open
                ? { opacity: 0, scale: 0.92, filter: "blur(3px)" }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            aria-hidden={open || createOpen || undefined}
            aria-keyshortcuts="Meta+K Control+K"
            aria-label="Create event"
            className="relative flex h-13 shrink-0 items-center gap-2 rounded-full border border-black/8 bg-primary px-5 font-semibold text-[0.9375rem] text-primary-foreground shadow-[0_22px_48px_-12px_rgba(0,0,0,0.4)] outline-none transition-colors hover:bg-primary/92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97]"
            initial={false}
            onClick={openCreate}
            ref={createButtonRef}
            style={{ pointerEvents: open || createOpen ? "none" : undefined }}
            tabIndex={open || createOpen ? -1 : 0}
            transition={MORPH}
            type="button"
          >
            <PlusIcon className="size-4.5" />
            Create event
            <kbd className="ml-0.5 inline-flex items-center rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none">
              ⌘K
            </kbd>
          </motion.button>

          <motion.div
            animate={{ width: open ? OPEN_WIDTH : REST_WIDTH }}
            className="relative h-13"
            initial={false}
            transition={MORPH}
          >
            <div className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-[1.625rem] border border-black/8 bg-card shadow-[0_22px_48px_-12px_rgba(0,0,0,0.35)]">
              <motion.div
                animate={{ height: expanded ? "auto" : 0 }}
                aria-hidden={!expanded}
                className="overflow-hidden"
                initial={false}
                transition={GROW}
              >
                <div className="flex flex-col gap-0.5 px-2 pt-3 pb-2">
                  <p className="px-2 pb-1 font-semibold text-[0.6875rem] text-muted-foreground/70 uppercase tracking-[0.04em]">
                    Recent
                  </p>
                  {recent.length === 0 ? (
                    <p className="px-2 py-2 text-muted-foreground text-xs">
                      No recent searches yet
                    </p>
                  ) : (
                    recent.map((value) => (
                      <button
                        className="group/sug flex items-center gap-2.5 rounded-[0.625rem] p-2 text-left text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        key={value}
                        onClick={() => pickRecent(value)}
                        tabIndex={expanded ? 0 : -1}
                        type="button"
                      >
                        <ClockIcon className="size-4 shrink-0 text-muted-foreground/70" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {value}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>

              <div className="relative h-13 flex-none">
                <button
                  aria-label="Search events"
                  aria-keyshortcuts="/"
                  className="absolute inset-y-0 left-0 grid w-13 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => !open && openSearch()}
                  ref={searchButtonRef}
                  tabIndex={open ? -1 : 0}
                  title="Search (/)"
                  type="button"
                >
                  <SearchIcon className="size-4.5" />
                </button>
                <motion.input
                  animate={
                    open ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }
                  }
                  aria-hidden={!open}
                  aria-label="Search event names"
                  className="absolute inset-0 w-full bg-transparent pr-13 pl-13 text-foreground text-[0.9375rem] outline-none placeholder:text-muted-foreground/70"
                  initial={false}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search event names…"
                  ref={inputRef}
                  style={{ pointerEvents: open ? "auto" : "none" }}
                  tabIndex={open ? 0 : -1}
                  transition={MORPH}
                  type="search"
                  value={query}
                />
                <motion.button
                  animate={
                    open
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.6 }
                  }
                  aria-label="Close search"
                  className="absolute inset-y-0 right-1.5 my-auto grid size-10 flex-none place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  initial={false}
                  onClick={closeSearch}
                  style={{ pointerEvents: open ? "auto" : "none" }}
                  tabIndex={open ? 0 : -1}
                  transition={MORPH}
                  type="button"
                >
                  <XIcon className="size-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {createOpen && (
        <CreateEventDialog onCreate={onCreate} onOpenChange={closeCreate} />
      )}
    </>
  )
}
