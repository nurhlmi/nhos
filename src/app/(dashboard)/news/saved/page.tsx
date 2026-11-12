import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SavedArticles } from "@/features/news/components/saved-articles";

export const metadata: Metadata = { title: "Saved Articles" };

export default function SavedArticlesPage() {
  return (
    <>
      <PageHeader title="Saved Articles" description="Your bookmarks and read-later queue." />
      <SavedArticles />
    </>
  );
}
