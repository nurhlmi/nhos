import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  professional_title: z.string().trim().max(120),
  timezone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
