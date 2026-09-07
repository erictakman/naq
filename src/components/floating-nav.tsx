"use client"

import * as React from "react"

import { CreateEventDialog } from "@/components/create-event-dialog"
import SearchExpandNav from "@/components/lab/search-expand-nav"
import type { EventItem } from "@/lib/events"

export function FloatingNav({
  query,
  onQueryChange,
  onCreate,
}: {
  query: string
  onQueryChange: (value: string) => void
  onCreate: (event: EventItem) => void
}): React.ReactElement {
  const [createOpen, setCreateOpen] = React.useState(false)
  const createButtonRef = React.useRef<HTMLButtonElement>(null)

  function openCreate() {
    setCreateOpen(true)
  }

  function closeCreate(next: boolean) {
    setCreateOpen(next)
    if (!next) createButtonRef.current?.focus()
  }

  // ⌘K / Ctrl+K toggles Create event from anywhere on the page. The "/" bind
  // that opens search lives with the field itself, in SearchExpandNav.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (!meta || event.key.toLowerCase() !== "k") return
      event.preventDefault()
      if (createOpen) closeCreate(false)
      else openCreate()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen])

  return (
    <>
      <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
        <SearchExpandNav
          createButtonRef={createButtonRef}
          createOpen={createOpen}
          onQueryChange={onQueryChange}
          openCreate={openCreate}
          query={query}
          suggestions={[]}
        />
      </div>

      {createOpen && (
        <CreateEventDialog onCreate={onCreate} onOpenChange={closeCreate} />
      )}
    </>
  )
}
