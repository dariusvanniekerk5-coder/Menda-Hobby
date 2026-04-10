import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "provider", "admin", "property_manager"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "accepted", "in_progress", "completed", "cancelled", "paid"]);
export const providerStatusEnum = pgEnum("provider_status", ["pending", "verified", "rejected"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
});

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceId: varchar("service_id"),
  bio: text("bio"),
  status: providerStatusEnum("status").notNull().default("pending"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalJobs: text("total_jobs").default("0"),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0"),
  qualificationsDoc: text("qualifications_doc"),
  idDocument: text("id_document"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  providerId: varchar("provider_id"),
  serviceId: varchar("service_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: jobStatusEnum("status").notNull().default("pending"),
  price: decimal("price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  customerRating: decimal("customer_rating", { precision: 3, scale: 2 }),
  customerReview: text("customer_review"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  jobId: varchar("job_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true, password: true, email: true, fullName: true, phone: true, role: true,
});
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProviderSchema = createInsertSchema(providers).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Job = typeof jobs.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
