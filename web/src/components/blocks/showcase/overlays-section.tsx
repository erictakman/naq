import {
  Bell,
  Bookmark,
  Copy,
  LogOut,
  Settings,
  Share2,
  User,
} from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/preview-card"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"

const commandItems = [
  { value: "bank", label: "Go to Bank" },
  { value: "ledger", label: "Go to Ledger" },
  { value: "manager", label: "Go to Manager" },
  { value: "paper", label: "Go to Paper" },
  { value: "premier", label: "Go to Premier" },
]

export function OverlaysSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="overlays"
      title="Overlays"
      description="Everything that opens on top of the page. Base UI handles focus trapping, Escape and returning focus to the trigger."
    >
      <Specimen name="Dialog" source="ui/dialog">
        <Dialog>
          <DialogTrigger render={<Button variant="raised" />}>
            Edit watchlist
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Rename watchlist</DialogTitle>
              <DialogDescription>
                The name is only visible to you.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input defaultValue="Nordic shipping" />
              </Field>
            </DialogPanel>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <DialogClose render={<Button />}>Save</DialogClose>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </Specimen>

      <Specimen name="AlertDialog" source="ui/alert-dialog">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
            Close account
          </AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Close your Courier account?</AlertDialogTitle>
              <AlertDialogDescription>
                Your watchlists and saved articles are deleted. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                Keep account
              </AlertDialogClose>
              <AlertDialogClose render={<Button variant="destructive" />}>
                Close account
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      </Specimen>

      <Specimen name="Sheet" source="ui/sheet">
        {(["left", "right"] as const).map((side) => (
          <Sheet key={side}>
            <SheetTrigger render={<Button variant="raised" />}>
              Open {side}
            </SheetTrigger>
            <SheetPopup side={side}>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>Updated 2 minutes ago</SheetDescription>
              </SheetHeader>
              <SheetPanel className="flex flex-col gap-3 text-sm">
                <p className="rounded-2xl bg-card p-4">
                  NHVN crossed your $125 alert.
                </p>
                <p className="rounded-2xl bg-card p-4">
                  New Premier report: Baltic ports.
                </p>
              </SheetPanel>
              <SheetFooter>
                <SheetClose render={<Button variant="raised" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </SheetPopup>
          </Sheet>
        ))}
      </Specimen>

      <Specimen
        name="Drawer"
        source="ui/drawer"
        note="Swipe down to dismiss on touch."
      >
        <Drawer>
          <DrawerTrigger render={<Button variant="raised" />}>
            Quick trade
          </DrawerTrigger>
          <DrawerPopup>
            <DrawerHeader>
              <DrawerTitle>Buy NHVN</DrawerTitle>
              <DrawerDescription>Last price $129.00</DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>
              <Field>
                <FieldLabel>Shares</FieldLabel>
                <Input type="number" defaultValue={10} />
              </Field>
            </DrawerPanel>
            <DrawerFooter>
              <DrawerClose render={<Button variant="ghost" />}>
                Cancel
              </DrawerClose>
              <DrawerClose render={<Button />}>Place order</DrawerClose>
            </DrawerFooter>
          </DrawerPopup>
        </Drawer>
      </Specimen>

      <Specimen name="Popover" source="ui/popover">
        <Popover>
          <PopoverTrigger render={<Button variant="raised" />}>
            <Bell />
            Price alert
          </PopoverTrigger>
          <PopoverPopup className="w-72">
            <PopoverTitle>Alert me at</PopoverTitle>
            <PopoverDescription>
              We notify you once when the price crosses this level.
            </PopoverDescription>
            <Input
              aria-label="Alert price"
              defaultValue="135.00"
              className="my-3"
            />
            <PopoverClose render={<Button size="sm" />}>
              Save alert
            </PopoverClose>
          </PopoverPopup>
        </Popover>
      </Specimen>

      <Specimen
        name="Tooltip · PreviewCard"
        source="ui/tooltip · ui/preview-card"
      >
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="raised" size="icon" aria-label="Save" />}
          >
            <Bookmark />
          </TooltipTrigger>
          <TooltipPopup>Save for later</TooltipPopup>
        </Tooltip>
        <p className="text-sm">
          Written by{" "}
          <PreviewCard>
            <PreviewCardTrigger
              href="#overlays"
              className="font-medium text-primary underline underline-offset-4"
            >
              Ingrid Solberg
            </PreviewCardTrigger>
            <PreviewCardPopup className="w-64">
              <p className="font-heading text-lg font-semibold">
                Ingrid Solberg
              </p>
              <p className="text-sm text-muted-foreground">
                Markets editor at Paper. Covers Nordic equities and shipping.
              </p>
            </PreviewCardPopup>
          </PreviewCard>
        </p>
      </Specimen>

      <Specimen name="Menu" source="ui/menu">
        <Menu>
          <MenuTrigger render={<Button variant="raised" />}>
            <User />
            Account
          </MenuTrigger>
          <MenuPopup className="w-56">
            <MenuGroup>
              <MenuGroupLabel>Eric</MenuGroupLabel>
              <MenuItem>
                <User />
                Profile
              </MenuItem>
              <MenuItem>
                <Settings />
                Settings
                <MenuShortcut>⌘,</MenuShortcut>
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuCheckboxItem defaultChecked>Daily brief</MenuCheckboxItem>
            <MenuSeparator />
            <MenuItem>
              <LogOut />
              Sign out
            </MenuItem>
          </MenuPopup>
        </Menu>
      </Specimen>

      <Specimen name="ContextMenu" source="ui/context-menu">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-input text-sm text-muted-foreground">
            Right-click (or long-press) here
          </ContextMenuTrigger>
          <ContextMenuPopup>
            <ContextMenuItem>
              <Copy />
              Copy ticker
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Share2 />
              Share
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Remove from watchlist</ContextMenuItem>
          </ContextMenuPopup>
        </ContextMenu>
      </Specimen>

      <Specimen name="Command" source="ui/command">
        <CommandDialog>
          <CommandDialogTrigger render={<Button variant="raised" />}>
            Jump to site
            <Kbd>⌘K</Kbd>
          </CommandDialogTrigger>
          <CommandDialogPopup>
            <Command items={commandItems}>
              <CommandInput placeholder="Search Courier…" />
              <CommandEmpty>No results.</CommandEmpty>
              <CommandList>
                {(item: (typeof commandItems)[number]) => (
                  <CommandItem key={item.value} value={item.value}>
                    {item.label}
                  </CommandItem>
                )}
              </CommandList>
            </Command>
          </CommandDialogPopup>
        </CommandDialog>
      </Specimen>
    </ShowcaseSection>
  )
}
