"use client";

import { useCallback, useRef, useState } from "react";
import type { Course } from "@/lib/data/types";
import { loadCatalog, type Catalog } from "@/lib/degree";

const NO_COURSES: Course[] = [];

export function useCourseCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const loading = useRef<Promise<Catalog> | null>(null);

  const load = useCallback(() => {
    loading.current ??= loadCatalog().then((loaded) => {
      if (!loaded.complete) loading.current = null;
      setCatalog(loaded);
      return loaded;
    });
    return loading.current;
  }, []);

  return { courses: catalog?.courses ?? NO_COURSES, ready: catalog !== null, load };
}
