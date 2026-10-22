import {
  Blocks,
  FlaskConical,
  FormInput,
  Layers,
  MousePointerClick,
  Navigation,
  Newspaper,
  Palette,
  Table2,
  Tags,
  TriangleAlert,
} from "lucide-react"
import { useEffect, useState } from "react"
import type React from "react"

import { ActionsSection } from "@/components/blocks/showcase/actions-section"
import { DataSection } from "@/components/blocks/showcase/data-section"
import { FeedbackSection } from "@/components/blocks/showcase/feedback-section"
import { FormsSection } from "@/components/blocks/showcase/forms-section"
import { FoundationsSection } from "@/components/blocks/showcase/foundations-section"
import { LabSection } from "@/components/blocks/showcase/lab-section"
import { NavigationSection } from "@/components/blocks/showcase/navigation-section"
import { OverlaysSection } from "@/components/blocks/showcase/overlays-section"
import { PaperSection } from "@/components/blocks/showcase/paper-section"
import { StatusSection } from "@/components/blocks/showcase/status-section"
import { useTheme } from "@/components/theme-provider"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"

type ShowcaseChapter = {
  id: string
  title: string
  Icon: typeof Palette
  Section: () => React.ReactElement
}

// One list drives both the sidebar and the page body, so a new chapter is
// one line here and can never be missing from the navigation.
const chapterGroups: { label: string; chapters: ShowcaseChapter[] }[] = [
  {
    label: "System",
    chapters: [
      {
        id: "foundations",
        title: "Foundations",
        Icon: Palette,
        Section: FoundationsSection,
      },
    ],
  },
  {
    label: "Primitives",
    chapters: [
      {
        id: "actions",
        title: "Actions",
        Icon: MousePointerClick,
        Section: ActionsSection,
      },
      {
        id: "status",
        title: "Labels and status",
        Icon: Tags,
        Section: StatusSection,
      },
      { id: "forms", title: "Forms", Icon: FormInput, Section: FormsSection },
      {
        id: "feedback",
        title: "Feedback",
        Icon: TriangleAlert,
        Section: FeedbackSection,
      },
      {
        id: "overlays",
        title: "Overlays",
        Icon: Layers,
        Section: OverlaysSection,
      },
      {
        id: "navigation",
        title: "Navigation",
        Icon: Navigation,
        Section: NavigationSection,
      },
      { id: "data", title: "Data display", Icon: Table2, Section: DataSection },
    ],
  },
  {
    label: "Blocks",
    chapters: [
      { id: "paper", title: "Paper", Icon: Newspaper, Section: PaperSection },
      { id: "lab", title: "Lab", Icon: FlaskConical, Section: LabSection },
    ],
  },
]

const chapters = chapterGroups.flatMap((group) => group.chapters)

/**
 * Scroll spy: marks the chapter whose top most recently crossed the upper
 * third of the viewport. IntersectionObserver reports crossings without a
 * scroll listener, so nothing runs while the page is still.
 */
function useActiveChapter(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0])

  useEffect(() => {
    // Highlighting is an enhancement; without the API the links still work.
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: "0px 0px -66% 0px" }
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])

  return activeId
}

const chapterIds = chapters.map((chapter) => chapter.id)

export function ShowcasePage(): React.ReactElement {
  const activeId = useActiveChapter(chapterIds)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-4">
          <p className="font-heading text-xl font-semibold italic">
            Courier UI
          </p>
          <p className="text-xs text-muted-foreground">
            Every component, in one place
          </p>
        </SidebarHeader>
        <SidebarContent>
          {chapterGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.chapters.map(({ id, title, Icon }) => (
                    <SidebarMenuItem key={id}>
                      <ChapterLink id={id} isActive={activeId === id}>
                        <Icon strokeWidth={1.5} />
                        {title}
                      </ChapterLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          <SidebarGroup>
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="/paper" />}>
                    <Newspaper strokeWidth={1.5} />
                    Paper article
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="/events" />}>
                    <Blocks strokeWidth={1.5} />
                    Event planner
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <h1 className="text-sm font-semibold">Components</h1>
          <ThemeSwitch />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-8">
          {chapters.map(({ id, Section }) => (
            <Section key={id} />
          ))}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// On phones the sidebar is a sheet over the page. An in-page anchor does not
// navigate away, so nothing would close it; close it on click instead. The
// hook needs SidebarProvider above it, hence a component of its own.
function ChapterLink({
  id,
  isActive,
  children,
}: {
  id: string
  isActive: boolean
  children: React.ReactNode
}): React.ReactElement {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenuButton
      isActive={isActive}
      onClick={() => setOpenMobile(false)}
      render={
        <a href={`#${id}`} aria-current={isActive ? "true" : undefined} />
      }
    >
      {children}
    </SidebarMenuButton>
  )
}

function ThemeSwitch(): React.ReactElement {
  const { theme, setTheme } = useTheme()

  return (
    <Label className="ml-auto text-sm text-muted-foreground">
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      Dark (provisional)
    </Label>
  )
}
