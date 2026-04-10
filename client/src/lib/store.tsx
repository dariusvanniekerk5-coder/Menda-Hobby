import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { Wrench, Zap, Sparkles, Hammer, Microwave, Leaf, Bug } from "lucide-react";

export type UserRole = "customer" | "provider" | "admin" | "property_manager" | null;

export interface User {
  id: string; name: string; email: string; role: UserRole; avatar?: string; companyName?: string;
}
export interface Service {
  id: string; name: string; icon: any; basePrice: number; description: string;
}
export interface Job {
  id: string; customerId: string; providerId?: string; serviceId: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | "paid";
  title: string; details?: string; description?: string; location?: string; address?: string;
  price: number; date?: string; createdAt?: string; scheduledAt?: string;
  customerRating?: string; customerReview?: string; propertyName?: string;
}
export interface ProviderProfile {
  id: string; userId: string; serviceId?: string; bio?: string;
  status: string; rating: string; totalJobs: string; earnings: string;
}
export interface Notification {
  id: string; userId: string; title: string; message: string;
  type: string; jobId?: string; read: boolean; createdAt: string;
}

export const SERVICES: Service[] = [
  { id: "plumbing", name: "Plumbing", icon: Wrench, basePrice: 450, description: "Leak repairs, pipe installation, and drain unblocking." },
  { id: "electrical", name: "Electrical", icon: Zap, basePrice: 550, description: "Wiring, DB boards, lighting, and surge protection." },
  { id: "cleaning", name: "Cleaning", icon: Sparkles, basePrice: 350, description: "Deep cleaning, move-in/out, and standard domestic cleaning." },
  { id: "handyman", name: "Handyman", icon: Hammer, basePrice: 400, description: "General repairs, mounting, assembly, and maintenance." },
  { id: "appliance", name: "Appliances", icon: Microwave, basePrice: 500, description: "Fridges, washing machines, ovens, and small appliances." },
  { id: "gardening", name: "Gardening", icon: Leaf, basePrice: 300, description: "Lawn care, garden maintenance, pruning, and landscaping." },
  { id: "pest_control", name: "Pest Control", icon: Bug, basePrice: 400, description: "Fumigation, rodent control, termites, and general pest removal." },
];

interface AppContextType {
  user: User | null; loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  jobs: Job[]; jobsLoading: boolean;
  addJob: (job: { serviceId: string; title: string; description?: string; address: string; price?: number; scheduledAt?: string }) => Promise<void>;
  updateJobStatus: (jobId: string, status: Job["status"]) => Promise<void>;
  releaseEscrow: (jobId: string) => Promise<void>;
  holdEscrow: (jobId: string) => Promise<void>;
  assignProvider: (jobId: string, providerId: string) => Promise<void>;
  submitReview: (jobId: string, rating: number, review: string) => Promise<void>;
  providers: ProviderProfile[];
  providerProfile: ProviderProfile | null;
  services: Service[];
  isMobile: boolean;
  refreshJobs: () => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options, credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function AppProvider({ children }: { children: ReactNode }): any {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    apiFetch("/api/me").then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const refreshJobs = useCallback(async () => {
    if (!user) return;
    setJobsLoading(true);
    try { setJobs(await apiFetch("/api/jobs")); } catch (e) { console.error(e); }
    finally { setJobsLoading(false); }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try { setNotifications(await apiFetch("/api/notifications")); } catch (e) { console.error(e); }
  }, [user]);

  const loadProviderProfile = useCallback(async () => {
    if (!user || user.role !== "provider") { setProviderProfile(null); return; }
    try { setProviderProfile(await apiFetch("/api/providers/me")); } catch { setProviderProfile(null); }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshJobs(); refreshNotifications(); loadProviderProfile();
      if (user.role === "admin") apiFetch("/api/providers").then(setProviders).catch(console.error);
    } else { setJobs([]); setNotifications([]); setProviderProfile(null); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const i = setInterval(refreshNotifications, 15000);
    return () => clearInterval(i);
  }, [user, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const clearSession = () => {
    setJobs([]); setNotifications([]); setProviderProfile(null); setProviders([]);
  };

  const login = async (email: string, password: string) => {
    if (user) { try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {} clearSession(); }
    const u = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setUser(u);
  };

  const register = async (data: any) => {
    if (user) { try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {} clearSession(); }
    const u = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
    setUser(u);
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null); clearSession();
  };

  const addJob = async (d: any) => {
    const svc = SERVICES.find(s => s.id === d.serviceId);
    const job = await apiFetch("/api/jobs", { method: "POST", body: JSON.stringify({ ...d, price: d.price || svc?.basePrice || 0 }) });
    setJobs(prev => [job, ...prev]);
  };
  const updateJobStatus = async (jobId: string, status: Job["status"]) => {
    const job = await apiFetch(`/api/jobs/${jobId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
  };
  const holdEscrow = async (jobId: string) => {
    const job = await apiFetch(`/api/jobs/${jobId}/escrow/hold`, { method: "PATCH" });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
  };
  const releaseEscrow = async (jobId: string) => {
    const job = await apiFetch(`/api/jobs/${jobId}/escrow/release`, { method: "PATCH" });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
  };
  const assignProvider = async (jobId: string, providerId: string) => {
    const job = await apiFetch(`/api/jobs/${jobId}/assign`, { method: "PATCH", body: JSON.stringify({ providerId }) });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
  };
  const submitReview = async (jobId: string, rating: number, review: string) => {
    const job = await apiFetch(`/api/jobs/${jobId}/review`, { method: "PATCH", body: JSON.stringify({ rating: String(rating), review }) });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...job } : j));
  };
  const markNotificationRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = async () => {
    await apiFetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      user, loading, setUser, login, register, logout,
      jobs, jobsLoading, addJob, updateJobStatus, holdEscrow, releaseEscrow, assignProvider, submitReview,
      providers, providerProfile, services: SERVICES, isMobile, refreshJobs,
      notifications, unreadCount, refreshNotifications, markNotificationRead, markAllRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
