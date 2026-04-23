import { PortalShell } from "@/components/portal-shell";
import { getSessionProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "patient") redirect("/dashboard");
  return <PortalShell profile={profile}>{children}</PortalShell>;
}
