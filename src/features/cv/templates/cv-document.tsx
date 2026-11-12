import type { CvData, CvSection } from "@/features/cv/types";
import { EMPLOYMENT_LABELS, SECTION_LABELS } from "@/features/cv/types";
import {
  Bullets,
  contactItems,
  displayUrl,
  experienceRange,
  groupSkills,
  monthYear,
  projectRange,
  visibleSections,
} from "@/features/cv/templates/shared";

/**
 * A4 CV document. Pure render: used by the live preview (client) and the
 * print route (server). Colours are fixed print colours, not theme tokens.
 */
export function CvDocument({ data }: { data: CvData }) {
  switch (data.profile.template) {
    case "ats_friendly":
      return <Ats data={data} />;
    case "developer_portfolio":
      return <Developer data={data} />;
    default:
      return <Minimalist data={data} />;
  }
}

// Section bodies (shared, styled per template via className props)

type Tone = { heading: string; muted: string; accent: string };

function SectionBody({ section, data, tone }: { section: CvSection; data: CvData; tone: Tone }) {
  switch (section) {
    case "summary":
      return <p className="leading-relaxed whitespace-pre-line">{data.profile.summary}</p>;
    case "experience":
      return (
        <div className="space-y-3.5">
          {data.experiences.map((e) => (
            <div key={e.id} className="cv-avoid-break">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">
                  {e.position} <span className={tone.muted}>· {e.company}</span>
                </p>
                <p className={`shrink-0 text-[10.5px] ${tone.muted}`}>{experienceRange(e)}</p>
              </div>
              <p className={`text-[10.5px] ${tone.muted}`}>
                {EMPLOYMENT_LABELS[e.employment_type]}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.description && <p className="mt-1 whitespace-pre-line">{e.description}</p>}
              <Bullets items={e.responsibilities} />
              {e.achievements.length > 0 && (
                <>
                  <p className={`mt-1 text-[10.5px] font-semibold ${tone.accent}`}>Key achievements</p>
                  <Bullets items={e.achievements} />
                </>
              )}
            </div>
          ))}
        </div>
      );
    case "education":
      return (
        <div className="space-y-2.5">
          {data.educations.map((e) => (
            <div key={e.id} className="cv-avoid-break">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{e.institution}</p>
                <p className={`shrink-0 text-[10.5px] ${tone.muted}`}>
                  {e.start_year} – {e.graduation_year ?? "Present"}
                </p>
              </div>
              <p>
                {e.degree}
                {e.major ? `, ${e.major}` : ""}
              </p>
              {e.description && <p className={`mt-0.5 whitespace-pre-line ${tone.muted}`}>{e.description}</p>}
            </div>
          ))}
        </div>
      );
    case "skills":
      return (
        <div className="space-y-1">
          {groupSkills(data).map(([cat, names]) => (
            <p key={cat}>
              <span className="font-semibold">{cat}: </span>
              {names.join(", ")}
            </p>
          ))}
        </div>
      );
    case "projects":
      return (
        <div className="space-y-3">
          {data.projects.map((p) => (
            <div key={p.id} className="cv-avoid-break">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{p.name}</p>
                <p className={`shrink-0 text-[10.5px] ${tone.muted}`}>{projectRange(p)}</p>
              </div>
              {p.description && <p className="mt-0.5 whitespace-pre-line">{p.description}</p>}
              {p.technologies.length > 0 && <p className={`mt-0.5 text-[10.5px] ${tone.muted}`}>{p.technologies.join(" · ")}</p>}
              {(p.project_url || p.github_url) && (
                <p className={`text-[10.5px] ${tone.accent}`}>
                  {[p.project_url, p.github_url].filter(Boolean).map((u) => displayUrl(u!)).join("  ·  ")}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    case "certifications":
      return (
        <div className="space-y-1.5">
          {data.certifications.map((c) => (
            <div key={c.id} className="flex items-baseline justify-between gap-3">
              <p>
                <span className="font-semibold">{c.name}</span> <span className={tone.muted}>· {c.issuer}</span>
                {c.credential_url && <span className={`block text-[10.5px] ${tone.accent}`}>{displayUrl(c.credential_url)}</span>}
              </p>
              <p className={`shrink-0 text-[10.5px] ${tone.muted}`}>{monthYear(c.issue_date)}</p>
            </div>
          ))}
        </div>
      );
  }
}

function Photo({ data, className }: { data: CvData; className: string }) {
  if (!data.photoUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, rendered for print
  return <img src={data.photoUrl} alt="" className={className} />;
}

// 1. Modern Minimalist

function Minimalist({ data }: { data: CvData }) {
  const p = data.profile;
  const tone: Tone = { heading: "text-[#1d4ed8]", muted: "text-[#6b7280]", accent: "text-[#1d4ed8]" };
  return (
    <div className="cv-page px-[18mm] py-[16mm] text-[11px] leading-snug">
      <header className="flex items-center gap-5 border-b border-[#e5e7eb] pb-5">
        <Photo data={data} className="size-20 rounded-full object-cover" />
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-[#111827]">{p.full_name || "Your Name"}</h1>
          {p.professional_title && <p className="mt-0.5 text-[13px] text-[#1d4ed8]">{p.professional_title}</p>}
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-[#4b5563]">
            {contactItems(data).map((c) => <span key={c.label}>{c.label}</span>)}
          </p>
        </div>
      </header>
      <div className="mt-5 space-y-5">
        {visibleSections(data).map((s) => (
          <section key={s}>
            <h2 className={`mb-2 text-[10.5px] font-semibold tracking-[0.12em] uppercase ${tone.heading}`}>{SECTION_LABELS[s]}</h2>
            <SectionBody section={s} data={data} tone={tone} />
          </section>
        ))}
      </div>
    </div>
  );
}

// 2. ATS Friendly
// Built for applicant tracking systems: one column in reading order, no photo,
// icons, tables, sidebars or text in graphics, standard section headings,
// plain-text contact details and dates, simple bullets, black on white.

const ATS_HEADINGS: Record<CvSection, string> = {
  summary: "Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};

function AtsSection({ section, data }: { section: CvSection; data: CvData }) {
  switch (section) {
    case "summary":
      return <p className="whitespace-pre-line">{data.profile.summary}</p>;
    case "experience":
      return (
        <div className="space-y-3">
          {data.experiences.map((e) => {
            const bullets = [...e.responsibilities, ...e.achievements];
            return (
              <div key={e.id} className="cv-avoid-break">
                <p className="font-bold">{e.position}</p>
                <p>
                  {e.company}
                  {e.location ? `, ${e.location}` : ""} | {EMPLOYMENT_LABELS[e.employment_type]} | {experienceRange(e)}
                </p>
                {e.description && <p className="mt-0.5 whitespace-pre-line">{e.description}</p>}
                {bullets.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      );
    case "education":
      return (
        <div className="space-y-2">
          {data.educations.map((e) => (
            <div key={e.id} className="cv-avoid-break">
              <p className="font-bold">
                {e.degree}
                {e.major ? `, ${e.major}` : ""}
              </p>
              <p>
                {e.institution} | {e.start_year} – {e.graduation_year ?? "Present"}
              </p>
              {e.description && <p className="mt-0.5 whitespace-pre-line">{e.description}</p>}
            </div>
          ))}
        </div>
      );
    case "skills":
      return (
        <div className="space-y-0.5">
          {groupSkills(data).map(([cat, names]) => (
            <p key={cat}>
              <span className="font-bold">{cat}:</span> {names.join(", ")}
            </p>
          ))}
        </div>
      );
    case "projects":
      return (
        <div className="space-y-2.5">
          {data.projects.map((pr) => (
            <div key={pr.id} className="cv-avoid-break">
              <p>
                <span className="font-bold">{pr.name}</span>
                {projectRange(pr) ? ` | ${projectRange(pr)}` : ""}
              </p>
              {pr.technologies.length > 0 && <p>Technologies: {pr.technologies.join(", ")}</p>}
              {pr.description && <p className="whitespace-pre-line">{pr.description}</p>}
              {pr.project_url && <p>{displayUrl(pr.project_url)}</p>}
              {pr.github_url && <p>{displayUrl(pr.github_url)}</p>}
            </div>
          ))}
        </div>
      );
    case "certifications":
      return (
        <div className="space-y-1">
          {data.certifications.map((c) => (
            <div key={c.id}>
              <p>
                <span className="font-bold">{c.name}</span>, {c.issuer}
                {c.issue_date ? ` | ${monthYear(c.issue_date)}` : ""}
              </p>
              {c.credential_url && <p>{displayUrl(c.credential_url)}</p>}
            </div>
          ))}
        </div>
      );
  }
}

function Ats({ data }: { data: CvData }) {
  const p = data.profile;
  return (
    <div
      className="cv-page px-[18mm] py-[15mm] text-[10.5pt] leading-[1.35] text-black"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <header>
        <h1 className="text-[18pt] leading-tight font-bold">{p.full_name || "Your Name"}</h1>
        {p.professional_title && <p className="mt-0.5 text-[11.5pt]">{p.professional_title}</p>}
        <p className="mt-1.5">{contactItems(data).map((c) => c.label).join(" | ")}</p>
      </header>
      {visibleSections(data).map((s) => (
        <section key={s} className="mt-4">
          <h2 className="mb-1.5 border-b border-black pb-0.5 text-[11pt] font-bold uppercase">{ATS_HEADINGS[s]}</h2>
          <AtsSection section={s} data={data} />
        </section>
      ))}
    </div>
  );
}

// 3. Developer Portfolio

const DEV_PRIORITY: CvSection[] = ["summary", "skills", "projects", "experience", "education", "certifications"];

function Developer({ data }: { data: CvData }) {
  const p = data.profile;
  const userOrder = visibleSections(data);
  // Honour user ordering, but this template is meant to lead with stack and projects
  // only when the user has not customised the order.
  const isDefaultOrder = data.profile.section_order.join() === "summary,experience,education,skills,projects,certifications";
  const sections = isDefaultOrder ? DEV_PRIORITY.filter((s) => userOrder.includes(s)) : userOrder;
  const tone: Tone = { heading: "text-[#047857]", muted: "text-[#6b7280]", accent: "text-[#047857]" };

  return (
    <div className="cv-page px-[16mm] py-[14mm] text-[11px] leading-snug">
      <header className="flex items-start justify-between gap-6 rounded-lg bg-[#0b1220] px-6 py-5 text-[#e5e7eb]">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-[#34d399]">~/cv $ whoami</p>
          <h1 className="mt-1 text-[24px] leading-tight font-semibold text-white">{p.full_name || "Your Name"}</h1>
          {p.professional_title && <p className="mt-0.5 font-mono text-[11.5px] text-[#93c5fd]">{p.professional_title}</p>}
          <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9.5px] text-[#9ca3af]">
            {contactItems(data).map((c) => <span key={c.label}>{c.label}</span>)}
          </p>
        </div>
        <Photo data={data} className="size-20 shrink-0 rounded-md object-cover ring-2 ring-[#34d399]/60" />
      </header>
      <div className="mt-5 space-y-5">
        {sections.map((s) => (
          <section key={s}>
            <h2 className={`mb-2 font-mono text-[11px] font-semibold ${tone.heading}`}>
              <span className="text-[#9ca3af]">## </span>
              {SECTION_LABELS[s]}
            </h2>
            {s === "skills" ? (
              <div className="space-y-1.5">
                {groupSkills(data).map(([cat, names]) => (
                  <div key={cat} className="flex gap-2">
                    <span className="w-28 shrink-0 font-mono text-[10px] text-[#6b7280]">{cat}</span>
                    <div className="flex flex-wrap gap-1">
                      {names.map((n) => (
                        <span key={n} className="rounded border border-[#d1d5db] bg-[#f9fafb] px-1.5 py-px font-mono text-[9.5px]">{n}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SectionBody section={s} data={data} tone={tone} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
