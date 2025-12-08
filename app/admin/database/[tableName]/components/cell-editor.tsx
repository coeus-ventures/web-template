"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface CellEditorProps {
  value: unknown;
  type: string;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function CellEditor({ value, type, onSave, onCancel }: CellEditorProps) {
  const [localValue, setLocalValue] = React.useState<string | boolean>(
    formatValueForEdit(value, type)
  );
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if ("select" in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave(parseValueForSave(localValue, type));
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(parseValueForSave(localValue, type));
  };

  switch (type) {
    case "boolean":
      return (
        <Checkbox
          checked={localValue as boolean}
          onCheckedChange={(checked) => {
            setLocalValue(!!checked);
            onSave(checked ? 1 : 0);
          }}
          autoFocus
        />
      );

    case "integer":
      return (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 w-full"
        />
      );

    case "timestamp":
      return (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="datetime-local"
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 w-full"
        />
      );

    case "json":
      return (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="min-h-[80px] w-full font-mono text-xs"
          placeholder="Enter valid JSON..."
        />
      );

    case "text":
    default:
      return (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 w-full"
        />
      );
  }
}

function formatValueForEdit(value: unknown, type: string): string | boolean {
  if (value === null || value === undefined) {
    return type === "boolean" ? false : "";
  }

  switch (type) {
    case "boolean":
      return value === 1 || value === true;

    case "timestamp":
      if (typeof value === "number") {
        const date = new Date(value);
        return date.toISOString().slice(0, 16);
      }
      return String(value);

    case "json":
      if (typeof value === "string") {
        return value;
      }
      return JSON.stringify(value, null, 2);

    default:
      return String(value);
  }
}

function parseValueForSave(value: string | boolean, type: string): unknown {
  if (value === "" && type !== "boolean") {
    return null;
  }

  switch (type) {
    case "boolean":
      return value ? 1 : 0;

    case "integer":
      const num = Number(value);
      return isNaN(num) ? null : num;

    case "timestamp":
      if (typeof value === "string" && value) {
        const date = new Date(value);
        return date.getTime();
      }
      return null;

    case "json":
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;

    default:
      return value;
  }
}
