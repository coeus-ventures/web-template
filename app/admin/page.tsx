import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminGateway } from "./components/admin-gateway";
import { AdminHeader } from "./components/admin-header";
import { AdminAccessDenied } from "./components/admin-access-denied";

export const metadata = {
  title: "Database Administration | Admin",
  description: "Secure database administration interface",
};

export default async function AdminPage() {
  const { user } = await getUser();

  if (!user) {
    redirect("/auth/signin?redirectTo=/admin");
  }

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
      <main className="flex-1">
        <AdminGateway />
      </main>
    </div>
  );
}
