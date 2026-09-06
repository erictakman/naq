import { describe, expect, it } from "vitest"

import {
  eventOwners,
  eventStatuses,
  eventTypes,
  formatEventDate,
  formatEventTimeRange,
  initialEvents,
} from "@/lib/events"

describe("eventOwners", () => {
  it("is a non-empty list of unique names", () => {
    expect(eventOwners.length).toBeGreaterThan(0)
    expect(new Set(eventOwners).size).toBe(eventOwners.length)
  })

  it("does not include Eric Takman as a mock owner", () => {
    expect(eventOwners).not.toContain("Eric Takman")
  })
})

describe("initialEvents", () => {
  it("only assigns owners from the shared eventOwners directory", () => {
    for (const event of initialEvents) {
      expect(eventOwners).toContain(event.owner)
    }
  })

  it("only uses documented event types and statuses", () => {
    for (const event of initialEvents) {
      expect(eventTypes).toContain(event.type)
      expect(eventStatuses).toContain(event.status)
    }
  })

  it("has unique ids", () => {
    const ids = initialEvents.map((event) => event.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("formatEventDate", () => {
  it("formats an ISO date in UTC as a short weekday/month/day string", () => {
    expect(formatEventDate("2026-09-07T07:15:00.000Z")).toBe("Mon, Sep 7")
  })
})

describe("formatEventTimeRange", () => {
  it("formats a start/end pair as a UTC time range", () => {
    expect(
      formatEventTimeRange(
        "2026-09-07T07:15:00.000Z",
        "2026-09-07T07:45:00.000Z"
      )
    ).toBe("7:15 AM – 7:45 AM")
  })
})
