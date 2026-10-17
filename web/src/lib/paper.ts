// Paper: Courier's economic news site. Types, formatters and sample content.
// The sample data is fictional; it stands in for what an API will return.

export type TradeDirection = "buy" | "sell"

/** A price at a point in time. `date` is an ISO calendar date (YYYY-MM-DD). */
export type DatedPrice = {
  amount: number
  date: string
}

export type TradeSuggestion = {
  ticker: string
  companyName: string
  direction: TradeDirection
  currency: string
  tradePrice: DatedPrice
  previousPrice: DatedPrice
  expectedPrice: DatedPrice
  exchangeHref: string
}

/** Analyst recommendation split in percent. Whatever is left is "no rating". */
export type SentimentBreakdown = {
  sell: number
  hold: number
  buy: number
}

export type ClosingPrice = {
  date: string
  close: number
}

export type KeyFigure = {
  label: string
  value: string
  change?: number
}

export type ArticleBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string; attribution: string }
  | { kind: "key-figures"; caption: string; figures: KeyFigure[] }
  | { kind: "trade-suggestion" }

export type CoverTone = "paper" | "lake" | "moss" | "crimson"

export type ArticleAuthor = {
  name: string
  role: string
}

export type ArticleSummary = {
  slug: string
  title: string
  tags: string[]
  authors: ArticleAuthor[]
  coverTone: CoverTone
}

export type Article = ArticleSummary & {
  section: string
  deck: string
  publishedAt: string
  readingMinutes: number
  priceHistory: ClosingPrice[]
  body: ArticleBlock[]
  tradeSuggestion: TradeSuggestion
  sentiment: SentimentBreakdown
}

export type UpcomingEvent = {
  id: string
  title: string
  date: string
  venue: string
}

/* ---------- Formatting ---------- */

const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency: string): string {
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(amount)
}

// ISO calendar dates carry no time zone, so read and print them as UTC.
// Otherwise "2026-10-14" can render as the 13th west of Greenwich.
function parseCalendarDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

const numericDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
})

/** 27-04-2025, the Paper design's compact date. */
export function formatNumericDate(isoDate: string): string {
  return numericDateFormatter
    .format(parseCalendarDate(isoDate))
    .replaceAll("/", "-")
}

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** 14 October 2026 */
export function formatLongDate(isoDate: string): string {
  return longDateFormatter.format(parseCalendarDate(isoDate))
}

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

/** 14 Oct */
export function formatDayMonth(isoDate: string): string {
  return dayMonthFormatter.format(parseCalendarDate(isoDate))
}

export function formatPercentChange(change: number): string {
  const sign = change > 0 ? "+" : change < 0 ? "−" : ""
  return `${sign}${Math.abs(change).toFixed(1)}%`
}

export function formatByline(authors: ArticleAuthor[]): string {
  const names = authors.map((author) => author.name)
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
}

/* ---------- Sample content ---------- */

const nordhavnPriceHistory: ClosingPrice[] = [
  ["2026-05-01", 101.4],
  ["2026-05-08", 99.8],
  ["2026-05-15", 103.2],
  ["2026-05-22", 104.9],
  ["2026-05-29", 102.6],
  ["2026-06-05", 98.7],
  ["2026-06-12", 96.1],
  ["2026-06-19", 97.4],
  ["2026-06-26", 100.2],
  ["2026-07-03", 103.8],
  ["2026-07-10", 106.5],
  ["2026-07-17", 105.1],
  ["2026-07-24", 108.9],
  ["2026-07-31", 111.3],
  ["2026-08-07", 109.6],
  ["2026-08-14", 112.8],
  ["2026-08-21", 114.0],
  ["2026-08-28", 113.2],
  ["2026-09-04", 116.7],
  ["2026-09-11", 118.4],
  ["2026-09-18", 117.1],
  ["2026-09-25", 121.6],
  ["2026-10-02", 124.3],
  ["2026-10-09", 122.8],
  ["2026-10-16", 129.0],
].map(([date, close]) => ({ date: date as string, close: close as number }))

export const articles: Article[] = [
  {
    slug: "nordhavn-freight-lifts-guidance",
    section: "Markets",
    tags: ["Nordics", "Shipping"],
    title: "Nordhavn Freight lifts its outlook as Baltic volumes return",
    deck: "The container operator raised full-year guidance for the second time this year. Analysts now ask whether the rebound is cyclical or the start of a new trade lane.",
    authors: [
      { name: "Ingrid Solberg", role: "Markets editor" },
      { name: "Tomas Ek", role: "Shipping correspondent" },
    ],
    publishedAt: "2026-10-16",
    readingMinutes: 6,
    coverTone: "lake",
    priceHistory: nordhavnPriceHistory,
    sentiment: { sell: 8, hold: 20, buy: 52 },
    tradeSuggestion: {
      ticker: "NHVN",
      companyName: "Nordhavn Freight",
      direction: "buy",
      currency: "USD",
      tradePrice: { amount: 129, date: "2026-10-16" },
      previousPrice: { amount: 114, date: "2026-08-14" },
      expectedPrice: { amount: 142, date: "2027-04-30" },
      exchangeHref: "#exchange",
    },
    body: [
      {
        kind: "paragraph",
        text: "Nordhavn Freight raised its full-year operating profit guidance on Thursday, citing a faster than expected return of container volumes through its Baltic hubs. The shares closed 5 percent higher at $129, the highest level since the company listed.",
      },
      {
        kind: "paragraph",
        text: "The operator now expects operating profit of $410 to 440 million, up from $360 to 400 million in July. Management pointed to longer contracts with two automotive suppliers and a recovery in spot rates that it described as “firmer than seasonal”.",
      },
      {
        kind: "key-figures",
        caption: "Third quarter, compared with the same quarter last year",
        figures: [
          { label: "Revenue", value: "$1.18 bn", change: 12.4 },
          { label: "Operating profit", value: "$118 m", change: 31.0 },
          { label: "Volume (TEU)", value: "642,000", change: 9.8 },
          { label: "Net debt", value: "$0.86 bn", change: -6.2 },
        ],
      },
      { kind: "heading", text: "A rebound, or a new route?" },
      {
        kind: "paragraph",
        text: "The question for investors is how much of the improvement survives a normal winter. Volumes through the northern ports have historically fallen 8 to 10 percent between October and February, and the company gave no quarterly breakdown of its new contracts.",
      },
      {
        kind: "quote",
        text: "We are not pricing a supercycle. We are pricing a company that finally fills its ships on the way back.",
        attribution: "Courier Premier analyst desk",
      },
      {
        kind: "paragraph",
        text: "Courier's analysts keep a buy recommendation and lift the target price, arguing that the return leg, long the weak half of the business, now carries enough freight to cover its own fuel.",
      },
      { kind: "trade-suggestion" },
      { kind: "heading", text: "What to watch" },
      {
        kind: "paragraph",
        text: "The company reports its fourth quarter in February. Before then, monthly port statistics and the outcome of the autumn contract round will show whether the guidance was cautious or generous. A fall in spot rates below the summer low would undo most of the upgrade.",
      },
    ],
  },
]

export const relatedArticles: ArticleSummary[] = [
  {
    slug: "riksbank-holds-rate",
    title: "The Riksbank holds its rate and signals patience into spring",
    tags: ["Sweden", "Rates"],
    authors: [{ name: "Maja Lind", role: "Economics" }],
    coverTone: "paper",
  },
  {
    slug: "port-automation-costs",
    title:
      "Port automation is cheaper than it was. Who pays for it is not settled",
    tags: ["Shipping", "Analysis"],
    authors: [{ name: "Tomas Ek", role: "Shipping correspondent" }],
    coverTone: "moss",
  },
  {
    slug: "nordic-small-caps",
    title: "Nordic small caps close the gap with their larger peers",
    tags: ["Nordics", "Equities"],
    authors: [
      { name: "Ingrid Solberg", role: "Markets editor" },
      { name: "Aron Holm", role: "Data" },
    ],
    coverTone: "crimson",
  },
]

export const upcomingEvents: UpcomingEvent[] = [
  {
    id: "event-shipping-outlook",
    title: "Shipping outlook 2027",
    date: "2026-11-12",
    venue: "Malmö Live",
  },
  {
    id: "event-nordic-equities",
    title: "Nordic equities breakfast",
    date: "2026-11-13",
    venue: "MECK",
  },
  {
    id: "event-rates-panel",
    title: "Rates and the krona",
    date: "2026-11-19",
    venue: "Malmö Live",
  },
]

export function findArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}
