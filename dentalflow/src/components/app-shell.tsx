import { cn } from "@/lib/cn";
import type { SessionProfile } from "@/lib/auth";
import type { AppRole } from "@/types/roles";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { ElementType } from "react";

const nav: { href: string; label: string; icon: ElementType; roles: AppRole[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "front_desk", "hygienist", "dentist"] },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, roles: ["admin", "front_desk", "hygienist", "dentist"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["admin", "front_desk", "hygienist", "dentist"] },
  { href: "/billing", label: "Billing", icon: CreditCard, roles: ["admin", "front_desk", "dentist"] },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, roles: ["admin", "front_desk", "hygienist", "dentist"] },
];

function roleLabel(r: AppRole) {
  switch (r) {
    case "front_desk":
      return "Front desk";
    case "hygienist":
      return "Hygienist";
    case "dentist":
      return "Dentist";
    case "admin":
      return "Admin";
    default:
      return r;
  }
}

export function AppShell({
  profile,
  children,
}: {
  profile: SessionProfile;
  children: React.ReactNode;
}) {
  const allow = (roles: AppRole[]) => roles.includes(profile.role);
  return (
    <div className="min-h-svh flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <aside
        className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col dark:border-slate-800 dark:bg-slate-900"
        aria-label="Primary"
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <Stethoscope className="h-6 w-6 text-sky-600" aria-hidden />
          <div>
            <div className="text-sm font-semibold">DentalFlow</div>
            <div className="text-xs text-slate-500">Practice</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {nav
            .filter((n) => allow(n.roles))
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800">
          <div className="text-sm text-slate-800 dark:text-slate-200">
            {profile.full_name ?? "Staff"}
            <div className="text-xs text-slate-500">{roleLabel(profile.role)}</div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" className="inline-flex w-full gap-2">
              <LogOut className="h-4 w-4" aria-hidden />
              <span>Sign out</span>
            </Button>
          </form>
          <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500">
            <Building2 className="h-3 w-3" aria-hidden />
            Demo: synthetic data
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="md:hidden">
          <header className="flex h-14 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm font-semibold">DentalFlow</div>
          </header>
        </div>
        <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
