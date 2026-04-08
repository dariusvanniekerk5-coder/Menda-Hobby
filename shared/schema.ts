import { createInsertSchema } from "drizzle-zod";
import { users, jobs, providers } from "../src/schema";
import { z } from "zod";

export const insertUserSchema = createInsertSchema(users);
export const insertJobSchema = createInsertSchema(jobs);
export const insertProviderSchema = createInsertSchema(providers);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertProvider = z.infer<typeof insertProviderSchema>;