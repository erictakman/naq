import { Mail, Search } from "lucide-react"
import type React from "react"

import {
  ShowcaseSection,
  Specimen,
} from "@/components/blocks/showcase/specimen"
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/autocomplete"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/ui/number-field"
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/otp-field"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const exchanges = [
  { value: "sto", label: "Nasdaq Stockholm" },
  { value: "osl", label: "Oslo Børs" },
  { value: "cph", label: "Nasdaq Copenhagen" },
  { value: "hel", label: "Nasdaq Helsinki" },
]

const tickers = [
  { value: "NHVN", label: "NHVN · Nordhavn Freight" },
  { value: "BRKA", label: "BRKA · Brokaven Energy" },
  { value: "LUMA", label: "LUMA · Lumafors Bank" },
  { value: "SKOG", label: "SKOG · Skogsberg Timber" },
]

export function FormsSection(): React.ReactElement {
  return (
    <ShowcaseSection
      id="forms"
      title="Forms"
      description="Every input sits in a Field so the label, description and error are wired to it for screen readers."
    >
      <Specimen name="Field · Input" source="ui/field · ui/input">
        <Field className="w-full max-w-xs">
          <FieldLabel>Email</FieldLabel>
          <Input type="email" placeholder="name@courier.se" />
          <FieldDescription>Used for price alerts.</FieldDescription>
        </Field>
        <Field className="w-full max-w-xs" invalid>
          <FieldLabel>Amount</FieldLabel>
          <Input defaultValue="-40" aria-invalid />
          <FieldError match>Amount must be positive.</FieldError>
        </Field>
      </Specimen>

      <Specimen name="Textarea" source="ui/textarea">
        <Field className="w-full">
          <FieldLabel>Note to analyst</FieldLabel>
          <Textarea placeholder="What would you like covered?" />
        </Field>
      </Specimen>

      <Specimen name="InputGroup" source="ui/input-group">
        <InputGroup className="max-w-xs">
          <InputGroupInput aria-label="Search" placeholder="Search tickers" />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup className="max-w-xs">
          <InputGroupInput aria-label="Email" type="email" placeholder="you" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>@courier.se</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup className="max-w-xs">
          <InputGroupAddon>
            <Mail />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Newsletter email"
            placeholder="Newsletter"
          />
        </InputGroup>
      </Specimen>

      <Specimen name="Select" source="ui/select">
        <Field className="w-full max-w-xs">
          <FieldLabel>Exchange</FieldLabel>
          <Select items={exchanges} defaultValue={exchanges[0]}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {exchanges.map((exchange) => (
                <SelectItem key={exchange.value} value={exchange}>
                  {exchange.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>
      </Specimen>

      <Specimen name="Combobox" source="ui/combobox">
        <Combobox items={tickers}>
          <ComboboxInput aria-label="Ticker" placeholder="Pick a ticker…" />
          <ComboboxPopup>
            <ComboboxEmpty>No ticker found.</ComboboxEmpty>
            <ComboboxList>
              {(ticker: (typeof tickers)[number]) => (
                <ComboboxItem key={ticker.value} value={ticker}>
                  {ticker.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Specimen>

      <Specimen name="Autocomplete" source="ui/autocomplete">
        <Autocomplete items={tickers}>
          <AutocompleteInput
            aria-label="Search companies"
            placeholder="Search companies…"
          />
          <AutocompletePopup>
            <AutocompleteEmpty>No company found.</AutocompleteEmpty>
            <AutocompleteList>
              {(ticker: (typeof tickers)[number]) => (
                <AutocompleteItem key={ticker.value} value={ticker}>
                  {ticker.label}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompletePopup>
        </Autocomplete>
      </Specimen>

      <Specimen name="NumberField" source="ui/number-field">
        <NumberField defaultValue={10} min={1} step={1}>
          <NumberFieldScrubArea label="Shares" />
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </Specimen>

      <Specimen name="OTPField" source="ui/otp-field">
        <OTPField aria-label="Verification code" length={6}>
          <OTPFieldInput aria-label="Character 1 of 6" />
          <OTPFieldInput aria-label="Character 2 of 6" />
          <OTPFieldInput aria-label="Character 3 of 6" />
          <OTPFieldSeparator />
          <OTPFieldInput aria-label="Character 4 of 6" />
          <OTPFieldInput aria-label="Character 5 of 6" />
          <OTPFieldInput aria-label="Character 6 of 6" />
        </OTPField>
      </Specimen>

      <Specimen
        name="Checkbox · CheckboxGroup"
        source="ui/checkbox · ui/checkbox-group"
      >
        <Label>
          <Checkbox defaultChecked />
          Email me the daily brief
        </Label>
        <CheckboxGroup aria-label="Sites" defaultValue={["paper", "bank"]}>
          <Label>
            <Checkbox value="paper" />
            Paper
          </Label>
          <Label>
            <Checkbox value="bank" />
            Bank
          </Label>
          <Label>
            <Checkbox value="ledger" />
            Ledger
          </Label>
        </CheckboxGroup>
      </Specimen>

      <Specimen name="RadioGroup" source="ui/radio-group">
        <RadioGroup aria-label="Order type" defaultValue="limit">
          <Label>
            <Radio value="market" /> Market order
          </Label>
          <Label>
            <Radio value="limit" /> Limit order
          </Label>
          <Label>
            <Radio value="stop" /> Stop loss
          </Label>
        </RadioGroup>
      </Specimen>

      <Specimen name="Switch · Slider" source="ui/switch · ui/slider">
        <Label>
          <Switch defaultChecked />
          Price alerts
        </Label>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Label>Risk tolerance</Label>
          <Slider
            aria-label="Risk tolerance"
            defaultValue={40}
            max={100}
            min={0}
          />
        </div>
      </Specimen>

      <Specimen
        name="Form · Fieldset"
        source="ui/form · ui/fieldset"
        note="Form runs native validation; submit with an empty name to see FieldError."
        wide
      >
        <Form
          className="flex w-full max-w-md flex-col gap-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <Fieldset>
            <FieldsetLegend>Book a private talk</FieldsetLegend>
            <Field name="name">
              <FieldLabel>Name</FieldLabel>
              <Input required placeholder="Full name" />
              <FieldError>Please enter your name.</FieldError>
            </Field>
            <Field name="company">
              <FieldLabel>Company</FieldLabel>
              <Input placeholder="Optional" />
            </Field>
          </Fieldset>
          <Button type="submit" className="self-start">
            Request booking
          </Button>
        </Form>
      </Specimen>
    </ShowcaseSection>
  )
}
