import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminGateway } from "./components/admin-gateway";
import { AdminHeader } from "./components/admin-header";
import { AdminAccessDenied } from "./components/admin-access-denied";
import { AuthToken } from "@/models/auth-token";

export const metadata = {
  title: "Database Administration | Admin",
  description: "Secure database administration interface",
};

export default async function AdminPage() {
  const { user } = await getUser();

  if (!user) {
    redirect("/auth/signin?redirectTo=/admin");
  }

  // Check if user has a recent token (authenticated via one-time token)
  // Tokens are only generated for project owners, so if they have a recent token,
  // they are the owner and should have access to admin
  const hasRecentToken = await AuthToken.hasRecentToken(user.email);

  // Only allow if user has a recent token (owner) OR has admin role
  if (!hasRecentToken && user.role !== "admin") {
    return (
      <div className="flex h-screen w-full flex-col">
        <AdminHeader userEmail={user.email} />
        <AdminAccessDenied />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <AdminHeader userEmail={user.email} />
      <main className="flex-1">
        <AdminGateway />
      </main>
    </div>
  );
}
