import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, CheckCircle, MessageCircle } from "lucide-react";
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
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1600&q=80"
            alt="Professional home service"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/90 via-[#111111]/60 to-transparent" />
        </div>

        <div className="container relative z-10 px-5 py-16 md:py-20">
          <div className="max-w-2xl">
            {/* Logo + tagline proportionally balanced */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src="/menda-logo.jpg"
                alt="Menda"
                className="h-14 md:h-16 w-auto object-contain drop-shadow-xl flex-shrink-0"
              />
              <div className="inline-flex items-center gap-2 bg-[#F4C430] text-[#111111] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                <Shield className="w-3 h-3 flex-shrink-0" /> Escrow-Protected
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black mb-5 tracking-tighter text-white leading-[1.05]">
              Trusted Services for Homes &amp; Businesses —{" "}
              <span className="text-[#F4C430]">Pay Only When It's Done</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-xl mb-7 font-medium leading-relaxed">
              Plumbing, electrical, cleaning, pest control, gardening and more. Vetted experts with escrow-protected payments — your money is safe until the job is done.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {["Vetted Professionals", "Escrow Protected", "Instant Booking", "Rated & Reviewed"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 bg-white/10 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold">
                  <CheckCircle className="w-3 h-3 text-[#F4C430] flex-shrink-0" /> {t}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBookService}
                size="lg"
                className="h-12 md:h-14 px-8 text-xs font-black uppercase tracking-widest bg-[#F4C430] text-[#111111] hover:bg-white shadow-2xl transition-all rounded-full border-none"
              >
                Book a Service <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Link href="/provider/signup">
                <Button variant="outline" size="lg" className="h-12 md:h-14 px-8 text-xs font-black uppercase tracking-widest bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white hover:text-[#111111] rounded-full">
                  Become a Provider
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-[#111111] py-7">
        <div className="container px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
            {[
              { num: "7", label: "Service Categories" },
              { num: "100%", label: "Vetted Providers" },
              { num: "Escrow", label: "Protected Payments" },
              { num: "24/7", label: "AI Support" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-[#F4C430]">{s.num}</p>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How Escrow Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container px-5">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#F4C430]/20 text-[#111111] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">How It Works</div>
            <h2 className="text-3xl md:text-4xl font-black text-[#111111] tracking-tight">Your money is always safe</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">Our escrow system holds your payment until you confirm the job is done to your satisfaction.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-7 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Book & Pay", desc: "Choose your service and pay securely. Your funds are held in escrow — not released until you approve." },
              { step: "2", title: "Pro Gets to Work", desc: "A vetted professional arrives and completes the job. You can track progress in real-time." },
              { step: "3", title: "Approve & Release", desc: "Happy with the work? Tap to release payment. Not satisfied? Raise a dispute — we'll resolve it." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#F4C430] text-[#111111] font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg">{s.step}</div>
                <h3 className="font-black text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat CTA */}
      <section className="py-12 bg-[#F4C430]">
        <div className="container px-5 text-center">
          <MessageCircle className="w-8 h-8 text-[#111111] mx-auto mb-3" />
          <h2 className="text-2xl font-black text-[#111111] mb-2">Have a question? Ask MAYA</h2>
          <p className="text-[#111111]/70 text-sm mb-5 max-w-sm mx-auto">Our AI assistant can give you rough estimates, explain services, and answer any questions instantly.</p>
          <Button onClick={handleBookService} className="bg-[#111111] text-white hover:bg-[#333] rounded-full px-8 h-12 font-black text-xs uppercase tracking-widest">
            Chat with MAYA <MessageCircle className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
