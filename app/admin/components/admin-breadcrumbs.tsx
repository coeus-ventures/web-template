"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

const pathMapping: Record<string, string> = {
  admin: "Admin",
  users: "Users",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Split path and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = pathMapping[segment] || segment;
    const isLast = index === segments.length - 1;

    return {
      label,
      href,
      isLast,
    };
  });

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {breadcrumb.isLast ? (
            <span className="font-medium text-foreground">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
