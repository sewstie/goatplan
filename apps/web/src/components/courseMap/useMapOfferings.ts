"use client";

import { useCallback, useRef, useState } from "react";
import { loadTerm, loadTermIndex } from "@/lib/data/load";
import type { Course } from "@/lib/data/types";

export function useMapOfferings() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [ready, setReady] = useState(false);
  const loading = useRef<Promise<void> | null>(null);
  const load = useCallback(() => {
    loading.current ??= (async () => {
      try {
        const { terms } = await loadTermIndex();
        const files = await Promise.allSettled([...terms].sort((a, b) => b.start.localeCompare(a.start)).map((term) => loadTerm(term.id)));
        const found = new Map<string, Course>();
        for (const file of files) if (file.status === "fulfilled") for (const course of file.value.courses) if (!found.has(course.code)) found.set(course.code, course);
        setCourses([...found.values()]);
      } catch {
        loading.current = null;
      }
      setReady(true);
    })();
    return loading.current;
  }, []);
  return { courses, ready, load };
}
