"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "invalidCredentials" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "invalidCredentials" };
    }
    // Auth.js signals a successful sign-in via a thrown redirect (NEXT_REDIRECT).
    // Let it propagate so Next.js can perform the navigation.
    throw error;
  }

  return {};
}
