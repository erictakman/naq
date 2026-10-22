import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import type React from "react"

import { cn } from "@/lib/utils"
import type { SentimentBreakdown } from "@/lib/paper"

type SentimentCardProps = {
  sentiment: SentimentBreakdown
  className?: string
}

type Recommendation = keyof SentimentBreakdown

const recommendationLabel: Record<Recommendation, string> = {
  sell: "Sell",
  hold: "Hold",
  buy: "Buy",
}

// Colours follow the Paper frame: buy is the brand red, sell is info blue,
// hold is neutral. The arrow and the word carry the meaning too, so the bar
// never relies on colour alone.
const recommendationStyle: Record<
  Recommendation,
  { bar: string; text: string; Icon: typeof ArrowRight }
> = {
  sell: { bar: "bg-info", text: "text-info-foreground", Icon: ArrowDownRight },
  hold: {
    bar: "bg-muted-foreground",
    text: "text-muted-foreground",
    Icon: ArrowRight,
  },
  buy: { bar: "bg-primary", text: "text-primary", Icon: ArrowUpRight },
}

const recommendationOrder: Recommendation[] = ["sell", "hold", "buy"]

/** "Overwhelmingly for Buy": how dominant the leading call is among rated. */
function describeConsensus(sentiment: SentimentBreakdown): {
  strength: string
  leader: Recommendation
} {
  const rated = sentiment.sell + sentiment.hold + sentiment.buy
  const leader = recommendationOrder.reduce((best, current) =>
    sentiment[current] > sentiment[best] ? current : best
  )
  const share = rated === 0 ? 0 : sentiment[leader] / rated
  const strength =
    share >= 0.6
      ? "Overwhelmingly for"
      : share >= 0.45
        ? "Leaning to"
        : "Split, edging to"
  return { strength, leader }
}

export function SentimentCard({
  sentiment,
  className,
}: SentimentCardProps): React.ReactElement {
  const { strength, leader } = describeConsensus(sentiment)
  const unrated = Math.max(
    0,
    100 - sentiment.sell - sentiment.hold - sentiment.buy
  )
  const summary = recommendationOrder
    .map((key) => `${recommendationLabel[key]} ${sentiment[key]}%`)
    .concat(unrated > 0 ? [`no rating ${unrated}%`] : [])
    .join(", ")

  return (
    <section
      aria-label="Recommendation sentiment"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-info-muted bg-card px-4.5 py-4 shadow-floating",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[10px] leading-3 text-muted-foreground">
          Recommendation sentiment
        </p>
        <p className="text-base leading-5 font-semibold">
          {strength}{" "}
          <span className={recommendationStyle[leader].text}>
            {recommendationLabel[leader]}
          </span>
        </p>
      </div>

      {/* Widths are percentages of the whole, so the gaps between segments
          come from `gap`, not from shrinking the data. */}
      <div role="img" aria-label={summary} className="flex h-3 gap-1">
        {recommendationOrder.map((key) =>
          sentiment[key] > 0 ? (
            <span
              key={key}
              className={cn("rounded-[4px]", recommendationStyle[key].bar)}
              style={{ flexGrow: sentiment[key], flexBasis: 0 }}
            />
          ) : null
        )}
        {unrated > 0 && (
          <span
            className="rounded-[4px] bg-info-muted"
            style={{ flexGrow: unrated, flexBasis: 0 }}
          />
        )}
      </div>

      <dl className="flex gap-5">
        {recommendationOrder.map((key) => {
          const { text, Icon } = recommendationStyle[key]
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-[10px] leading-3 text-muted-foreground">
                {recommendationLabel[key]}
              </dt>
              <dd
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  text
                )}
              >
                <Icon aria-hidden className="size-4" strokeWidth={1.5} />
                <span className="font-mono tabular-nums">
                  {sentiment[key]}%
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
