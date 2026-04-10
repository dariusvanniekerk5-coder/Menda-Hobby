import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, MapPin, Calendar, ChevronRight, Filter, Bell, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProviderJobs() {
  const { jobs, services, refreshJobs, providerProfile } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const i = setInterval(refreshJobs, 15000);
    return () => clearInterval(i);
  }, [refreshJobs]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true); await refreshJobs(); setTimeout(() => setIsRefreshing(false), 500);
  };

  const myProviderId = providerProfile?.id;
  const myJobs = myProviderId ? jobs.filter(j => j.providerId === myProviderId) : [];
  const availableJobs = jobs.filter(j => !j.providerId && j.status === "pending");
  const activeJobs = myJobs.filter(j => j.status !== "completed" && j.status !== "cancelled" && j.status !== "paid");
  const filteredAvailable = filter === "all" ? availableJobs : availableJobs.filter(j => j.serviceId === filter);
  const isNotVerified = providerProfile && providerProfile.status !== "verified";

  const formatDate = (d: string | undefined) => {
    if (!d) return "Flexible";
    try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }); } catch { return "Flexible"; }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Marketplace</h1>
          <p className="text-muted-foreground text-sm font-medium">Find and accept new jobs</p>
        </div>
        <Button variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl", isRefreshing && "animate-spin")} onClick={handleManualRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isNotVerified && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-black text-amber-800 text-sm">Account Under Review</p>
            <p className="text-xs text-amber-600 mt-0.5">Your profile is being verified. You'll be able to accept jobs once approved.</p>
          </div>
        </div>
      )}

      {availableJobs.length > 0 && !isNotVerified && (
        <div className="bg-[#F4C430] p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-pulse" style={{ animationDuration: "3s" }}>
          <Bell className="w-5 h-5 text-[#111111]" />
          <div className="flex-1">
            <p className="font-black text-[#111111] text-sm">{availableJobs.length} new job{availableJobs.length > 1 ? "s" : ""} available!</p>
            <p className="text-[10px] font-bold text-[#111111]/60 uppercase tracking-widest">Tap to view & accept</p>
          </div>
        </div>
      )}

      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Your Active Jobs</h2>
          {activeJobs.map(job => (
            <Link key={job.id} href={"/provider/job/" + job.id}>
              <Card className="border-border shadow-sm bg-white hover:border-[#F4C430] transition-all cursor-pointer rounded-xl overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-bold text-[#111111] truncate">{job.title || "Job"}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] h-5 uppercase font-black bg-[#F4C430] text-[#111111] border-none shadow-none">
                        {(job.status || "").replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold truncate">{job.address}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#F4C430] flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Requests</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select className="text-[10px] font-bold bg-transparent border-none focus:ring-0 text-muted-foreground uppercase tracking-wider cursor-pointer" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {filteredAvailable.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border shadow-sm">
            <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-bold">No new jobs right now</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Auto-refreshes every 15 seconds</p>
          </div>
        ) : filteredAvailable.map(job => {
          const service = services.find(s => s.id === job.serviceId);
          return (
            <Link key={job.id} href={"/provider/job/" + job.id}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-[#F4C430] cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="bg-[#111111] px-4 py-3 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{service?.name}</span>
                    <span className="text-xs font-black text-[#111111] bg-[#F4C430] px-3 py-1 rounded-full">R {(Number(job.price) * 0.8).toFixed(0)} Payout</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-base text-[#111111] group-hover:text-[#F4C430] transition-colors line-clamp-2">{job.title || "New request"}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#F4C430]" /><span className="truncate max-w-[150px]">{job.address || "TBD"}</span></span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#F4C430]" />{formatDate(job.scheduledAt || job.createdAt)}</span>
                    </div>
                    <Button className={cn("w-full h-10 font-black uppercase tracking-widest text-[10px] rounded-xl mt-2", isNotVerified ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white")} disabled={!!isNotVerified}>
                      {isNotVerified ? "Verification Pending" : "View & Accept"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

