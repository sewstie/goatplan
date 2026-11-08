"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, Check, GraduationCap, WarningCircle } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { foundCourse, getDegreeSource, loadCatalog, parseTerm, termLong } from "@/lib/degree";
import { validHistoryTerm } from "@/lib/degree/history";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { addPlanMessage, type AddPlanMessage } from "./addPlanResult";

export function AddPlanToDegree() {
  const courses = usePlanner((state) => state.courses);
  const file = usePlanner((state) => state.term);
  const saved = usePlanner(selectSavedPlan);
  const [result, setResult] = useState<{ key: string; message: AddPlanMessage } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const codes = saved ? saved.courses : courses;
  const term = parseTerm(saved?.termId ?? file?.term.id);
  const termName = term ? termLong(term) : "";
  const key = `${termName}|${codes.join(",")}`;
  const message = result?.key === key ? result.message : null;
  const ready = !!file && !!term && validHistoryTerm(termName) && codes.length > 0;
  const detail = codes.length === 0 ? "Pick courses first" : !term || !validHistoryTerm(termName) ? "This term can’t be tracked yet" : `${codes.length} ${codes.length === 1 ? "course" : "courses"} · planned for ${termName}`;

  async function add() {
    if (!file || !term) return;
    const missing = codes.some((code) => !file.courses.some((course) => course.code === code));
    const catalog = missing ? await loadCatalog() : null;
    const list = codes.map((code) => {
      const course = file.courses.find((item) => item.code === code) ?? catalog?.courses.find((item) => item.code === code);
      const savedCourse = saved?.schedule.find((item) => item.code === code);
      return { ...foundCourse(course ?? { code, title: savedCourse?.title ?? "", credits: savedCourse?.sections.find((section) => section.credits != null)?.credits ?? 3 }), status: "planned" as const, term: termName };
    });
    // The button is about to be replaced, so focus stays in the menu instead of falling to the page.
    box.current?.focus();
    setResult({ key, message: addPlanMessage(getDegreeSource().addCourses(list), codes.length, termName) });
  }

  return (
    <div ref={box} tabIndex={-1} className="w-288 outline-none max-tablet:w-full">
      {message ? (
        <div role="status" className="flex items-start gap-10 rounded-row px-8 py-8">
          <span aria-hidden className={cx("flex size-32 shrink-0 items-center justify-center rounded-control [&_svg]:size-16", message.tone === "success" ? "bg-success-soft text-success-ink" : "bg-warning-soft text-warning-ink")}>
            {message.tone === "success" ? <Check weight="bold" /> : <WarningCircle weight="bold" />}
          </span>
          <span className="flex min-w-0 flex-col gap-2">
            <span className="text-10 leading-14-5 font-570 text-ink">{message.title}</span>
            <span className="text-9 leading-13 text-ink-muted">{message.detail}</span>
            {message.tone === "success" && (
              <Link href="/degree" className="mt-4 inline-flex w-fit items-center gap-4 rounded-row text-9 leading-13 font-570 text-accent hover:underline">
                Open My degree <ArrowRight aria-hidden weight="bold" className="size-11" />
              </Link>
            )}
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={!ready}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-detail`}
          onClick={() => void add()}
          className="group flex w-full cursor-pointer items-center gap-10 rounded-row px-8 py-8 text-left enabled:hover:bg-surface-selected disabled:cursor-not-allowed max-tablet:min-h-44"
        >
          <span aria-hidden className="flex size-32 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent group-disabled:bg-surface-disabled group-disabled:text-ink-faint [&_svg]:size-16">
            <GraduationCap weight="bold" />
          </span>
          <span className="flex min-w-0 flex-col gap-2">
            <span id={`${id}-title`} className="text-10 leading-14-5 font-570 text-ink group-disabled:text-ink-muted">Add to My degree</span>
            <span id={`${id}-detail`} className="text-9 leading-13 text-ink-muted">{detail}</span>
          </span>
        </button>
      )}
    </div>
  );
}
