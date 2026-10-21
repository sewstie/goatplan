export const TUTORIAL_STEPS = [
  {
    title: "Choose your term",
    description: "Use the Term selector in the sidebar to choose when you’re taking classes. Your choices become your real plan.",
    action: "Choose a term",
    target: "tutorial-term",
  },
  {
    title: "Add your courses",
    description: "Search by course code in the sidebar and add a course. GoatPlan chooses sections and generates schedules automatically. One course is enough to continue.",
    action: "Search courses",
    target: "tutorial-search",
  },
  {
    title: "Browse your schedules",
    description: "Use the arrows beside Schedule planner to compare schedules. Select a class to see its sections. You can finish this guide even if no schedule fits, then adjust your choices in the planner.",
    action: "Browse schedules",
    target: "tutorial-schedules",
  },
] as const;
