import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { NewsFeed } from "@/features/news/components/news-feed";

export const metadata: Metadata = { title: "Technology News" };

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="Technology News"
        description="Headlines from publisher RSS feeds, with attribution and links to the original articles."
        actions={
          <Button asChild variant="outline">
            <Link href="/news/saved"><Bookmark /> Saved articles</Link>
          </Button>
        }
      />
      <NewsFeed />
    </>
  );
}
