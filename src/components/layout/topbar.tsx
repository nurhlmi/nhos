"use client";

import Link from "next/link";
import { Menu, Search, Settings, LogOut, User } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CommandMenu, useCommandMenu } from "@/components/layout/command-menu";
import { LiveClock } from "@/components/layout/live-clock";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useShellUser, initials } from "@/components/layout/user-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const user = useShellUser();
  const command = useCommandMenu();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <Button
        variant="outline"
        className="hidden h-8 w-56 justify-start gap-2 text-muted-foreground md:flex"
        onClick={() => command.setOpen(true)}
      >
        <Search className="size-3.5" />
        <span className="text-xs">Search or jump to…</span>
        <span className="ml-auto flex gap-1" aria-hidden="true">
          <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">/</kbd>
          <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
        </span>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => command.setOpen(true)} aria-label="Search">
        <Search />
      </Button>

      <LiveClock timezone={user.timezone} className="hidden xl:flex" />
      <NotificationBell />
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
            <Avatar className="size-7">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
                {initials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{user.fullName || "Owner"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings"><User /> Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings#dashboard"><Settings /> Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandMenu open={command.open} onOpenChange={command.setOpen} />
    </header>
  );
}
