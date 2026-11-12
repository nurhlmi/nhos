"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getYear, parseISO } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  ImageIcon,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/states";
import { Pager } from "@/components/shared/pager";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";
import type { AssetRow } from "@/types/database";
import { ASSET_CATEGORIES, ASSET_STATUSES, categoryLabel } from "@/features/assets/constants";
import { useAssetImage, useDeleteAsset } from "@/features/assets/hooks";
import { AssetStatusBadge } from "@/features/assets/components/asset-badges";

const PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const ALL = "all";

type View = "list" | "grid";

type SortKey = "purchased" | "cost";
type SortDir = "asc" | "desc";
type Sort = { key: SortKey; dir: SortDir } | null;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "purchased:desc", label: "Purchased, newest first" },
  { value: "purchased:asc", label: "Purchased, oldest first" },
  { value: "cost:desc", label: "Cost, highest first" },
  { value: "cost:asc", label: "Cost, lowest first" },
  { value: "added", label: "Recently added" },
];

const DEFAULT_SORT: { key: SortKey; dir: SortDir } = { key: "purchased", dir: "desc" };

/** No sort param means the default; "Recently added" (null) is stored as ?sort=added. */
function parseSort(params: URLSearchParams): Sort {
  const key = params.get("sort");
  if (key === "added") return null;
  if (key !== "purchased" && key !== "cost") return DEFAULT_SORT;
  return { key, dir: params.get("order") === "asc" ? "asc" : "desc" };
}

function parseView(params: URLSearchParams): View {
  return params.get("view") === "list" ? "list" : "grid";
}

function parsePageSize(params: URLSearchParams): number {
  const n = Number(params.get("limit"));
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/**
 * Sort, view and page size live in the URL (?sort=cost&order=asc&view=list&limit=50)
 * so they survive reloads and shared links. A null value removes the key.
 */
function writeParams(next: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(next)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

function sortAssets(assets: AssetRow[], sort: Sort) {
  if (!sort) return assets;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...assets].sort((a, b) => {
    const diff =
      sort.key === "cost"
        ? Number(a.purchase_price) - Number(b.purchase_price)
        : a.purchase_date.localeCompare(b.purchase_date);
    return diff * sign || b.created_at.localeCompare(a.created_at);
  });
}

export function AssetList({ assets }: { assets: AssetRow[] }) {
  const router = useRouter();
  const del = useDeleteAsset();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AssetRow | null>(null);
  const searchParams = useSearchParams();
  const sort = useMemo(() => parseSort(searchParams), [searchParams]);
  const view = parseView(searchParams);
  const pageSize = parsePageSize(searchParams);

  const applySort = (next: Sort) => {
    const isDefault = next?.key === DEFAULT_SORT.key && next.dir === DEFAULT_SORT.dir;
    writeParams(
      isDefault
        ? { sort: null, order: null }
        : next
          ? { sort: next.key, order: next.dir }
          : { sort: "added", order: null },
    );
    setPage(1);
  };
  const applyView = (next: View) => writeParams({ view: next === "grid" ? null : next });
  const applyPageSize = (next: number) => {
    writeParams({ limit: next === DEFAULT_PAGE_SIZE ? null : String(next) });
    setPage(1);
  };
  // Header click: first click picks the direction people usually want (newest, highest), second flips it.
  const toggleSort = (key: SortKey) =>
    applySort(sort?.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const years = useMemo(
    () => [...new Set(assets.map((a) => getYear(parseISO(a.purchase_date))))].sort((a, b) => b - a),
    [assets],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return assets.filter(
      (a) =>
        (category === ALL || a.category === category) &&
        (status === ALL || a.status === status) &&
        (year === ALL || String(getYear(parseISO(a.purchase_date))) === year) &&
        (!term || a.name.toLowerCase().includes(term) || (a.description ?? "").toLowerCase().includes(term)),
    );
  }, [assets, q, category, status, year]);
  const ordered = useMemo(() => sortAssets(filtered, sort), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = ordered.slice((current - 1) * pageSize, current * pageSize);
  const filtersActive = q || category !== ALL || status !== ALL || year !== ALL;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Search name or description"
            className="pl-8"
            aria-label="Search assets"
          />
        </div>
        <FilterSelect value={category} onChange={resetPage(setCategory)} label="Category" options={ASSET_CATEGORIES} />
        <FilterSelect value={status} onChange={resetPage(setStatus)} label="Status" options={ASSET_STATUSES} />
        <FilterSelect
          value={year}
          onChange={resetPage(setYear)}
          label="Purchase year"
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <Select
          value={sort ? `${sort.key}:${sort.dir}` : "added"}
          onValueChange={(v) => {
            const [key, dir] = v.split(":") as [SortKey | "added", SortDir];
            applySort(key === "added" ? null : { key, dir });
          }}
        >
          <SelectTrigger className="w-auto min-w-32" aria-label="Sort assets">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setCategory(ALL);
              setStatus(ALL);
              setYear(ALL);
              setPage(1);
            }}
          >
            Reset
          </Button>
        )}
        <div className="ml-auto flex rounded-md border p-0.5" role="group" aria-label="View">
          <ViewButton active={view === "grid"} onClick={() => applyView("grid")} label="Grid view" icon={LayoutGrid} />
          <ViewButton active={view === "list"} onClick={() => applyView("list")} label="List view" icon={List} />
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No assets yet"
          description="Record your first asset to keep its purchase details, status and photo in one place."
          action={
            <Button asChild size="sm">
              <Link href="/assets/new"><Plus /> Add asset</Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No assets match these filters" compact />
      ) : view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((a) => (
            <li key={a.id} className="relative flex flex-col overflow-hidden rounded-lg border bg-card hover:border-primary/50">
              <AssetThumb path={a.image_path} className="aspect-[4/3] w-full rounded-none border-0 border-b" iconClassName="size-6" />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {/* The stretched link makes the whole card clickable; the actions menu sits above it. */}
                    <Link
                      href={`/assets/${a.id}`}
                      className="line-clamp-2 rounded-sm font-medium after:absolute after:inset-0 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {a.name}
                    </Link>
                    {a.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                  <div className="relative z-10 -mt-1 -mr-1">
                    <AssetActions asset={a} onDelete={setPendingDelete} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(a.category)} · {formatDate(a.purchase_date)}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="tabular font-medium">{formatCurrency(Number(a.purchase_price))}</span>
                  <AssetStatusBadge status={a.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <SortableHead label="Purchased" sortKey="purchased" sort={sort} onSort={toggleSort} className="hidden lg:table-cell" />
                <SortableHead label="Cost" sortKey="cost" sort={sort} onSort={toggleSort} align="right" />
                <TableHead>Status</TableHead>
                <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/assets/${a.id}`)}>
                  <TableCell className="max-w-0 min-w-56 w-full">
                    <div className="flex items-center gap-3">
                      <AssetThumb path={a.image_path} />
                      <div className="min-w-0">
                        <Link
                          href={`/assets/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-sm font-medium hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {a.name}
                        </Link>
                        {a.description && (
                          <p className="truncate text-xs text-muted-foreground" title={a.description}>{a.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{categoryLabel(a.category)}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(a.purchase_date)}</TableCell>
                  <TableCell className="tabular text-right">{formatCurrency(Number(a.purchase_price))}</TableCell>
                  <TableCell><AssetStatusBadge status={a.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AssetActions asset={a} onDelete={setPendingDelete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Select value={String(pageSize)} onValueChange={(v) => applyPageSize(Number(v))}>
            <SelectTrigger size="sm" className="w-auto" aria-label="Assets per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="min-w-0 flex-1">
            <Pager page={current} totalPages={totalPages} total={filtered.length} label="assets" onPageChange={setPage} />
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The asset and its attached image will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={del.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingDelete) return;
                await del.mutateAsync(pendingDelete).catch(() => undefined);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Asset thumbnail; a neutral tile stands in when there is no image or the signed URL fails. */
function AssetThumb({
  path,
  className = "size-10",
  iconClassName = "size-4",
}: {
  path: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const image = useAssetImage(path);
  const [broken, setBroken] = useState(false);
  if (path && image.isLoading) return <Skeleton className={cn("shrink-0 rounded-md", className)} />;
  if (!path || !image.data || broken)
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground", className)}
        aria-hidden
      >
        <ImageIcon className={iconClassName} />
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
    <img
      src={image.data}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("shrink-0 rounded-md border object-cover", className)}
    />
  );
}

function AssetActions({ asset, onDelete }: { asset: AssetRow; onDelete: (asset: AssetRow) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${asset.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link href={`/assets/${asset.id}`}><Eye /> View</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/assets/${asset.id}/edit`}><Pencil /> Edit</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(asset)}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon className={cn(!active && "text-muted-foreground")} />
    </Button>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-32" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort?.key === sortKey ? sort.dir : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead
      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}
      className={cn(align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "text-muted-foreground")} aria-hidden />
      </button>
    </TableHead>
  );
}
