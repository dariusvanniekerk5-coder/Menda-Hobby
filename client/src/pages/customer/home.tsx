import { Link, useLocation } from "wouter";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Building2, Sparkles, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export default function CustomerHome() {
  const { user, services, jobs } = useApp();
  const [, setLocation] = useLocation();
  const [showServicePicker, setShowServicePicker] = useState(false);
  
  const activeJobs = jobs.filter(j => j.customerId === user?.id && j.status !== "completed" && j.status !== "cancelled" && j.status !== "paid");
  const isPM = user?.role === "property_manager";

  const handleServiceSelect = (serviceId: string) => {
    setShowServicePicker(false);
    setLocation("/customer/book/" + serviceId);
  };

  return (
    <div className="container px-4 py-6 space-y-8 bg-[#F7F7F7] min-h-screen pb-24">
      <div className="flex justify-between items-start pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/menda-logo.jpg" alt="Menda" className="h-8 w-auto object-contain" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Welcome to MENDA</span>
          </div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">
            {isPM ? user?.companyName : "Hello, " + (user?.name.split(" ")[0] || "")}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isPM ? "Managing your properties made easy." : "What help do you need today?"}
          </p>
        </div>
        {isPM && (
          <Button variant="outline" size="sm" className="gap-2 font-black uppercase tracking-widest text-[9px] border-border bg-white shadow-sm h-9">
            <Building2 className="w-3.5 h-3.5" /> Properties
          </Button>
        )}
      </div>

      <div className="bg-[#111111] rounded-3xl p-6 shadow-2xl flex items-center justify-between border-none">
        <div className="space-y-1">
          <h3 className="text-white font-black text-xl tracking-tight">Need help now?</h3>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Connect with a vetted pro instantly</p>
        </div>
        <Dialog open={showServicePicker} onOpenChange={setShowServicePicker}>
          <DialogTrigger asChild>
            <Button className="bg-[#F4C430] text-[#111111] hover:bg-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl border-none shadow-xl shadow-[#F4C430]/10">
              <Plus className="w-4 h-4 mr-2" /> New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-none rounded-3xl shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="bg-[#111111] p-6 text-white">
              <DialogTitle className="text-lg font-black uppercase tracking-widest text-center">Choose a Service</DialogTitle>
              <DialogDescription className="sr-only">Pick a Menda service to start a new job request.</DialogDescription>
            </DialogHeader>
            <div className="p-5 grid grid-cols-2 gap-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => handleServiceSelect(svc.id)}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#F7F7F7] hover:bg-[#F4C430] group transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-[#111111] group-hover:text-white transition-colors">
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#111111]">{svc.name}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">From R{svc.basePrice}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeJobs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Active Jobs</h3>
            <Link href="/customer/jobs">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F4C430] hover:underline cursor-pointer">View All</span>
            </Link>
          </div>
          {activeJobs.slice(0, 3).map((job) => (
            <div key={job.id} className="flex items-center justify-between bg-[#F7F7F7] p-4 rounded-xl border border-border mb-2 last:mb-0">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-bold text-[#111111] truncate">{job.title || job.description || "Job"}</p>
                <span className="text-[9px] bg-[#F4C430] text-[#111111] px-2 py-0.5 rounded uppercase font-black">
                  {job.status.replace("_", " ")}
                </span>
              </div>
              <Link href={"/customer/job/" + job.id}>
                <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-[#F4C430]/10 text-[#F4C430]">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#111111] px-1 relative inline-block">
          Book a Service
          <span className="absolute -bottom-1 left-0 w-8 h-1 bg-[#F4C430] rounded-full"></span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service) => (
            <Link key={service.id} href={"/customer/book/" + service.id}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-border bg-white hover:border-[#F4C430] rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#F7F7F7] flex items-center justify-center shadow-sm text-[#111111] group-hover:bg-[#F4C430] transition-colors duration-300">
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-sm group-hover:text-[#111111] transition-colors uppercase tracking-tight">{service.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-[#111111] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Building2 className="w-48 h-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="bg-[#F4C430] text-[#111111] text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded inline-block mb-4">Menda Business</div>
          <h3 className="font-black text-2xl mb-2 font-heading tracking-tight">Professional Property Care</h3>
          <p className="text-white/60 mb-8 max-w-md text-sm font-medium leading-relaxed">
            {isPM
              ? "Property managers get consolidated monthly statements and priority dispatch."
              : "Our quality guarantee ensures your home is in safe hands. Vetted pros, upfront pricing."}
          </p>
          <Button onClick={() => setShowServicePicker(true)} className="font-black uppercase tracking-widest text-[10px] bg-[#F4C430] text-[#111111] hover:bg-[#F4C430]/90 h-11 px-8 rounded-full border-none shadow-lg shadow-[#F4C430]/20">
            {isPM ? "View Property Report" : "Get a Quote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
