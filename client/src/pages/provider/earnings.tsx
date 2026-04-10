import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Percent, Briefcase, Clock } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const data = [
  { name: "Mon", total: 450 },
  { name: "Tue", total: 900 },
  { name: "Wed", total: 0 },
  { name: "Thu", total: 1200 },
  { name: "Fri", total: 850 },
  { name: "Sat", total: 1500 },
  { name: "Sun", total: 0 },
];

export default function ProviderEarnings() {
  const { user, jobs } = useApp();
  
  const myCompletedJobs = jobs.filter(j => j.providerId === user?.id && j.status === "completed");
  const myPendingJobs = jobs.filter(j => j.providerId === user?.id && j.status === "accepted" || j.status === "in_progress");
  
  const grossRevenue = myCompletedJobs.reduce((acc, job) => acc + job.price, 0);
  const totalPayout = grossRevenue * 0.8;
  const pendingRevenue = myPendingJobs.reduce((acc, job) => acc + job.price, 0) * 0.8;
  
  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-3xl font-black font-heading mb-2 tracking-tight text-[#111111]">Earnings</h1>
      <p className="text-muted-foreground text-sm font-medium mb-8">Your financial performance on Menda</p>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <Card className="bg-white border-border shadow-md overflow-hidden rounded-2xl">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Payout (Net)</p>
              <div className="w-8 h-8 rounded-full bg-[#F4C430] flex items-center justify-center text-[#111111]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-5xl font-black font-heading text-[#111111]">R {totalPayout.toLocaleString()}</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
               <div>
                 <p className="text-muted-foreground text-[9px] font-black uppercase mb-1">Gross Revenue</p>
                 <p className="text-sm font-bold text-[#111111]">R {grossRevenue.toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-muted-foreground text-[9px] font-black uppercase mb-1 text-[#F4C430]">Pending Payout</p>
                 <p className="text-sm font-bold text-[#111111]">R {pendingRevenue.toLocaleString()}</p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="border-border bg-white shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[#F7F7F7] text-[#111111] rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase">Jobs</p>
              <p className="text-lg font-black text-[#111111]">{myCompletedJobs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-white shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[#F7F7F7] text-[#111111] rounded-lg">
              <Percent className="w-4 h-4 text-[#F4C430]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase">Commission</p>
              <p className="text-lg font-black text-[#111111]">20%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="mb-8 border-border bg-white shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-[#F4C430]" /> Weekly Activity
          </CardTitle>
          <CardDescription className="text-[10px] font-bold">Gross volume before fees</CardDescription>
        </CardHeader>
        <CardContent className="h-[180px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
              <YAxis fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
              <Tooltip 
                cursor={{ fill: '#F7F7F7' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="total" fill="#F4C430" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Recent Payouts</h3>
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-[#F4C430] hover:bg-transparent">Export History</Button>
        </div>
        <div className="space-y-3">
          {myCompletedJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-bold italic">No completed transactions to display.</p>
            </div>
          ) : (
            myCompletedJobs.slice(0, 5).map(job => (
              <div key={job.id} className="group flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm hover:border-[#F4C430] transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-[#F7F7F7] rounded-lg p-2.5 text-[#111111]">
                    <CheckCircle2 className="w-5 h-5 opacity-40" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#111111]">{job.details}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-0.5 font-bold">
                      <Calendar className="w-2.5 h-2.5 mr-1" /> {format(new Date(job.date), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#111111] text-sm">R {(job.price * 0.8).toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-tight">Paid</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
