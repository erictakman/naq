import { createRoute, notFound, redirect } from "@tanstack/react-router"

import { ArticlePage } from "@/components/blocks/paper/article-page"
import {
  articles,
  findArticle,
  relatedArticles,
  upcomingEvents,
} from "@/lib/paper"
import { rootRoute } from "@/routes/root"

// Until Paper has a front page, /paper opens the latest article.
export const paperRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/paper",
  beforeLoad: () => {
    throw redirect({
      to: "/paper/$articleSlug",
      params: { articleSlug: articles[0].slug },
      replace: true,
    })
  },
})

export const paperArticleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/paper/$articleSlug",
  // The loader is where an API call will go. An unknown slug falls through
  // to the root route's not-found page.
  loader: ({ params }) => {
    const article = findArticle(params.articleSlug)
    if (!article) throw notFound()
    return article
  },
  component: PaperArticlePage,
})

function PaperArticlePage() {
  const article = paperArticleRoute.useLoaderData()

  return (
    <ArticlePage
      article={article}
      relatedArticles={relatedArticles}
      upcomingEvents={upcomingEvents}
    />
  )
}
