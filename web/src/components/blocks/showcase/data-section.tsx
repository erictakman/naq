import { useState } from "react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney, formatPercentChange } from "@/lib/paper"

const holdings = [
  {
    ticker: "NHVN",
    name: "Nordhavn Freight",
    shares: 40,
    price: 129,
    change: 5.0,
  },
  {
    ticker: "LUMA",
    name: "Lumafors Bank",
    shares: 120,
    price: 48.2,
    change: -1.3,
  },
  {
    ticker: "SKOG",
    name: "Skogsberg Timber",
    shares: 15,
    price: 212.6,
    change: 0.4,
  },
]

function HoldingsTable({ variant }: { variant?: "card" }): React.ReactElement {
  return (
    <Table variant={variant}>
      <TableCaption className="sr-only">Holdings</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Today</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => (
          <TableRow key={holding.ticker}>
            <TableCell>
              <span className="font-medium">{holding.name}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">
                {holding.ticker}
              </span>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {holding.shares}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatMoney(holding.price, "USD")}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={holding.change >= 0 ? "success" : "error"}>
                {formatPercentChange(holding.change)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function DataSection(): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <ShowcaseSection
      id="data"
      title="Data display"
      description="Containers and tables. Numbers use the mono face with tabular figures so columns line up."
    >
      <Specimen name="Card" source="ui/card" className="items-stretch">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Portfolio value</CardTitle>
            <CardDescription>All accounts, in USD</CardDescription>
            <CardAction>
              <Badge variant="success">+2.1%</Badge>
            </CardAction>
          </CardHeader>
          <CardPanel>
            <p className="font-mono text-3xl font-medium tabular-nums">
              $11,236.40
            </p>
          </CardPanel>
          <CardFooter className="gap-2">
            <Button size="sm">Deposit</Button>
            <Button size="sm" variant="raised">
              Statements
            </Button>
          </CardFooter>
        </Card>
      </Specimen>

      <Specimen name="Calendar" source="ui/calendar">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-2xl ring-1 ring-border"
        />
      </Specimen>

      <Specimen name="Table" source="ui/table" wide className="items-stretch">
        <div className="w-full">
          <HoldingsTable />
        </div>
      </Specimen>

      <Specimen
        name="Frame · Table variant card"
        source="ui/frame · ui/table"
        wide
        className="items-stretch"
      >
        <Frame className="w-full">
          <FrameHeader>
            <FrameTitle>Holdings</FrameTitle>
            <FrameDescription>Updated at market close</FrameDescription>
          </FrameHeader>
          <FramePanel className="p-0">
            <HoldingsTable variant="card" />
          </FramePanel>
          <FrameFooter className="text-xs text-muted-foreground">
            Prices are delayed 15 minutes.
          </FrameFooter>
        </Frame>
      </Specimen>
    </ShowcaseSection>
  )
}
