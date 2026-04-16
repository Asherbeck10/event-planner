import { z } from "zod";

export const EVENT_CATEGORIES = [
  "Music",
  "Sports",
  "Tech",
  "Food",
  "Art",
  "Networking",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  category: z.enum(EVENT_CATEGORIES),
  maxAttendees: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventInput = z.infer<typeof eventSchema>;
