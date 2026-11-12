"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AssetRow } from "@/types/database";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "@/features/assets/constants";
import { useSaveAsset } from "@/features/assets/hooks";
import { assetFormSchema, type AssetFormValues } from "@/features/assets/schemas";

function defaults(asset?: AssetRow | null): AssetFormValues {
  return {
    name: asset?.name ?? "",
    category: asset?.category ?? "electronics",
    description: asset?.description ?? "",
    purchase_date: asset?.purchase_date ?? format(new Date(), "yyyy-MM-dd"),
    // NaN keeps a new form's price field empty; the schema reports it as "Enter an amount".
    purchase_price: asset ? Number(asset.purchase_price) : Number.NaN,
    status: asset?.status ?? "active",
    notes: asset?.notes ?? "",
  };
}

export function AssetForm({ asset }: { asset?: AssetRow | null }) {
  const router = useRouter();
  const save = useSaveAsset(asset?.id);
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: defaults(asset),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await save.mutateAsync(values).catch(() => null);
    if (saved) router.push(`/assets/${saved.id}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.name)} className="sm:col-span-2">
            <FieldLabel htmlFor="name">Asset name</FieldLabel>
            <Input id="name" placeholder="MacBook Air M2 13” 8/256" {...form.register("name")} />
            <FieldDescription>Include brand, model and variant so you can tell similar assets apart.</FieldDescription>
            <FieldError errors={[errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field data-invalid={Boolean(errors.purchase_date)}>
            <FieldLabel htmlFor="purchase_date">Purchase date</FieldLabel>
            <Input id="purchase_date" type="date" {...form.register("purchase_date")} />
            <FieldError errors={[errors.purchase_date]} />
          </Field>
          <Field data-invalid={Boolean(errors.purchase_price)}>
            <FieldLabel htmlFor="purchase_price">Purchase price</FieldLabel>
            <Controller
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <NumericFormat
                  customInput={Input}
                  id="purchase_price"
                  name={field.name}
                  getInputRef={field.ref}
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onValueChange={(v) => field.onChange(v.floatValue ?? Number.NaN)}
                  onBlur={field.onBlur}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                  allowedDecimalSeparators={[","]}
                  decimalScale={2}
                  allowNegative={false}
                  inputMode="decimal"
                  placeholder="Rp 0"
                  aria-invalid={Boolean(errors.purchase_price)}
                  className="tabular"
                />
              )}
            />
            <FieldError errors={[errors.purchase_price]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field data-invalid={Boolean(errors.description)} className="sm:col-span-2">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea id="description" rows={3} placeholder="Specs, condition, accessories, warranty…" {...form.register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea id="notes" rows={2} {...form.register("notes")} />
          </Field>
        </FieldGroup>
      </section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {asset ? "Save changes" : "Create asset"}
        </Button>
      </div>
    </form>
  );
}
