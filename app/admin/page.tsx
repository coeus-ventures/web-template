"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetStats } from "./behaviors/get-stats/use-get-stats";
import { AdminHeader } from "./components/admin-header";
import { Users } from "lucide-react";

export default function AdminDashboardPage() {
  const { stats, isLoading, error } = useGetStats();

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader
        title="Dashboard"
        description="Overview of your application statistics"
      />

      <div className="flex-1 px-4 md:px-6 py-8 space-y-8">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold">
              {isLoading ? "-" : stats?.totalUsers ?? 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Total Users</div>
          </Card>
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold">
              {isLoading ? "-" : stats?.activeSessions ?? 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Active Sessions
            </div>
          </Card>
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className={`text-3xl font-bold ${stats && stats.bannedUsers > 0 ? 'text-destructive' : ''}`}>
              {isLoading ? "-" : stats?.bannedUsers ?? 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Banned Users
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and manage user accounts
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/admin/users">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
