"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { setUserRole } from "@/app/actions/user-actions";

export type RoleOption = { value: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"; label: string };

export function UserRoleRow({
  userId,
  email,
  employeeName,
  role,
  roles,
  isSelf,
  errorMessages,
}: {
  userId: string;
  email: string;
  employeeName: string;
  role: string;
  roles: RoleOption[];
  isSelf: boolean;
  errorMessages: Record<string, string>;
}) {
  const [currentRole, setCurrentRole] = useState(role);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell>{email}</TableCell>
      <TableCell>{employeeName}</TableCell>
      <TableCell>
        {isSelf ? (
          <span className="text-sm text-muted-foreground">
            {roles.find((r) => r.value === currentRole)?.label ?? currentRole}
          </span>
        ) : (
          <div className="flex flex-col gap-1">
            <Select
              value={currentRole}
              disabled={isPending}
              items={Object.fromEntries(roles.map((r) => [r.value, r.label]))}
              onValueChange={(value) => {
                const previous = currentRole;
                setCurrentRole(value as string);
                setError(null);
                startTransition(async () => {
                  const result = await setUserRole(userId, value as string);
                  if (result.error) {
                    setCurrentRole(previous);
                    setError(errorMessages[result.error] ?? result.error);
                  }
                });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <span className="text-sm text-destructive" role="alert">
                {error}
              </span>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
