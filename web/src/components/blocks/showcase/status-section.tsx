import { Globe, LockKeyhole } from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
  VariantRow,
} from "@/components/blocks/showcase/specimen"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Chip, type ChipProps } from "@/components/ui/chip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

const badgeVariants: NonNullable<BadgeProps["variant"]>[] = [
  "default",
  "secondary",
  "outline",
  "info",
  "success",
  "warning",
  "error",
  "destructive",
]

const chipVariants: NonNullable<ChipProps["variant"]>[] = [
  "neutral",
  "primary",
  "info",
  "success",
  "warning",
  "error",
  "outline",
]

export function StatusSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="status"
      title="Labels and status"
      description="Badge is a small marker or count. Chip is a word-sized label beside content: a topic, a status, an access level."
    >
      <Specimen
        name="Badge"
        source="ui/badge"
        className="flex-col items-start gap-4"
      >
        <VariantRow label="variant">
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </VariantRow>
        <VariantRow label="size">
          <Badge size="sm">sm</Badge>
          <Badge>default</Badge>
          <Badge size="lg">lg</Badge>
        </VariantRow>
      </Specimen>

      <Specimen
        name="Chip"
        source="ui/chip"
        className="flex-col items-start gap-4"
      >
        <VariantRow label="variant">
          {chipVariants.map((variant) => (
            <Chip key={variant} variant={variant}>
              {variant}
            </Chip>
          ))}
        </VariantRow>
        <VariantRow label="shape pill · size sm · with icon">
          <Chip variant="outline" shape="pill" size="sm">
            <LockKeyhole strokeWidth={1.5} />
            Invite only
          </Chip>
          <Chip variant="outline" shape="pill" size="sm">
            <Globe strokeWidth={1.5} />
            Public
          </Chip>
          <Chip variant="success" shape="pill">
            Published
          </Chip>
        </VariantRow>
      </Specimen>

      <Specimen name="Avatar" source="ui/avatar">
        <Avatar>
          <AvatarFallback>IS</AvatarFallback>
        </Avatar>
        <Avatar className="size-10">
          <AvatarFallback className="bg-paper font-semibold text-primary">
            TE
          </AvatarFallback>
        </Avatar>
        <div className="flex -space-x-2">
          {["MA", "AH", "JL"].map((initials) => (
            <Avatar key={initials} className="size-10 ring-2 ring-card">
              <AvatarFallback className="bg-info-muted text-info-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </Specimen>

      <Specimen name="Kbd" source="ui/kbd">
        <Kbd>/</Kbd>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <span className="text-sm text-muted-foreground">
          Press <Kbd>Esc</Kbd> to close
        </span>
      </Specimen>

      <Specimen name="Spinner · Skeleton" source="ui/spinner · ui/skeleton">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-label="Loading" />
          Loading prices…
        </span>
        <div aria-hidden className="flex w-full items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </Specimen>

      <Specimen name="Separator" source="ui/separator">
        <div className="flex w-full flex-col gap-3 text-sm">
          <span>Markets</span>
          <Separator />
          <div className="flex h-5 items-center gap-3">
            <span>Bank</span>
            <Separator orientation="vertical" />
            <span>Ledger</span>
            <Separator orientation="vertical" />
            <span>Paper</span>
          </div>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
