import { requireAuthForPage } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAuthForPage();
  return <AppShell>{children}</AppShell>;
}
