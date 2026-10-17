import type React from "react"

import { ArticleCover } from "@/components/blocks/paper/article-cover"
import { Chip } from "@/components/ui/chip"
import { cn } from "@/lib/utils"
import { type ArticleSummary, formatByline } from "@/lib/paper"

type NewsCardProps = {
  article: ArticleSummary
  href: string
  /** Heading level inside the surrounding page outline. */
  headingLevel?: "h2" | "h3"
  className?: string
}

/**
 * Teaser for an article. The headline link is stretched over the card with
 * an ::after overlay, so the whole card is clickable while screen readers
 * hear a single link named by the headline.
 */
export function NewsCard({
  article,
  href,
  headingLevel: Heading = "h3",
  className,
}: NewsCardProps): React.ReactElement {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-3xl bg-card p-1 pb-4 ring-1 ring-border transition-shadow ring-inset hover:shadow-floating",
        className
      )}
    >
      <ArticleCover tone={article.coverTone} className="h-44" />
      <div className="flex flex-col gap-2 px-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Topics">
          {article.tags.map((tag) => (
            <li key={tag}>
              <Chip variant="primary">{tag}</Chip>
            </li>
          ))}
        </ul>
        <Heading className="font-heading text-lg leading-6 font-semibold text-balance">
          <a
            href={href}
            className="outline-none group-hover:underline group-hover:decoration-border group-hover:underline-offset-4 after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {article.title}
          </a>
        </Heading>
        <p className="text-xs leading-4 text-muted-foreground">
          By {formatByline(article.authors)}
        </p>
      </div>
    </article>
  )
}
