import { z } from "zod";

export interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

/**
 * Build a Zod schema dynamically from column metadata.
 * Useful for validating row data against table structure.
 */
export function buildZodSchemaFromMetadata(columns: ColumnDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const col of columns) {
    let fieldSchema: z.ZodTypeAny;

    switch (col.type) {
      case "text":
        fieldSchema = z.string().nullable().optional();
        break;
      case "integer":
        fieldSchema = z
          .union([z.number(), z.string().transform(Number)])
          .nullable()
          .optional();
        break;
      case "boolean":
        fieldSchema = z
          .union([z.boolean(), z.number().transform((n) => n === 1)])
          .nullable()
          .optional();
        break;
      case "timestamp":
        fieldSchema = z
          .union([z.number(), z.date().transform((d) => d.getTime())])
          .nullable()
          .optional();
        break;
      case "json":
        fieldSchema = z.any().nullable().optional();
        break;
      default:
        fieldSchema = z.any().nullable().optional();
    }

    shape[col.name] = fieldSchema;
  }

  return z.object(shape).passthrough();
}
