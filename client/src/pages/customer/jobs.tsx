import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ChevronRight, Calendar, MapPin, Wrench, Clock, Shield, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerJobs() {
  const { jobs, user, services } = useApp();
  const myJobs = jobs.filter(j => j.customerId === user?.id);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Request Sent", color: "bg-amber-100 text-amber-800", icon: Clock },
    accepted: { label: "Job Accepted", color: "bg-[#F4C430]/20 text-[#111111]", icon: CheckCircle2 },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Shield },
    completed: { label: "Approve Escrow", color: "bg-green-100 text-green-800", icon: Unlock },
    paid: { label: "Funds Released", color: "bg-green-600 text-white", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: Clock },
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "Flexible";
    try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return "—"; }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-8 bg-[#F7F7F7] min-h-screen">
      <div className="pt-4">
        <h1 className="text-3xl font-black font-heading tracking-tight text-[#111111]">Your Jobs</h1>
        <p className="text-muted-foreground text-sm font-medium">Track and manage your service requests</p>
      </div>

      <div className="space-y-6">
        {myJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border shadow-sm">
            <div className="bg-[#F7F7F7] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-muted-foreground/20" />
            </div>
            <h3 className="font-bold text-lg text-[#111111]">No jobs yet</h3>
            <p className="text-muted-foreground text-sm mb-6">You haven't booked any services yet.</p>
            <Link href="/customer/home">
              <Button className="bg-[#F4C430] text-[#111111] hover:bg-[#F4C430]/90 font-black uppercase tracking-widest text-[10px] px-8 rounded-full h-11">Book a Service</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myJobs.map((job) => {
              const service = services.find(s => s.id === job.serviceId);
              const sc = statusConfig[job.status] || statusConfig.pending;
              const StatusIcon = sc.icon;

              return (
                <Link key={job.id} href={`/customer/job/${job.id}`}>
                  <Card className="hover:border-[#F4C430] transition-all border-border cursor-pointer group rounded-2xl bg-white shadow-sm overflow-hidden hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-black text-base text-[#111111] group-hover:text-[#F4C430] transition-colors truncate">
                            {job.title || service?.name || "Job"}
                          </h3>
                          {job.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{job.description}</p>
                          )}
                        </div>
                        <Badge className={cn("uppercase text-[9px] font-black tracking-widest px-2 py-0.5 shadow-none border-none rounded flex items-center gap-1 ml-2 flex-shrink-0", sc.color)}>
                          <StatusIcon className="w-3 h-3" /> {sc.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#F4C430]" /> {formatDate(job.scheduledAt || job.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#F4C430]" /> {job.address || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#F7F7F7]">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {job.status === "paid" ? (
                            <><Unlock className="w-3 h-3 text-green-500" /> Escrow released</>
                          ) : job.status === "completed" ? (
                            <><Lock className="w-3 h-3 text-amber-500" /> Awaiting your approval</>
                          ) : (
                            <><Lock className="w-3 h-3 text-[#F4C430]" /> Escrow protected</>
                          )}
                        </div>
                        <span className="text-sm font-black text-[#111111]">R {Number(job.price || 0).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

