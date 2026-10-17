import type React from "react"

import { cn } from "@/lib/utils"
import type { CoverTone } from "@/lib/paper"

const toneClasses: Record<CoverTone, { ground: string; ink: string }> = {
  paper: { ground: "bg-paper", ink: "text-sand" },
  lake: { ground: "bg-info-muted", ink: "text-lake" },
  moss: { ground: "bg-success-muted", ink: "text-moss" },
  crimson: { ground: "bg-error-muted", ink: "text-crimson" },
}

type ArticleCoverProps = {
  tone: CoverTone
  className?: string
}

/**
 * Placeholder artwork for articles without a photo: a tinted ground with
 * contour lines. Decorative, so it is hidden from assistive technology;
 * a real photo should be an <img> with alt text instead.
 */
export function ArticleCover({
  tone,
  className,
}: ArticleCoverProps): React.ReactElement {
  const { ground, ink } = toneClasses[tone]
  const contours = [0, 1, 2, 3, 4, 5, 6]

  return (
    <div
      aria-hidden
      className={cn("overflow-clip rounded-[20px]", ground, className)}
    >
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        className={cn("size-full", ink)}
      >
        {contours.map((index) => (
          <path
            key={index}
            d={`M -20 ${170 - index * 18} C 80 ${120 - index * 22}, 160 ${210 - index * 14}, 260 ${140 - index * 20} S 380 ${90 - index * 10}, 420 ${110 - index * 16}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25 + index * 0.1}
            strokeWidth={1.5}
          />
        ))}
      </svg>
    </div>
  )
}
