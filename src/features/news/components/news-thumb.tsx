"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Feed-provided image, or a neutral placeholder with the source initial. */
export function NewsThumb({ src, source, className }: { src: string | null; source: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 text-lg font-semibold text-muted-foreground", className)} aria-hidden>
        {source.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party feed images, not optimised through our server
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("bg-surface-2 object-cover", className)}
    />
  );
}
