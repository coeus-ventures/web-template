import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminHeader } from "./components/admin-header";
import { AdminAccessDenied } from "./components/admin-access-denied";

export const metadata = {
  title: "Admin | Dashboard",
  description: "Admin dashboard",
};

export default async function AdminPage() {
  const { user } = await getUser();

  if (!user) {
    redirect("/auth/signin?redirectTo=/admin");
  }

  // Only allow users with admin role
  if (user.role !== "admin") {
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
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to the admin area.</p>
      </main>
    </div>
  );
}
