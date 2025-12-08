"use client";

import { Database } from "lucide-react";

export default function DatabasePage() {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Select a table</p>
        <p className="text-sm mt-1 opacity-70">Choose a table from the sidebar to view its data</p>
      </div>
    </div>
  );
}
