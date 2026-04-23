import { getSessionProfile } from "@/lib/auth";
import { getHomePathForRole } from "@/types/roles";
import { redirect } from "next/navigation";

export default async function Home() {
  const p = await getSessionProfile();
  if (!p) redirect("/login");
  redirect(getHomePathForRole(p.role));
}
