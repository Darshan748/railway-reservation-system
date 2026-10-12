import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  LayoutDashboard,
  ListOrdered,
  Menu,
  RotateCcw,
  Search,
  Settings2,
  Ticket,
  TrainFront,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ConfirmAction } from "./ConfirmAction";
import { resetData } from "@/lib/rail/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search Trains", icon: Search },
  { to: "/reservations", label: "My Reservations", icon: Ticket },
  { to: "/waitlist", label: "Waiting List", icon: ListOrdered },
  { to: "/admin", label: "Train Management", icon: Settings2 },
  { to: "/dsa", label: "DSA Concepts", icon: Brain },
  { to: "/docs", label: "Documentation", icon: BookOpen },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <TrainFront className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base font-bold text-sidebar-accent-foreground">RailYatra</span>
        <span className="block text-[11px] text-sidebar-foreground/70">Reservation System</span>
      </span>
    </Link>
  );
}

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/search": "Search Trains",
  "/reservations": "My Reservations",
  "/waitlist": "Waiting List",
  "/admin": "Train Management",
  "/dsa": "DSA Concepts",
  "/docs": "Project Documentation",
};

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title =
    TITLES[pathname] ?? (pathname.startsWith("/book") ? "Book Ticket" : pathname.startsWith("/ticket") ? "Ticket" : "RailYatra");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col gap-8 bg-sidebar p-5 lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-foreground/80">
          Academic DSA project. All train data is <strong className="text-sidebar-accent-foreground">simulated</strong>, not live railway information.
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex flex-col gap-8">
            <Brand />
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="warning" className="hidden sm:inline-flex">Simulated data</Badge>
            <ConfirmAction
              title="Reset demo data?"
              description="All trains, reservations and waiting-list entries will be replaced with the original sample data. This cannot be undone."
              confirmLabel="Reset data"
              destructive
              onConfirm={() => {
                resetData();
                toast.success("Demo data reset to sample records");
              }}
            >
              <Button variant="outline" size="sm">
                <RotateCcw /> <span className="hidden sm:inline">Reset data</span>
              </Button>
            </ConfirmAction>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
