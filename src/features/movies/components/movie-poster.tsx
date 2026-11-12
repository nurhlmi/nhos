"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

/** TMDB poster or backdrop, with a neutral placeholder when TMDB has no image or it fails to load. */
export function MovieImage({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 text-muted-foreground", className)} aria-hidden>
        <Film className="size-6" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by TMDB's image CDN at the size we ask for
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={cn("bg-surface-2 object-cover", className)} />
  );
}
