import { TrendingDown, TrendingUp } from "lucide-react"
import { useId } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  type DatedPrice,
  formatMoney,
  formatNumericDate,
  type TradeSuggestion,
} from "@/lib/paper"

type TradeSuggestionCardProps = {
  suggestion: TradeSuggestion
  /**
   * `tab`: the verdict sits on a tinted tab that peeks out above the card.
   * `inline`: the verdict is the card's first row and the card ends in a
   * "Go to exchange" action.
   */
  layout?: "tab" | "inline"
  className?: string
}

const directionLabel = { buy: "Buy", sell: "Sell" } as const

export function TradeSuggestionCard({
  suggestion,
  layout = "tab",
  className,
}: TradeSuggestionCardProps): React.ReactElement {
  const { direction, currency } = suggestion
  const headingId = useId()

  const verdict = (
    <div className="flex items-center justify-between px-1 text-[10px] leading-3 font-medium text-muted-foreground">
      <span id={headingId}>
        Suggestion{" "}
        <span className="sr-only">
          for {suggestion.companyName} ({suggestion.ticker})
        </span>
      </span>
      <span className="flex items-center gap-1 uppercase">
        {directionLabel[direction]}
        <DirectionIcon direction={direction} />
      </span>
    </div>
  )

  const priceComparison = (
    <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-panel ring-1 ring-border ring-inset">
      <PriceLine
        label="Previous price"
        price={suggestion.previousPrice}
        currency={currency}
      />
      <hr className="border-border" />
      <PriceLine
        label="Expected price"
        price={suggestion.expectedPrice}
        currency={currency}
      />
    </div>
  )

  if (layout === "inline") {
    return (
      <section
        aria-labelledby={headingId}
        className={cn(
          "flex flex-col gap-2 rounded-[20px] bg-muted p-3.5 ring-1 ring-border ring-inset",
          className
        )}
      >
        <div className="px-3 py-1">{verdict}</div>
        <div className="px-4 pt-1.5">
          <PriceLine
            label="Trade price"
            price={suggestion.tradePrice}
            currency={currency}
          />
        </div>
        {priceComparison}
        <div className="flex justify-end px-1">
          <Button
            variant="raised"
            render={<a href={suggestion.exchangeHref} />}
          >
            Go to exchange
          </Button>
        </div>
      </section>
    )
  }

  // The tab is absolutely placed in the top padding; the card is `relative`
  // and comes later in the DOM, so it paints over the tab's lower half.
  return (
    <section
      aria-labelledby={headingId}
      className={cn("relative flex flex-col pt-9", className)}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-18 rounded-[20px] px-4 py-3",
          direction === "buy" ? "bg-success-muted" : "bg-error-muted"
        )}
      >
        {verdict}
      </div>
      <div className="relative flex flex-col gap-2 rounded-[20px] bg-muted p-3.5 ring-1 ring-border ring-inset">
        <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Trade price</span>
          <span className="font-mono tabular-nums">
            {formatMoney(suggestion.tradePrice.amount, currency)}
          </span>
        </div>
        {priceComparison}
      </div>
    </section>
  )
}

function DirectionIcon({
  direction,
}: {
  direction: TradeSuggestion["direction"]
}): React.ReactElement {
  return direction === "buy" ? (
    <TrendingUp
      aria-hidden
      className="size-3.5 text-success"
      strokeWidth={1.5}
    />
  ) : (
    <TrendingDown
      aria-hidden
      className="size-3.5 text-error"
      strokeWidth={1.5}
    />
  )
}

// A <dl> pairs each label with its value for screen readers; the date sits
// in its own row underneath, as in the Paper design.
function PriceLine({
  label,
  price,
  currency,
}: {
  label: string
  price: DatedPrice
  currency: string
}): React.ReactElement {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-muted-foreground">
      <dt className="text-xs font-medium">{label}</dt>
      <dd className="text-right font-mono text-xs font-medium tabular-nums">
        {formatMoney(price.amount, currency)}
      </dd>
      <dt className="text-[10px] leading-3">Date</dt>
      <dd className="text-right font-mono text-[10px] leading-3 tabular-nums">
        <time dateTime={price.date}>{formatNumericDate(price.date)}</time>
      </dd>
    </dl>
  )
}
