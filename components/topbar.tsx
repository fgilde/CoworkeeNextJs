import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/locale-switch";
import { UserMenu } from "@/components/user-menu";

export function Topbar({ user }: { user: { email: string; role: string } }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border px-6">
      <ThemeToggle />
      <LocaleSwitch />
      <UserMenu user={user} />
    </header>
  );
}
