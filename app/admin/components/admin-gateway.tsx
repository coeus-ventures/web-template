"use client";

export function AdminGateway() {
  return (
    <iframe
      src="/api/admin"
      className="h-full w-full border-0"
      title="Drizzle Studio"
    />
  );
}
