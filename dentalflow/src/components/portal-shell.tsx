import { signOutAction } from "@/actions/auth";
import type { SessionProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Home, LogOut, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/appointments", label: "Appointments", icon: Calendar },
  { href: "/portal/treatment", label: "Treatment", icon: FileText },
  { href: "/portal/forms", label: "Forms", icon: FileText },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/billing", label: "Balance", icon: User },
] as const;

export function PortalShell({
  profile,
  children,
}: {
  profile: SessionProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">DentalFlow</div>
            <div className="text-xs text-slate-500">Patient portal</div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="gap-2 text-sm">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
        <nav className="border-t border-slate-200 dark:border-slate-800" aria-label="Portal">
          <ul className="mx-auto flex max-w-5xl flex-wrap gap-1 px-2 py-2">
            {nav.map((n) => {
              const I = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <I className="h-4 w-4" />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="px-4 pb-2 text-center text-[11px] text-amber-800 dark:text-amber-200">
          You only see your own information. {profile.full_name ? `— ${profile.full_name}` : ""}
        </p>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4">{children}</main>
    </div>
  );
}
