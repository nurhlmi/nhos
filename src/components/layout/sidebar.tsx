"use client";

import { APP_NAME } from "@/lib/env";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { navGroups, secondaryNav, isNavActive, type NavItem } from "@/config/navigation";
import { Logo } from "@/components/layout/logo";
import { useShellUser, initials } from "@/components/layout/user-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <SidebarBody collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBody collapsed={false} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function SidebarBody({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <Link href="/" onClick={onNavigate} aria-label={`${APP_NAME} home`}>
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <div className="space-y-4">
          {navGroups.map((group, i) => (
            <div key={group.label ?? i} role="group" aria-label={group.label}>
              {group.label &&
                (collapsed ? (
                  <div className="mx-2 mb-2 h-px bg-sidebar-border" aria-hidden />
                ) : (
                  <p className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                ))}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} active={isNavActive(pathname, item.href)} collapsed={collapsed} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="my-4 h-px bg-sidebar-border" />
        <ul className="space-y-0.5">
          {secondaryNav.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} active={isNavActive(pathname, item.href)} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>

      {onToggleCollapsed && (
        <div className={cn("px-3 pb-2", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapsed}
            className={cn("text-muted-foreground", !collapsed && "w-full justify-start")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      )}

      <ProfileSection collapsed={collapsed} />
    </div>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 pointer-coarse:h-11 items-center gap-3 rounded-md px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

function ProfileSection({ collapsed }: { collapsed: boolean }) {
  const user = useShellUser();
  const name = user.fullName || user.email.split("@")[0];

  return (
    <div className={cn("flex items-center gap-2.5 border-t border-sidebar-border p-3", collapsed && "flex-col")}>
      <Avatar className="size-8">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
          {initials(user.fullName, user.email)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}
      <form action={signOut}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out" className="text-muted-foreground">
              <LogOut />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={collapsed ? "right" : "top"}>Sign out</TooltipContent>
        </Tooltip>
      </form>
    </div>
  );
}
