import type {
  CvCertificationRow,
  CvEducationRow,
  CvExperienceRow,
  CvProfileRow,
  CvProjectRow,
  CvSkillRow,
  CvTemplate,
} from "@/types/database";

export const CV_SECTIONS = ["summary", "experience", "education", "skills", "projects", "certifications"] as const;
export type CvSection = (typeof CV_SECTIONS)[number];

export const SECTION_LABELS: Record<CvSection, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications & Awards",
};

export const TEMPLATES: { value: CvTemplate; label: string; description: string }[] = [
  { value: "modern_minimalist", label: "Modern Minimalist", description: "Single column, generous whitespace, blue accents" },
  { value: "ats_friendly", label: "ATS Friendly", description: "One column, standard headings, no photo or graphics, reads cleanly in applicant tracking systems" },
  { value: "developer_portfolio", label: "Developer Portfolio", description: "Monospace accents, projects and stack first" },
];

export type CvData = {
  profile: CvProfileRow;
  photoUrl: string | null;
  experiences: CvExperienceRow[];
  educations: CvEducationRow[];
  skills: CvSkillRow[];
  projects: CvProjectRow[];
  certifications: CvCertificationRow[];
};

export const EMPLOYMENT_LABELS: Record<CvExperienceRow["employment_type"], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  self_employed: "Self-employed",
};

export const SKILL_LEVEL_LABELS: Record<CvSkillRow["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const SKILL_LEVEL_VALUE: Record<CvSkillRow["level"], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/** Normalises the stored section order (adds missing sections, drops unknown ones). */
export function orderedSections(profile: Pick<CvProfileRow, "section_order">): CvSection[] {
  const known = profile.section_order.filter((s): s is CvSection => (CV_SECTIONS as readonly string[]).includes(s));
  return [...new Set([...known, ...CV_SECTIONS])];
}
