"use client"

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react"
import { MotionConfig, motion } from "motion/react"
import { PlusIcon } from "lucide-react"
import { Kbd } from "../ui/kbd"

// Search-expand navigation bar - a two-stage morph disclosure.
//
// Rest: a rounded bar whose whole surface is the "Create event" button, with a
// search icon parked on its right. The button sits directly on top of the
// search field; click search and it plays in two stages, each animating a
// single driving property:
//
//   1. Horizontal morph (open): the search icon GLIDES left to become the
//      field's leading icon while the create button fades out and the input
//      underneath fades in, with a ✕ fading in on the right. The travel
//      distance is measured from layout (offsetLeft - transform-independent),
//      so it stays correct as the component shrinks on narrow screens.
//   2. Vertical grow (expanded): the box - anchored to the bottom - grows
//      UPWARD (motion animates the panel's height to auto), turning the
//      rectangle into a card with a recent-searches panel cascading in above.
//
// The stages are sequenced in JS (open → grow; collapse → un-morph). "flip"
// effect: the search icon blurs out in place instead of travelling.
//
// Closing splits two ways, because a search is worth more than the bar it was
// typed into:
//
//   · COMMIT (⏎, the search icon, picking a recent, clicking away) folds the
//     bar but KEEPS the text, so the page stays filtered. The collapsed bar
//     then carries a chip with the live term - click it to edit, ✕ to clear -
//     since otherwise the filter would be invisible.
//   · CANCEL (Esc, the ✕ inside the field) drops the text and restores the
//     unfiltered page.
//
// Only committed terms land in the recent list. The field is optionally
// controlled (query/onQueryChange). Animation via motion/react; honours
// prefers-reduced-motion. Requires the lab-theme tokens. Fully Tailwind.

const MORPH_MS = 400
const GROW_MS = 420
const EASE = [0.22, 1, 0.36, 1] as const
const SLIDE_EASE = [0.76, 0, 0.24, 1] as const // icon crossing: symmetric, smooth
const MORPH = { duration: 0.4, ease: EASE } as const
const GROW = { duration: 0.44, ease: EASE } as const
const MAX_RECENT = 5

// Resting chrome fade: out with a small drift + blur, back in clean.
const CHROME_SHOWN = { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }
const CHROME_HIDDEN = { opacity: 0, x: -6.4, scale: 0.96, filter: "blur(3px)" }

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return (
    !!element &&
    (element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.isContentEditable)
  )
}

export default function SearchExpandNav({
  suggestions = DEFAULT_SUGGESTIONS,
  effect = "travel",
  inspect = false,
  query,
  onQueryChange,
  onSearch,
  createOpen = false,
  toggleCreate,
  onSearchOpen,
  createButtonRef,
}: {
  /** Seeds the recent panel until the user has searched for something. */
  suggestions?: string[]
  effect?: "travel" | "flip"
  inspect?: boolean
  /** Controlled field text. Omit it and the bar keeps its own. */
  query?: string
  onQueryChange?: (value: string) => void
  /** Runs on submit and on picking a recent search. */
  onSearch?: (value: string) => void
  createOpen?: boolean
  /** Opens the create flow - and closes it again, since the button stays live
   *  in front of it. */
  toggleCreate?: () => void
  /** Fires just before the field opens, so an owner can stand the create flow
   *  down first: the search asked for the keyboard and wins. */
  onSearchOpen?: () => void
  createButtonRef?: RefObject<HTMLButtonElement | null>
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [travelX, setTravelX] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const [ownQuery, setOwnQuery] = useState("")

  const controlled = query !== undefined
  const value = controlled ? query : ownQuery

  const rootRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBtnRef = useRef<HTMLButtonElement>(null)
  const valueRef = useRef(value)
  const timerRef = useRef<number | null>(null)
  const panelId = useId()

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    valueRef.current = value
  }, [value])

  function setValue(next: string) {
    if (!controlled) setOwnQuery(next)
    onQueryChange?.(next)
  }

  // The travel distance: the bar's left padding - where the field's leading
  // icon sits - minus the search icon's resting left. offsetLeft ignores
  // transforms, so this is safe to measure any time and re-measures as the
  // container-query sizing kicks in.
  useLayoutEffect(() => {
    const measure = () => {
      const btn = searchBtnRef.current
      const row = rowRef.current
      if (!btn || !row) return
      const pad = Number.parseFloat(getComputedStyle(row).paddingLeft) || 0
      setTravelX(pad - btn.offsetLeft)
    }
    measure()
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    if (rootRef.current) observer?.observe(rootRef.current)
    return () => observer?.disconnect()
  }, [open])

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function openSearch() {
    clearTimer()
    // Both the field and the create palette want the keyboard. Say so before
    // flipping `open`, so the two state changes land in one render and the
    // "create took over, fold the field" effect below never sees a reason to
    // roll the morph straight back.
    onSearchOpen?.()
    setOpen(true)
    if (reduced()) setExpanded(true)
    else timerRef.current = window.setTimeout(() => setExpanded(true), MORPH_MS)
  }

  // Fold the card back into a bar. Whoever calls this has already decided what
  // happens to the text.
  function collapse(refocus: boolean) {
    clearTimer()
    setExpanded(false)
    const settle = () => {
      setOpen(false)
      if (refocus) searchBtnRef.current?.focus()
    }
    if (reduced()) settle()
    else timerRef.current = window.setTimeout(settle, GROW_MS)
  }

  // Keep the term: the page stays filtered and the bar shows it as a chip.
  // `text` is passed explicitly when it hasn't landed in state yet.
  function commitSearch(text: string = valueRef.current, refocus = true) {
    const trimmed = text.trim()
    if (trimmed) {
      setValue(trimmed)
      setRecent((list) =>
        [trimmed, ...list.filter((entry) => entry !== trimmed)].slice(
          0,
          MAX_RECENT
        )
      )
      onSearch?.(trimmed)
    } else if (text) {
      setValue("")
    }
    collapse(refocus)
  }

  // Drop the term: the page goes back to unfiltered.
  function cancelSearch() {
    setValue("")
    collapse(true)
  }

  // Wipe the filter without touching the bar's open/closed state - the chip's
  // ✕ unmounts itself here, so hand focus somewhere that survives.
  function clearSearch() {
    setValue("")
    if (open) inputRef.current?.focus()
    else searchBtnRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    // Reopening with a live term: preselect it so typing replaces the search
    // instead of appending to it.
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [open])

  useEffect(() => {
    if (inspect) {
      setOpen(true)
      setExpanded(true)
    }
  }, [inspect])

  // The create dialog takes the keyboard: fold the field away behind it, but
  // keep both the term and the dialog's focus.
  useEffect(() => {
    if (createOpen && open) commitSearch(valueRef.current, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, open])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: PointerEvent) => {
      // Clicking away is a dismissal, not a discard - and it must not yank
      // focus back to the bar the user just left.
      if (!rootRef.current?.contains(event.target as Node))
        commitSearch(valueRef.current, false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelSearch()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // "/" opens the field from anywhere on the page, unless the user is already
  // typing somewhere else - including inside the create palette, where a "/"
  // is just a character. Anywhere else it cancels the create flow in favour of
  // the search, same as the search button does.
  useEffect(() => {
    if (open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || isTypingTarget(event.target)) return
      event.preventDefault()
      openSearch()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => clearTimer, [])

  // ⏎ applies the search and gets the bar out of the way; the results behind
  // it are already filtered and stay that way.
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    commitSearch()
  }

  const chrome = (hidden: boolean) => ({
    initial: false as const,
    animate: hidden ? CHROME_HIDDEN : CHROME_SHOWN,
    transition: MORPH,
    style: { pointerEvents: hidden ? ("none" as const) : undefined },
  })

  // What the panel lists: everything searched this session, padded out with the
  // seed suggestions so the card is never bare when they're supplied.
  const entries = [
    ...recent,
    ...suggestions.filter((entry) => !recent.includes(entry)),
  ].slice(0, MAX_RECENT)

  // A term is filtering the page right now.
  const active = value.trim() !== ""

  // Kept out of the class strings: the tailwind formatter eats the separating
  // space when these are inlined in the template literal.
  const cardOutline = inspect
    ? " outline-[1.5px] outline-offset-4 outline-[#3b82f6] outline-dashed"
    : ""
  const iconOutline =
    inspect && effect === "travel"
      ? " outline outline-[1.5px] outline-[#ef4444] outline-dashed"
      : ""

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} className="@container relative h-14 w-88 max-w-full">
        <div
          className={`group/nav absolute inset-x-0 bottom-0 flex flex-col rounded-xl bg-card shadow-border [--nav-avatar:2rem] [--nav-icon:2.25rem] [--nav-pad:0.5rem] @max-[330px]:[--nav-icon:1.9rem] @max-[330px]:[--nav-pad:0.375rem] @max-[330px]:[--nav-avatar:1.7rem]${cardOutline}`}
        >
          {/* Elevation on a faded overlay: a cheap opacity tween, no per-frame
              box-shadow repaint. */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.22)]"
            aria-hidden="true"
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={GROW}
          />

          {/* Stage 2: recent searches - motion grows the height to auto. */}
          <motion.div
            className="overflow-hidden"
            id={panelId}
            role="region"
            aria-label="Recent searches"
            aria-hidden={!expanded}
            initial={false}
            animate={{ height: expanded ? "auto" : 0 }}
            transition={GROW}
          >
            <div className="px-2 pt-3 pb-2">
              <motion.p
                className="mb-1 px-2 text-[0.6875rem] font-semibold tracking-[0.04em] text-muted-foreground/70 uppercase"
                initial={false}
                animate={
                  expanded
                    ? { opacity: 1, filter: "blur(0px)" }
                    : { opacity: 0, filter: "blur(4px)" }
                }
                transition={GROW}
              >
                Recent
              </motion.p>
              {entries.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted-foreground">
                  No recent searches yet
                </p>
              ) : (
                <ul className="flex flex-col">
                  {entries.map((entry, index) => (
                    <motion.li
                      key={entry}
                      initial={false}
                      // Rows cascade in as the panel opens; the close drops the
                      // delays so the fold reads as one soft piece.
                      animate={
                        expanded
                          ? { opacity: 1, y: 0, filter: "blur(0px)" }
                          : { opacity: 0, y: 8, filter: "blur(4px)" }
                      }
                      transition={{
                        ...GROW,
                        delay: expanded ? index * 0.04 : 0,
                      }}
                    >
                      <button
                        type="button"
                        className="group/sug flex w-full items-center gap-2.5 rounded-[0.625rem] p-2 text-left text-foreground/70 [transition:background-color_200ms_ease,color_200ms_ease] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        tabIndex={expanded ? 0 : -1}
                        onClick={() => commitSearch(entry)}
                      >
                        <span className="inline-flex flex-none text-muted-foreground/70">
                          <ClockIcon />
                        </span>
                        <span className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                          {entry}
                        </span>
                        <span className="inline-flex flex-none -translate-x-1 text-muted-foreground/50 opacity-0 [transition:opacity_200ms_ease,transform_200ms_ease] group-hover/sug:translate-x-0 group-hover/sug:opacity-100">
                          <ReturnIcon />
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>

          {/* The bar: the fixed-height bottom row of the box. */}
          <form
            className="relative h-14 flex-none"
            role="search"
            onSubmit={handleSubmit}
          >
            {/* Stage 1, field: hidden at rest, sitting under the create button
                and revealed as that fades. */}
            <motion.input
              ref={inputRef}
              type="search"
              className="absolute inset-0 w-full border-0 bg-transparent pr-[calc(var(--nav-pad)+var(--nav-icon)+0.25rem)] pl-[calc(var(--nav-pad)+var(--nav-icon)+0.25rem)] text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none"
              placeholder="Search event names…"
              aria-label="Search event names"
              aria-hidden={!open}
              tabIndex={open ? 0 : -1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              initial={false}
              animate={open ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
              transition={MORPH}
              style={{ pointerEvents: open ? "auto" : "none" }}
            />

            {/* Resting chrome, layered over the field: the create button owns
                the bar, the search icon is parked at its right. The row itself
                stays click-through so the field below stays clickable. */}
            <div
              ref={rowRef}
              className="pointer-events-none absolute inset-0 flex items-center gap-1.5 px-[var(--nav-pad)]"
            >
              <motion.button
                aria-hidden={open || createOpen || undefined}
                aria-expanded={createOpen}
                aria-keyshortcuts="Meta+K Control+K"
                aria-label="Create event"
                className="pointer-events-auto flex h-[var(--nav-icon)] min-w-0 flex-1 items-center justify-center gap-2 rounded-[0.625rem] bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none [transition:background-color_200ms_ease] hover:bg-primary/92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97]"
                onClick={toggleCreate}
                ref={createButtonRef}
                tabIndex={open || createOpen ? -1 : 0}
                type="button"
                {...chrome(open)}
              >
                <PlusIcon className="size-4.5 flex-none" />
                <span className="truncate">Create event</span>
                <Kbd className="ml-0.5 flex-none bg-background/15 font-mono text-[0.6875rem] text-primary-foreground/80">
                  ⌘K
                </Kbd>
              </motion.button>

              {/* A committed term survives the collapse, so the resting bar
                  has to say so - it takes the slot the "/" hint sits in
                  otherwise. */}
              {active ? (
                <motion.span
                  aria-hidden={open || undefined}
                  className="pointer-events-auto flex max-w-[7.5rem] flex-none items-center gap-0.5 rounded-full bg-muted py-0.5 pr-0.5 pl-2"
                  {...chrome(open)}
                >
                  <button
                    className="min-w-0 truncate text-xs font-medium text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    onClick={() => openSearch()}
                    tabIndex={open ? -1 : 0}
                    title={`Searching "${value}" - click to edit`}
                    type="button"
                  >
                    {value}
                  </button>
                  <button
                    aria-label="Clear search"
                    className="grid size-5 flex-none place-items-center rounded-full text-muted-foreground outline-none [transition:background-color_150ms_ease,color_150ms_ease] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    onClick={clearSearch}
                    tabIndex={open ? -1 : 0}
                    type="button"
                  >
                    <CloseIcon size={12} />
                  </button>
                </motion.span>
              ) : (
                <motion.span
                  aria-hidden="true"
                  className="flex-none"
                  {...chrome(open)}
                >
                  <Kbd className="font-mono">/</Kbd>
                </motion.span>
              )}

              {/* The travelling search icon: slides left by the measured
                  distance to become the field's leading icon. */}
              <motion.button
                ref={searchBtnRef}
                type={open ? "submit" : "button"}
                className={`pointer-events-auto relative z-[2] grid h-[var(--nav-icon)] w-[var(--nav-icon)] flex-none place-items-center rounded-[0.625rem] [transition:color_200ms_ease] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  open && effect === "travel"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }${iconOutline}`}
                aria-label="Search events"
                aria-keyshortcuts="/"
                title="Search (/)"
                aria-expanded={open}
                aria-controls={panelId}
                initial={false}
                animate={
                  effect === "travel"
                    ? {
                        x: open ? travelX : 0,
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0px)",
                      }
                    : open
                      ? { x: 0, opacity: 0, scale: 0.9, filter: "blur(3px)" }
                      : { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
                }
                transition={{
                  x: { duration: 0.4, ease: SLIDE_EASE },
                  default: MORPH,
                }}
                style={{
                  pointerEvents: open && effect === "flip" ? "none" : undefined,
                }}
                onClick={(event) => {
                  if (!open) {
                    event.preventDefault()
                    openSearch()
                  }
                }}
              >
                <SearchIcon />
              </motion.button>
            </div>

            {/* ✕ fades in on the right once the search icon has vacated it. */}
            <motion.button
              type="button"
              className="absolute top-1/2 right-[var(--nav-pad)] z-[2] grid h-[var(--nav-icon)] w-[var(--nav-icon)] place-items-center rounded-[0.625rem] text-muted-foreground [transition:background-color_200ms_ease,color_200ms_ease] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Close search"
              aria-hidden={!open}
              tabIndex={open ? 0 : -1}
              initial={false}
              animate={
                open ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }
              }
              transition={MORPH}
              style={{ y: "-50%", pointerEvents: open ? "auto" : "none" }}
              onClick={cancelSearch}
              title="Close and clear (Esc)"
            >
              <CloseIcon />
            </motion.button>
          </form>

          {inspect && (
            <>
              <span className="pointer-events-none absolute -top-[1.85rem] left-0 rounded-[0.25rem] border border-[#bfdbfe] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium whitespace-nowrap text-[#2563eb] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                fixed width · bottom-anchored · grows ↑
              </span>
              <span className="pointer-events-none absolute top-3 right-2 rounded-[0.25rem] border border-[#bfdbfe] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium whitespace-nowrap text-[#2563eb] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                height 0 → auto
              </span>
              <span className="pointer-events-none absolute -bottom-[1.6rem] left-0 rounded-[0.25rem] border border-[#fecaca] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium whitespace-nowrap text-[#dc2626] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                {effect === "flip"
                  ? "search icon blurs out in place"
                  : `slides ← ${Math.round(Math.abs(travelX))}px measured`}
              </span>
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}
function SearchIcon() {
  return (
    <Svg>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </Svg>
  )
}
function CloseIcon({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  )
}
function ClockIcon() {
  return (
    <Svg size={16}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}
function ReturnIcon() {
  return (
    <Svg size={16}>
      <path d="m9 10-4 4 4 4" />
      <path d="M5 14h9a5 5 0 0 0 5-5V6" />
    </Svg>
  )
}

const DEFAULT_SUGGESTIONS = [
  "Animations on the web",
  "flex-grow vs grid-fr",
  "prefers-reduced-motion",
  "container query units",
]
