"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/logout";

export function UserMenu({ user }: { user: { email: string; role: string } }) {
  const t = useTranslations("nav");
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={user.email}
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-medium">{user.email}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.role}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutAction()}>
          <LogOut className="size-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
