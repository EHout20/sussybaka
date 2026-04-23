import { VerifyEmailClient } from "./verify-email-client";

type PageProps = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return <VerifyEmailClient initialEmail={typeof sp.email === "string" ? sp.email : ""} />;
}
