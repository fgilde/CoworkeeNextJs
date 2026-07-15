import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/locale-switch";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell, type BellNotification } from "@/components/notification-bell";

export function Topbar({
  user,
  notifications,
  unreadCount,
}: {
  user: { email: string; role: string };
  notifications: BellNotification[];
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border/60 bg-background/70 px-6 backdrop-blur-md">
      <ThemeToggle />
      <LocaleSwitch />
      <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      <UserMenu user={user} />
    </header>
  );
}
