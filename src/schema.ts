import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(),
  location: text("location").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("open"),
  customerId: integer("customer_id").references(() => users.id),
  providerId: integer("provider_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  businessName: text("business_name").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  contactEmail: text("contact_email").notNull(),
  hourlyRate: integer("hourly_rate").notNull(),
  availability: text("availability").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertJobSchema = createInsertSchema(jobs);
export const insertProviderSchema = createInsertSchema(providers);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertProvider = z.infer<typeof insertProviderSchema>;