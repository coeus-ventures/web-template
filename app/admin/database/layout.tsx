"use client";

import { AdminHeader } from "../components/admin-header";
import { DatabaseSidebar } from "./components/database-sidebar";

export default function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AdminHeader />
      <div className="flex-1 flex min-h-0">
        <DatabaseSidebar />
        <main className="flex-1 overflow-auto flex flex-col">{children}</main>
      </div>
    </div>
  );
}
