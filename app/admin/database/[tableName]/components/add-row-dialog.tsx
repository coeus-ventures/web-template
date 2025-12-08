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

interface AddRowDialogProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnMetadata[];
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  initialValues?: Record<string, unknown> | null;
  isLoading?: boolean;
}

export function AddRowDialog({
  open,
  onClose,
  columns,
  onSubmit,
  initialValues,
  isLoading,
}: AddRowDialogProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or initialValues change
  React.useEffect(() => {
    if (open) {
      // Initialize with defaults or initialValues
      const defaults: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.isPrimaryKey || col.name === "id") {
          continue; // Skip auto-generated fields
        }
        if (initialValues && initialValues[col.name] !== undefined) {
          defaults[col.name] = initialValues[col.name];
        } else if (col.type === "boolean") {
          defaults[col.name] = false;
        } else {
          defaults[col.name] = "";
        }
      }
      setFormData(defaults);
      setErrors({});
    }
  }, [open, columns, initialValues]);

  const handleChange = (column: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [column]: value }));
    setErrors((prev) => ({ ...prev, [column]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    for (const col of columns) {
      if (col.isPrimaryKey || col.name === "id") continue;
      if (
        !col.isNullable &&
        !col.name.includes("created_at") &&
        !col.name.includes("updated_at")
      ) {
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

    // Prepare data for submission
    const submitData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== "") {
        submitData[key] = value;
      }
    }

    await onSubmit(submitData);
  };

  const renderField = (col: ColumnMetadata) => {
    // Skip auto-generated fields
    if (col.isPrimaryKey || col.name === "id") {
      return null;
    }
    if (col.name === "created_at" || col.name === "updated_at") {
      return null;
    }

    const isRequired =
      !col.isNullable &&
      !col.name.includes("created_at") &&
      !col.name.includes("updated_at");

    const value = formData[col.name];

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
          <DialogTitle>
            {initialValues ? "Duplicate Row" : "Add New Row"}
          </DialogTitle>
          <DialogDescription>
            {initialValues
              ? "Create a copy of the selected row. Modify fields as needed."
              : "Fill in the fields below to create a new row."}
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
