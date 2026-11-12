"use client";

import { useState } from "react";
import { ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePrayerCities } from "@/features/prayer/hooks";

/** Searchable list of the 517 regencies and cities Kemenag publishes schedules for. */
export function CityPicker({ value, label, onChange }: { value: string | null; label: string | null; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cities = usePrayerCities();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} aria-label="Choose city" className="w-full justify-between sm:w-64">
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="text-muted-foreground" />
            <span className="truncate">{label ?? "Loading city"}</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command>
          <CommandInput placeholder="Search city or regency" />
          <CommandList className="max-h-72">
            {cities.isError ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                The city list could not be loaded.{" "}
                <button type="button" className="underline hover:text-foreground" onClick={() => void cities.refetch()}>
                  Retry
                </button>
              </p>
            ) : cities.isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading cities</p>
            ) : (
              <>
                <CommandEmpty>No city matches that name.</CommandEmpty>
                {cities.data?.data.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    data-checked={c.id === value}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    {c.name}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
