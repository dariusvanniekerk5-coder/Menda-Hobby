import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const jobId = new URLSearchParams(search).get("jobId");

  useEffect(() => {
    // Auto-redirect to jobs after 4 seconds
    const t = setTimeout(() => setLocation("/customer/jobs"), 4000);
    return () => clearTimeout(t);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black font-heading text-[#111111] mb-2">Payment Confirmed!</h1>
        <p className="text-muted-foreground text-sm mb-2">
          Your funds are safely held in escrow. A verified MENDA provider will be assigned to your job shortly.
        </p>
        <p className="text-xs text-muted-foreground/60 mb-8">
          You'll receive a notification once a provider accepts. Redirecting you now…
        </p>
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase tracking-widest text-xs rounded-xl gap-2"
            onClick={() => setLocation(jobId ? `/customer/job/${jobId}` : "/customer/jobs")}
          >
            View My Job <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs"
            onClick={() => setLocation("/customer/home")}
          >
            Back to Home
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <img src="/menda-logo.jpg" alt="Menda" className="h-6 w-auto" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secured by MENDA Escrow</span>
        </div>
      </motion.div>
    </div>
  );
}
