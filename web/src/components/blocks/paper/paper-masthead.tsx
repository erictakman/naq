import { Search } from "lucide-react"
import type React from "react"

import { Button } from "@/components/ui/button"

const sections = ["Markets", "Economy", "Companies", "Research"] as const

type PaperMastheadProps = {
  currentSection?: (typeof sections)[number]
}

export function PaperMasthead({
  currentSection,
}: PaperMastheadProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a
          href="/paper"
          className="rounded-sm font-heading text-2xl leading-none font-semibold italic outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Paper
          <span className="sr-only">, Courier news</span>
        </a>

        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {sections.map((section) => (
              <li key={section}>
                <a
                  href={`/paper/${section.toLowerCase()}`}
                  aria-current={section === currentSection ? "page" : undefined}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-offset-2 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                  {section}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search Paper">
            <Search strokeWidth={1.5} />
          </Button>
          <Button variant="raised" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button>Subscribe</Button>
        </div>
      </div>
    </header>
  )
}
