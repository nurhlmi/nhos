import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MoviesView } from "@/features/movies/components/movies-view";

export const metadata: Metadata = { title: "Movies" };

export default function MoviesPage() {
  return (
    <>
      <PageHeader title="Movies" description="Films now showing and coming soon in Indonesian cinemas, from TMDB." />
      <MoviesView />
    </>
  );
}
