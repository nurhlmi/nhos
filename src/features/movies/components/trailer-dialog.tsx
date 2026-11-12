"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { youtubeEmbedUrl } from "@/features/movies/youtube";

export type TrailerRequest = { key: string; title: string };

/** In-app trailer player. Closing the dialog unmounts the iframe, which stops playback. */
export function TrailerDialog({ trailer, onOpenChange }: { trailer: TrailerRequest | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!trailer} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden bg-black p-0 sm:max-w-4xl [&>[data-slot=dialog-close]]:z-10 [&>[data-slot=dialog-close]]:bg-black/60 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-black/80">
        {trailer && (
          <>
            <DialogTitle className="sr-only">{trailer.title} trailer</DialogTitle>
            <DialogDescription className="sr-only">YouTube trailer player. Press Escape to close.</DialogDescription>
            <iframe
              src={youtubeEmbedUrl(trailer.key, { autoplay: 1 })}
              title={`${trailer.title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full border-0"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
