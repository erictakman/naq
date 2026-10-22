import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Plus,
  Share2,
  Underline,
} from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
  VariantRow,
} from "@/components/blocks/showcase/specimen"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Group, GroupSeparator } from "@/components/ui/group"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/toolbar"

const buttonVariants: NonNullable<ButtonProps["variant"]>[] = [
  "default",
  "raised",
  "primary-subtle",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
  "destructive-outline",
]

const buttonSizes: NonNullable<ButtonProps["size"]>[] = [
  "xs",
  "sm",
  "default",
  "lg",
  "xl",
]

export function ActionsSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="actions"
      title="Actions"
      description="Pills you press. One default (brand red) button per view; raised is the everyday secondary action."
    >
      <Specimen
        name="Button"
        source="ui/button"
        wide
        className="flex-col items-start gap-5"
      >
        <VariantRow label="variant">
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </VariantRow>
        <VariantRow label="size">
          {buttonSizes.map((size) => (
            <Button key={size} variant="raised" size={size}>
              {size}
            </Button>
          ))}
        </VariantRow>
        <VariantRow label="icon sizes · with icon · state">
          <Button size="icon-sm" variant="raised" aria-label="Add">
            <Plus />
          </Button>
          <Button size="icon" variant="raised" aria-label="Add">
            <Plus />
          </Button>
          <Button size="icon-lg" aria-label="Add">
            <Plus />
          </Button>
          <Button variant="raised">
            <Share2 />
            Share
          </Button>
          <Button loading>Saving</Button>
          <Button variant="raised" disabled>
            Disabled
          </Button>
          <Button variant="link" render={<a href="#actions" />}>
            Rendered as a link
          </Button>
        </VariantRow>
      </Specimen>

      <Specimen name="Toggle" source="ui/toggle">
        <Toggle aria-label="Bold">
          <Bold />
        </Toggle>
        <Toggle variant="outline" aria-label="Italic" defaultPressed>
          <Italic />
        </Toggle>
        <Toggle variant="outline">Watchlist</Toggle>
      </Specimen>

      <Specimen name="ToggleGroup" source="ui/toggle-group">
        <ToggleGroup aria-label="Text style" multiple>
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline />
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          aria-label="Period"
          variant="outline"
          defaultValue={["1m"]}
        >
          <ToggleGroupItem value="1d">1D</ToggleGroupItem>
          <ToggleGroupItem value="1m">1M</ToggleGroupItem>
          <ToggleGroupItem value="1y">1Y</ToggleGroupItem>
        </ToggleGroup>
      </Specimen>

      <Specimen name="Group" source="ui/group">
        <Group aria-label="Export">
          <Button variant="outline">Export</Button>
          <GroupSeparator />
          <Button
            variant="outline"
            size="icon"
            aria-label="More export options"
          >
            <Plus />
          </Button>
        </Group>
      </Specimen>

      <Specimen name="Toolbar" source="ui/toolbar">
        <Toolbar aria-label="Formatting">
          <ToggleGroup className="border-none p-0" defaultValue={["left"]}>
            <ToolbarButton
              aria-label="Align left"
              render={<ToggleGroupItem value="left" />}
            >
              <AlignLeft />
            </ToolbarButton>
            <ToolbarButton
              aria-label="Align center"
              render={<ToggleGroupItem value="center" />}
            >
              <AlignCenter />
            </ToolbarButton>
            <ToolbarButton
              aria-label="Align right"
              render={<ToggleGroupItem value="right" />}
            >
              <AlignRight />
            </ToolbarButton>
          </ToggleGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarButton render={<Button variant="raised" size="sm" />}>
              Save
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </Specimen>
    </ShowcaseSection>
  )
}
