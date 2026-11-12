"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CvProfileRow, Database } from "@/types/database";
import { CV_SECTIONS } from "@/features/cv/types";

const db = () => getSupabaseBrowserClient();
type Tables = Database["public"]["Tables"];

export type CvItemTable = "cv_experiences" | "cv_educations" | "cv_skills" | "cv_projects" | "cv_certifications";

const ORDER: Record<CvItemTable, { column: string; ascending: boolean }[]> = {
  cv_experiences: [{ column: "sort_order", ascending: true }, { column: "start_date", ascending: false }],
  cv_educations: [{ column: "sort_order", ascending: true }, { column: "start_year", ascending: false }],
  cv_skills: [{ column: "sort_order", ascending: true }, { column: "created_at", ascending: true }],
  cv_projects: [{ column: "sort_order", ascending: true }, { column: "start_date", ascending: false }],
  cv_certifications: [{ column: "sort_order", ascending: true }, { column: "issue_date", ascending: false }],
};

/**
 * All CV item tables share id / user_id / sort_order. Supabase's generics cannot
 * resolve a union of table names, so queries go through one concrete table type
 * and results are cast back to the caller's row type.
 */
const itemTable = (name: CvItemTable) => db().from(name as "cv_skills");
type AnyItemInsert = Tables["cv_skills"]["Insert"];

export const cvKeys = {
  profiles: ["cv", "profiles"] as const,
  items: (table: CvItemTable) => ["cv", "items", table] as const,
  photo: (path: string) => ["cv", "photo", path] as const,
};

// Generic CRUD for CV sections (experience, education, ...)

export function useCvItems<T extends CvItemTable>(table: T) {
  return useQuery({
    queryKey: cvKeys.items(table),
    queryFn: async (): Promise<Tables[T]["Row"][]> => {
      let query = itemTable(table).select("*");
      for (const o of ORDER[table]) query = query.order(o.column, { ascending: o.ascending, nullsFirst: false });
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as unknown as Tables[T]["Row"][];
    },
  });
}

export function useCvItemMutations<T extends CvItemTable>(table: T, label: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: cvKeys.items(table) });

  const save = useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Tables[T]["Update"] }) => {
      const res = id
        ? await itemTable(table).update(values as AnyItemInsert).eq("id", id)
        : await itemTable(table).insert(values as AnyItemInsert);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: (_d, { id }) => {
      toast.success(`${label} ${id ? "updated" : "added"}`);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await itemTable(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`${label} deleted`);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  /** Persists a new order by rewriting sort_order for every row. */
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id, index) => itemTable(table).update({ sort_order: index }).eq("id", id)),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
    },
    onSuccess: () => void invalidate(),
    onError: (e) => toast.error(e.message),
  });

  return { save, remove, reorder };
}

// CV versions (cv_profiles)

export function useCvProfiles() {
  return useQuery({
    queryKey: cvKeys.profiles,
    queryFn: async (): Promise<CvProfileRow[]> => {
      const { data, error } = await db().from("cv_profiles").select("*").order("created_at");
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useCvProfileMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: cvKeys.profiles });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Tables["cv_profiles"]["Update"] }) => {
      const { data, error } = await db().from("cv_profiles").update(values).eq("id", id).select("id");
      if (error) throw new Error(`CV could not be saved: ${error.message}`);
      if (!data.length) throw new Error("CV could not be saved: this CV version no longer exists. Reload the page.");
    },
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: cvKeys.profiles });
      const prev = qc.getQueryData<CvProfileRow[]>(cvKeys.profiles);
      qc.setQueryData<CvProfileRow[]>(cvKeys.profiles, (rows) => rows?.map((r) => (r.id === id ? { ...r, ...values } : r)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(cvKeys.profiles, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => void invalidate(),
  });

  const create = useMutation({
    mutationFn: async (source?: CvProfileRow): Promise<CvProfileRow> => {
      const base: Tables["cv_profiles"]["Insert"] = source
        ? {
            template: source.template,
            full_name: source.full_name,
            professional_title: source.professional_title,
            email: source.email,
            phone: source.phone,
            location: source.location,
            website: source.website,
            linkedin_url: source.linkedin_url,
            github_url: source.github_url,
            portfolio_url: source.portfolio_url,
            summary: source.summary,
            section_order: source.section_order,
            hidden_sections: source.hidden_sections,
            // The photo file belongs to the source version; the copy starts without one.
          }
        : { full_name: "", section_order: [...CV_SECTIONS] };
      const { data, error } = await db()
        .from("cv_profiles")
        .insert({ ...base, version_name: source ? `${source.version_name} (copy)` : "New CV", is_default: false })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (row) => {
      toast.success(`Created "${row.version_name}"`);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: CvProfileRow) => {
      const { error } = await db().from("cv_profiles").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
      if (row.photo_path) await db().storage.from("cv-photos").remove([row.photo_path]);
    },
    onSuccess: () => {
      toast.success("CV version deleted");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const setDefault = useMutation({
    mutationFn: async (row: CvProfileRow) => {
      // Clear the previous default first (partial unique index allows one default).
      const clear = await db().from("cv_profiles").update({ is_default: false }).eq("is_default", true);
      if (clear.error) throw new Error(clear.error.message);
      const { error } = await db().from("cv_profiles").update({ is_default: true }).eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Default CV updated");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ row, file, userId }: { row: CvProfileRow; file: File; userId: string }) => {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPG or WebP image.");
      if (file.size > 2 * 1024 * 1024) throw new Error("Photo must be 2 MB or smaller.");
      const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
      const path = `${userId}/${row.id}-${Date.now()}.${ext}`;
      const up = await db().storage.from("cv-photos").upload(path, file, { contentType: file.type });
      if (up.error) throw new Error(up.error.message);
      const { error } = await db().from("cv_profiles").update({ photo_path: path }).eq("id", row.id);
      if (error) throw new Error(error.message);
      if (row.photo_path) await db().storage.from("cv-photos").remove([row.photo_path]);
    },
    onSuccess: () => {
      toast.success("Photo updated");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const removePhoto = useMutation({
    mutationFn: async (row: CvProfileRow) => {
      const { error } = await db().from("cv_profiles").update({ photo_path: null }).eq("id", row.id);
      if (error) throw new Error(error.message);
      if (row.photo_path) await db().storage.from("cv-photos").remove([row.photo_path]);
    },
    onSuccess: () => {
      toast.success("Photo removed");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return { update, create, remove, setDefault, uploadPhoto, removePhoto };
}

export function useCvPhotoUrl(path: string | null) {
  return useQuery({
    queryKey: cvKeys.photo(path ?? ""),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await db().storage.from("cv-photos").createSignedUrl(path!, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
  });
}
