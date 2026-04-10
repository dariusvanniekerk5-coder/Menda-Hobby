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
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Invalid credentials" });
      const valid = await compare(password, user.password);
      if (!valid) return done(null, false, { message: "Invalid credentials" });
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
      const user = await storage.insertUser({ username, password: hashed, email, fullName, phone: phone || null, role: role || "customer" });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after register" });
        res.json(formatUser(user));
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/auth/login", (req, res, next) => {
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
          completed: "Your job has been marked as completed",
          cancelled: "Your job has been cancelled",
        };
        const label = labels[req.body.status];
        if (label) notify(prevJob.customerId, "Job Update", `${label} — "${prevJob.title}"`, "job_update", job.id);
        if (req.body.status === "completed" && prevJob.providerId) {
          const provider = await storage.getProviderById(prevJob.providerId);
          if (provider) notify(provider.userId, "Job Completed", `"${prevJob.title}" marked complete.`, "job_update", job.id);
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
        notify(job.customerId, "Job Accepted!", `${pUser?.fullName || "A provider"} accepted "${job.title}".`, "job_update", job.id);
      }
      res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

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
          notify(provider.userId, "Escrow Released!", `R${payout} released for "${prevJob.title}".`, "payment", job.id);
        }
      }
      if (prevJob) notify(prevJob.customerId, "Payment Complete", `Escrow released for "${prevJob.title}".`, "payment", job.id);
      res.json({ ...job, escrowStatus: "released" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

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

  app.post("/api/providers/apply", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { bio, serviceId, qualificationsDoc, idDocument } = req.body;
      const existing = await storage.getProviderByUserId(user.id);
      if (existing) return res.status(400).json({ error: "Provider profile already exists" });
      const providerData: any = { userId: user.id, bio, serviceId, status: "pending", rating: "0", totalJobs: "0", earnings: "0" };
      if (qualificationsDoc !== undefined) providerData.qualificationsDoc = qualificationsDoc || null;
      if (idDocument !== undefined) providerData.idDocument = idDocument || null;
      const provider = await storage.insertProvider(providerData);
      notify(user.id, "Application Received", "Your provider application is under review. We'll be in touch within 2-3 business days.", "provider_update");
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

  // CHAT / AI ASSISTANT
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });

      const SYSTEM = `You are Menda's friendly AI assistant. Menda is a South African home services marketplace connecting clients with vetted, certified professionals.

Services & base prices (starting estimates — actual quotes depend on complexity):
- Plumbing: R450 (leaks, pipes, drains, geysers)
- Electrical: R550 (wiring, DB boards, lights, surge protection)
- Cleaning: R350 (deep clean, move-in/out, domestic)
- Handyman: R400 (repairs, mounting, assembly, maintenance)
- Appliance Repair: R500 (fridges, washing machines, ovens)
- Gardening: R300 (lawn, pruning, landscaping)
- Pest Control: R400 (fumigation, rodents, termites)

How Menda works: Client books & pays → funds held in escrow → vetted provider does the job → client approves → payment released. All providers are background-checked, certified, and FICA compliant.

Your role: Give helpful rough cost estimates, explain the platform, answer home maintenance questions, and be warm and concise. If you can't help, tell the user to email support@menda.co.za. Respond in English, Afrikaans, or Zulu based on the user.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (apiKey) {
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 512,
            system: SYSTEM,
            messages: [
              ...history.slice(-8).map((h: any) => ({ role: h.role, content: h.content })),
              { role: "user", content: message },
            ],
          }),
        });
        const data = await anthropicRes.json() as any;
        return res.json({ reply: data.content?.[0]?.text || "I couldn't process that. Please try again." });
      }

      // Smart rules-based fallback (no API key needed)
      const q = message.toLowerCase();
      let reply = "";
      if (q.match(/plumb|pipe|leak|tap|drain|toilet|geyser|water/)) {
        reply = "Plumbing starts from R450. That covers callout and basic labour — fixing a leak, unblocking a drain, toilet repairs. Geyser replacements are quoted separately. Want to book a plumber?";
      } else if (q.match(/electric|wir|light|plug|switch|db|power|breaker|surge/)) {
        reply = "Electrical work starts from R550 — light fittings, plug points, switching issues. DB board and full rewiring are quoted on-site. All our electricians are registered and certified.";
      } else if (q.match(/clean|house|domestic|maid|scrub/)) {
        reply = "Cleaning starts from R350 for a standard domestic clean. Deep cleans and move-in/out cleans are priced by size. Our cleaners are vetted and reliable.";
      } else if (q.match(/handyman|repair|fix|mount|hang|install|assemble/)) {
        reply = "Handyman services start from R400 — repairs, TV mounting, furniture assembly, minor carpentry. Describe what needs doing and I can give a better estimate.";
      } else if (q.match(/garden|lawn|grass|prune|tree|landscap/)) {
        reply = "Gardening starts from R300 — lawn mowing, trimming, pruning, general upkeep. Landscaping projects are quoted separately.";
      } else if (q.match(/pest|cockroach|rat|mice|termite|bug|fumigate|ant/)) {
        reply = "Pest control starts from R400. We handle cockroaches, rodents, termites, ants, and general fumigation. Price depends on treatment type and property size.";
      } else if (q.match(/appliance|fridge|washing|machine|oven|dishwasher|stove/)) {
        reply = "Appliance repair starts from R500. We fix fridges, washing machines, dishwashers, ovens, and more. Technicians diagnose on-site and quote before any parts are ordered.";
      } else if (q.match(/escrow|payment|pay|money|safe|hold|release/)) {
        reply = "Menda uses escrow to protect your money. When you book, your payment is held securely and only released to the provider once you confirm the job is done to your satisfaction. If something's wrong, you raise a dispute and our team steps in.";
      } else if (q.match(/how|work|process|book|step/)) {
        reply = "Simple: 1) Choose your service and pay — funds go into escrow. 2) A vetted provider is assigned and does the work. 3) You approve and release payment. Your money is always protected until you're happy.";
      } else if (q.match(/price|cost|rate|charge|fee|how much|quote|estimate/)) {
        reply = "Base rates (starting prices — final quotes depend on complexity):\n\n• Plumbing: R450+\n• Electrical: R550+\n• Cleaning: R350+\n• Handyman: R400+\n• Appliances: R500+\n• Gardening: R300+\n• Pest Control: R400+\n\nWhich service can I give you more detail on?";
      } else if (q.match(/hello|hi |hey|good morning|good day|sawubona|hallo/)) {
        reply = "Hello! 👋 Welcome to Menda. I can help with service estimates, booking questions, or anything about how we work. What do you need today?";
      } else if (q.match(/human|agent|person|speak|call|contact|support|email/)) {
        reply = "For anything that needs a human, reach our team at support@menda.co.za. We get back within one business day. Anything else I can help with?";
      } else {
        reply = "I can help with service cost estimates, how Menda works, and home maintenance questions. Could you tell me a bit more about what you need? Or reach us at support@menda.co.za.";
      }
      res.json({ reply });
    } catch (e: any) {
      res.status(500).json({ reply: "I'm having trouble right now. Please email support@menda.co.za." });
    }
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

  return httpServer;
}
