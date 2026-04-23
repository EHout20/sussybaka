import { AppShell } from "@/components/app-shell";
import { getSessionProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "patient") redirect("/portal");
  return <AppShell profile={profile}>{children}</AppShell>;
}
