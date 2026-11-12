"use client";

import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintToolbar({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    // Wait for fonts and the photo before opening the print dialog.
    const id = setTimeout(() => {
      void document.fonts.ready.then(() => window.print());
    }, 400);
    return () => clearTimeout(id);
  }, [autoPrint]);

  return (
    <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-between gap-3 rounded-lg bg-white px-4 py-2.5 text-sm text-neutral-700 shadow">
      <p>
        To export a PDF, choose <span className="font-medium text-neutral-900">Save as PDF</span> as the destination. Set margins to
        “None” and enable background graphics.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={() => window.print()}><Printer /> Print / PDF</Button>
        <Button size="sm" variant="ghost" className="text-neutral-700 hover:bg-neutral-100" onClick={() => window.close()} aria-label="Close">
          <X />
        </Button>
      </div>
    </div>
  );
}
