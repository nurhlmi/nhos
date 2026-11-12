"use client";

import { APP_NAME } from "@/lib/env";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { segmentLabels } from "@/config/navigation";

function labelFor(segment: string) {
  const decoded = decodeURIComponent(segment);
  if (segmentLabels[decoded]) return segmentLabels[decoded];
  if (/^CVE-\d{4}-\d+$/i.test(decoded)) return decoded.toUpperCase();
  if (/^[0-9a-f-]{36}$/i.test(decoded)) return "Detail";
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="hidden sm:inline-flex">
          {segments.length === 0 ? (
            <BreadcrumbPage>Overview</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/">{APP_NAME}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.length === 0 && <BreadcrumbPage className="sm:hidden">Overview</BreadcrumbPage>}
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={href}>
              <BreadcrumbSeparator className={index === 0 ? "hidden sm:list-item" : undefined} />
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate">{labelFor(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="truncate pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:items-center">{labelFor(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
