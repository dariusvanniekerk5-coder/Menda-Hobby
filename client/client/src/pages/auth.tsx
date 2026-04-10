import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2, Loader2, ArrowRight, Briefcase } from "lucide-react";
import type { UserRole } from "@/lib/store";

interface RoleOption {
  id: string;
  label: string;
  desc: string;
  icon: any;
  dbRole: UserRole;
  isCompany: boolean;
}

const ROLES: RoleOption[] = [
  { id: "individual", label: "Individual", desc: "I need a home service pro", icon: Home, dbRole: "customer", isCompany: false },
  { id: "company", label: "Company", desc: "Business requiring property services", icon: Briefcase, dbRole: "customer", isCompany: true },
  { id: "property_manager", label: "Property Manager", desc: "I manage multiple estates", icon: Building2, dbRole: "property_manager", isCompany: true },
];

export default function Auth() {
  const { login, register, user } = useApp();
  const [, setLocation] = useLocation();
  const [matchCustomer] = useRoute("/auth/customer");
  const [matchPM] = useRoute("/auth/property_manager");
  const [matchCompany] = useRoute("/auth/company");

  // Derive initial role from URL
  const getInitialRole = () => {
    if (matchPM) return ROLES.find(r => r.id === "property_manager") || null;
    if (matchCompany) return ROLES.find(r => r.id === "company") || null;
    if (matchCustomer) return ROLES.find(r => r.id === "individual") || null;
    return null;
  };

  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(getInitialRole);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regCompanyReg, setRegCompanyReg] = useState("");

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const path = user.role === "provider" ? "/provider/jobs" : user.role === "admin" ? "/admin/dashboard" : "/customer/home";
      setLocation(path);
    }
  }, [user]);

  const redirect = (role: UserRole) => {
    const path = role === "provider" ? "/provider/jobs" : role === "admin" ? "/admin/dashboard" : "/customer/home";
    setLocation(path);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail.trim()) return setError("Please enter your email");
    if (!loginPassword) return setError("Please enter your password");
    setIsLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      // redirect handled by useEffect above
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return setError("Please select a role");
    setError("");
    if (!regEmail.trim()) return setError("Please enter your email");
    if (!regPassword || regPassword.length < 6) return setError("Password must be at least 6 characters");
    if (!regName.trim() && !regCompanyName.trim()) return setError("Please enter your name");
    setIsLoading(true);
    try {
      const fullName = selectedRole.isCompany
        ? regCompanyName + (regName ? " — " + regName : "")
        : regName;
      await register({
        email: regEmail.trim(),
        password: regPassword,
        fullName: fullName.trim(),
        phone: regPhone,
        role: selectedRole.dbRole,
      });
      // redirect handled by useEffect above
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setError("");
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6b328]/20 via-[#d4a520]/15 to-[#c49a1c]/20 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full bg-[#F4C430]/15 animate-pulse" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#F4C430]/10 animate-pulse" style={{ animationDelay: "1.5s" }} />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <img src="/menda-logo.jpg" alt="Menda" className="h-28 w-auto object-contain drop-shadow-2xl" />
            </div>
            <h1 className="text-3xl font-black text-[#111111] tracking-tight">Welcome to MENDA</h1>
            <p className="text-[#b8941e] text-xs font-black uppercase tracking-[0.3em] mt-1.5">Fast · Reliable · Trusted</p>
            <p className="text-[#111111]/50 text-sm mt-2.5 font-medium">Select your account type to continue</p>
          </div>

          <Tabs defaultValue="login" onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="w-full mb-5 bg-[#8C8C8C]/20 backdrop-blur rounded-2xl p-1.5 border border-[#8C8C8C]/30 shadow-lg">
              <TabsTrigger value="login" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#F4C430] data-[state=active]:text-[#111111] data-[state=active]:shadow-md h-10">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#F4C430] data-[state=active]:text-[#111111] data-[state=active]:shadow-md h-10">Register</TabsTrigger>
            </TabsList>
            {["login", "register"].map((tabVal) => (
              <TabsContent key={tabVal} value={tabVal}>
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <button key={role.id} onClick={() => handleRoleSelect(role)}
                      className="w-full flex items-center gap-4 p-5 bg-white/90 backdrop-blur rounded-2xl border-2 border-[#F4C430]/20 hover:border-[#F4C430] hover:shadow-2xl hover:shadow-[#F4C430]/20 hover:scale-[1.02] transition-all duration-300 text-left group">
                      <div className="w-14 h-14 rounded-2xl bg-[#F4C430] flex items-center justify-center shadow-lg shadow-[#F4C430]/30 group-hover:shadow-xl flex-shrink-0">
                        <role.icon className="w-7 h-7 text-[#111111]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg text-[#111111]">{role.label}</p>
                        <p className="text-sm text-[#111111]/50 font-medium">{role.desc}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#F4C430]/10 flex items-center justify-center group-hover:bg-[#F4C430] transition-colors flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-[#111111]/30 group-hover:text-[#111111] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <p className="text-center text-xs text-[#111111]/40 mt-5 font-medium">
            Providers: <button onClick={() => setLocation("/provider/signup")} className="text-[#F4C430] font-black hover:underline">Apply here</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6b328]/20 via-[#d4a520]/15 to-[#c49a1c]/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full bg-[#F4C430]/15 animate-pulse" />

      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl relative z-10 overflow-hidden bg-white/95 backdrop-blur">
        <div className="h-1.5 bg-gradient-to-r from-[#F4C430] via-[#e6b328] to-[#111111]" />

        <CardHeader className="pb-2 pt-6 px-7">
          <button onClick={() => { setSelectedRole(null); setError(""); }} className="text-xs text-muted-foreground hover:text-[#111111] mb-3 flex items-center gap-1 font-bold">
            ← Back
          </button>
          <div className="flex justify-center mb-3">
            <img src="/menda-logo.jpg" alt="Menda" className="h-16 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3 mb-1 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F4C430] flex items-center justify-center shadow-lg shadow-[#F4C430]/30 flex-shrink-0">
              <selectedRole.icon className="w-6 h-6 text-[#111111]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-[#111111]">{selectedRole.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{selectedRole.desc}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-7 pb-7">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "register"); setError(""); }}>
            <TabsList className="w-full mb-5 bg-[#F7F7F7] rounded-xl p-1">
              <TabsTrigger value="login" className="flex-1 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#F4C430] data-[state=active]:text-[#111111] h-9">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-lg font-black text-xs uppercase tracking-widest data-[state=active]:bg-[#F4C430] data-[state=active]:text-[#111111] h-9">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">Email</Label>
                  <Input
                    value={loginEmail}
                    onChange={e => { setLoginEmail(e.target.value); setError(""); }}
                    type="email"
                    placeholder={selectedRole.isCompany ? "company@email.com" : "your@email.com"}
                    className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">Password</Label>
                  <Input
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setError(""); }}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" disabled={isLoading} className="w-full h-13 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl shadow-[#F4C430]/30 transition-all mt-2" style={{ height: "52px" }}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  No account? <button type="button" onClick={() => setTab("register")} className="text-[#F4C430] font-black hover:underline">Register here</button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3.5">
                {selectedRole.isCompany && (
                  <>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest">Company Name</Label>
                      <Input value={regCompanyName} onChange={e => { setRegCompanyName(e.target.value); setError(""); }} placeholder="e.g. Sandton Property Group" className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" required />
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest">Company Reg. Number <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span></Label>
                      <Input value={regCompanyReg} onChange={e => setRegCompanyReg(e.target.value)} placeholder="e.g. 2024/123456/07" className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" />
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">{selectedRole.isCompany ? "Contact Person" : "Full Name"}</Label>
                  <Input value={regName} onChange={e => { setRegName(e.target.value); setError(""); }} placeholder={selectedRole.isCompany ? "Contact person's name" : "Your full name"} className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" required />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">Email</Label>
                  <Input value={regEmail} onChange={e => { setRegEmail(e.target.value); setError(""); }} type="email" placeholder={selectedRole.isCompany ? "info@company.co.za" : "your@email.com"} className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" required autoComplete="email" />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">Phone <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span></Label>
                  <Input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="072 000 0000" className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest">Password</Label>
                  <Input value={regPassword} onChange={e => { setRegPassword(e.target.value); setError(""); }} type="password" placeholder="Min. 6 characters" className="mt-1 rounded-xl border-2 focus:border-[#F4C430] h-12" required autoComplete="new-password" />
                </div>
                {error && <p className="text-red-500 text-xs font-bold bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" disabled={isLoading} className="w-full bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl shadow-[#F4C430]/30 transition-all mt-1" style={{ height: "52px" }}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Have an account? <button type="button" onClick={() => setTab("login")} className="text-[#F4C430] font-black hover:underline">Sign in</button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
