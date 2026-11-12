import { format, parseISO } from "date-fns";
import type { CvExperienceRow, CvProjectRow } from "@/types/database";
import type { CvData, CvSection } from "@/features/cv/types";
import { orderedSections } from "@/features/cv/types";

export function monthYear(date: string | null) {
  if (!date) return "";
  try {
    return format(parseISO(date), "MMM yyyy");
  } catch {
    return date;
  }
}

export function experienceRange(e: CvExperienceRow) {
  return `${monthYear(e.start_date)} – ${e.is_current ? "Present" : monthYear(e.end_date) || "Present"}`;
}

export function projectRange(p: CvProjectRow) {
  if (!p.start_date && !p.end_date) return "";
  return `${monthYear(p.start_date)}${p.end_date ? ` – ${monthYear(p.end_date)}` : p.start_date ? " – Present" : ""}`;
}

export function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Sections to render, in the user's order, skipping hidden and empty ones. */
export function visibleSections(data: CvData): CvSection[] {
  const hidden = new Set(data.profile.hidden_sections);
  return orderedSections(data.profile).filter((s) => {
    if (hidden.has(s)) return false;
    switch (s) {
      case "summary":
        return Boolean(data.profile.summary?.trim());
      case "experience":
        return data.experiences.length > 0;
      case "education":
        return data.educations.length > 0;
      case "skills":
        return data.skills.length > 0;
      case "projects":
        return data.projects.length > 0;
      case "certifications":
        return data.certifications.length > 0;
    }
  });
}

export function groupSkills(data: CvData) {
  const groups = new Map<string, string[]>();
  for (const s of data.skills) {
    const list = groups.get(s.category) ?? [];
    list.push(s.name);
    groups.set(s.category, list);
  }
  return [...groups.entries()];
}

export function contactItems(data: CvData) {
  const p = data.profile;
  return [
    p.email && { label: p.email, href: `mailto:${p.email}` },
    p.phone && { label: p.phone, href: `tel:${p.phone.replace(/\s/g, "")}` },
    p.location && { label: p.location },
    p.website && { label: displayUrl(p.website), href: p.website },
    p.linkedin_url && { label: displayUrl(p.linkedin_url), href: p.linkedin_url },
    p.github_url && { label: displayUrl(p.github_url), href: p.github_url },
    p.portfolio_url && { label: displayUrl(p.portfolio_url), href: p.portfolio_url },
  ].filter((x): x is { label: string; href?: string } => Boolean(x));
}

export function Bullets({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={className ?? "mt-1 list-disc space-y-0.5 pl-4"}>
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}
