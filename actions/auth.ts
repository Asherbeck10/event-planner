"use server";

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: messages };
  }

  const { name, email, password } = parsed.data;

  // Check if email is taken
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    name,
    email,
    password: passwordHash,
  });

  if (insertError) {
    return { error: "Failed to create account. Please try again." };
  }

  // Sign in right away after registration
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });

  return { success: true };
}

export async function loginUser(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // NEXT_REDIRECT is thrown on successful redirect — re-throw it
    throw err;
  }

  return { success: true };
}
