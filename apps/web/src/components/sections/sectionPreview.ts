import { create } from "zustand";

interface SectionPreview {
  courseCode: string | null;
  sectionId: string | null;
  start: (courseCode: string, sectionId: string) => void;
  end: (sectionId: string) => void;
}

export const useSectionPreview = create<SectionPreview>()((set) => ({
  courseCode: null,
  sectionId: null,
  start: (courseCode, sectionId) => set({ courseCode, sectionId }),
  end: (sectionId) => set((state) => state.sectionId === sectionId ? { courseCode: null, sectionId: null } : state),
}));
