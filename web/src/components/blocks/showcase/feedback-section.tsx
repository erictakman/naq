import {
  CircleAlert,
  CircleCheck,
  Info,
  Newspaper,
  TriangleAlert,
} from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/meter"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress"
import { toastManager } from "@/components/ui/toast"

const alerts = [
  {
    variant: "info",
    Icon: Info,
    title: "Not investment advice",
    description: "Suggestions on Courier are illustrative.",
  },
  {
    variant: "success",
    Icon: CircleCheck,
    title: "Order placed",
    description: "10 NHVN at $129.00 limit.",
  },
  {
    variant: "warning",
    Icon: TriangleAlert,
    title: "Market closes in 15 minutes",
    description: "Orders after 17:30 queue until tomorrow.",
  },
  {
    variant: "error",
    Icon: CircleAlert,
    title: "Payment failed",
    description: "Your card was declined. Try another method.",
  },
] as const

const toastTypes = ["success", "info", "warning", "error"] as const

export function FeedbackSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="feedback"
      title="Feedback"
      description="Status tells people what happened. Each status pairs a colour with an icon and words, never colour alone."
    >
      <Specimen
        name="Alert"
        source="ui/alert"
        wide
        className="grid gap-3 md:grid-cols-2"
      >
        <Alert>
          <Newspaper strokeWidth={1.5} />
          <AlertTitle>Default</AlertTitle>
          <AlertDescription>
            Neutral notice on the card surface.
          </AlertDescription>
        </Alert>
        {alerts.map(({ variant, Icon, title, description }) => (
          <Alert key={variant} variant={variant}>
            <Icon strokeWidth={1.5} />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        ))}
      </Specimen>

      <Specimen
        name="Toast"
        source="ui/toast · toastManager"
        note="The ToastProvider wraps this page in routes/components.tsx."
      >
        {toastTypes.map((type) => (
          <Button
            key={type}
            variant="raised"
            onClick={() =>
              toastManager.add({
                type,
                title: `A ${type} toast`,
                description: "Toasts stack in the bottom-right corner.",
              })
            }
          >
            {type}
          </Button>
        ))}
      </Specimen>

      <Specimen
        name="Progress · Meter"
        source="ui/progress · ui/meter"
        className="flex-col items-stretch gap-5"
      >
        <Progress value={64}>
          <div className="flex justify-between">
            <ProgressLabel>Onboarding</ProgressLabel>
            <ProgressValue />
          </div>
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
        <Progress value={null} aria-label="Loading report" />
        <Meter value={72}>
          <div className="flex justify-between">
            <MeterLabel>Portfolio in equities</MeterLabel>
            <MeterValue />
          </div>
          <MeterTrack>
            <MeterIndicator />
          </MeterTrack>
        </Meter>
      </Specimen>

      <Specimen name="Empty" source="ui/empty">
        <Empty className="w-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Newspaper />
            </EmptyMedia>
            <EmptyTitle>No saved articles</EmptyTitle>
            <EmptyDescription>
              Bookmark articles on Paper to read them later.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="raised" render={<a href="/paper" />}>
              Browse Paper
            </Button>
          </EmptyContent>
        </Empty>
      </Specimen>
    </ShowcaseSection>
  )
}
