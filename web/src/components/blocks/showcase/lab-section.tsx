import { Bell, Flag, UserRound } from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import MentionComposer from "@/components/lab/caret-mention-popover"
import CommandPalette, { type Command } from "@/components/lab/command-palette"
import WheelList from "@/components/lab/inertial-wheel-list"
import SharePopover from "@/components/lab/share-permissions-popover"

// Commands are data: each has typed argument slots, and `message` turns the
// chosen options into the applied summary.
const commands: Command[] = [
  {
    id: "alert",
    label: "Set price alert",
    icon: <Bell className="size-3.5" />,
    slots: [
      {
        name: "ticker",
        prompt: "Which stock?",
        kind: "plain",
        options: [{ value: "NHVN" }, { value: "LUMA" }, { value: "SKOG" }],
      },
      {
        name: "level",
        prompt: "At what change?",
        kind: "plain",
        options: [{ value: "±2%" }, { value: "±5%" }, { value: "±10%" }],
      },
    ],
    message: ([ticker, level]) =>
      `Alert on ${ticker?.value} at ${level?.value}`,
  },
  {
    id: "assign",
    label: "Assign analyst",
    icon: <UserRound className="size-3.5" />,
    slots: [
      {
        name: "analyst",
        prompt: "Who covers it?",
        kind: "person",
        options: [
          { value: "Ingrid Solberg", hint: "Markets" },
          { value: "Tomas Ek", hint: "Shipping" },
        ],
      },
    ],
    message: ([analyst]) => `Assigned to ${analyst?.value}`,
  },
  {
    id: "flag",
    label: "Flag as commissioned",
    icon: <Flag className="size-3.5" />,
    danger: true,
    slots: [],
    message: () => "Flagged as commissioned",
  },
]

const horizons = [
  "1 month",
  "3 months",
  "6 months",
  "1 year",
  "2 years",
  "5 years",
]

export function LabSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="lab"
      title="Lab"
      description="Third-party interaction patterns kept in components/lab. Docs in docs/components. Search expand nav runs live on /events."
    >
      <Specimen
        name="CommandPalette"
        source="lab/command-palette"
        note="Pick a command, then fill its argument chips."
        className="items-start justify-center"
      >
        <CommandPalette commands={commands} />
      </Specimen>

      <Specimen
        name="WheelList"
        source="lab/inertial-wheel-list"
        note="Drag, scroll or use arrow keys."
        className="justify-center"
      >
        <WheelList
          items={horizons}
          label="Investment horizon"
          initialIndex={3}
        />
      </Specimen>

      <Specimen
        name="MentionComposer"
        source="lab/caret-mention-popover"
        note="Type @ to mention someone."
        className="items-start"
      >
        <div className="w-full">
          <MentionComposer />
        </div>
      </Specimen>

      <Specimen
        name="SharePopover"
        source="lab/share-permissions-popover"
        className="justify-center"
      >
        <SharePopover docTitle="Nordhavn research note" />
      </Specimen>
    </ShowcaseSection>
  )
}
