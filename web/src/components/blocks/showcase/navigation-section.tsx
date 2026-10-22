import { ChevronDown } from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"

const faq = [
  {
    question: "Is Courier a real bank?",
    answer:
      "No. Courier is a demonstration platform; accounts and prices are illustrative.",
  },
  {
    question: "What is commissioned research?",
    answer:
      "Coverage a company pays for. Premier labels it so readers can weigh it.",
  },
  {
    question: "How often are prices updated?",
    answer: "Every 15 minutes during trading hours.",
  },
]

const headlines = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  time: `${String(9 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`,
  title: [
    "Krona firms after inflation print",
    "Shipping index edges higher",
    "Bank shares lead Stockholm gains",
    "Oil slips on demand worries",
  ][index % 4],
}))

export function NavigationSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="navigation"
      title="Navigation and disclosure"
      description="Ways to move between views and to show more on demand."
    >
      <Specimen name="Tabs" source="ui/tabs" className="items-stretch">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTab value="overview">Overview</TabsTab>
            <TabsTab value="financials">Financials</TabsTab>
            <TabsTab value="research">Research</TabsTab>
          </TabsList>
          <TabsPanel value="overview" className="pt-3 text-sm">
            Container shipping across the Baltic and North Sea.
          </TabsPanel>
          <TabsPanel value="financials" className="pt-3 text-sm">
            Revenue $1.18 bn, operating profit $118 m.
          </TabsPanel>
          <TabsPanel value="research" className="pt-3 text-sm">
            Three Premier reports this year.
          </TabsPanel>
        </Tabs>
        <Tabs defaultValue="day" className="w-full">
          <TabsList variant="underline">
            <TabsTab value="day">Day</TabsTab>
            <TabsTab value="week">Week</TabsTab>
            <TabsTab value="month">Month</TabsTab>
          </TabsList>
        </Tabs>
      </Specimen>

      <Specimen
        name="Breadcrumb · Pagination"
        source="ui/breadcrumb · ui/pagination"
        className="flex-col items-start gap-5"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#navigation">Paper</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#navigation">Markets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nordhavn Freight</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#navigation" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#navigation">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#navigation" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#navigation">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#navigation" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Specimen>

      <Specimen
        name="Accordion"
        source="ui/accordion"
        className="items-stretch"
      >
        <Accordion defaultValue={[faq[0].question]} className="w-full">
          {faq.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionPanel>{item.answer}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Specimen>

      <Specimen
        name="Collapsible · ScrollArea"
        source="ui/collapsible · ui/scroll-area"
        className="flex-col items-stretch gap-4"
      >
        <Collapsible>
          <CollapsibleTrigger
            render={<Button variant="ghost" size="sm" className="group" />}
          >
            Show methodology
            <ChevronDown className="transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsiblePanel className="px-3 pt-2 text-sm text-muted-foreground">
            Target prices are the median of covering analysts, refreshed
            nightly.
          </CollapsiblePanel>
        </Collapsible>
        <ScrollArea className="h-40 rounded-2xl ring-1 ring-border">
          <ul className="flex flex-col p-2 text-sm">
            {headlines.map((headline) => (
              <li
                key={headline.id}
                className="flex gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {headline.time}
                </span>
                {headline.title}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Specimen>
    </ShowcaseSection>
  )
}
