"use client";

import { useEffect, useRef, useState } from "react";
import { CvDocument } from "@/features/cv/templates/cv-document";
import type { CvData } from "@/features/cv/types";

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const A4_HEIGHT_PX = 1123;

/** Scales the real A4 document to fit the available width. */
export function CvPreview({ data }: { data: CvData }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const wrap = wrapRef.current;
    const doc = docRef.current;
    if (!wrap || !doc) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, wrap.clientWidth / A4_WIDTH_PX));
      setHeight(Math.max(A4_HEIGHT_PX, doc.scrollHeight));
    });
    ro.observe(wrap);
    ro.observe(doc);
    return () => ro.disconnect();
  }, []);

  const pages = Math.ceil(height / A4_HEIGHT_PX);

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative overflow-hidden rounded-md shadow-lg ring-1 ring-black/10" style={{ height: height * scale }}>
        <div ref={docRef} className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})`, width: A4_WIDTH_PX }}>
          <CvDocument data={data} />
        </div>
        {/* Page-break guides */}
        {Array.from({ length: pages - 1 }).map((_, i) => (
          <div
            key={i}
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-red-400/70"
            style={{ top: (i + 1) * A4_HEIGHT_PX * scale }}
          >
            <span className="absolute right-1 -top-4 rounded bg-red-500/80 px-1 text-[9px] text-white">page {i + 2}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        A4 · {pages} page{pages > 1 ? "s" : ""} · live preview
      </p>
    </div>
  );
}
