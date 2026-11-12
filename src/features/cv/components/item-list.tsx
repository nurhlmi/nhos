"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";

type Item = { id: string };

/** Generic editable list with reorder, edit and confirmed delete. */
export function ItemList<T extends Item>({
  items,
  isLoading,
  error,
  noun,
  title,
  subtitle,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  items: T[] | undefined;
  isLoading: boolean;
  error: unknown;
  noun: string;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => Promise<unknown>;
  onReorder: (ids: string[]) => void;
}) {
  if (error) return <ErrorState error={error} compact />;
  if (isLoading) return <ListSkeleton rows={3} />;

  const list = items ?? [];
  const move = (index: number, dir: -1 | 1) => {
    const ids = list.map((i) => i.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    onReorder(ids);
  };

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <EmptyState
          title={`No ${noun.toLowerCase()} yet`}
          compact
          action={<Button size="sm" onClick={onAdd}><Plus /> Add {noun.toLowerCase()}</Button>}
        />
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {list.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={index === list.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDown />
                  </Button>
                </div>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit(item)}>
                  <p className="truncate text-sm font-medium">{title(item)}</p>
                  {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle(item)}</p>}
                </button>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${title(item)}`} onClick={() => onEdit(item)}>
                  <Pencil />
                </Button>
                <ConfirmDialog
                  title={`Delete ${noun.toLowerCase()}?`}
                  description={`"${title(item)}" will be permanently removed from all CV versions.`}
                  onConfirm={() => onDelete(item)}
                  trigger={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${title(item)}`}><Trash2 /></Button>}
                />
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={onAdd}><Plus /> Add {noun.toLowerCase()}</Button>
        </>
      )}
    </div>
  );
}
