"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { ColumnMetadata } from "../state";
import type { TableRow } from "../state";

interface EditRowDialogProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnMetadata[];
  row: TableRow | null;
  onSubmit: (id: string | number, data: Record<string, unknown>) => Promise<unknown>;
  isLoading?: boolean;
}

export function EditRowDialog({
  open,
  onClose,
  columns,
  row,
  onSubmit,
  isLoading,
}: EditRowDialogProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or row changes
  React.useEffect(() => {
    if (open && row) {
      const data: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.name === "id" || col.isPrimaryKey) {
          data[col.name] = row[col.name];
        } else if (col.type === "timestamp" && row[col.name]) {
          // Format timestamp for datetime-local input
          const date = new Date(row[col.name] as number);
          data[col.name] = date.toISOString().slice(0, 16);
        } else if (col.type === "json" && row[col.name]) {
          data[col.name] =
            typeof row[col.name] === "string"
              ? row[col.name]
              : JSON.stringify(row[col.name], null, 2);
        } else if (col.type === "boolean") {
          data[col.name] = row[col.name] === 1 || row[col.name] === true;
        } else {
          data[col.name] = row[col.name] ?? "";
        }
      }
      setFormData(data);
      setErrors({});
    }
  }, [open, row, columns]);

  const handleChange = (column: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [column]: value }));
    setErrors((prev) => ({ ...prev, [column]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!row) return;

    // Basic validation
    const newErrors: Record<string, string> = {};
    for (const col of columns) {
      if (col.isPrimaryKey || col.name === "id") continue;
      if (col.name === "created_at" || col.name === "updated_at") continue;
      if (!col.isNullable) {
        const value = formData[col.name];
        if (value === "" || value === null || value === undefined) {
          newErrors[col.name] = "This field is required";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission (exclude id and timestamps)
    const submitData: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.isPrimaryKey || col.name === "id") continue;
      if (col.name === "created_at" || col.name === "updated_at") continue;

      const value = formData[col.name];
      if (col.type === "boolean") {
        submitData[col.name] = value ? 1 : 0;
      } else if (col.type === "timestamp" && value) {
        submitData[col.name] = new Date(value as string).getTime();
      } else if (col.type === "integer" && value !== "") {
        submitData[col.name] = Number(value);
      } else if (value !== "") {
        submitData[col.name] = value;
      } else {
        submitData[col.name] = null;
      }
    }

    await onSubmit(row.id as string | number, submitData);
  };

  const renderField = (col: ColumnMetadata) => {
    const isReadOnly = col.isPrimaryKey || col.name === "id";
    const isTimestamp =
      col.name === "created_at" || col.name === "updated_at";
    const isRequired =
      !col.isNullable && !isReadOnly && !isTimestamp;

    const value = formData[col.name];

    // Show timestamps as read-only formatted dates
    if (isTimestamp) {
      const timestamp = row?.[col.name];
      const formatted = timestamp
        ? new Date(timestamp as number).toLocaleString()
        : "N/A";
      return (
        <div key={col.name} className="space-y-2">
          <Label htmlFor={col.name} className="text-muted-foreground">
            {col.name}
          </Label>
          <Input
            id={col.name}
            value={formatted}
            disabled
            className="bg-muted"
          />
        </div>
      );
    }

    if (isReadOnly) {
      return (
        <div key={col.name} className="space-y-2">
          <Label htmlFor={col.name} className="text-muted-foreground">
            {col.name} (read-only)
          </Label>
          <Input
            id={col.name}
            value={String(value ?? "")}
            disabled
            className="bg-muted"
          />
        </div>
      );
    }

    switch (col.type) {
      case "boolean":
        return (
          <div key={col.name} className="flex items-center space-x-2">
            <Checkbox
              id={col.name}
              checked={!!value}
              onCheckedChange={(checked) => handleChange(col.name, checked)}
            />
            <Label htmlFor={col.name}>
              {col.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case "integer":
        return (
          <div key={col.name} className="space-y-2">
            <Label htmlFor={col.name}>
              {col.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={col.name}
              type="number"
              value={value as string}
              onChange={(e) => handleChange(col.name, e.target.value)}
              className={errors[col.name] ? "border-destructive" : ""}
            />
            {errors[col.name] && (
              <p className="text-sm text-destructive">{errors[col.name]}</p>
            )}
          </div>
        );

      case "timestamp":
        return (
          <div key={col.name} className="space-y-2">
            <Label htmlFor={col.name}>
              {col.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={col.name}
              type="datetime-local"
              value={value as string}
              onChange={(e) => handleChange(col.name, e.target.value)}
              className={errors[col.name] ? "border-destructive" : ""}
            />
            {errors[col.name] && (
              <p className="text-sm text-destructive">{errors[col.name]}</p>
            )}
          </div>
        );

      case "json":
        return (
          <div key={col.name} className="space-y-2">
            <Label htmlFor={col.name}>
              {col.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={col.name}
              value={value as string}
              onChange={(e) => handleChange(col.name, e.target.value)}
              placeholder="Enter valid JSON..."
              className={`font-mono text-sm ${errors[col.name] ? "border-destructive" : ""}`}
            />
            {errors[col.name] && (
              <p className="text-sm text-destructive">{errors[col.name]}</p>
            )}
          </div>
        );

      case "text":
      default:
        return (
          <div key={col.name} className="space-y-2">
            <Label htmlFor={col.name}>
              {col.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={col.name}
              type="text"
              value={value as string}
              onChange={(e) => handleChange(col.name, e.target.value)}
              className={errors[col.name] ? "border-destructive" : ""}
            />
            {errors[col.name] && (
              <p className="text-sm text-destructive">{errors[col.name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Row</DialogTitle>
          <DialogDescription>
            Make changes to the row. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {columns.map((col) => renderField(col))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
