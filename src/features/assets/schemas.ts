import { z } from "zod";

export const assetFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  category: z.enum(["electronics", "vehicle", "property", "furniture", "software", "other"]),
  description: z.string().trim().max(1000).optional(),
  purchase_date: z.iso.date("Pick a valid date"),
  purchase_price: z
    .number({ error: "Enter an amount" })
    .finite()
    .positive("Purchase price must be greater than 0")
    .max(1e15, "Amount is too large"),
  status: z.enum(["active", "inactive", "disposed", "sold", "lost"]),
  notes: z.string().trim().max(2000).optional(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;
