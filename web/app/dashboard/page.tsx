import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Signed in as: {session.user.email}</p>
      <p>Organization ID: {session.user.organizationId}</p>
      <p>Role: {session.user.role}</p>
      <ul>
        <li><a href="/api/v1/me" style={{ color: "#818cf8" }}>/api/v1/me</a></li>
        <li><a href="/api/v1/contacts" style={{ color: "#818cf8" }}>/api/v1/contacts</a></li>
        <li><a href="/api/health" style={{ color: "#818cf8" }}>/api/health</a></li>
      </ul>
    </main>
  );
}