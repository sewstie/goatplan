import type { Metadata } from "next";
import {
  ArrowClockwise,
  ArrowSquareOut,
  BookmarkSimple,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Check,
  Clock,
  LockSimple,
  LockSimpleOpen,
  MagnifyingGlass,
  Plus,
  X,
} from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { ChipDemo } from "./ChipDemo";
import { DemoRow } from "./DemoRow";
import { DemoSection } from "./DemoSection";
import { DialogDemo } from "./DialogDemo";
import { ToggleDemo } from "./ToggleDemo";
import { TooltipDemo } from "./TooltipDemo";

export const metadata: Metadata = {
  title: "UI primitives · GoatPlan",
  robots: { index: false },
};

const terms = [
  { value: "2026-B", label: "B Term · Fall 2026" },
  { value: "2027-C", label: "C Term · Spring 2027" },
  { value: "2027-D", label: "D Term · Spring 2027" },
];

const times = ["8:00 AM", "9:00 AM", "10:00 AM"].map((time) => ({ value: time, label: time }));

const sorts = [
  { value: "early", label: "Fewest early classes" },
  { value: "gaps", label: "Fewest gaps" },
  { value: "days", label: "Fewest days" },
];

export default function UiPrimitivesPage() {
  return (
    <main className="mx-auto flex max-w-1100 flex-col gap-12 p-(--size-app-padding)">
      <header className="flex flex-col gap-7 px-4 pt-8 pb-12">
        <h1 className="text-25 leading-30 font-700 tracking-title">UI primitives</h1>
        <p className="text-10 leading-14-5 text-ink-muted">
          Every primitive in components/ui with its variants and states. Sample labels come from
          the designs in docs/design.
        </p>
      </header>

      <DemoSection title="Button" note="Variants: primary, secondary, warning, soft. Sizes: lg 36, md 36 with 10px label, sm 32, xs 21.">
        <DemoRow label="Primary">
          <Button icon={<BookmarkSimple />}>Save schedule</Button>
          <Button icon={<BookmarkSimple />} disabled>
            Save schedule
          </Button>
          <Button size="md" icon={<X />}>
            Remove AB 1533
          </Button>
          <Button size="sm" icon={<ArrowClockwise />}>
            Switch to C Term
          </Button>
          <Button size="sm" icon={<Check />} className="w-112" aria-disabled="true">
            Saved
          </Button>
        </DemoRow>
        <DemoRow label="Links that look like buttons">
          <ButtonLink href="https://workday.wpi.edu" external icon={<ArrowSquareOut />}>
            Open Workday
          </ButtonLink>
          <ButtonLink href="/plans" size="sm" variant="secondary">
            All saved plans
          </ButtonLink>
        </DemoRow>
        <DemoRow label="Secondary and warning">
          <Button variant="secondary" size="md" icon={<CalendarBlank />}>
            Check another term
          </Button>
          <Button variant="warning" icon={<Clock />}>
            Use data from Oct 9
          </Button>
          <Button variant="warning" size="xs">
            Remove course
          </Button>
        </DemoRow>
        <DemoRow label="Soft (xs)">
          <Button variant="soft" size="xs" icon={<Plus />}>
            Add
          </Button>
          <Button variant="soft" size="xs" icon={<LockSimple />}>
            Lock
          </Button>
          <Button variant="soft" size="xs" icon={<LockSimpleOpen />}>
            Unlock
          </Button>
        </DemoRow>
        <DemoRow label="Full width">
          <div className="flex w-238 flex-col gap-8">
            <Button size="md" fullWidth icon={<X />}>
              Remove AB 1533
            </Button>
            <Button variant="secondary" size="md" fullWidth icon={<CalendarBlank />}>
              Check another term
            </Button>
          </div>
        </DemoRow>
      </DemoSection>

      <DemoSection title="Icon button">
        <DemoRow label="Outline (schedule switcher) and ghost">
          <IconButton label="Previous schedule" icon={<CaretLeft />} />
          <IconButton label="Next schedule" icon={<CaretRight />} />
          <IconButton label="Next schedule" icon={<CaretRight />} disabled />
          <IconButton variant="ghost" label="Remove" icon={<X />} className="text-ink" />
        </DemoRow>
      </DemoSection>

      <DemoSection title="Badge" note="Tones: success, warning, neutral, accent. Sizes: sm 8px, md 8.5px, lg 9px.">
        <DemoRow label="Fit badges (md)">
          <Badge tone="success">Fits</Badge>
          <Badge tone="warning">Clashes with AE 2320 lecture</Badge>
          <Badge tone="warning">All sections full</Badge>
        </DemoRow>
        <DemoRow label="Small and large">
          <Badge size="sm">Only lecture</Badge>
          <Badge size="sm">No set time</Badge>
          <Badge size="sm" tone="accent">
            Previewing
          </Badge>
          <Badge size="lg" tone="accent">
            Locked
          </Badge>
          <Badge size="lg" tone="warning">
            Waitlist only
          </Badge>
          <Badge size="lg" tone="warning">
            7 of 15 on waitlist
          </Badge>
        </DemoRow>
      </DemoSection>

      <DemoSection title="Chip" note="Preference chips. The × removes a block, the dashed chip adds one.">
        <div className="flex flex-wrap items-center gap-7 rounded-card bg-canvas px-12 py-12">
          <ChipDemo />
        </div>
      </DemoSection>

      <DemoSection title="Toggle" note="A switch: Space or Enter toggles it.">
        <DemoRow label="On, off, disabled">
          <ToggleDemo />
        </DemoRow>
      </DemoSection>

      <DemoSection title="Select" note="Native select, styled closed. Variants: field, box, pill, menu.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-16">
          <DemoRow label="Field (term)">
            <Select label="Term" options={terms} defaultValue="2027-C" className="w-192" />
          </DemoRow>
          <DemoRow label="Box (professor)">
            <Select
              variant="box"
              label="Professor"
              options={[{ value: "ye-lu", label: "Ye Lu" }]}
              className="w-238"
            />
          </DemoRow>
          <DemoRow label="Disabled field">
            <Select label="Term" options={terms} defaultValue="2027-C" className="w-192" disabled />
          </DemoRow>
        </div>
        <div className="flex flex-wrap items-center gap-7 rounded-card bg-canvas px-12 py-12">
          <Select variant="pill" label="Starts after" options={times} defaultValue="9:00 AM" />
          <Select variant="menu" label="Sort" options={sorts} defaultValue="early" />
        </div>
      </DemoSection>

      <DemoSection title="Text input">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-16">
          <DemoRow label="Empty">
            <TextInput
              type="search"
              label="Search courses"
              placeholder="Course code or professor"
              icon={<MagnifyingGlass />}
              className="w-192"
            />
          </DemoRow>
          <DemoRow label="With a value">
            <TextInput
              type="search"
              label="Search courses"
              placeholder="Course code or professor"
              defaultValue="AE 23200"
              icon={<MagnifyingGlass />}
              className="w-192"
            />
          </DemoRow>
          <DemoRow label="Disabled with hint">
            <TextInput
              type="search"
              label="Search courses"
              placeholder="Course code or professor"
              icon={<MagnifyingGlass />}
              hint="Search works once sections load."
              disabled
              className="w-192"
            />
          </DemoRow>
          <DemoRow label="Visible label">
            <TextInput label="Block name" placeholder="Work" hideLabel={false} className="w-192" />
          </DemoRow>
        </div>
      </DemoSection>

      <DemoSection title="Card" note="Surfaces used across the designs.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(238px,1fr))] gap-12 rounded-card bg-canvas p-12">
          <Card variant="panel" className="px-16 py-20 text-10">
            panel · sidebar, calendar, details
          </Card>
          <Card className="px-10 pt-15 pb-10 text-10">outlined · section choice</Card>
          <Card variant="subtle" className="px-10 py-23 text-10">
            subtle · skeleton card
          </Card>
          <Card variant="message" className="px-20 py-28 text-10">
            message · over the calendar
          </Card>
          <Card variant="issue" className="p-11 text-10 text-issue-ink">
            issue · Two lectures overlap
          </Card>
          <Card variant="problem" className="px-10 pt-15 pb-10 text-10">
            problem · Lab CX01 is full
          </Card>
          <Card variant="unfit" className="px-10 py-12 text-10 text-unfit-ink">
            unfit · Doesn’t fit
          </Card>
          <Card variant="strip" className="px-12 py-12 text-10">
            strip · spec strip
          </Card>
        </div>
      </DemoSection>

      <DemoSection title="Dialog and sheet" note="Native modal dialog: focus moves in, Escape closes, focus returns.">
        <DemoRow label="Open">
          <DialogDemo />
        </DemoRow>
      </DemoSection>

      <DemoSection title="Tooltip" note="Shows on hover and on keyboard focus. Escape hides it.">
        <DemoRow label="Hovered block">
          <TooltipDemo />
        </DemoRow>
      </DemoSection>
    </main>
  );
}
