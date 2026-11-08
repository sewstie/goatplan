"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import type { Section } from "@/lib/data/types";
import { describeCourse, type DescribedText } from "./descriptionText";

type CourseDescriptionProps = {
  code: string;
  title: string;
  description: string;
  /** The sections in the schedule. Topic courses give each one its own description. */
  sections: readonly Section[];
  phone?: boolean;
  onBack(): void;
};

/** The details panel's description page, opened from "Course description". */
export function CourseDescription({ code, title, description, sections, phone = false, onBack }: CourseDescriptionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const described = describeCourse({ description }, sections);
  const empty = described.parts.length === 0 && described.topics.length === 0;
  const body = phone ? "text-9" : "text-10 leading-17-5";

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="pb-12">
        <Button variant="secondary" size="sm" icon={<ArrowLeft aria-hidden />} onClick={onBack}>
          Back to sections
        </Button>
      </div>
      <p className="text-9 leading-13 font-650 text-ink-muted">Course description</p>
      <h2 ref={headingRef} tabIndex={-1} className={cx("font-700 tracking-heading text-ink", phone ? "text-25 leading-30" : "text-21 leading-25-2")}>
        {code}
      </h2>
      <p className="text-11 leading-17-6 font-510 text-ink">{title}</p>

      {empty ? (
        <p className={cx("pt-7 text-ink-muted", body)}>WPI has no description for this course.</p>
      ) : (
        <DescriptionBody described={described} className={body} />
      )}

      {described.topics.map((topic) => (
        <section key={topic.section} aria-label={`Topic for ${topic.section}`} className="mt-11 flex flex-col gap-4 border-t border-line pt-11">
          <h3 className="text-10 leading-14-5 font-650 text-ink">{topic.title || `Section ${topic.section}`}</h3>
          <p className="text-9 leading-13 text-ink-muted">Topic for section {topic.section}</p>
          <DescriptionBody described={topic} className={body} />
        </section>
      ))}
    </div>
  );
}

function DescriptionBody({ described, className }: { described: DescribedText; className: string }) {
  return (
    <div className={cx("flex flex-col gap-10 pt-7 text-ink-secondary", className)}>
      {described.offered && <p className="font-570 text-ink">{described.offered}</p>}
      {described.parts.map((part, index) => (
        <p key={index}>
          {part.label && <span className="font-650 text-ink">{part.label}: </span>}
          {part.text}
        </p>
      ))}
    </div>
  );
}
