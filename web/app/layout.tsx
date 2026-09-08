import type { ReactNode } from "react"
import "../src/index.css"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <ThemeProvider>
        <body>{children}</body>
      </ThemeProvider>
    </html>
  )
}
