import { z } from "zod";
import { differenceInCalendarDays, parseISO } from "date-fns";

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

export const cveSearchSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(5).max(50).default(20),
    q: optionalText,
    vendor: optionalText,
    product: optionalText,
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    minScore: z.coerce.number().min(0).max(10).optional(),
  })
  .refine((v) => !v.product || v.vendor, { message: "Product filter needs a vendor", path: ["product"] })
  .refine(
    (v) => {
      if (!v.from) return true;
      const to = v.to ? parseISO(v.to) : new Date();
      const days = differenceInCalendarDays(to, parseISO(v.from));
      return days >= 0 && days <= 120;
    },
    { message: "NVD allows a date range of at most 120 days", path: ["from"] },
  );

export const cveIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^CVE-\d{4}-\d{4,}$/, "Invalid CVE ID");

export const kevQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
  q: optionalText,
  ransomware: z.enum(["Known", "Unknown"]).optional(),
});

export const cveNoteSchema = z.object({
  content: z.string().trim().min(1, "Note cannot be empty").max(5000),
});
export type CveNoteValues = z.infer<typeof cveNoteSchema>;
