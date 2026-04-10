import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hash, compare } from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

declare module "express-session" {
  interface SessionData { userId: string; }
}

function notify(userId: string, title: string, message: string, type = "info", jobId?: string) {
  storage.insertNotification({ userId, title, message, type, jobId }).catch(e => console.error("Notification failed:", e));
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(session({
    secret: process.env.SESSION_SECRET || "menda-secret-2026",
    resave: false, saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Invalid email or password" });
      const valid = await compare(password, user.password);
      if (!valid) return done(null, false, { message: "Invalid email or password" });
      return done(null, user);
    } catch (e) { return done(e); }
  }));
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try { done(null, await storage.getUserById(id)); } catch (e) { done(e); }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    next();
  };
  const formatUser = (user: any) => ({
    id: user.id, name: user.fullName, email: user.email, role: user.role,
    phone: user.phone, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`,
  });

  // AUTH
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName, phone, role } = req.body;
      if (!email || !password || !fullName) return res.status(400).json({ error: "Email, password and name are required" });
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ error: "Email already registered" });
      const hashed = await hash(password, 10);
      const username = email.split("@")[0] + Date.now();
      const user = await storage.insertUser({ username, password: hashed, email, fullName, phone, role: role || "customer" });
      if (role === "provider") {
        await storage.insertProvider({ userId: user.id, status: "pending", rating: "0", totalJobs: "0", earnings: "0" });
      }
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after register" });
        res.json(formatUser(user));
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/auth/login", (req, res, next) => {
    if (!req.body.email || !req.body.password) return res.status(400).json({ error: "Email and password required" });
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ error: "Login failed" });
        res.json(formatUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => { req.logout(() => res.json({ success: true })); });
  app.get("/api/me", requireAuth, (req, res) => { res.json(formatUser(req.user)); });

  // JOBS
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      let jobList;
      if (user.role === "admin") {
        jobList = await storage.getAllJobs();
      } else if (user.role === "provider") {
        const provider = await storage.getProviderByUserId(user.id);
        const myJobs = provider ? await storage.getJobsByProviderId(provider.id) : [];
        const allJobs = await storage.getAllJobs();
        const available = allJobs.filter((j: any) => !j.providerId && j.status === "pending");
        const ids = new Set(myJobs.map((j: any) => j.id));
        jobList = [...myJobs, ...available.filter((j: any) => !ids.has(j.id))];
      } else {
        jobList = await storage.getJobsByCustomerId(user.id);
      }
      res.json(jobList);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { serviceId, title, description, address, scheduledAt, price } = req.body;
      const job = await storage.insertJob({
        customerId: user.id, serviceId, title, description, address,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null, price, status: "pending",
      });
      const allProviders = await storage.getAllProviders();
      for (const p of allProviders) {
        if (p.status === "verified") {
          notify(p.userId, "New Job Available", `"${title}" in ${address}`, "job_update", job.id);
        }
      }
      res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/jobs/:id/status", requireAuth, async (req, res) => {
    try {
      const prevJob = await storage.getJobById(req.params.id);
      const job = await storage.updateJobStatus(req.params.id, req.body.status);
      if (prevJob && job) {
        const labels: Record<string, string> = {
          in_progress: "Your provider has started working",
          completed: "Your job has been marked as completed — please review and release escrow",
          cancelled: "Your job has been cancelled",
        };
        const label = labels[req.body.status];
        if (label) notify(prevJob.customerId, "Job Update", `${label} — "${prevJob.title}"`, "job_update", job.id);
        if (req.body.status === "completed" && prevJob.providerId) {
          const provider = await storage.getProviderById(prevJob.providerId);
          if (provider) notify(provider.userId, "Job Completed", `"${prevJob.title}" marked complete. Awaiting escrow release.`, "job_update", job.id);
        }
      }
      res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/jobs/:id/assign", requireAuth, async (req, res) => {
    try {
      const { providerId } = req.body;
      const provider = await storage.getProviderById(providerId);
      if (!provider) return res.status(400).json({ error: "Provider not found" });
      if (provider.status !== "verified") return res.status(400).json({ error: "Provider not verified" });
      const job = await storage.assignProvider(req.params.id, providerId);
      if (job) {
        const pUser = await storage.getUserById(provider.userId);
        notify(job.customerId, "Job Accepted!", `${pUser?.fullName || "A provider"} accepted "${job.title}". They will begin shortly.`, "job_update", job.id);
      }
      res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ESCROW
  app.patch("/api/jobs/:id/escrow/hold", requireAuth, async (req, res) => {
    try {
      const job = await storage.updateJobStatus(req.params.id, "in_progress");
      if (job) notify(job.customerId, "Escrow Held", `R${job.price} held in escrow for "${job.title}"`, "payment", job.id);
      res.json({ ...job, escrowStatus: "held" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/jobs/:id/escrow/release", requireAuth, async (req, res) => {
    try {
      const prevJob = await storage.getJobById(req.params.id);
      const job = await storage.updateJobStatus(req.params.id, "paid");
      if (prevJob?.providerId) {
        const provider = await storage.getProviderById(prevJob.providerId);
        if (provider) {
          const payout = (parseFloat(String(prevJob.price)) * 0.8).toFixed(0);
          notify(provider.userId, "Escrow Released!", `R${payout} released for "${prevJob.title}". Funds on the way!`, "payment", job.id);
        }
      }
      if (prevJob) notify(prevJob.customerId, "Payment Complete", `Escrow released for "${prevJob.title}". Thank you!`, "payment", job.id);
      res.json({ ...job, escrowStatus: "released" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // REVIEW
  app.patch("/api/jobs/:id/review", requireAuth, async (req, res) => {
    try {
      const { rating, review } = req.body;
      const job = await storage.addJobReview(req.params.id, rating, review);
      if (job?.providerId) {
        const provider = await storage.getProviderById(job.providerId);
        if (provider) notify(provider.userId, "New Review", `You received a ${rating}-star review for "${job.title}"`, "info", job.id);
      }
      res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // PROVIDERS
  app.get("/api/providers", requireAuth, async (req, res) => {
    try {
      const provs = await storage.getAllProviders();
      const enriched = await Promise.all(provs.map(async (p) => {
        const u = await storage.getUserById(p.userId);
        return { ...p, userName: u?.fullName || "Unknown", userEmail: u?.email || "", userPhone: u?.phone || "" };
      }));
      res.json(enriched);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/providers/me", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const provider = await storage.getProviderByUserId(user.id);
      if (!provider) return res.status(404).json({ error: "No provider profile" });
      res.json(provider);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/providers/signup", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { bio, serviceId } = req.body;
      const existing = await storage.getProviderByUserId(user.id);
      if (existing) return res.status(400).json({ error: "Already exists" });
      const provider = await storage.insertProvider({ userId: user.id, bio, serviceId, status: "pending", rating: "0", totalJobs: "0", earnings: "0" });
      notify(user.id, "Application Received", "Your provider application is under review.", "provider_update");
      res.json(provider);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/providers/:id/vet", requireAuth, async (req, res) => {
    try {
      const provider = await storage.updateProviderStatus(req.params.id, req.body.status);
      if (req.body.status === "verified") notify(provider.userId, "You're Verified!", "You can now accept jobs on MENDA.", "provider_update");
      else if (req.body.status === "rejected") notify(provider.userId, "Application Update", "Your application was not approved. Contact support.", "provider_update");
      res.json(provider);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/providers/earnings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const provider = await storage.getProviderByUserId(user.id);
      if (!provider) return res.status(404).json({ error: "Not found" });
      const pJobs = await storage.getJobsByProviderId(provider.id);
      const done = pJobs.filter((j: any) => j.status === "paid" || j.status === "completed");
      const total = done.reduce((s: number, j: any) => s + (parseFloat(j.price) * 0.8), 0);
      res.json({ provider, completedJobs: done.length, totalEarnings: total, jobs: pJobs });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // NOTIFICATIONS
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try { res.json(await storage.getNotificationsByUserId((req.user as any).id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try { res.json(await storage.markNotificationRead(req.params.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try { await storage.markAllNotificationsRead((req.user as any).id); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // AI CHAT BOT - uses Anthropic API
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages array required" });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "AI service not configured" });

      const systemPrompt = `You are MAYA, the MENDA virtual assistant — a warm, professional, and knowledgeable helper for the MENDA home services platform in South Africa.

MENDA connects customers with vetted home service providers. Services offered:
- Plumbing: R450 base (leak repairs, pipe installation, drain unblocking, burst pipes, geysers)
- Electrical: R550 base (wiring, DB boards, lighting, outlets, surge protection, fault finding)
- Cleaning: R350 base (deep cleaning, move-in/out, standard domestic, once-off, regular)
- Handyman: R400 base (general repairs, mounting, assembly, maintenance, tiling, painting)
- Appliances: R500 base (fridges, washing machines, ovens, dishwashers, small appliances)
- Gardening: R300 base (lawn care, maintenance, pruning, landscaping, irrigation)
- Pest Control: R400 base (fumigation, rodents, termites, cockroaches, ants, general)

PRICING GUIDANCE (always clarify these are estimates — final price quoted by provider):
- Call-out fee is typically included in base price for first hour
- After hours / weekends: add 30-50% surcharge
- Materials are charged separately (pipes, fittings, parts, etc.)
- Complex jobs (e.g., burst geyser replacement): R2,000–R6,000 including parts
- DB board upgrade: R3,500–R8,000
- Full house rewire: R15,000–R40,000+
- Solar panel installation: R45,000–R120,000+ depending on system size
- Air conditioning install: R8,000–R20,000 per unit
- Deep clean 3-bedroom home: R1,200–R2,500
- Regular weekly clean: R400–R800 per visit
- Pest fumigation (house): R1,500–R4,000

HOW MENDA WORKS:
1. Customer books a service and pays
2. Funds held in escrow (safe — not released until job done)
3. Vetted provider is assigned and does the work
4. Customer approves and releases payment
5. Provider receives 80% (MENDA takes 20% platform fee)

PAYMENT & ESCROW: Explain that this protects customers. Funds are only released when the customer is satisfied. Disputes can be raised if unhappy.

PROVIDER VETTING: All providers go through background checks, skills verification, and ID verification before being approved.

YOUR BEHAVIOUR:
- Be warm, friendly, and concise
- Give rough estimates when asked but ALWAYS clarify they are estimates
- If unsure about a specific technical question, say so honestly
- For complex issues (legal disputes, serious complaints, specific quotes), recommend contacting a human: "I'd recommend speaking to our support team for this"
- You can help with: service explanations, rough pricing, how to book, how escrow works, what to expect, troubleshooting booking issues, etc.
- Keep responses concise — 2-4 sentences unless detailed answer needed
- Use South African context (Rands, local references)
- Be helpful even to potential providers asking about joining MENDA
- Never make up specific facts you don't know`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: systemPrompt,
          messages: messages.slice(-10), // last 10 messages for context
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Anthropic API error:", err);
        return res.status(500).json({ error: "AI service error" });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";
      res.json({ message: text });
    } catch (e: any) {
      console.error("Chat error:", e);
      res.status(500).json({ error: "Chat service unavailable" });
    }
  });

  return httpServer;
}
