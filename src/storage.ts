import { db } from "./db";
import { users, jobs, providers } from "./schema";
import { eq, or } from "drizzle-orm";
import type { InsertUser, InsertJob, InsertProvider } from "../shared/schema";

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  createdAt?: Date | null;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  serviceType: string;
  status: string;
  customerId?: number | null;
  providerId?: number | null;
  createdAt?: Date | null;
}

export interface Provider {
  id: number;
  userId: number | null;
  businessName: string;
  serviceType: string;
  description: string;
  contactEmail: string;
  hourlyRate: number;
  availability: string;
  status: string;
  earnings?: number;
  createdAt?: Date | null;
}

export const storage = {
  // User methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  },

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return result[0];
  },

  async insertUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  },

  // Job methods
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  },

  async getJobsByCustomerId(customerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.customerId, customerId));
  },

  async getJobsByProviderId(providerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.providerId, providerId));
  },

  async insertJob(jobData: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(jobData).returning();
    return result[0];
  },

  async updateJobStatus(id: string, status: string): Promise<Job | undefined> {
    const result = await db.update(jobs).set({ status }).where(eq(jobs.id, parseInt(id))).returning();
    return result[0];
  },

  async assignProvider(id: string, providerId: number): Promise<Job | undefined> {
    const result = await db.update(jobs).set({ providerId }).where(eq(jobs.id, parseInt(id))).returning();
    return result[0];
  },

  // Provider methods
  async getAllProviders(): Promise<Provider[]> {
    return await db.select().from(providers);
  },

  async getProviderByUserId(userId: number): Promise<Provider | undefined> {
    const result = await db.select().from(providers).where(eq(providers.userId, userId));
    return result[0];
  },

  async insertProvider(providerData: InsertProvider): Promise<Provider> {
    const result = await db.insert(providers).values(providerData).returning();
    return result[0];
  },

  async updateProviderStatus(id: string, status: string): Promise<Provider | undefined> {
    const result = await db.update(providers).set({ status }).where(eq(providers.id, parseInt(id))).returning();
    return result[0];
  },
};