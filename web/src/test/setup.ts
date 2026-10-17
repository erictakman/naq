import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vite-plus/test"

afterEach(() => {
  cleanup()
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  })
}

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

for (const method of [
  "hasPointerCapture",
  "setPointerCapture",
  "releasePointerCapture",
] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, {
      writable: true,
      configurable: true,
      value: () => false,
    })
  }
}

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    configurable: true,
    value: () => {},
  })
}

// jsdom has no element scrolling at all, and the wheel picker drives itself
// with scrollTo. Without this it throws the moment a time popover opens.
if (!Element.prototype.scrollTo) {
  Object.defineProperty(Element.prototype, "scrollTo", {
    writable: true,
    configurable: true,
    value: () => {},
  })
}

// The router resets scroll on navigation, which jsdom only logs as unimplemented.
Object.defineProperty(window, "scrollTo", {
  writable: true,
  configurable: true,
  value: () => {},
})

if (!Element.prototype.getAnimations) {
  Object.defineProperty(Element.prototype, "getAnimations", {
    writable: true,
    configurable: true,
    value: () => [],
  })
}
