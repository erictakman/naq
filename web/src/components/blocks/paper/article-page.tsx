import { Bookmark, Clock, Info, Share2 } from "lucide-react"
import type React from "react"

import { CommissionedCard } from "@/components/blocks/paper/commissioned-card"
import { NewsCard } from "@/components/blocks/paper/news-card"
import { PaperMasthead } from "@/components/blocks/paper/paper-masthead"
import { PriceChart } from "@/components/blocks/paper/price-chart"
import { SentimentCard } from "@/components/blocks/paper/sentiment-card"
import { TradeSuggestionCard } from "@/components/blocks/paper/trade-suggestion-card"
import { UpcomingEventsCard } from "@/components/blocks/paper/upcoming-events-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { cn } from "@/lib/utils"
import {
  type Article,
  type ArticleAuthor,
  type ArticleBlock,
  type ArticleSummary,
  formatByline,
  formatLongDate,
  formatPercentChange,
  type KeyFigure,
  type UpcomingEvent,
} from "@/lib/paper"

type ArticlePageProps = {
  article: Article
  relatedArticles: ArticleSummary[]
  upcomingEvents: UpcomingEvent[]
}

export function ArticlePage({
  article,
  relatedArticles,
  upcomingEvents,
}: ArticlePageProps): React.ReactElement {
  const { tradeSuggestion } = article

  return (
    <div className="min-h-svh bg-background">
      <PaperMasthead currentSection="Markets" />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
        <section className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="flex min-w-0 flex-col gap-8">
            <ArticleHeader article={article} />

            <PriceChart
              prices={article.priceHistory}
              currency={tradeSuggestion.currency}
              label={`${tradeSuggestion.companyName} (${tradeSuggestion.ticker})`}
              className="rounded-3xl bg-muted p-4 ring-1 ring-border ring-inset sm:p-6"
            />

            <div className="flex max-w-[68ch] flex-col gap-5">
              {article.body.map((block, index) => (
                <ArticleBlockView
                  key={index}
                  block={block}
                  // On wide screens the suggestion lives in the sidebar. Below
                  // `lg` the sidebar drops under the article, so the card is
                  // shown here, next to the paragraph that argues for it.
                  renderTradeSuggestion={() => (
                    <TradeSuggestionCard
                      suggestion={tradeSuggestion}
                      layout="inline"
                      className="my-2 sm:max-w-94 lg:hidden"
                    />
                  )}
                />
              ))}
            </div>

            <Alert variant="info" className="max-w-[68ch]">
              <Info strokeWidth={1.5} />
              <AlertTitle>Not investment advice</AlertTitle>
              <AlertDescription>
                Courier is a demonstration platform. Suggestions and prices on
                this page are illustrative.
              </AlertDescription>
            </Alert>
          </article>

          <aside
            aria-label="About this stock"
            className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start"
          >
            <TradeSuggestionCard
              suggestion={tradeSuggestion}
              className="hidden lg:flex"
            />
            <SentimentCard sentiment={article.sentiment} />
            <CommissionedCard
              access="invite-only"
              title="Commissioned"
              description={`Our analysts deliver specialised research on companies that commission coverage from Courier Premier, ${tradeSuggestion.companyName} among them.`}
              actionLabel="Request invite"
              actionHref="#premier"
            />
          </aside>
        </section>

        <section
          aria-labelledby="more-from-paper"
          className="flex flex-col gap-6 border-t border-border pt-10"
        >
          <h2
            id="more-from-paper"
            className="font-heading text-2xl font-semibold"
          >
            More from Paper
          </h2>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map((related) => (
                <li key={related.slug} className="flex">
                  <NewsCard
                    article={related}
                    href={`/paper/${related.slug}`}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
            <UpcomingEventsCard
              events={upcomingEvents}
              audience="Paper subscribers"
              bookingHref="#booking"
              className="self-start"
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function ArticleHeader({ article }: { article: Article }): React.ReactElement {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          {article.section}
        </span>
        <span aria-hidden className="text-border">
          /
        </span>
        <ul className="flex flex-wrap gap-1.5" aria-label="Topics">
          {article.tags.map((tag) => (
            <li key={tag}>
              <Chip variant="primary">{tag}</Chip>
            </li>
          ))}
        </ul>
      </div>

      <h1 className="max-w-[22ch] font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
        {article.title}
      </h1>
      <p className="max-w-[60ch] text-lg leading-7 text-pretty text-muted-foreground">
        {article.deck}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {article.authors.map((author) => (
              <Avatar
                key={author.name}
                className="size-10 ring-2 ring-background"
              >
                <AvatarFallback className="bg-paper font-semibold text-primary">
                  {initialsOf(author)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">
              By {formatByline(article.authors)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <time dateTime={article.publishedAt}>
                {formatLongDate(article.publishedAt)}
              </time>
              <span aria-hidden>·</span>
              <Clock aria-hidden className="size-3" strokeWidth={1.5} />
              {article.readingMinutes} min read
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="raised" size="sm">
            <Share2 strokeWidth={1.5} />
            Share
          </Button>
          <Button variant="raised" size="icon-sm" aria-label="Save article">
            <Bookmark strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </header>
  )
}

function initialsOf(author: ArticleAuthor): string {
  return author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function ArticleBlockView({
  block,
  renderTradeSuggestion,
}: {
  block: ArticleBlock
  renderTradeSuggestion: () => React.ReactNode
}): React.ReactNode {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className="text-[17px] leading-7 text-pretty first-of-type:first-letter:float-left first-of-type:first-letter:mt-1 first-of-type:first-letter:mr-2 first-of-type:first-letter:font-heading first-of-type:first-letter:text-6xl first-of-type:first-letter:leading-[0.8] first-of-type:first-letter:font-semibold first-of-type:first-letter:text-primary">
          {block.text}
        </p>
      )
    case "heading":
      return (
        <h2 className="mt-4 font-heading text-2xl leading-8 font-semibold">
          {block.text}
        </h2>
      )
    case "quote":
      return (
        <figure className="my-3 border-y border-border py-6">
          <blockquote className="font-heading text-2xl leading-8 font-medium text-balance italic">
            “{block.text}”
          </blockquote>
          <figcaption className="mt-3 text-xs text-muted-foreground">
            {block.attribution}
          </figcaption>
        </figure>
      )
    case "key-figures":
      return <KeyFigures caption={block.caption} figures={block.figures} />
    case "trade-suggestion":
      return renderTradeSuggestion()
  }
}

function KeyFigures({
  caption,
  figures,
}: {
  caption: string
  figures: KeyFigure[]
}): React.ReactElement {
  return (
    <figure className="my-2 flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-px overflow-clip rounded-2xl bg-border ring-1 ring-border sm:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1 bg-card p-4">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="font-mono text-lg font-medium tabular-nums">
              {figure.value}
            </dd>
            {figure.change !== undefined && (
              <dd
                className={cn(
                  "font-mono text-xs tabular-nums",
                  figure.change >= 0
                    ? "text-success-foreground"
                    : "text-error-foreground"
                )}
              >
                {formatPercentChange(figure.change)}
              </dd>
            )}
          </div>
        ))}
      </dl>
      <figcaption className="text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}
