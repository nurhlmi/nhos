"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "@/components/shared/source-badge";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import { useConversion } from "@/features/currency/hooks";
import { converterFormSchema, type ConverterFormValues } from "@/features/currency/schemas";
import { formatDate, formatNumber, formatRate } from "@/utils/format";

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function CurrencyConverter() {
  const form = useForm<ConverterFormValues>({
    resolver: zodResolver(converterFormSchema),
    defaultValues: { amount: 100, from: "USD", to: "IDR" },
    mode: "onChange",
  });
  const values = useWatch({ control: form.control });
  const debounced = useDebounced(values, 350);
  const amount = Number(debounced.amount);
  const valid = converterFormSchema.safeParse({ ...debounced, amount }).success;
  const conversion = useConversion(debounced.from ?? "USD", debounced.to ?? "IDR", amount, valid);

  const swap = () => {
    const { from, to } = form.getValues();
    form.setValue("from", to, { shouldValidate: true });
    form.setValue("to", from, { shouldValidate: true });
  };

  const result = conversion.data?.data;

  return (
    <div className="space-y-4">
      <Field data-invalid={Boolean(form.formState.errors.amount)}>
        <FieldLabel htmlFor="fx-amount">Amount</FieldLabel>
        <Input
          id="fx-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          className="tabular text-base"
          {...form.register("amount", { valueAsNumber: true })}
        />
      </Field>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field>
          <FieldLabel htmlFor="fx-from">From</FieldLabel>
          <Controller
            control={form.control}
            name="from"
            render={({ field }) => <CurrencySelect id="fx-from" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Swap currencies">
          <ArrowLeftRight />
        </Button>
        <Field>
          <FieldLabel htmlFor="fx-to">To</FieldLabel>
          <Controller
            control={form.control}
            name="to"
            render={({ field }) => <CurrencySelect id="fx-to" value={field.value} onChange={field.onChange} />}
          />
        </Field>
      </div>
      <FieldError errors={[form.formState.errors.amount]} />

      <div className="rounded-lg border bg-surface-2 p-4">
        {conversion.isError ? (
          <p className="text-sm text-destructive">Rate unavailable: {conversion.error.message}</p>
        ) : !result || conversion.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {formatNumber(result.amount, 4)} {result.from} =
            </p>
            <p className="tabular mt-0.5 text-2xl font-semibold tracking-tight">
              {formatNumber(result.result, result.to === "IDR" || result.to === "JPY" ? 2 : 4)}{" "}
              <span className="text-base font-medium text-muted-foreground">{result.to}</span>
            </p>
            <p className="tabular mt-1 text-xs text-muted-foreground">
              1 {result.from} = {formatRate(result.rate)} {result.to} · reference date {formatDate(result.date)}
            </p>
          </>
        )}
      </div>
      <SourceBadge meta={conversion.data?.meta} />
    </div>
  );
}
