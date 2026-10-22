import type React from "react"

import { ArticleCover } from "@/components/blocks/paper/article-cover"
import { CommissionedCard } from "@/components/blocks/paper/commissioned-card"
import { NewsCard } from "@/components/blocks/paper/news-card"
import { PriceChart } from "@/components/blocks/paper/price-chart"
import { SentimentCard } from "@/components/blocks/paper/sentiment-card"
import { TradeSuggestionCard } from "@/components/blocks/paper/trade-suggestion-card"
import { UpcomingEventsCard } from "@/components/blocks/paper/upcoming-events-card"
import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import {
  articles,
  type CoverTone,
  relatedArticles,
  type TradeSuggestion,
  upcomingEvents,
} from "@/lib/paper"

const featured = articles[0]

// The article only carries a buy. A sell case shows the other tab colour.
const sellSuggestion: TradeSuggestion = {
  ticker: "LUMA",
  companyName: "Lumafors Bank",
  direction: "sell",
  currency: "USD",
  tradePrice: { amount: 48.2, date: "2026-10-16" },
  previousPrice: { amount: 52.9, date: "2026-07-31" },
  expectedPrice: { amount: 41.0, date: "2027-03-31" },
  exchangeHref: "#paper",
}

const coverTones: CoverTone[] = ["paper", "lake", "moss", "crimson"]

export function PaperSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="paper"
      title="Paper blocks"
      description="Feature components for Paper, built from the Paper design file. See them composed on the article page at /paper."
    >
      <Specimen
        name="TradeSuggestionCard"
        source="blocks/paper/trade-suggestion-card"
        note='layout="tab" (buy and sell) and layout="inline"'
        wide
        className="grid items-start gap-6 md:grid-cols-3"
      >
        <TradeSuggestionCard suggestion={featured.tradeSuggestion} />
        <TradeSuggestionCard suggestion={sellSuggestion} />
        <TradeSuggestionCard
          suggestion={featured.tradeSuggestion}
          layout="inline"
        />
      </Specimen>

      <Specimen
        name="SentimentCard"
        source="blocks/paper/sentiment-card"
        note="Headline is computed: the leading call's share of rated analysts."
        className="flex-col items-stretch"
      >
        <SentimentCard sentiment={featured.sentiment} />
        <SentimentCard sentiment={{ sell: 30, hold: 34, buy: 28 }} />
      </Specimen>

      <Specimen
        name="CommissionedCard"
        source="blocks/paper/commissioned-card"
        className="grid items-stretch gap-4 sm:grid-cols-2"
      >
        <CommissionedCard
          access="invite-only"
          title="Commissioned"
          description="Specialised research on companies that commission coverage."
          actionLabel="Request invite"
          actionHref="#paper"
        />
        <CommissionedCard
          access="public"
          title="Research"
          description="Open notes from the Premier analyst desk."
          actionLabel="Read notes"
          actionHref="#paper"
        />
      </Specimen>

      <Specimen
        name="PriceChart"
        source="blocks/paper/price-chart"
        note="Hover for the nearest close; Show data opens the table view."
        wide
        className="items-stretch"
      >
        <PriceChart
          prices={featured.priceHistory}
          currency="USD"
          label="Nordhavn Freight (NHVN)"
          className="w-full"
        />
      </Specimen>

      <Specimen
        name="NewsCard"
        source="blocks/paper/news-card"
        wide
        className="grid items-stretch gap-4 md:grid-cols-3"
      >
        {relatedArticles.map((article) => (
          <NewsCard
            key={article.slug}
            article={article}
            href={`/paper/${article.slug}`}
          />
        ))}
      </Specimen>

      <Specimen
        name="UpcomingEventsCard"
        source="blocks/paper/upcoming-events-card"
        className="items-stretch"
      >
        <UpcomingEventsCard
          events={upcomingEvents}
          audience="Paper subscribers"
          bookingHref="#paper"
          className="w-full"
        />
      </Specimen>

      <Specimen
        name="ArticleCover"
        source="blocks/paper/article-cover"
        note='tone: "paper" | "lake" | "moss" | "crimson"'
        className="grid grid-cols-2 gap-3"
      >
        {coverTones.map((tone) => (
          <figure key={tone} className="flex flex-col gap-1.5">
            <ArticleCover tone={tone} className="h-24" />
            <figcaption className="font-mono text-[11px] text-muted-foreground">
              {tone}
            </figcaption>
          </figure>
        ))}
      </Specimen>
    </ShowcaseSection>
  )
}
