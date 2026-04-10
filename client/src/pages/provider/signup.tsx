import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, Link } from "wouter";
import { ShieldCheck, Loader2, Upload, CheckCircle, ArrowLeft, FileText } from "lucide-react";

function FileUploadField({ label, hint, onChange }: { label: string; hint: string; onChange: (b64: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { onChange(null); setFileName(null); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
      <button type="button" onClick={() => ref.current?.click()} className="w-full h-16 border-2 border-dashed border-[#F4C430]/40 hover:border-[#F4C430] rounded-xl bg-[#F7F7F7] hover:bg-[#F4C430]/5 transition-all flex items-center justify-center gap-3 group">
        <Upload className="w-5 h-5 text-[#111111]/30 group-hover:text-[#F4C430] transition-colors" />
        <span className="text-xs font-bold text-[#111111]/50 group-hover:text-[#111111] transition-colors">{fileName || hint}</span>
        {fileName && <CheckCircle className="w-4 h-4 text-green-500" />}
      </button>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function ProviderSignup() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [service, setService] = useState("");
  const [qualDoc, setQualDoc] = useState<string | null>(null);
  const [idDoc, setIdDoc] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !service) { setError("Please fill in all required fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone, role: "provider" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Registration failed" }));
        throw new Error(err.error || "Registration failed");
      }
      const applyRes = await fetch("/api/providers/apply", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: `${service} professional`, serviceId: service, qualificationsDoc: qualDoc || null, idDocument: idDoc || null }),
      });
      if (!applyRes.ok) {
        await fetch("/api/providers/signup", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: `${service} professional`, serviceId: service }),
        });
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally { setIsLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-center">
          <div className="bg-[#111111] p-10">
            <div className="w-16 h-16 rounded-full bg-[#F4C430] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#111111]" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Application Submitted</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">We'll review your details</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-[#111111]/70 leading-relaxed font-medium">Thank you for applying to MENDA. Our team will review your qualifications and get back to you within 2–3 business days.</p>
            <p className="text-xs text-[#111111]/40 font-bold uppercase tracking-wider">You'll receive an email once you're approved.</p>
            <Button onClick={() => setLocation("/auth/provider")} className="w-full h-12 font-black uppercase tracking-widest text-[11px] bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] transition-all rounded-full shadow-xl">
              Sign In to Your Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-lg">
        <Link href="/"><button className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-[#111111] transition-colors mb-6 uppercase tracking-widest"><ArrowLeft className="w-3.5 h-3.5" /> Back to Home</button></Link>
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-[#111111] p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F4C430] flex items-center justify-center mx-auto mb-4 shadow-lg"><ShieldCheck className="w-6 h-6 text-[#111111]" /></div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Apply as a Provider</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">South Africa's Premium Service Network</p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Dlamini" className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="081 234 5678" className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address *</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password *</Label>
              <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min 8 characters" className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Category *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F7F7F7] border-none font-bold"><SelectValue placeholder="Select your primary skill" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="plumbing" className="font-bold">Plumbing</SelectItem>
                  <SelectItem value="electrical" className="font-bold">Electrical</SelectItem>
                  <SelectItem value="cleaning" className="font-bold">Cleaning</SelectItem>
                  <SelectItem value="handyman" className="font-bold">Handyman</SelectItem>
                  <SelectItem value="appliance" className="font-bold">Appliances</SelectItem>
                  <SelectItem value="gardening" className="font-bold">Gardening</SelectItem>
                  <SelectItem value="pest_control" className="font-bold">Pest Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t border-[#F4C430]/20 pt-5 space-y-4">
              <div className="flex items-start gap-3 bg-[#F4C430]/5 border border-[#F4C430]/20 rounded-xl p-4">
                <FileText className="w-4 h-4 text-[#F4C430] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-[#111111]/60 leading-relaxed">
                  <span className="text-[#111111] font-black block mb-1 uppercase tracking-wider text-[10px]">Documents Required</span>
                  We verify every provider before they go live. Upload your trade certification and a copy of your South African ID. FICA compliance is required for all financial transactions.
                </p>
              </div>
              <FileUploadField label="Trade Qualification / Certification" hint="Upload certificate (PDF or image)" onChange={setQualDoc} />
              <FileUploadField label="Copy of South African ID" hint="Upload ID document (PDF or image)" onChange={setIdDoc} />
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <Button type="submit" disabled={isLoading} className="w-full h-12 font-black uppercase tracking-widest text-[11px] bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] transition-all rounded-full shadow-xl">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Submit Application
            </Button>
            <p className="text-center text-xs text-muted-foreground">Already a provider?{" "}<Link href="/auth/provider"><span className="font-black text-[#111111] hover:text-[#F4C430] cursor-pointer transition-colors underline underline-offset-2">Sign in here</span></Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
