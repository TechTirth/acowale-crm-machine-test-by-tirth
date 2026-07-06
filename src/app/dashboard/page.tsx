import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

// Server-side auth guard: unauthenticated visitors never see the console shell.
export default async function DashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <Dashboard />;
}
