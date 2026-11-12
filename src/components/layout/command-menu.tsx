"use client";

import { APP_NAME } from "@/lib/env";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Plus, ScanSearch, Sun, Newspaper, Bookmark } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { allNav } from "@/config/navigation";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useCommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      // "/" opens search, unless the user is typing it into a field.
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const run = (fn: () => void) => {
    onOpenChange(false);
    setQuery("");
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={`Search ${APP_NAME}`} description="Jump to a page or run an action">
      <Command>
        <CommandInput placeholder="Type a page, CVE ID or keyword…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>

          {trimmed.length > 1 && (
            <CommandGroup heading="Search">
              {CVE_PATTERN.test(trimmed) ? (
                <CommandItem
                  value={`open ${trimmed}`}
                  onSelect={() => run(() => router.push(`/cve/${trimmed.toUpperCase()}`))}
                >
                  <ScanSearch /> Open {trimmed.toUpperCase()}
                </CommandItem>
              ) : (
                <CommandItem
                  value={`search cve ${trimmed}`}
                  onSelect={() => run(() => router.push(`/cve?q=${encodeURIComponent(trimmed)}`))}
                >
                  <ScanSearch /> Search CVEs for “{trimmed}”
                </CommandItem>
              )}
            </CommandGroup>
          )}

          <CommandGroup heading="Navigate">
            {allNav.map((item) => (
              <CommandItem key={item.href} value={`${item.title} ${item.description}`} onSelect={() => run(() => router.push(item.href))}>
                <item.icon /> {item.title}
              </CommandItem>
            ))}
            <CommandItem value="saved articles bookmarks" onSelect={() => run(() => router.push("/news/saved"))}>
              <Newspaper /> Saved articles
            </CommandItem>
            <CommandItem value="cve watchlist bookmarks" onSelect={() => run(() => router.push("/cve/watchlist"))}>
              <Bookmark /> CVE watchlist
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="add new asset" onSelect={() => run(() => router.push("/assets/new"))}>
              <Plus /> Add asset
            </CommandItem>
            <CommandItem
              value="toggle theme dark light"
              onSelect={() => run(() => setTheme(resolvedTheme === "light" ? "dark" : "light"))}
            >
              {resolvedTheme === "light" ? <Moon /> : <Sun />} Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
