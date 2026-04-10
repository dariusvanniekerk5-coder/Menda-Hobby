import { Link, useRoute } from "wouter";
import { useApp, SERVICES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, CheckCircle2, ChevronLeft, Phone, Shield, Star, Lock, Unlock, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function CustomerJobDetails() {
  const [, params] = useRoute("/customer/job/:id");
  const { jobs, releaseEscrow, submitReview, refreshJobs } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showReview, setShowReview] = useState(false);

  const job = jobs.find(j => j.id === params?.id);
  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>;

  const service = SERVICES.find(s => s.id === job.serviceId);

  const statusFlow = [
    { key: "pending", label: "Request Sent", icon: Clock },
    { key: "accepted", label: "Job Accepted", icon: CheckCircle2 },
    { key: "in_progress", label: "In Progress", icon: Shield },
    { key: "completed", label: "Job Completed", icon: CheckCircle2 },
    { key: "paid", label: "Escrow Released", icon: Unlock },
  ];
  const currentIdx = statusFlow.findIndex(s => s.key === job.status);

  const handleReleaseEscrow = async () => {
    setIsLoading(true);
    try { await releaseEscrow(job.id); await refreshJobs(); } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsLoading(true);
    try { await submitReview(job.id, rating, reviewText); await refreshJobs(); setShowReview(false); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "Flexible";
    try { return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return "Flexible"; }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-32">
      <Link href="/customer/jobs">
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Jobs
        </Button>
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-black font-heading">{job.title || service?.name || "Job"}</h1>
          <p className="text-muted-foreground text-sm flex items-center mt-1">
            <Calendar className="w-3 h-3 mr-1" /> {formatDate(job.scheduledAt || job.createdAt)}
          </p>
        </div>
        <Badge className={cn(
          "capitalize shadow-sm font-black text-[10px] uppercase",
          job.status === "paid" ? "bg-green-600 text-white" :
          job.status === "completed" ? "bg-blue-600 text-white" :
          job.status === "in_progress" ? "bg-amber-500 text-white" :
          job.status === "accepted" ? "bg-[#F4C430] text-[#111111]" :
          "bg-[#F7F7F7] text-[#111111]"
        )}>
          {job.status === "paid" ? "Funds Released" : (job.status || "").replace("_", " ")}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Status Timeline */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Job Progress</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-0">
              {statusFlow.map((step, i) => {
                const isComplete = i <= currentIdx;
                const isCurrent = i === currentIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                        isComplete ? "bg-[#F4C430] border-[#F4C430] text-[#111111]" :
                        "bg-white border-gray-200 text-gray-300"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {i < statusFlow.length - 1 && (
                        <div className={cn("w-0.5 h-8", isComplete && i < currentIdx ? "bg-[#F4C430]" : "bg-gray-200")} />
                      )}
                    </div>
                    <div className={cn("pt-1", isCurrent ? "text-[#111111]" : "text-muted-foreground")}>
                      <p className={cn("text-xs", isCurrent ? "font-black" : "font-bold")}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Escrow Status Card */}
        <Card className="bg-[#111111] border-none shadow-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {job.status === "paid" ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-[#F4C430]" />}
                <span className="text-[10px] uppercase font-black tracking-widest text-white/50">
                  {job.status === "paid" ? "Escrow Released" : job.status === "completed" ? "Awaiting Your Approval" : "Escrow Protected"}
                </span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-[#F4C430]">R {Number(job.price || 0).toLocaleString()}</h3>
            <p className="text-xs text-white/40 mt-1">
              {job.status === "paid" ? "Funds have been released to the service provider."
                : job.status === "completed" ? "Job is done. Review the work and release escrow when satisfied."
                : "Your funds are held securely until you approve the completed work."}
            </p>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430]/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#F4C430]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Location</p>
              <p className="font-bold text-[#111111] truncate">{job.address || job.location || "Pending"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="bg-[#F7F7F7] p-4 rounded-xl text-sm leading-relaxed">
              {job.description || job.details || "No additional details."}
            </p>
          </CardContent>
        </Card>

        {/* Review (if already submitted) */}
        {job.customerRating && (
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2">Your Review</p>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn("w-5 h-5", s <= Number(job.customerRating) ? "text-[#F4C430] fill-[#F4C430]" : "text-gray-300")} />
                ))}
              </div>
              {job.customerReview && <p className="text-sm text-green-800">{job.customerReview}</p>}
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {showReview && (
          <Card className="border-[#F4C430] shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-black">Rate This Service</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star className={cn("w-8 h-8 transition-colors", s <= rating ? "text-[#F4C430] fill-[#F4C430]" : "text-gray-300 hover:text-[#F4C430]/50")} />
                  </button>
                ))}
              </div>
              <Textarea placeholder="Tell us about your experience..." value={reviewText} onChange={e => setReviewText(e.target.value)} className="rounded-xl" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowReview(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black" onClick={handleSubmitReview} disabled={isLoading || rating === 0}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-4 z-40">
        <div className="max-w-lg mx-auto">
          {job.status === "pending" && (
            <div className="h-14 bg-amber-50 text-amber-700 rounded-xl text-center font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-amber-200">
              <Clock className="w-4 h-4" /> Waiting for a provider to accept
            </div>
          )}
          {job.status === "accepted" && (
            <div className="h-14 bg-[#F4C430]/10 text-[#111111] rounded-xl text-center font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-[#F4C430]/30">
              <CheckCircle2 className="w-4 h-4 text-[#F4C430]" /> Provider assigned — work will begin soon
            </div>
          )}
          {job.status === "in_progress" && (
            <div className="h-14 bg-blue-50 text-blue-700 rounded-xl text-center font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-blue-200">
              <Shield className="w-4 h-4" /> Work in progress — escrow held securely
            </div>
          )}
          {job.status === "completed" && (
            <Button
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl"
              onClick={handleReleaseEscrow}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              Approve & Release Escrow — R {Number(job.price || 0).toLocaleString()}
            </Button>
          )}
          {job.status === "paid" && !job.customerRating && !showReview && (
            <Button
              className="w-full h-14 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl"
              onClick={() => setShowReview(true)}
            >
              <Star className="w-4 h-4 mr-2" /> Rate & Review This Service
            </Button>
          )}
          {job.status === "paid" && (job.customerRating || showReview) && (
            <div className="h-14 bg-green-100 text-green-800 rounded-xl text-center font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border border-green-200">
              <CheckCircle2 className="w-5 h-5" /> Complete — Thank you!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

