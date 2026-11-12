// Hand-maintained to match supabase/migrations. Regenerate with
// `pnpm db:types` once the project is linked to a Supabase instance.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string; updated_at: string };

type TableDef<Row, Required extends keyof Row> = {
  Row: Row;
  // user_id defaults to auth.uid() in the database, so it is never required.
  Insert: Partial<Row> & Pick<Row, Exclude<Required, "user_id">>;
  Update: Partial<Row>;
  Relationships: [];
};

export type AssetCategory =
  | "electronics"
  | "vehicle"
  | "property"
  | "furniture"
  | "software"
  | "other";
export type AssetStatus = "active" | "inactive" | "disposed" | "sold" | "lost";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance"
  | "internship"
  | "self_employed";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type CvTemplate =
  | "modern_minimalist"
  | "ats_friendly"
  | "developer_portfolio";

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string | null;
  professional_title: string | null;
  avatar_url: string | null;
  timezone: string;
};

export type DashboardPreferencesRow = Timestamps & {
  id: string;
  user_id: string;
  widget_order: string[];
  hidden_widgets: string[];
  quick_links: string[];
  default_currency_base: string;
};

export type CurrencyWatchlistRow = Timestamps & {
  id: string;
  user_id: string;
  base_currency: string;
  quote_currency: string;
  position: number;
};

export type AssetRow = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  category: AssetCategory;
  description: string | null;
  purchase_date: string;
  purchase_price: number;
  status: AssetStatus;
  notes: string | null;
  image_path: string | null;
};

export type CveBookmarkRow = Timestamps & {
  id: string;
  user_id: string;
  cve_id: string;
  description: string | null;
  severity: string | null;
  cvss_score: number | null;
  published_at: string | null;
  is_reviewed: boolean;
  reviewed_at: string | null;
};

export type CveNoteRow = Timestamps & {
  id: string;
  user_id: string;
  bookmark_id: string;
  content: string;
};

export type NewsBookmarkRow = Timestamps & {
  id: string;
  user_id: string;
  article_url: string;
  title: string;
  description: string | null;
  source: string;
  category: string;
  image_url: string | null;
  published_at: string | null;
  is_read: boolean;
  read_at: string | null;
};

export type CvProfileRow = Timestamps & {
  id: string;
  user_id: string;
  version_name: string;
  template: CvTemplate;
  is_default: boolean;
  full_name: string;
  professional_title: string | null;
  photo_path: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  summary: string | null;
  section_order: string[];
  hidden_sections: string[];
};

export type CvExperienceRow = Timestamps & {
  id: string;
  user_id: string;
  company: string;
  position: string;
  employment_type: EmploymentType;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  responsibilities: string[];
  achievements: string[];
  sort_order: number;
};

export type CvEducationRow = Timestamps & {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  major: string | null;
  start_year: number;
  graduation_year: number | null;
  description: string | null;
  sort_order: number;
};

export type CvSkillRow = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  category: string;
  level: SkillLevel;
  sort_order: number;
};

export type CvProjectRow = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  technologies: string[];
  project_url: string | null;
  github_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
};

export type CvCertificationRow = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  credential_url: string | null;
  sort_order: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, "id">;
      dashboard_preferences: TableDef<DashboardPreferencesRow, "user_id">;
      currency_watchlists: TableDef<
        CurrencyWatchlistRow,
        "user_id" | "base_currency" | "quote_currency"
      >;
      assets: TableDef<
        AssetRow,
        | "user_id"
        | "name"
        | "purchase_date"
        | "purchase_price"
      >;
      cve_bookmarks: TableDef<CveBookmarkRow, "user_id" | "cve_id">;
      cve_notes: TableDef<CveNoteRow, "user_id" | "bookmark_id" | "content">;
      news_bookmarks: TableDef<
        NewsBookmarkRow,
        "user_id" | "article_url" | "title" | "source" | "category"
      >;
      cv_profiles: TableDef<CvProfileRow, "user_id">;
      cv_experiences: TableDef<
        CvExperienceRow,
        "user_id" | "company" | "position" | "start_date"
      >;
      cv_educations: TableDef<
        CvEducationRow,
        "user_id" | "institution" | "degree" | "start_year"
      >;
      cv_skills: TableDef<CvSkillRow, "user_id" | "name">;
      cv_projects: TableDef<CvProjectRow, "user_id" | "name">;
      cv_certifications: TableDef<
        CvCertificationRow,
        "user_id" | "name" | "issuer"
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      asset_category: AssetCategory;
      asset_status: AssetStatus;
      employment_type: EmploymentType;
      skill_level: SkillLevel;
      cv_template: CvTemplate;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
