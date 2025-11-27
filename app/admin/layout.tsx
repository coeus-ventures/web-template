import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getUser();

  // Check if user is authenticated and has admin role
  if (!user) {
    redirect("/auth/signin?callbackURL=/admin");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-full">{children}</div>
      <Toaster />
    </div>
  );
}
