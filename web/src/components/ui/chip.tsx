import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"
import { cn } from "@/lib/utils"

/**
 * Courier chip: a non-interactive label (a tag, a status, an access level).
 * Badge is the small count/marker; Chip is the word-sized label next to content.
 */
export const chipVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    defaultVariants: {
      variant: "neutral",
      shape: "rounded",
      size: "default",
    },
    variants: {
      variant: {
        neutral: "bg-muted-foreground/10 text-muted-foreground",
        primary: "bg-error-muted text-primary",
        info: "bg-info-muted text-info-foreground",
        success: "bg-success-muted text-success-foreground",
        warning: "bg-warning-muted text-warning-foreground",
        error: "bg-error-muted text-error-foreground",
        // The "Invite only" / "Public" pill: a card-coloured lozenge.
        outline: "bg-card text-foreground ring-1 ring-border ring-inset",
      },
      shape: {
        rounded: "rounded-[12px]",
        pill: "rounded-full",
      },
      size: {
        default: "px-3 py-1.5 text-xs leading-4",
        sm: "px-2 py-1 text-[11px] leading-3.5",
      },
    },
  }
)

export interface ChipProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof chipVariants>["variant"]
  shape?: VariantProps<typeof chipVariants>["shape"]
  size?: VariantProps<typeof chipVariants>["size"]
}

export function Chip({
  className,
  variant,
  shape,
  size,
  render,
  ...props
}: ChipProps): React.ReactElement {
  const defaultProps = {
    className: cn(chipVariants({ variant, shape, size }), className),
    "data-slot": "chip",
  }

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  })
}
