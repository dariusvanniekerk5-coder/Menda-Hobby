import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, DollarSign, TrendingUp, ShieldCheck, Clock, AlertCircle, Zap, LayoutDashboard, CheckCircle2, XCircle, Mail, Phone, ChevronRight, User, Loader2, MapPin, Calendar, LogOut } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Failed" })); throw new Error(e.error); }
  return res.json();
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────
export function AdminDashboard() {
  const { jobs, providers } = useApp();
  const completed = jobs.filter(j => j.status === "completed" || j.status === "paid");
  const pending = jobs.filter(j => j.status === "pending");
  const active = jobs.filter(j => j.status === "accepted" || j.status === "in_progress");
  const pendingProvs = providers.filter((p: any) => p.status === "pending");
  const mendaEarnings = completed.reduce((a, j) => a + Number(j.price || 0) * 0.2, 0);

  const stats = [
    { label: "Active Jobs", value: active.length, icon: Zap, color: "bg-blue-500" },
    { label: "Pending Jobs", value: pending.length, icon: Clock, color: "bg-amber-500" },
    { label: "Providers to Vet", value: pendingProvs.length, icon: ShieldCheck, color: "bg-red-500" },
    { label: "Menda Earnings", value: `R ${mendaEarnings.toLocaleString()}`, icon: TrendingUp, color: "bg-green-500" },
  ];

  return (
    <div className="container px-4 py-8 space-y-8 pb-24 bg-[#F7F7F7] min-h-screen">
      <div><div className="flex items-center gap-2 mb-1"><LayoutDashboard className="w-4 h-4 text-[#F4C430]" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Oversight</span></div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Admin Console</h1></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (<Card key={s.label} className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-5"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3", s.color)}><s.icon className="w-5 h-5" /></div><p className="text-2xl font-black text-[#111111]">{s.value}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p></CardContent></Card>))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingProvs.length > 0 && (<Link href="/admin/providers"><Card className="border-2 border-red-200 bg-red-50 hover:border-red-300 cursor-pointer rounded-2xl"><CardContent className="p-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white"><AlertCircle className="w-5 h-5" /></div><div><p className="font-black text-red-800">{pendingProvs.length} provider{pendingProvs.length > 1 ? "s" : ""} awaiting vetting</p><p className="text-xs text-red-600/70">Tap to review</p></div></div><ChevronRight className="w-5 h-5 text-red-400" /></CardContent></Card></Link>)}
        <Link href="/admin/jobs"><Card className="border-border bg-white hover:border-[#F4C430] cursor-pointer rounded-2xl shadow-sm"><CardContent className="p-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center text-white"><Briefcase className="w-5 h-5" /></div><div><p className="font-black text-[#111111]">{jobs.length} total jobs</p><p className="text-xs text-muted-foreground">View all activity</p></div></div><ChevronRight className="w-5 h-5 text-muted-foreground" /></CardContent></Card></Link>
      </div>
    </div>
  );
}

// ─── ADMIN PROVIDERS ──────────────────────────────────────
export function AdminProviders() {
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending"|"verified"|"rejected">("pending");

  const load = useCallback(async () => { try { setAll(await apiFetch("/api/providers")); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const vet = async (id: string, status: string) => {
    setActionId(id);
    try { await apiFetch(`/api/providers/${id}/vet`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch {} finally { setActionId(null); }
  };

  const filtered = all.filter(p => p.status === tab);
  const counts = { pending: all.filter(p => p.status === "pending").length, verified: all.filter(p => p.status === "verified").length, rejected: all.filter(p => p.status === "rejected").length };

  return (
    <div className="container px-4 py-8 space-y-6 pb-24 bg-[#F7F7F7] min-h-screen">
      <div><div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-[#F4C430]" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Provider Management</span></div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Vet Providers</h1></div>
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-border">
        {(["pending","verified","rejected"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", tab === t ? "bg-[#111111] text-white" : "text-muted-foreground")}>
            {t} <span className={cn("min-w-[20px] h-5 rounded-full text-[10px] flex items-center justify-center px-1.5", tab === t ? "bg-[#F4C430] text-[#111111]" : "bg-[#F7F7F7]")}>{counts[t]}</span>
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#F4C430]" /></div> :
       filtered.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-dashed"><Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm font-bold text-muted-foreground">No {tab} providers</p></div> :
       <div className="space-y-4">{filtered.map(p => (
         <Card key={p.id} className="border-border shadow-sm bg-white rounded-2xl overflow-hidden"><CardContent className="p-0">
           <div className="p-5 space-y-3">
             <div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-[#F4C430]/10 flex items-center justify-center"><User className="w-6 h-6 text-[#F4C430]" /></div><div><p className="font-black">{p.userName}</p><div className="flex items-center gap-3 mt-0.5"><span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {p.userEmail}</span>{p.userPhone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {p.userPhone}</span>}</div></div></div>
               <Badge className={cn("text-[9px] font-black uppercase border-none", p.status === "verified" ? "bg-green-100 text-green-800" : p.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800")}>{p.status}</Badge></div>
             {p.bio && <p className="text-xs text-muted-foreground bg-[#F7F7F7] p-3 rounded-xl">{p.bio}</p>}
           </div>
           {p.status === "pending" && <div className="border-t p-4 flex gap-3 bg-[#F7F7F7]">
             <Button variant="outline" className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] border-red-200 text-red-600" onClick={() => vet(p.id, "rejected")} disabled={actionId === p.id}>{actionId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" />Reject</>}</Button>
             <Button className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] bg-green-600 hover:bg-green-700 text-white" onClick={() => vet(p.id, "verified")} disabled={actionId === p.id}>{actionId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Approve</>}</Button>
           </div>}
           {p.status === "verified" && <div className="border-t p-4 bg-[#F7F7F7]"><Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] border-red-200 text-red-600" onClick={() => vet(p.id, "rejected")} disabled={actionId === p.id}>Revoke</Button></div>}
           {p.status === "rejected" && <div className="border-t p-4 bg-[#F7F7F7]"><Button className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] bg-[#F4C430] text-[#111111]" onClick={() => vet(p.id, "verified")} disabled={actionId === p.id}>Approve</Button></div>}
         </CardContent></Card>
       ))}</div>}
    </div>
  );
}

// ─── ADMIN JOBS ───────────────────────────────────────────
export function AdminJobs() {
  const { jobs, services } = useApp();
  const [sf, setSf] = useState("all");
  const filtered = sf === "all" ? jobs : jobs.filter(j => j.status === sf);
  const fmt = (d: string | undefined) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }); } catch { return "—"; } };

  return (
    <div className="container px-4 py-8 space-y-6 pb-24 bg-[#F7F7F7] min-h-screen">
      <div><h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">All Jobs</h1></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all","pending","accepted","in_progress","completed","paid","cancelled"].map(s => (
          <button key={s} onClick={() => setSf(s)} className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap", sf === s ? "bg-[#111111] text-white" : "bg-white text-muted-foreground border border-border")}>{s === "all" ? "All" : s.replace("_"," ")}</button>
        ))}
      </div>
      <div className="space-y-3">{filtered.map(j => {
        const svc = services.find(s => s.id === j.serviceId);
        return (<Card key={j.id} className="border-border shadow-sm bg-white rounded-xl"><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{j.title || "—"}</p><p className="text-[10px] text-muted-foreground font-bold mt-0.5">{svc?.name}</p></div><Badge className={cn("text-[9px] h-5 uppercase font-black border-none ml-2", j.status === "paid" ? "bg-green-100 text-green-800" : j.status === "completed" ? "bg-blue-100 text-blue-800" : j.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-[#F4C430]/20 text-[#111111]")}>{(j.status||"").replace("_"," ")}</Badge></div><div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.address||"—"}</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(j.createdAt)}</span><span>R {Number(j.price||0).toLocaleString()}</span></div></CardContent></Card>);
      })}</div>
    </div>
  );
}

// ─── CUSTOMER PROFILE ─────────────────────────────────────
export function CustomerProfile() {
  const { user, logout, jobs } = useApp();
  const done = jobs.filter(j => j.status === "completed" || j.status === "paid");
  const spent = done.reduce((s, j) => s + Number(j.price || 0), 0);
  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 space-y-6 pb-24">
      <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Profile</h1>
      <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-6 flex items-center gap-4">
        <img src={user?.avatar} alt="" className="w-16 h-16 rounded-2xl bg-[#F7F7F7] border-2 border-[#F4C430]" />
        <div><h2 className="font-black text-xl">{user?.name}</h2><p className="text-xs text-muted-foreground">{user?.email}</p><Badge className="mt-1 text-[9px] font-black uppercase bg-[#F4C430]/20 text-[#111111] border-none">{user?.role}</Badge></div>
      </CardContent></Card>
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-5 text-center"><p className="text-2xl font-black">{done.length}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Jobs Done</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-5 text-center"><p className="text-2xl font-black">R {spent.toLocaleString()}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total Spent</p></CardContent></Card>
      </div>
      <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs border-red-200 text-red-600 hover:bg-red-50 gap-2"><LogOut className="w-4 h-4" /> Sign Out</Button>
    </div>
  );
}

// ─── PROVIDER PROFILE ─────────────────────────────────────
export function ProviderProfile() {
  const { user, logout, providerProfile } = useApp();
  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 space-y-6 pb-24">
      <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Profile</h1>
      <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-6 flex items-center gap-4">
        <img src={user?.avatar} alt="" className="w-16 h-16 rounded-2xl bg-[#F7F7F7] border-2 border-[#F4C430]" />
        <div><h2 className="font-black text-xl">{user?.name}</h2><p className="text-xs text-muted-foreground">{user?.email}</p>
          <Badge className={cn("mt-1 text-[9px] font-black uppercase border-none", providerProfile?.status === "verified" ? "bg-green-100 text-green-800" : providerProfile?.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800")}>{providerProfile?.status || "pending"}</Badge></div>
      </CardContent></Card>
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-4 text-center"><p className="text-xl font-black">{providerProfile?.totalJobs || 0}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Jobs</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-4 text-center"><p className="text-xl font-black text-[#F4C430]">{providerProfile?.rating || "—"}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Rating</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl"><CardContent className="p-4 text-center"><p className="text-xl font-black text-green-600">R {Number(providerProfile?.earnings || 0).toLocaleString()}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Earned</p></CardContent></Card>
      </div>
      <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs border-red-200 text-red-600 hover:bg-red-50 gap-2"><LogOut className="w-4 h-4" /> Sign Out</Button>
    </div>
  );
}

