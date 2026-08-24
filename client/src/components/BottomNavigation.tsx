/** Hawker Market Journal style: a paper coloured mobile navigation bar with clear active section markers. */
import { CalendarDays, House, PlusCircle, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const navigationItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/log", label: "Log a Meal", icon: PlusCircle },
  { href: "/history", label: "Daily History", icon: CalendarDays },
  { href: "/community", label: "Community", icon: UsersRound },
];

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-lg items-center justify-around rounded-[1.35rem] border border-[#d5e1cc] bg-[#fffdf5]/95 p-1.5 shadow-[0_10px_30px_rgba(36,79,54,0.16)] backdrop-blur-md">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? location === "/" : location === item.href;
          return (
            <button
              key={item.href}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(item.href)}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 text-[0.65rem] font-extrabold leading-tight transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049] sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm ${active ? "bg-[#216442] text-white shadow-[0_3px_0_#143e2a]" : "text-[#496a58] hover:bg-[#eaf2df]"}`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
