"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isBefore, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Pager } from "@/components/shared/pager";
import { SourceBadge } from "@/components/shared/source-badge";
import { useKev } from "@/features/cve/hooks";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

const ANY = "any";

export function KevList() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [ransomware, setRansomware] = useState(ANY);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const kev = useKev({ page, pageSize: 25, q: debounced || undefined, ransomware: ransomware === ANY ? undefined : ransomware });
  const result = kev.data?.data;
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search CVE, vendor, product" className="pl-8" aria-label="Search KEV" />
        </div>
        <Select
          value={ransomware}
          onValueChange={(v) => {
            setRansomware(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52" aria-label="Ransomware use"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any ransomware use</SelectItem>
            <SelectItem value="Known">Known ransomware use</SelectItem>
            <SelectItem value="Unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {kev.isError ? (
        <ErrorState error={kev.error} onRetry={() => void kev.refetch()} />
      ) : !result ? (
        <Skeleton className="h-96 w-full" />
      ) : result.items.length === 0 ? (
        <EmptyState title="No KEV entries match" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE</TableHead>
                <TableHead>Vulnerability</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="hidden lg:table-cell">Ransomware</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((e) => {
                const overdue = isBefore(parseISO(e.dueDate), now);
                return (
                  <TableRow key={e.cveID}>
                    <TableCell>
                      <Link href={`/cve/${e.cveID}`} className="font-mono text-xs font-medium hover:text-primary">
                        {e.cveID}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate font-medium">{e.vulnerabilityName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.vendorProject} · {e.product}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatDate(e.dateAdded)}</TableCell>
                    <TableCell className={cn("text-xs", overdue ? "text-muted-foreground" : "font-medium text-warning")}>
                      {formatDate(e.dueDate)}
                      {!overdue && <span className="block text-[10px] font-normal">upcoming</span>}
                    </TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">
                      {e.knownRansomwareCampaignUse === "Known" ? (
                        <span className="font-medium text-destructive">Known</span>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {result && (
        <Pager page={result.page} totalPages={result.totalPages} total={result.total} label={`of ${result.catalogTotal} KEV entries`} onPageChange={setPage} />
      )}
      <SourceBadge meta={kev.data?.meta} />
    </div>
  );
}
