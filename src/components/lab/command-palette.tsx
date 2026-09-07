"use client"

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { MotionConfig, motion, useReducedMotion } from "motion/react"

// Command palette with argument chips - Linear-style multi-step commands inside
// a single input.
//
// The hard problem is focus choreography. A command like "Assign to [person]
// with priority [level]" is really a tiny form; the obvious build gives each
// picked value its own focusable element - then Tab order, Backspace and
// screen-reader context all fracture mid-command. Here the palette has exactly
// ONE focusable control, the text input, for its whole life:
//
//   · Picking a command collapses it into a CHIP painted before the input (the
//     chip is render output, not a field). The list slides to that command's
//     first argument slot and the same input now filters the options.
//   · Filling a command's last slot STAGES it as a clause instead of running
//     it - the list slides back to the remaining commands joined by an "and",
//     so one session builds a compound. Nothing runs until ✓ Apply (⌘⏎);
//     ✕ discards the whole stack.
//   · Backspace on an empty query POPS the last chip - across the "and" too.
//     Chips never join the tab order but ARE clickable: clicking one rewinds
//     to that slot; the tail dims to preview the rewind scope.
//
// Matching is a fuzzy subsequence ("mvp" finds "Move to project") scored with
// word-start + adjacency bonuses minus a gap penalty, matched letters
// underlined in place. The list body's height is a measured px that motion
// eases between filter states and view swaps; pushes slide in from the right,
// pops from the left; chips grow in and pop instantly (Backspace must feel
// immediate). Pass your own `commands` and handle `onApply`.
//
// Animation via motion/react; honours prefers-reduced-motion. Requires the
// lab-theme tokens. Fully Tailwind, no CSS files.

const EASE = [0.22, 1, 0.36, 1] as const
const EASE_ICON = [0.2, 0, 0, 1] as const
const SLIDE = 28 // 1.75rem directional slide

export interface CommandOption {
  value: string
  hint?: string
  dot?: string
}
export interface CommandSlot {
  name: string
  prompt: string
  kind: "person" | "dot" | "plain" | "text"
  options: CommandOption[]
}
export interface Command {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  danger?: boolean
  slots: CommandSlot[]
  message: (values: CommandOption[]) => string
}

export interface CommandPaletteState {
  mode: string
  depth: number
  staged: number
  query: string
  matches: number
  chips: string[]
  height: number | null
  lastRun: string | null
}

// ── Matching ───────────────────────────────────────────────────────────
function scan(query: string, hay: string, boundaryFirst: boolean) {
  const idx: number[] = []
  let pos = 0
  let score = 0
  let prev = -2
  for (const ch of query) {
    let at = -1
    if (boundaryFirst) {
      for (let i = pos; i < hay.length; i += 1) {
        if (hay[i] === ch && (i === 0 || hay[i - 1] === " ")) {
          at = i
          break
        }
      }
    }
    if (at === -1) at = hay.indexOf(ch, pos)
    if (at === -1) return null
    if (at === 0 || hay[at - 1] === " ") score += 10
    else score += 4
    if (at === prev + 1) score += 8
    score -= Math.min(6, at - pos)
    idx.push(at)
    prev = at
    pos = at + 1
  }
  return { score, idx }
}

function fuzzyMatch(query: string, text: string) {
  const q = query.toLowerCase().replace(/\s+/g, "")
  if (!q) return { score: 0, idx: [] }
  const hay = text.toLowerCase()
  const a = scan(q, hay, true)
  const b = scan(q, hay, false)
  if (!a) return b
  if (!b) return a
  return a.score >= b.score ? a : b
}

function substringMatch(query: string, text: string) {
  const q = query.trim().toLowerCase()
  if (!q) return { score: 0, idx: [] }
  const at = text.toLowerCase().indexOf(q)
  if (at === -1) return null
  return {
    score: 100 - at,
    idx: Array.from({ length: q.length }, (_, i) => at + i),
  }
}

// Underline the matched letters where they sit - consecutive indices merge.
function Highlight({ text, idx }: { text: string; idx: number[] }) {
  if (!idx || idx.length === 0) return <>{text}</>
  const set = new Set(idx)
  const out: ReactNode[] = []
  let run = ""
  let marked = set.has(0)
  for (let i = 0; i <= text.length; i += 1) {
    const now = i < text.length && set.has(i)
    if (i === text.length || now !== marked) {
      if (run)
        out.push(
          marked ? (
            <span
              key={`m${i}`}
              className="text-foreground underline decoration-muted-foreground/70 decoration-1 underline-offset-[3px] group-data-[danger=true]/opt:group-data-[active=true]/opt:text-inherit"
            >
              {run}
            </span>
          ) : (
            <Fragment key={`t${i}`}>{run}</Fragment>
          )
        )
      run = ""
      marked = now
    }
    if (i < text.length) run += text[i]
  }
  return <>{out}</>
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface Clause {
  command: Command
  values: CommandOption[]
}
interface Row {
  item: CommandOption | Command
  idx: number[]
  score: number
  order: number
}
const labelOf = (item: CommandOption | Command) =>
  "label" in item ? item.label : item.value

export default function CommandPalette({
  commands,
  matcher = "fuzzy",
  morph = true,
  onApply,
  onPickCommand,
  inspect = false,
  onStateChange,
  width = "max-w-[24rem]",
}: {
  commands: Command[]
  /** "fuzzy" = scored subsequence · "substring" = plain indexOf. */
  matcher?: "fuzzy" | "substring"
  morph?: boolean
  /** Runs when ✓ Apply / ⌘⏎ commits the staged clauses. */
  onApply?: (clauses: { command: Command; values: CommandOption[] }[]) => void
  /**
   * First refusal on a command picked from the root list, handed whatever is
   * staged so far. Return true to consume it - the palette then leaves its own
   * state alone, which is how an "escape hatch" row (one that navigates away
   * instead of filling a slot) gets to skip ✓ Apply.
   */
  onPickCommand?: (
    command: Command,
    staged: { command: Command; values: CommandOption[] }[]
  ) => boolean
  inspect?: boolean
  onStateChange?: (state: CommandPaletteState) => void
  /** Tailwind max-width utility for the palette container. */
  width?: string
}) {
  const [query, setQuery] = useState("")
  const [command, setCommand] = useState<Command | null>(null)
  const [slotIndex, setSlotIndex] = useState(0)
  const [values, setValues] = useState<CommandOption[]>([])
  const [clauses, setClauses] = useState<Clause[]>([])
  const [active, setActive] = useState(0)
  const [bodyH, setBodyH] = useState<number | null>(null)
  const [leaving, setLeaving] = useState<{
    rows: Row[]
    ctx: { command: Command | null; slotIndex: number }
    dir: number
  } | null>(null)
  const [ran, setRan] = useState<{ message: string } | null>(null)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [hoveredChip, setHoveredChip] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const leaveTimerRef = useRef<number>(0)
  const ranTimerRef = useRef<number>(0)
  const bodyFirstRef = useRef(true)
  const listboxId = useId()
  const reduced = useReducedMotion()

  const slot = command ? command.slots[slotIndex] : null
  const stagedIds = useMemo(
    () => new Set(clauses.map((c) => c.command.id)),
    [clauses]
  )
  const items = useMemo<(CommandOption | Command)[]>(
    () =>
      slot
        ? slot.kind === "text"
          ? []
          : slot.options
        : commands.filter((cmd) => !stagedIds.has(cmd.id)),
    [slot, commands, stagedIds]
  )
  const viewKey = command ? `${command.id}:${slotIndex}` : "root"

  const matches = useMemo<Row[]>(() => {
    const match = matcher === "fuzzy" ? fuzzyMatch : substringMatch
    const out: Row[] = []
    items.forEach((item, order) => {
      const hit = match(query, labelOf(item))
      if (hit) out.push({ item, idx: hit.idx, score: hit.score, order })
    })
    out.sort((a, b) => b.score - a.score || a.order - b.order)
    return out
  }, [items, query, matcher])

  const activeSafe = Math.min(active, Math.max(0, matches.length - 1))

  const chipGroups = [
    ...clauses.map((clause, index) => ({
      key: `clause-${index}`,
      chips: [
        {
          key: "cmd",
          label: clause.command.label,
          kind: "cmd" as const,
          dot: undefined as string | undefined,
        },
        ...clause.values.map((v, i) => ({
          key: `v${i}`,
          label: v.value,
          kind: "val" as const,
          dot: v.dot,
        })),
      ],
    })),
    ...(command
      ? [
          {
            key: "live",
            chips: [
              {
                key: "cmd",
                label: command.label,
                kind: "cmd" as const,
                dot: undefined as string | undefined,
              },
              ...values.map((v, i) => ({
                key: `v${i}`,
                label: v.value,
                kind: "val" as const,
                dot: v.dot,
              })),
            ],
          },
        ]
      : []),
  ]
  const chips = chipGroups.flatMap((g) => g.chips.map((c) => c.label))

  function shift(dir: number, mutate: () => void) {
    if (morph && !reduced) {
      setLeaving({ rows: matches, ctx: { command, slotIndex }, dir })
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = window.setTimeout(() => setLeaving(null), 320)
    }
    mutate()
    setQuery("")
    setActive(0)
  }

  function stageClause(cmd: Command, vals: CommandOption[]) {
    shift(1, () => {
      setClauses((list) => [...list, { command: cmd, values: vals }])
      setCommand(null)
      setSlotIndex(0)
      setValues([])
    })
  }

  function applyAll() {
    if (clauses.length === 0 || command) return
    const message = clauses.map((c) => c.command.message(c.values)).join(" · ")
    onApply?.(clauses.map((c) => ({ command: c.command, values: c.values })))
    setRan({ message })
    setLastRun(message)
    clearTimeout(ranTimerRef.current)
    ranTimerRef.current = window.setTimeout(() => setRan(null), 1600)
    setClauses([])
    setQuery("")
    setActive(0)
  }

  function clearAll() {
    if (command) {
      shift(-1, () => {
        setCommand(null)
        setSlotIndex(0)
        setValues([])
        setClauses([])
      })
    } else {
      setClauses([])
      setQuery("")
      setActive(0)
    }
  }

  function pick(item: CommandOption | Command) {
    if (!command) {
      const cmd = item as Command
      if (
        onPickCommand?.(
          cmd,
          clauses.map((c) => ({ command: c.command, values: c.values }))
        )
      )
        return
      if (cmd.slots.length === 0) {
        stageClause(cmd, [])
        return
      }
      shift(1, () => {
        setCommand(cmd)
        setSlotIndex(0)
        setValues([])
      })
    } else if (slotIndex + 1 < command.slots.length) {
      shift(1, () => {
        setValues((list) => [...list, item as CommandOption])
        setSlotIndex(slotIndex + 1)
      })
    } else {
      stageClause(command, [...values, item as CommandOption])
    }
  }

  function popChip() {
    if (command) {
      if (slotIndex > 0) {
        shift(-1, () => {
          setValues((list) => list.slice(0, -1))
          setSlotIndex(slotIndex - 1)
        })
      } else {
        shift(-1, () => {
          setCommand(null)
          setValues([])
        })
      }
    } else if (clauses.length > 0) {
      const last = clauses[clauses.length - 1]
      if (last.command.slots.length === 0) {
        setClauses((list) => list.slice(0, -1))
        setActive(0)
      } else {
        shift(-1, () => {
          setClauses((list) => list.slice(0, -1))
          setCommand(last.command)
          setSlotIndex(last.command.slots.length - 1)
          setValues(last.values.slice(0, -1))
        })
      }
    }
  }

  function editChip(groupIndex: number, chipIndex: number) {
    const keep = clauses.slice(0, groupIndex)
    const isLive = command && groupIndex === clauses.length
    const cmd = isLive ? command! : clauses[groupIndex].command
    const vals = isLive ? values : clauses[groupIndex].values
    if (chipIndex === 0) {
      if (!command) {
        setClauses(keep)
        setQuery("")
        setActive(0)
      } else {
        shift(-1, () => {
          setClauses(keep)
          setCommand(null)
          setSlotIndex(0)
          setValues([])
        })
      }
    } else {
      shift(-1, () => {
        setClauses(keep)
        setCommand(cmd)
        setSlotIndex(chipIndex - 1)
        setValues(vals.slice(0, chipIndex - 1))
      })
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (matches.length)
        setActive((i) => (Math.min(i, matches.length - 1) + 1) % matches.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (matches.length)
        setActive(
          (i) =>
            (Math.min(i, matches.length - 1) - 1 + matches.length) %
            matches.length
        )
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (event.metaKey || event.ctrlKey) applyAll()
      else if (slot?.kind === "text") {
        const value = query.trim()
        if (value) pick({ value })
      } else {
        const hit = matches[activeSafe]
        if (hit) pick(hit.item)
      }
    } else if (
      event.key === "Backspace" &&
      query === "" &&
      (command || clauses.length > 0)
    ) {
      event.preventDefault()
      popChip()
    } else if (event.key === "Escape") {
      if (query !== "") {
        event.preventDefault()
        setQuery("")
        setActive(0)
      } else if (command || clauses.length > 0) {
        event.preventDefault()
        popChip()
      }
    }
  }

  // The height:auto illusion - measure the live view; motion eases `height`.
  useLayoutEffect(() => {
    const view = viewRef.current
    if (!view) return undefined
    const measure = () => setBodyH(view.offsetHeight)
    measure()
    requestAnimationFrame(() => {
      bodyFirstRef.current = false
    })
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    observer?.observe(view)
    return () => observer?.disconnect()
  }, [viewKey, matches.length])

  // Focus the single control the moment the palette appears - without this
  // the whole "one focusable input" design is inert until the user clicks in.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keep the keyboard selection on screen inside the capped list.
  useEffect(() => {
    const list = listRef.current
    const node = list?.children[activeSafe] as HTMLElement | undefined
    if (!list || !node) return
    if (node.offsetTop < list.scrollTop) list.scrollTop = node.offsetTop
    else if (
      node.offsetTop + node.offsetHeight >
      list.scrollTop + list.clientHeight
    ) {
      list.scrollTop = node.offsetTop + node.offsetHeight - list.clientHeight
    }
  }, [activeSafe, viewKey])

  useEffect(
    () => () => {
      clearTimeout(leaveTimerRef.current)
      clearTimeout(ranTimerRef.current)
    },
    []
  )

  useEffect(() => {
    onStateChange?.({
      mode: command
        ? `${command.label} → ${command.slots[slotIndex].name}`
        : "commands",
      depth: chips.length,
      staged: clauses.length,
      query,
      matches: matches.length,
      chips,
      height: bodyH == null ? null : Math.round(bodyH),
      lastRun,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    command,
    slotIndex,
    clauses,
    query,
    matches.length,
    values,
    bodyH,
    lastRun,
    onStateChange,
  ])

  function renderRows(
    rows: Row[],
    ctx: { command: Command | null; slotIndex: number },
    live: boolean
  ) {
    const textSlot = ctx.command?.slots[ctx.slotIndex]?.kind === "text"
    if (rows.length === 0) {
      if (textSlot) {
        return query.trim() === "" ? (
          <div className="flex flex-col items-center gap-1 px-3 py-[1.125rem] text-center text-[0.8125rem] text-muted-foreground/70">
            Type a value
            <span className="text-[0.6875rem]">Enter to continue</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-3 py-[1.125rem] text-center text-[0.8125rem] text-muted-foreground/70">
            Press Enter to use{" "}
            <span className="text-muted-foreground">
              &ldquo;{query.trim()}&rdquo;
            </span>
            <span className="text-[0.6875rem]">
              Esc clears · Backspace pops a chip
            </span>
          </div>
        )
      }
      return query === "" ? (
        <div className="flex flex-col items-center gap-1 px-3 py-[1.125rem] text-center text-[0.8125rem] text-muted-foreground/70">
          Everything staged
          <span className="text-[0.6875rem]">
            ✓ Apply runs it all · Backspace pops a chip
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 px-3 py-[1.125rem] text-center text-[0.8125rem] text-muted-foreground/70">
          No matches for{" "}
          <span className="text-muted-foreground">&ldquo;{query}&rdquo;</span>
          <span className="text-[0.6875rem]">
            Esc clears
            {ctx.command || clauses.length > 0
              ? " · Backspace pops a chip"
              : ""}
          </span>
        </div>
      )
    }
    const kind = ctx.command ? ctx.command.slots[ctx.slotIndex].kind : "command"
    return (
      <ul
        role={live ? "listbox" : undefined}
        id={live ? listboxId : undefined}
        aria-label={
          live
            ? ctx.command
              ? ctx.command.slots[ctx.slotIndex].prompt
              : "Commands"
            : undefined
        }
        className="m-0 flex max-h-[13.5rem] list-none flex-col gap-px overflow-y-auto p-0"
        ref={live ? listRef : undefined}
      >
        {rows.map((row, index) => {
          const isCommand = "label" in row.item
          return (
            <li
              key={labelOf(row.item)}
              id={live ? `${listboxId}-${index}` : undefined}
              role={live ? "option" : undefined}
              aria-selected={live ? index === activeSafe : undefined}
              className="group/opt flex cursor-pointer items-center gap-2 rounded-lg px-2 py-[0.4375rem] text-[0.8125rem] text-foreground/80 data-[active=true]:bg-accent data-[active=true]:text-foreground data-[danger=true]:data-[active=true]:bg-destructive/10 data-[danger=true]:data-[active=true]:text-destructive"
              data-active={live && index === activeSafe ? "true" : undefined}
              data-danger={
                isCommand && (row.item as Command).danger ? "true" : undefined
              }
              onMouseDown={
                live
                  ? (event) => {
                      event.preventDefault()
                      pick(row.item)
                    }
                  : undefined
              }
              onMouseMove={live ? () => setActive(index) : undefined}
            >
              {kind === "command" && (
                <span className="inline-flex flex-none text-muted-foreground/70 group-data-[active=true]/opt:text-muted-foreground group-data-[danger=true]/opt:group-data-[active=true]/opt:text-destructive">
                  {(row.item as Command).icon}
                </span>
              )}
              {kind === "person" && (
                <span
                  className="inline-flex h-[1.375rem] w-[1.375rem] flex-none items-center justify-center rounded-full bg-foreground/10 text-[0.5625rem] font-semibold tracking-[0.02em] text-foreground/70"
                  aria-hidden="true"
                >
                  {initials((row.item as CommandOption).value)}
                </span>
              )}
              {kind === "dot" && (
                <span
                  className="inline-block h-2 w-2 flex-none rounded-full"
                  style={{
                    background:
                      (row.item as CommandOption).dot ??
                      "var(--color-muted-foreground)",
                  }}
                  aria-hidden="true"
                />
              )}
              {kind === "plain" && (
                <span className="inline-flex flex-none text-muted-foreground/70 group-data-[active=true]/opt:text-muted-foreground">
                  {ctx.command?.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                <Highlight text={labelOf(row.item)} idx={row.idx} />
              </span>
              {"hint" in row.item && row.item.hint && (
                <span className="flex-none text-[0.6875rem] text-muted-foreground/70">
                  {row.item.hint}
                </span>
              )}
              {isCommand && (row.item as Command).shortcut ? (
                <kbd
                  className="inline-flex min-w-4 items-center justify-center rounded px-1 font-mono text-[0.625rem] leading-normal text-muted-foreground inset-ring inset-ring-foreground/10 group-data-[active=true]/opt:bg-background group-data-[active=true]/opt:inset-ring-0"
                  aria-hidden="true"
                >
                  {(row.item as Command).shortcut}
                </kbd>
              ) : (
                <kbd
                  className="inline-flex min-w-4 items-center justify-center rounded bg-muted px-1 font-mono text-[0.625rem] leading-normal text-muted-foreground opacity-0 group-data-[active=true]/opt:opacity-100"
                  aria-hidden="true"
                >
                  ↵
                </kbd>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  // Flat chip counter for the tail-dim preview (hover a chip → later chips dim).
  let flat = -1

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`relative w-full ${width}`}
        data-inspect={inspect ? "true" : "false"}
      >
        <div className="overflow-hidden rounded-xl bg-popover shadow-border">
          <div
            className={`flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2.5 cursor-text${
              inspect
                ? "outline outline-[1.5px] -outline-offset-[3px] outline-[#ef4444] outline-dashed"
                : ""
            }`}
            onClick={() => inputRef.current?.focus()}
          >
            <span
              className="inline-flex flex-none text-muted-foreground/70"
              aria-hidden="true"
            >
              <SearchIcon />
            </span>
            {chipGroups.map((group, groupIndex) => (
              <Fragment key={group.key}>
                {groupIndex > 0 &&
                  (() => {
                    flat += 1
                    const myFlat = flat
                    return (
                      <span
                        className="flex-none text-[0.6875rem] font-medium text-muted-foreground/70 transition-opacity duration-[240ms]"
                        style={{
                          opacity:
                            hoveredChip != null && myFlat > hoveredChip
                              ? 0.35
                              : 1,
                        }}
                      >
                        and
                      </span>
                    )
                  })()}
                {group.chips.map((chip, chipIndex) => {
                  flat += 1
                  const myFlat = flat
                  const isLast =
                    groupIndex === chipGroups.length - 1 &&
                    chipIndex === group.chips.length - 1
                  return (
                    <span
                      className="inline-flex transition-opacity duration-[240ms]"
                      key={`${group.key}-${chip.key}`}
                      style={{
                        opacity:
                          hoveredChip != null && myFlat > hoveredChip
                            ? 0.35
                            : 1,
                      }}
                    >
                      <motion.button
                        type="button"
                        tabIndex={-1}
                        initial={
                          morph && !reduced
                            ? { opacity: 0, scale: 0.85, filter: "blur(2px)" }
                            : false
                        }
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.24, ease: EASE }}
                        className={`inline-flex min-w-0 cursor-pointer items-center gap-[0.3125rem] overflow-hidden rounded-md px-[0.4375rem] py-[0.1875rem] text-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.96] ${
                          chip.kind === "cmd"
                            ? "bg-primary text-primary-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-primary/85"
                            : "bg-muted text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-foreground/10"
                        }`}
                        aria-label={`${chip.kind === "cmd" ? "Remove" : "Change"} ${chip.label}${isLast ? "" : ", also removes later chips"}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setHoveredChip(myFlat)}
                        onMouseLeave={() => setHoveredChip(null)}
                        onClick={() => editChip(groupIndex, chipIndex)}
                      >
                        {chip.dot && (
                          <span
                            className="inline-block h-2 w-2 flex-none rounded-full"
                            style={{ background: chip.dot }}
                            aria-hidden="true"
                          />
                        )}
                        {chip.label}
                      </motion.button>
                    </span>
                  )
                })}
              </Fragment>
            ))}
            <input
              ref={inputRef}
              className="min-w-[5rem] flex-1 border-0 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              type="text"
              value={query}
              placeholder={slot ? slot.prompt : "Type a command"}
              aria-label={slot ? slot.prompt : "Type a command"}
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={
                matches.length ? `${listboxId}-${activeSafe}` : undefined
              }
              aria-autocomplete="list"
              aria-describedby={
                chips.length > 0 ? `${listboxId}-trail` : undefined
              }
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={handleKeyDown}
            />
            <span id={`${listboxId}-trail`} className="sr-only">
              {chips.length > 0
                ? `Building: ${chipGroups.map((g) => g.chips.map((c) => c.label).join(" ")).join(", and ")}. Backspace removes the last chip.`
                : ""}
            </span>
          </div>

          <motion.div
            className={`relative overflow-hidden${inspect ? "outline outline-[1.5px] -outline-offset-[3px] outline-[#3b82f6] outline-dashed" : ""}`}
            animate={{ height: bodyH ?? "auto" }}
            transition={
              !morph || reduced || bodyFirstRef.current
                ? { duration: 0 }
                : { duration: 0.3, ease: EASE }
            }
          >
            {leaving && morph && !reduced && (
              <motion.div
                className="pointer-events-none absolute top-0 left-0 w-full p-1"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: -leaving.dir * SLIDE, opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                aria-hidden="true"
                inert
              >
                {renderRows(leaving.rows, leaving.ctx, false)}
              </motion.div>
            )}
            <motion.div
              className="p-1"
              key={viewKey}
              ref={viewRef}
              initial={
                leaving && morph && !reduced
                  ? { x: leaving.dir * SLIDE, opacity: 0, filter: "blur(2px)" }
                  : false
              }
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {renderRows(matches, { command, slotIndex }, true)}
            </motion.div>
          </motion.div>

          <div className="relative flex min-h-8 items-center justify-between gap-2 border-t border-border px-3 py-[0.4375rem] text-[0.6875rem] text-muted-foreground/70">
            <motion.span
              className="inline-flex items-center gap-[0.3125rem]"
              animate={
                ran
                  ? { opacity: 0, y: -4, filter: "blur(2px)" }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              transition={{ duration: 0.25, ease: EASE_ICON }}
              style={{ pointerEvents: ran ? "none" : undefined }}
            >
              {command ? (
                <>
                  {command.label} · {command.slots[slotIndex].name}{" "}
                  {slotIndex + 1} of {command.slots.length}
                </>
              ) : clauses.length > 0 ? (
                <>
                  <span className="tabular-nums">{clauses.length}</span> staged
                  · add another or apply
                </>
              ) : (
                <>{commands.length} commands</>
              )}
            </motion.span>
            <motion.span
              className="group/apply inline-flex items-center gap-3"
              animate={
                ran
                  ? { opacity: 0, y: -4, filter: "blur(2px)" }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              transition={{ duration: 0.25, ease: EASE_ICON }}
              style={{ pointerEvents: ran ? "none" : undefined }}
            >
              <button
                type="button"
                className="relative inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-transparent text-muted-foreground/70 transition-[background-color,color,opacity,scale] duration-150 after:absolute after:-inset-1.5 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring hover:enabled:bg-accent hover:enabled:text-foreground active:enabled:scale-[0.96] disabled:cursor-default disabled:opacity-35"
                disabled={clauses.length === 0 && !command && query === ""}
                aria-label="Clear staged commands"
                onMouseDown={(event) => event.preventDefault()}
                onClick={clearAll}
              >
                <XIcon />
              </button>
              <button
                type="button"
                className="relative inline-flex h-7 cursor-pointer items-center gap-[0.3125rem] rounded-[0.4375rem] bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-[background-color,color,scale] duration-150 after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:enabled:scale-[0.96] disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground/70 disabled:[&_[data-n]]:bg-foreground/[0.06]"
                disabled={clauses.length === 0 || !!command}
                aria-label={`Apply ${clauses.length} staged ${clauses.length === 1 ? "command" : "commands"}`}
                aria-keyshortcuts="Meta+Enter Control+Enter"
                title="⌘⏎"
                onMouseDown={(event) => event.preventDefault()}
                onClick={applyAll}
              >
                <CheckIcon />
                Apply
                {clauses.length > 0 && (
                  <span
                    data-n
                    className="inline-flex min-w-4 items-center justify-center rounded-[0.3125rem] bg-primary-foreground/[0.18] px-1 text-[0.625rem] leading-normal tabular-nums"
                  >
                    {clauses.length}
                  </span>
                )}
              </button>
            </motion.span>
            <motion.span
              className="absolute inset-0 flex items-center gap-1.5 px-3 font-medium text-foreground"
              aria-hidden={!ran}
              initial={false}
              animate={
                ran
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 4, filter: "blur(2px)" }
              }
              transition={{ duration: 0.25, ease: EASE_ICON }}
              style={{ pointerEvents: "none" }}
            >
              <span className="inline-flex flex-none text-[#16a34a]">
                <CheckIcon />
              </span>
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {ran?.message ?? lastRun}
              </span>
            </motion.span>
          </div>
        </div>

        <span className="sr-only" aria-live="polite">
          {ran
            ? `Applied: ${ran.message}`
            : `${slot ? `${slot.prompt}: ` : ""}${matches.length} ${matches.length === 1 ? "result" : "results"}${clauses.length > 0 ? `, ${clauses.length} staged` : ""}`}
        </span>

        {inspect && (
          <>
            <span className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-0 z-[6] rounded-[0.25rem] border border-[#bfdbfe] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium tracking-[0.01em] whitespace-nowrap text-[#2563eb] tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              {matcher === "fuzzy"
                ? "fuzzy: word-start +10 · adjacent +8 · gap −1"
                : "substring: indexOf, earlier hit wins"}
            </span>
            <span className="pointer-events-none absolute top-[calc(100%+0.4rem)] left-0 z-[6] rounded-[0.25rem] border border-[#fecaca] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium tracking-[0.01em] whitespace-nowrap text-[#dc2626] tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              one tab stop · chip click rewinds · ⌫ pops · ⌘⏎ applies
            </span>
            <span className="pointer-events-none absolute top-[calc(100%+0.4rem)] right-0 z-[6] rounded-[0.25rem] border border-[#bfdbfe] bg-white px-[0.3125rem] py-[0.0625rem] text-[0.625rem] leading-normal font-medium tracking-[0.01em] whitespace-nowrap text-[#2563eb] tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              height: {bodyH == null ? "auto" : `${Math.round(bodyH)}px`} ·
              measured → eased
            </span>
          </>
        )}
      </div>
    </MotionConfig>
  )
}

function Svg({ children, size = 15 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
    <Svg size={16}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  )
}
function CheckIcon() {
  return (
    <Svg size={13}>
      <path d="M20 6 9 17l-5-5" strokeWidth="2.5" />
    </Svg>
  )
}
function XIcon() {
  return (
    <Svg size={13}>
      <path d="M18 6 6 18M6 6l12 12" strokeWidth="2.5" />
    </Svg>
  )
}
