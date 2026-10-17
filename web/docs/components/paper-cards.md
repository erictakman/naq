# Paper cards

Blocks for Paper (economic news), built from the Paper design file and the
Courier tokens in `src/index.css`. Source: `src/components/blocks/paper/`.
Example page: `/paper` (redirects to the sample article).

| Component             | Props                                                         | Notes                                                                                                   |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `TradeSuggestionCard` | `suggestion`, `layout: "tab" \| "inline"`                     | `tab` puts the BUY/SELL verdict on a tinted tab above the card; `inline` adds "Go to exchange".         |
| `SentimentCard`       | `sentiment` (`sell`/`hold`/`buy` percent)                     | Headline is computed from the leading call's share of rated analysts. Remainder renders as "no rating". |
| `CommissionedCard`    | `access`, `title`, `description`, `actionLabel`, `actionHref` | Premier promotion. Only the action is a link.                                                           |
| `NewsCard`            | `article`, `href`, `headingLevel`                             | Whole card clickable through a stretched `::after` on the headline link.                                |
| `UpcomingEventsCard`  | `events`, `audience`, `bookingHref`                           | Gradient frame is a 1px padded wrapper (border-image cannot follow a radius).                           |
| `PriceChart`          | `prices`, `currency`, `label`                                 | One series, hover crosshair, "Show data" table for keyboard and screen readers.                         |
| `ArticleCover`        | `tone`                                                        | Decorative placeholder until articles have photos.                                                      |

Primitives added or changed in `components/ui`:

- `Chip`: word-sized label. Variants `neutral`, `primary`, `info`, `success`, `warning`, `error`, `outline`; `shape: "rounded" | "pill"`.
- `Button`: pill shape (icon sizes stay rounded squares), new variants `raised` (Courier bevel) and `primary-subtle`.

Token notes: `warning-foreground` and `info-foreground` are one step darker than
the Courier design system file so chips and tonal buttons pass WCAG AA. The dark
theme is provisional.
