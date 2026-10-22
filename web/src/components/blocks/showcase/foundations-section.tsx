import { useEffect, useState } from "react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
  VariantRow,
} from "@/components/blocks/showcase/specimen"

const colorGroups: { label: string; tokens: string[] }[] = [
  {
    label: "Surfaces and text",
    tokens: [
      "background",
      "foreground",
      "card",
      "muted",
      "muted-foreground",
      "accent",
      "border",
      "input",
    ],
  },
  {
    label: "Actions",
    tokens: ["primary", "primary-foreground", "secondary", "destructive"],
  },
  {
    label: "Status",
    tokens: [
      "info",
      "info-foreground",
      "info-muted",
      "success",
      "success-foreground",
      "success-muted",
      "warning",
      "warning-foreground",
      "warning-muted",
      "error",
      "error-foreground",
      "error-muted",
    ],
  },
  {
    label: "Charts",
    tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
]

// Shadows and radii are declared in `@theme inline`, which inlines their
// values into the utilities instead of emitting `--shadow-*` variables, so
// they are shown through the utility classes. The class names must be
// written out in full: Tailwind finds them by scanning source text, and a
// template string like `shadow-${name}` never appears in the source.
const shadowClasses = {
  bevel: "shadow-bevel",
  "bevel-selected": "shadow-bevel-selected",
  well: "shadow-well",
  "well-deep": "shadow-well-deep",
  panel: "shadow-panel",
  raised: "shadow-raised",
  floating: "shadow-floating",
  menu: "shadow-menu",
} as const

const radiusClasses = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  "4xl": "rounded-4xl",
  full: "rounded-full",
} as const

/**
 * Resolves each token to the colour the browser actually paints, as hex.
 *
 * Reading the custom property gives back its source text, which in dark mode
 * is `color-mix(...)` or `oklch(...)`: not something to paste into Paper.
 * So the token is applied to a probe element (the browser resolves var(),
 * color-mix() and oklch()), painted onto a 1×1 canvas, and the pixel is read
 * back. Alpha survives, so translucent tokens come out as #rrggbbaa.
 */
function resolveColor(
  token: string,
  probe: HTMLElement,
  context: CanvasRenderingContext2D
): string {
  probe.style.color = `var(${token})`
  const computed = getComputedStyle(probe).color
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = computed
  context.fillRect(0, 0, 1, 1)
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
  const channels =
    alpha === 255 ? [red, green, blue] : [red, green, blue, alpha]
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

/** Re-resolves when the `dark` class on <html> flips. */
function useResolvedColors(tokens: string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({})
  const key = tokens.join(",")

  useEffect(() => {
    const root = document.documentElement
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    const probe = document.createElement("span")
    probe.hidden = true
    document.body.append(probe)

    const read = () =>
      setValues(
        Object.fromEntries(
          key
            .split(",")
            .map((token) => [token, resolveColor(token, probe, context)])
        )
      )
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      probe.remove()
    }
  }, [key])

  return values
}

export function FoundationsSection(): React.ReactElement {
  const colorValues = useResolvedColors(
    colorGroups.flatMap((group) => group.tokens.map((token) => `--${token}`))
  )

  return (
    <ShowcaseSection
      id="foundations"
      title="Foundations"
      description="The tokens every component reads. Colour values are resolved by the browser to hex, so they follow the theme toggle and can be copied straight into Paper."
    >
      <Specimen
        name="Colour"
        source="src/index.css :root"
        wide
        className="flex-col items-stretch gap-6"
      >
        {colorGroups.map((group) => (
          <VariantRow key={group.label} label={group.label}>
            <ul className="grid w-full grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
              {group.tokens.map((token) => (
                <li key={token} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-9 shrink-0 rounded-lg ring-1 ring-border ring-inset"
                    style={{ background: `var(--${token})` }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium">
                      --{token}
                    </span>
                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                      {colorValues[`--${token}`] || "…"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </VariantRow>
        ))}
      </Specimen>

      <Specimen
        name="Typography"
        source="--font-sans · --font-heading · --font-mono"
        className="flex-col items-start gap-5"
      >
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground">
            Platypi · font-heading
          </p>
          <p className="font-heading text-4xl leading-tight font-semibold">
            Markets open higher
          </p>
          <p className="font-heading text-xl italic">
            “Italic for pull quotes”
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground">
            Outfit · font-sans
          </p>
          <p className="text-base">
            Body 16/24 for reading.{" "}
            <strong className="font-semibold">Semibold 600</strong> for labels.
          </p>
          <p className="text-sm text-muted-foreground">
            Secondary 14/20 in muted-foreground.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground">
            Azeret Mono · font-mono + tabular-nums
          </p>
          <p className="font-mono text-sm tabular-nums">
            $1,129.00 · 27-04-2026 · NHVN
          </p>
        </div>
      </Specimen>

      <Specimen
        name="Radius"
        source="rounded-* (scale of --radius: 0.75rem)"
        className="items-end"
      >
        {Object.entries(radiusClasses).map(([token, radiusClass]) => (
          <div key={token} className="flex flex-col items-center gap-2">
            <span
              aria-hidden
              className={`size-14 border-2 border-primary/40 bg-error-muted ${radiusClass}`}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              {radiusClass}
            </span>
          </div>
        ))}
      </Specimen>

      <Specimen
        name="Shadow"
        source="shadow-* (Courier)"
        wide
        className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-6 bg-muted"
      >
        {Object.entries(shadowClasses).map(([token, shadowClass]) => (
          <div key={token} className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className={`h-16 w-full rounded-2xl bg-card ${shadowClass}`}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              {shadowClass}
            </span>
          </div>
        ))}
      </Specimen>
    </ShowcaseSection>
  )
}
