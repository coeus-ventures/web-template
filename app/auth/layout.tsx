import { getUser } from "@/lib/auth";
import { signOut } from "./behaviors/signout/actions/signout";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUser();

  if (user) {
    await signOut(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-dotted-grid">{children}</div>
  );
}
