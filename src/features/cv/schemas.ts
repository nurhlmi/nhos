import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Use a full URL starting with https://");
const optionalDate = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a valid date");
const year = z.number({ error: "Enter a year" }).int().min(1900).max(2200);

/** Newline-separated list in the form, string[] in the database. */
export const linesToArray = (v: string) =>
  v
    .split("\n")
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
export const commaToArray = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const personalInfoSchema = z.object({
  version_name: z.string().trim().min(1, "Name this version").max(60),
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  professional_title: optionalText(120),
  email: z.string().trim().max(120).refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email"),
  phone: optionalText(40),
  location: optionalText(100),
  website: optionalUrl,
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
  summary: optionalText(2000),
});
export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(120),
    position: z.string().trim().min(1, "Position is required").max(120),
    employment_type: z.enum(["full_time", "part_time", "contract", "freelance", "internship", "self_employed"]),
    location: optionalText(100),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required"),
    end_date: optionalDate,
    is_current: z.boolean(),
    description: optionalText(1500),
    responsibilities: optionalText(4000),
    achievements: optionalText(4000),
  })
  .refine((v) => v.is_current || !v.end_date || v.end_date >= v.start_date, {
    message: "End date must be after the start date",
    path: ["end_date"],
  });
export type ExperienceValues = z.infer<typeof experienceSchema>;

export const educationSchema = z
  .object({
    institution: z.string().trim().min(1, "Institution is required").max(150),
    degree: z.string().trim().min(1, "Degree is required").max(120),
    major: optionalText(120),
    start_year: year,
    graduation_year: year.nullable(),
    description: optionalText(1500),
  })
  .refine((v) => v.graduation_year === null || v.graduation_year >= v.start_year, {
    message: "Graduation year must be after the start year",
    path: ["graduation_year"],
  });
export type EducationValues = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(60),
  category: z.string().trim().min(1, "Category is required").max(60),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});
export type SkillValues = z.infer<typeof skillSchema>;

export const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(120),
    description: optionalText(1500),
    technologies: optionalText(500),
    project_url: optionalUrl,
    github_url: optionalUrl,
    start_date: optionalDate,
    end_date: optionalDate,
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "End date must be after the start date",
    path: ["end_date"],
  });
export type ProjectValues = z.infer<typeof projectSchema>;

export const certificationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  issuer: z.string().trim().min(1, "Issuer is required").max(120),
  issue_date: optionalDate,
  credential_url: optionalUrl,
});
export type CertificationValues = z.infer<typeof certificationSchema>;
