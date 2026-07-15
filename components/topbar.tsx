import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/locale-switch";
import { UserMenu } from "@/components/user-menu";

export function Topbar({ user }: { user: { email: string; role: string } }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/60 bg-background/70 px-6 backdrop-blur-md">
      <ThemeToggle />
      <LocaleSwitch />
      <UserMenu user={user} />
    </header>
  );
}
