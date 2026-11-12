"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrencies } from "@/features/currency/hooks";
import { cn } from "@/lib/utils";

export function CurrencySelect({
  value,
  onChange,
  exclude,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const { data, isLoading, isError } = useCurrencies();
  const entries = Object.entries(data?.data ?? {}).filter(([code]) => code !== exclude);

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading || isError}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("w-full", className)}>
        <SelectValue placeholder={isError ? "Unavailable" : "Currency"}>
          <span className="font-mono text-xs font-medium">{value}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {entries.map(([code, name]) => (
          <SelectItem key={code} value={code}>
            <span className="w-9 font-mono text-xs font-medium">{code}</span>
            <span className="text-muted-foreground">{name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
