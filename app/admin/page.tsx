import { getUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGateway } from "./components/admin-gateway";

export const metadata = {
  title: "Database Administration | Admin",
  description: "Secure database administration interface",
};

export default async function AdminPage() {
  const { user } = await getUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  // Optional: Check for admin role
  // if (user.role !== 'admin') {
  //   redirect("/unauthorized");
  // }

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">← Back to App</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <p className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium">{user.email}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Gateway Interface */}
      <main className="flex-1">
        <AdminGateway />
      </main>
    </div>
  );
}
