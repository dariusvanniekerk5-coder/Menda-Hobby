import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, CheckCircle, Award, FileCheck, UserCheck, Star } from "lucide-react";
import { useApp } from "@/lib/store";

export default function Landing() {
  const { user } = useApp();
  const [, setLocation] = useLocation();

  const handleBookService = () => {
    if (user) setLocation("/customer/home");
    else setLocation("/auth/customer");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1600&q=80" alt="Professional home service" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/70 to-[#111111]/90 sm:bg-gradient-to-r sm:from-[#111111]/90 sm:via-[#111111]/65 sm:to-transparent" />
        </div>
        {/* Top bar: logo + sign in */}
        <div className="relative z-20 flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-7">
          <img src="/menda-logo.jpg" alt="Menda" className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-xl" />
          <Button onClick={() => setLocation("/auth/customer")} variant="outline" className="h-9 px-5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white hover:text-[#111111] rounded-full">
            Sign In
          </Button>
        </div>
        {/* Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="container px-5 sm:px-8 py-10 sm:py-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[#F4C430] text-[#111111] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-5 shadow-xl">
                <Shield className="w-3 h-3" /> Escrow-Protected Payments
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 tracking-tight text-white leading-[1.05]">
                Trusted Services for<br />Homes & Businesses —{" "}
                <span className="text-[#F4C430]">Pay Only When It's Done</span>
              </h1>
              <p className="text-base sm:text-lg text-white/70 max-w-lg mb-7 font-medium leading-relaxed">
                Plumbing, electrical, handyman & cleaning — and more. Vetted experts, escrow-protected payments.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Vetted Professionals", "Escrow Protected", "Instant Booking", "Rated & Reviewed"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 bg-white/10 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3 h-3 text-[#F4C430]" /> {t}
                  </div>
                ))}
              </div>
              <Button onClick={handleBookService} size="lg" className="h-14 px-10 text-xs font-black uppercase tracking-widest bg-[#F4C430] text-[#111111] hover:bg-white shadow-2xl transition-all rounded-full border-none">
                Book a Service <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-[#111111] py-8">
        <div className="container px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[{ num: "7", label: "Service Categories" }, { num: "100%", label: "Vetted Providers" }, { num: "Escrow", label: "Protected Payments" }, { num: "24/7", label: "Support Available" }].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-[#F4C430]">{s.num}</p>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F4C430]/20 text-[#111111] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">How It Works</div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] tracking-tight">Your money is always safe</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">Our escrow system holds your payment until you confirm the job is done to your satisfaction.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Book & Pay", desc: "Choose your service and pay securely. Your funds are held in escrow — not released until you approve." },
              { step: "2", title: "Pro Gets to Work", desc: "A vetted professional arrives and completes the job. You can track progress in real-time." },
              { step: "3", title: "Approve & Release", desc: "Happy with the work? Tap to release payment. Not satisfied? Raise a dispute — we'll resolve it." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#F4C430] text-[#111111] font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">{s.step}</div>
                <h3 className="font-black text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider section */}
      <section className="py-20 sm:py-24 bg-[#111111] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F4C430]/5 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="container px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#F4C430]/10 border border-[#F4C430]/20 text-[#F4C430] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Award className="w-3 h-3" /> For Professionals Only
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
              We Only Work With<br /><span className="text-[#F4C430]">The Best</span>
            </h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
              MENDA is selective by design. Every provider on our platform is personally vetted, properly qualified, and background-checked before they ever see a job. We require certified trade qualifications for skilled work — not just anyone gets listed. If you're a skilled professional with the credentials to prove it, we'd like to hear from you.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-12">
            {[
              { icon: FileCheck, title: "Trade Certification", desc: "Valid qualification for your field" },
              { icon: UserCheck, title: "South African ID", desc: "Copy of valid SA ID document" },
              { icon: Shield, title: "Clean Record", desc: "Verifiable professional track record" },
              { icon: Star, title: "FICA Compliant", desc: "Required for all payment transactions" },
            ].map((r) => (
              <div key={r.title} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 text-center hover:border-[#F4C430]/30 transition-all">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F4C430]/10 flex items-center justify-center mx-auto mb-3">
                  <r.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4C430]" />
                </div>
                <p className="font-black text-white text-xs sm:text-sm mb-1">{r.title}</p>
                <p className="text-white/40 text-[11px] leading-relaxed hidden sm:block">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-5">Think you qualify?</p>
            <Link href="/provider/signup">
              <Button size="lg" className="h-14 px-10 text-xs font-black uppercase tracking-widest bg-[#F4C430] text-[#111111] hover:bg-white shadow-2xl transition-all rounded-full border-none">
                Apply to Join as a Provider <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-white/20 text-xs mt-4">
              Already a provider?{" "}
              <Link href="/auth/provider"><span className="text-white/40 hover:text-[#F4C430] cursor-pointer transition-colors underline underline-offset-2">Sign in here</span></Link>
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#0a0a0a] py-8">
        <div className="container px-6 text-center">
          <img src="/menda-logo.jpg" alt="Menda" className="h-10 w-auto object-contain mx-auto mb-4 opacity-50" />
          <p className="text-white/20 text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} Menda · South Africa's Trusted Home Services Marketplace</p>
        </div>
      </footer>
    </div>
  );
}
