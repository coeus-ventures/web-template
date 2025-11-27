"use client";

import { AdminNav } from "./admin-nav";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { Separator } from "@/components/ui/separator";

interface AdminHeaderProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 md:px-6 py-4">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <AdminNav />
        </div>

        {/* Breadcrumbs */}
        <AdminBreadcrumbs />

        {/* Page header */}
        {(title || description || action) && (
          <>
            <Separator className="my-4" />
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              {action && <div className="ml-4">{action}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
