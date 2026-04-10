import { Link, useRoute, useLocation } from "wouter";
import { useApp, SERVICES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, CheckCircle2, ChevronLeft, Phone, User, AlertTriangle, Lock, Unlock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ProviderJobDetails() {
  const [, params] = useRoute("/provider/job/:id");
  const [, setLocation] = useLocation();
  const { user, jobs, assignProvider, updateJobStatus, refreshJobs, providerProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const job = jobs.find(j => j.id === params?.id);
  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>;

  const service = SERVICES.find(s => s.id === job.serviceId);
  const myProviderId = providerProfile?.id;
  const isAssignedToMe = !!myProviderId && job.providerId === myProviderId;
  const isPending = job.status === "pending" && !job.providerId;
  const isVerified = providerProfile?.status === "verified";
  const payout = Number(job.price) * 0.8;
  const commission = Number(job.price) * 0.2;

  const handleAccept = async () => {
    if (!myProviderId || !isVerified) return;
    setIsLoading(true);
    try { await assignProvider(job.id, myProviderId); await refreshJobs(); }
    catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleUpdateStatus = async (s: any) => {
    setIsLoading(true);
    try { await updateJobStatus(job.id, s); await refreshJobs(); }
    catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "Flexible";
    try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }); } catch { return "Flexible"; }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-32">
      <Link href="/provider/jobs">
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent"><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-black font-heading">{job.title || service?.name || "Job"}</h1>
          <p className="text-muted-foreground text-sm flex items-center mt-1"><Calendar className="w-3 h-3 mr-1" /> {formatDate(job.scheduledAt || job.createdAt)}</p>
        </div>
        <Badge className={cn("capitalize shadow-sm font-black text-[10px] uppercase",
          job.status === "paid" ? "bg-green-600 text-white" : job.status === "completed" ? "bg-blue-600 text-white" :
          job.status === "in_progress" ? "bg-amber-500 text-white" : job.status === "accepted" ? "bg-[#F4C430] text-[#111111]" : "bg-[#F7F7F7] text-[#111111]"
        )}>{job.status === "paid" ? "Escrow Released" : (job.status || "").replace("_", " ")}</Badge>
      </div>

      <div className="space-y-4">
        {!isVerified && isPending && (
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div><p className="font-black text-amber-800 text-sm">Verification Required</p><p className="text-xs text-amber-600 mt-0.5">You must be verified before accepting jobs.</p></div>
          </div>
        )}

        <Card className="bg-[#111111] border-none shadow-xl overflow-hidden">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Your Payout (80%)</p>
              <h3 className="text-3xl font-black text-[#F4C430]">R {payout.toFixed(0)}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Menda Fee (20%)</p>
              <p className="font-bold text-white/60">R {commission.toFixed(0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {job.status === "paid" ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-[#F4C430]" />}
                <span className="text-[9px] text-white/40 font-bold">{job.status === "paid" ? "Funds released" : "In escrow"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430]/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-[#F4C430]" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Location</p>
              <p className="font-bold text-[#111111] truncate">{job.address || "Pending"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Job Description</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm mb-2"><span className="font-bold">{service?.name}</span></div>
            <p className="bg-[#F7F7F7] p-4 rounded-xl text-sm leading-relaxed">{job.description || "No details."}</p>
          </CardContent>
        </Card>

        {isAssignedToMe && (
          <Card className="border-[#F4C430]/20 shadow-sm overflow-hidden">
            <div className="bg-[#F4C430]/10 px-4 py-2 border-b border-[#F4C430]/20 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#F4C430]" />
              <span className="text-[10px] uppercase font-black text-[#111111]/60 tracking-widest">Client Contact</span>
            </div>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1"><h3 className="font-bold">{job.propertyName || "Private Residence"}</h3><p className="text-xs text-muted-foreground mt-0.5">{job.address}</p></div>
              <Button size="icon" variant="outline" className="rounded-full shadow-sm h-10 w-10"><Phone className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-4 z-40">
        <div className="max-w-lg mx-auto">
          {isPending ? (
            <div className="grid grid-cols-4 gap-3">
              <Button variant="outline" className="h-14 font-black uppercase tracking-widest text-xs rounded-xl" onClick={() => setLocation("/provider/jobs")}>Decline</Button>
              <Button className={cn("col-span-3 h-14 font-black uppercase tracking-widest text-sm rounded-xl shadow-xl",
                isVerified ? "bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white shadow-[#F4C430]/30" : "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
              )} onClick={handleAccept} disabled={isLoading || !isVerified}>
                {!isVerified ? "Verification Pending" : isLoading ? "Accepting..." : `Accept Job — R ${payout.toFixed(0)}`}
              </Button>
            </div>
          ) : isAssignedToMe ? (
            <>
              {job.status === "accepted" && (
                <Button className="w-full h-14 bg-[#111111] text-white hover:bg-[#F4C430] hover:text-[#111111] font-black uppercase tracking-widest text-sm rounded-xl shadow-xl" onClick={() => handleUpdateStatus("in_progress")} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Start Working
                </Button>
              )}
              {job.status === "in_progress" && (
                <Button className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl" onClick={() => handleUpdateStatus("completed")} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Mark as Completed
                </Button>
              )}
              {job.status === "completed" && (
                <div className="h-14 bg-blue-50 text-blue-700 rounded-xl text-center font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-blue-200">
                  <Lock className="w-4 h-4" /> Awaiting customer escrow approval
                </div>
              )}
              {job.status === "paid" && (
                <div className="h-14 bg-green-100 text-green-800 rounded-xl text-center font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border border-green-200">
                  <Unlock className="w-5 h-5" /> Escrow Released — R {payout.toFixed(0)}
                </div>
              )}
            </>
          ) : (
            <div className="text-center bg-[#F7F7F7] p-4 rounded-xl text-muted-foreground text-sm font-bold border border-dashed">Taken by another provider</div>
          )}
        </div>
      </div>
    </div>
  );
}

