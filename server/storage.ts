import { db } from "./db";
import { users, jobs, providers, notifications } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InsertUser, User, Job, Provider, Notification } from "@shared/schema";

export class DatabaseStorage {
  async getUserById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async insertUser(insertUser: InsertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllJobs() {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }
  async getJobById(id: string) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
  async getJobsByCustomerId(customerId: string) {
    return db.select().from(jobs).where(eq(jobs.customerId, customerId)).orderBy(desc(jobs.createdAt));
  }
  async getJobsByProviderId(providerId: string) {
    return db.select().from(jobs).where(eq(jobs.providerId, providerId)).orderBy(desc(jobs.createdAt));
  }
  async insertJob(jobData: any) {
    const [job] = await db.insert(jobs).values(jobData).returning();
    return job;
  }
  async updateJobStatus(jobId: string, status: string) {
    const [job] = await db.update(jobs).set({ status: status as any, updatedAt: new Date() }).where(eq(jobs.id, jobId)).returning();
    return job;
  }
  async assignProvider(jobId: string, providerId: string) {
    const [job] = await db.update(jobs).set({ providerId, status: "accepted" as any, updatedAt: new Date() }).where(eq(jobs.id, jobId)).returning();
    return job;
  }
  async addJobReview(jobId: string, rating: string, review: string) {
    const [job] = await db.update(jobs).set({ customerRating: rating, customerReview: review, updatedAt: new Date() } as any).where(eq(jobs.id, jobId)).returning();
    return job;
  }
  async getAllProviders() {
    return db.select().from(providers);
  }
  async getProviderByUserId(userId: string) {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider;
  }
  async getProviderById(id: string) {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }
  async insertProvider(providerData: any) {
    const [provider] = await db.insert(providers).values(providerData).returning();
    return provider;
  }
  async updateProviderStatus(providerId: string, status: string) {
    const [provider] = await db.update(providers).set({ status: status as any }).where(eq(providers.id, providerId)).returning();
    return provider;
  }
  // Notifications
  async getNotificationsByUserId(userId: string) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }
  async insertNotification(data: { userId: string; title: string; message: string; type?: string; jobId?: string }) {
    const [notif] = await db.insert(notifications).values({
      userId: data.userId, title: data.title, message: data.message,
      type: data.type || "info", jobId: data.jobId || null, read: false,
    }).returning();
    return notif;
  }
  async markNotificationRead(id: string) {
    const [notif] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return notif;
  }
  async markAllNotificationsRead(userId: string) {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }
}

export const storage = new DatabaseStorage();

