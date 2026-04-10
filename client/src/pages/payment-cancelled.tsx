import { useLocation, useSearch } from "wouter";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const jobId = new URLSearchParams(search).get("jobId");

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black font-heading text-[#111111] mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground text-sm mb-8">
          No charge was made. Your job request has been saved — you can try paying again or book a different service.
        </p>
        <div className="space-y-3">
          {jobId && (
            <Button
              className="w-full h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase tracking-widest text-xs rounded-xl gap-2"
              onClick={() => setLocation(`/customer/job/${jobId}`)}
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
            onClick={() => setLocation("/customer/home")}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <img src="/menda-logo.jpg" alt="Menda" className="h-6 w-auto" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MENDA — Safe & Secure</span>
        </div>
      </motion.div>
    </div>
  );
}
