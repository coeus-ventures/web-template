"use client";

import { useEffect, useState } from "react";

export function AdminGateway() {
  const [isGatewayAvailable, setIsGatewayAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Gateway is available
    fetch("/api/admin/health")
      .then((res) => {
        if (res.ok) {
          setIsGatewayAvailable(true);
        } else if (res.status === 503) {
          setIsGatewayAvailable(false);
          setError("Gateway service is not running");
        } else if (res.status === 401) {
          setError("Unauthorized - please login again");
        } else {
          setError("Failed to connect to Gateway");
        }
      })
      .catch((err) => {
        console.error("Gateway health check failed:", err);
        setIsGatewayAvailable(false);
        setError("Unable to reach Gateway service");
      });
  }, []);

  if (isGatewayAvailable === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Database Administration...</p>
        </div>
      </div>
    );
  }

  if (!isGatewayAvailable || error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Gateway Unavailable</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="bg-muted/50 rounded p-3 text-left font-mono text-xs">
              <p className="mb-2">Start the Gateway with:</p>
              <code className="text-primary">bun run drizzle:gateway</code>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <iframe
        src="/api/admin"
        className="h-full w-full border-0"
        title="Drizzle Gateway - Database Administration"
        allow="fullscreen"
      />
    </div>
  );
}
