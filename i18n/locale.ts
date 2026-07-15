"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { locales, type Locale } from "@/i18n/request";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!(locales as readonly string[]).includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: ONE_YEAR,
  });

  const session = await auth();
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: { locale },
    });
  }

  revalidatePath("/", "layout");
}
