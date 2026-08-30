import {
  BarChart3,
  BookMarked,
  CalendarDays,
  Code2,
  LayoutDashboard,
  Lightbulb,
  Trophy,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: BookMarked },
  { href: "/languages", label: "Languages", icon: Code2 },
  { href: "/contributions", label: "Contributions", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/year-in-review", label: "Year in Review", icon: Trophy },
  { href: "/contributions?period=12m", label: "Trends", icon: CalendarDays, hidden: true },
];
