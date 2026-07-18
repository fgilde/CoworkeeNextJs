"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";

export type SetupFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const setupSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    companyName: z.string().min(1),
    defaultLocale: z.enum(["de", "en"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export async function completeSetup(
  _prevState: SetupFormState,
  formData: FormData
): Promise<SetupFormState> {
  // CRITICAL GUARD: this action must never be able to create a second admin
  // once the instance is already set up (it's reachable with no auth).
  if ((await db.user.count()) !== 0) {
    return { error: "alreadySetup" };
  }

  const parsed = setupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    if (flat.confirmPassword?.includes("passwordMismatch")) {
      return { error: "passwordMismatch" };
    }
    return { error: "validationError", fieldErrors: flat };
  }
  const data = parsed.data;
  const passwordHash = await hashPassword(data.password);

  try {
    await db.$transaction(async (tx) => {
      // Re-check inside the transaction so a concurrent request can't race past
      // the guard above and create two admins.
      if ((await tx.user.count()) !== 0) {
        throw new Error("ALREADY_SETUP");
      }

      const employee = await tx.employee.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          hireDate: new Date(),
          status: "ACTIVE",
        },
      });

      await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "ADMIN",
          locale: data.defaultLocale,
          employeeId: employee.id,
        },
      });

      await tx.companySettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", companyName: data.companyName, defaultLocale: data.defaultLocale },
        update: { companyName: data.companyName, defaultLocale: data.defaultLocale },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_SETUP") {
      return { error: "alreadySetup" };
    }
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", data.defaultLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "loginFailed" };
    }
    // Auth.js signals success via a thrown redirect (NEXT_REDIRECT) — let it propagate.
    throw error;
  }

  return {};
}
