import { ChevronRight, Globe, LockKeyhole } from "lucide-react"
import type React from "react"

import { Chip } from "@/components/ui/chip"
import { cn } from "@/lib/utils"

type CommissionedCardProps = {
  access: "invite-only" | "public"
  title: string
  description: string
  actionLabel: string
  actionHref: string
  className?: string
}

const accessChip = {
  "invite-only": { label: "Invite only", Icon: LockKeyhole },
  public: { label: "Public", Icon: Globe },
} as const

/** Premier promotion: commissioned research and other gated content. */
export function CommissionedCard({
  access,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: CommissionedCardProps): React.ReactElement {
  const { label, Icon } = accessChip[access]

  return (
    <section
      aria-label={title}
      className={cn(
        "relative flex min-h-66 flex-col justify-between gap-6 overflow-clip rounded-3xl bg-muted py-6 pr-8 pl-6 ring-1 ring-border ring-inset",
        className
      )}
    >
      <Chip variant="outline" shape="pill" size="sm" className="self-start">
        <Icon aria-hidden className="size-3" strokeWidth={1.5} />
        {label}
      </Chip>

      <div className="relative z-10 flex max-w-60 flex-col gap-1.5">
        <h2 className="font-heading text-2xl leading-7.5 font-semibold">
          {title}
        </h2>
        <p className="text-[13px] leading-4">{description}</p>
      </div>

      {/* The whole card is not a link: only the action is, so the card's
          text stays selectable and the link name stays short. */}
      <a
        href={actionHref}
        className="group inline-flex items-center gap-1.5 self-start rounded-sm text-sm leading-4.5 font-semibold outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {actionLabel}
        <ChevronRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.5}
        />
      </a>

      {/* Decorative seal, echoing the editorial paper texture. */}
      <svg
        aria-hidden
        viewBox="0 0 120 120"
        className="pointer-events-none absolute -right-12 -bottom-14 size-40 text-border"
      >
        <circle
          cx="60"
          cy="60"
          r="56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <circle
          cx="60"
          cy="60"
          r="30"
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </section>
  )
}
