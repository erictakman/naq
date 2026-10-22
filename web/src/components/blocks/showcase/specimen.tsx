import { useId } from "react"
import type React from "react"

import { cn } from "@/lib/utils"

type ShowcaseSectionProps = {
  id: string
  title: string
  description: string
  children: React.ReactNode
}

/** One chapter of the showcase. The `id` is the sidebar's anchor target. */
export function ShowcaseSection({
  id,
  title,
  description,
  children,
}: ShowcaseSectionProps): React.ReactElement {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      // scroll-mt keeps the heading clear of the sticky top bar on jump.
      className="flex scroll-mt-20 flex-col gap-6"
    >
      <header className="flex flex-col gap-1.5">
        <h2 id={headingId} className="font-heading text-3xl font-semibold">
          {title}
        </h2>
        <p className="max-w-[64ch] text-muted-foreground">{description}</p>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </section>
  )
}

type SpecimenProps = {
  /** Component name as imported, e.g. "Button". Shown in mono. */
  name: string
  /** Where it lives, e.g. "ui/button". */
  source: string
  note?: string
  /** Span both grid columns on wide screens. */
  wide?: boolean
  className?: string
  children: React.ReactNode
}

/** A labelled frame around one component and its variants. */
export function Specimen({
  name,
  source,
  note,
  wide = false,
  className,
  children,
}: SpecimenProps): React.ReactElement {
  const titleId = useId()

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 flex-col overflow-clip rounded-[20px] bg-muted ring-1 ring-border ring-inset",
        wide && "xl:col-span-2"
      )}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4 pb-3">
        <h3 id={titleId} className="font-mono text-sm font-medium">
          {name}
        </h3>
        <code className="text-xs text-muted-foreground">{source}</code>
        {note && <p className="w-full text-xs text-muted-foreground">{note}</p>}
      </header>
      <div
        className={cn(
          "mx-1.5 mb-1.5 flex flex-1 flex-wrap items-center gap-3 rounded-[14px] bg-card p-5 shadow-panel ring-1 ring-border ring-inset",
          className
        )}
      >
        {children}
      </div>
    </article>
  )
}

/** Small caption above a row of variants inside a specimen. */
export function VariantRow({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}): React.ReactElement {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {children}
      </div>
    </div>
  )
}
