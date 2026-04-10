import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ShieldCheck, Home, Briefcase, ArrowLeft } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; canRegister: boolean; registerHref?: string; description: string }> = {
  customer: {
    label: "Individual",
    icon: Home,
    color: "#F4C430",
    canRegister: true,
    description: "Book trusted home service professionals",
  },
  property_manager: {
    label: "Property Manager",
    icon: Briefcase,
    color: "#F4C430",
    canRegister: true,
    description: "Manage services across multiple properties",
  },
  company: {
    label: "Company",
    icon: Briefcase,
    color: "#F4C430",
    canRegister: true,
    description: "Business services and property management",
  },
  provider: {
    label: "Service Provider",
    icon: ShieldCheck,
    color: "#111111",
    canRegister: false,
    registerHref: "/provider/signup",
    description: "Sign in to your provider account",
  },
};

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export default function Auth() {
  const params = useParams<{ role: string }>();
  const role = params.role || "customer";
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.customer;
  const Icon = config.icon;

  const { setUser } = useApp();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const redirectAfterAuth = (userRole: string) => {
    if (userRole === "provider") setLocation("/provider/jobs");
    else if (userRole === "admin") setLocation("/admin/dashboard");
    else setLocation("/customer/home");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setError("Please enter your email and password."); return; }
    setError(""); setIsLoading(true);
    try {
      const user = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setUser(user);
      redirectAfterAuth(user.role);
    } catch (e: any) {
      setError(e.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) { setError("Please fill in all required fields."); return; }
    if (regPassword !== regConfirm) { setError("Passwords don't match."); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setIsLoading(true);
    try {
      const user = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: regEmail, password: regPassword, fullName: regName, phone: regPhone, role }),
      });
      setUser(user);
      redirectAfterAuth(user.role);
    } catch (e: any) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-[#111111] transition-colors mb-6 uppercase tracking-widest">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-[#111111] p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: config.color }}>
              <Icon className="w-7 h-7" style={{ color: config.color === "#111111" ? "#F4C430" : "#111111" }} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              {config.canRegister ? "Welcome to MENDA" : "Provider Sign In"}
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">{config.description}</p>

            {config.canRegister && (
              <div className="flex mt-6 bg-white/10 rounded-full p-1 gap-1">
                <button
                  onClick={() => { setTab("login"); setError(""); }}
                  className={`flex-1 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${tab === "login" ? "bg-[#F4C430] text-[#111111]" : "text-white/60 hover:text-white"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setTab("register"); setError(""); }}
                  className={`flex-1 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${tab === "register" ? "bg-[#F4C430] text-[#111111]" : "text-white/60 hover:text-white"}`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          <div className="p-8">
            {(tab === "login" || !config.canRegister) && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <Input
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Input
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold"
                    autoComplete="current-password"
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 font-black uppercase tracking-widest text-[11px] bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] transition-all rounded-full shadow-xl">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
                {!config.canRegister && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Not yet a provider?{" "}
                    <Link href="/provider/signup">
                      <span className="font-black text-[#111111] hover:text-[#F4C430] cursor-pointer transition-colors underline underline-offset-2">
                        Apply to join
                      </span>
                    </Link>
                  </p>
                )}
              </form>
            )}

            {tab === "register" && config.canRegister && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="John Dlamini"
                    className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} type="email" placeholder="you@example.com"
                      className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</Label>
                    <Input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="081 234 5678"
                      className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Input value={regPassword} onChange={e => setRegPassword(e.target.value)} type="password" placeholder="Min 8 characters"
                    className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                  <Input value={regConfirm} onChange={e => setRegConfirm(e.target.value)} type="password" placeholder="••••••••"
                    className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
                </div>
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                <Button type="submit" disabled={isLoading}
                  className="w-full h-12 font-black uppercase tracking-widest text-[11px] bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] transition-all rounded-full shadow-xl">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
