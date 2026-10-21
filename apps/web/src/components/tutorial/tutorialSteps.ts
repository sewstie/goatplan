export const TUTORIAL_STEPS = [
  {
    id: "term",
    title: "Choose your term",
    description: "Use the Term selector in the sidebar to choose when you’re taking classes. Your choices become your real plan.",
    action: "Choose a term",
    target: "tutorial-term",
  },
  {
    id: "courses",
    title: "Add your courses",
    description: "Search by course code in the sidebar and add a course. GoatPlan chooses sections and generates schedules automatically. One course is enough to continue.",
    action: "Search courses",
    target: "tutorial-search",
  },
  {
    id: "availability",
    title: "Set availability if you want",
    description: "New plans start at Any time, with no blocked time and Only open sections on. All changes are optional.",
    action: "Find Starts after",
    target: "tutorial-start-time",
  },
  {
    id: "schedules",
    title: "Browse your schedules",
    description: "Use the arrows beside Schedule planner to compare schedules. Select a class to see its sections. You can finish this guide even if no schedule fits, then adjust your choices in the planner.",
    action: "Browse schedules",
    target: "tutorial-schedules",
  },
] as const;
