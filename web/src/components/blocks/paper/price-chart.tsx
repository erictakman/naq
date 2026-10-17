import { useEffect, useId, useRef, useState } from "react"
import type React from "react"

import { cn } from "@/lib/utils"
import {
  type ClosingPrice,
  formatDayMonth,
  formatLongDate,
  formatMoney,
} from "@/lib/paper"

type PriceChartProps = {
  prices: ClosingPrice[]
  currency: string
  label: string
  className?: string
}

// The viewBox is kept equal to the rendered size in CSS pixels (measured
// with a ResizeObserver), so 11px labels stay 11px on a phone instead of
// shrinking with a scaled-down drawing.
const height = 240
const padding = { top: 16, right: 48, bottom: 28, left: 8 }
const plotHeight = height - padding.top - padding.bottom

function useElementWidth(fallback: number) {
  const elementReference = useRef<HTMLDivElement>(null)
  const [elementWidth, setElementWidth] = useState(fallback)

  useEffect(() => {
    const element = elementReference.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      setElementWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [elementReference, elementWidth] as const
}

function niceTicks(minimum: number, maximum: number, count: number): number[] {
  const step = Math.ceil((maximum - minimum) / count / 5) * 5
  const start = Math.floor(minimum / step) * step
  return Array.from(
    { length: count + 2 },
    (_, index) => start + index * step
  ).filter((tick) => tick <= maximum + step)
}

/**
 * Single-series closing price line. One series needs no legend; the caption
 * names it. Hover (or touch) shows the nearest close; the same numbers are
 * available as a table for keyboard and screen reader users.
 */
export function PriceChart({
  prices,
  currency,
  label,
  className,
}: PriceChartProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const gradientId = useId()
  const [containerReference, width] = useElementWidth(640)
  const plotWidth = width - padding.left - padding.right

  const closes = prices.map((price) => price.close)
  const ticks = niceTicks(Math.min(...closes), Math.max(...closes), 3)
  const lowest = ticks[0]
  const highest = ticks.at(-1) ?? lowest + 1

  const xFor = (index: number) =>
    padding.left + (index / Math.max(1, prices.length - 1)) * plotWidth
  const yFor = (close: number) =>
    padding.top + (1 - (close - lowest) / (highest - lowest)) * plotHeight

  const linePath = prices
    .map(
      (price, index) =>
        `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(price.close)}`
    )
    .join(" ")
  const baseline = padding.top + plotHeight
  const areaPath = `${linePath} L${xFor(prices.length - 1)},${baseline} L${xFor(0)},${baseline} Z`

  const first = prices[0]
  const last = prices.at(-1) ?? first
  const active = activeIndex === null ? null : prices[activeIndex]

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * width
    const ratio = (x - padding.left) / plotWidth
    const index = Math.round(ratio * (prices.length - 1))
    setActiveIndex(Math.min(prices.length - 1, Math.max(0, index)))
  }

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div ref={containerReference} className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${label}: from ${formatMoney(first.close, currency)} on ${formatLongDate(first.date)} to ${formatMoney(last.close, currency)} on ${formatLongDate(last.date)}.`}
          width={width}
          height={height}
          className="block w-full touch-pan-y overflow-visible"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={padding.left + plotWidth}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="var(--border)"
                strokeDasharray={tick === lowest ? undefined : "2 4"}
              />
              <text
                x={width - padding.right + 8}
                y={yFor(tick)}
                dominantBaseline="middle"
                className="fill-muted-foreground font-mono text-[11px]"
              >
                {tick}
              </text>
            </g>
          ))}

          {[0, Math.floor((prices.length - 1) / 2), prices.length - 1].map(
            (index) => (
              <text
                key={index}
                x={xFor(index)}
                y={height - 8}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === prices.length - 1
                      ? "end"
                      : "middle"
                }
                className="fill-muted-foreground text-[11px]"
              >
                {formatDayMonth(prices[index].date)}
              </text>
            )
          )}

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Direct label on the latest close only. */}
          <circle
            cx={xFor(prices.length - 1)}
            cy={yFor(last.close)}
            r={4}
            fill="var(--primary)"
            stroke="var(--card)"
            strokeWidth={2}
          />

          {active && activeIndex !== null && (
            <g pointerEvents="none">
              <line
                x1={xFor(activeIndex)}
                x2={xFor(activeIndex)}
                y1={padding.top}
                y2={baseline}
                stroke="var(--input)"
              />
              <circle
                cx={xFor(activeIndex)}
                cy={yFor(active.close)}
                r={5}
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {active && activeIndex !== null && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col rounded-xl bg-popover px-3 py-2 text-xs shadow-menu ring-1 ring-border"
            style={{ left: `${(xFor(activeIndex) / width) * 100}%` }}
          >
            <span className="text-muted-foreground">
              {formatLongDate(active.date)}
            </span>
            <span className="font-mono font-medium tabular-nums">
              {formatMoney(active.close, currency)}
            </span>
          </div>
        )}
      </div>

      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}, weekly close</span>
        <details className="group">
          <summary className="cursor-pointer rounded-sm font-medium text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring">
            Show data
          </summary>
          <table className="mt-2 w-full font-mono tabular-nums">
            <thead>
              <tr className="text-left">
                <th scope="col" className="pr-6 font-sans font-medium">
                  Week ending
                </th>
                <th scope="col" className="text-right font-sans font-medium">
                  Close
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.date}>
                  <td className="pr-6">{formatLongDate(price.date)}</td>
                  <td className="text-right">
                    {formatMoney(price.close, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  )
}
