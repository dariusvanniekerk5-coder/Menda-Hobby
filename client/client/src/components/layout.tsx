import { Link, useLocation } from "wouter";
import { useApp } from "@/lib/store";
import { Home, Briefcase, User, ShieldCheck, DollarSign, LogIn, ChevronRight, LogOut, Bell, CheckCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import MayaChat from "@/components/maya-chat";

// Inline NotificationBell to avoid extra file dependency issues
function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const fmt = (d: string) => {
    try {
      const ms = Date.now() - new Date(d).getTime();
      const m = Math.floor(ms / 60000);
      if (m < 1) return "Now";
      if (m < 60) return m + "m";
      const h = Math.floor(m / 60);
      if (h < 24) return h + "h";
      return Math.floor(h / 24) + "d";
    } catch { return ""; }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] transition-colors">
        <Bell className="w-[18px] h-[18px] text-[#111111]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#F4C430] text-[#111111] text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[320px] max-h-[400px] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-[100]">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-[#F7F7F7]">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={() => markAllRead()} className="text-[10px] font-bold text-[#F4C430] flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Read all
                </button>
              )}
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-bold">No notifications</p>
              </div>
            ) : notifications.slice(0, 20).map(n => (
              <button key={n.id} onClick={async () => {
                if (!n.read) await markNotificationRead(n.id);
                if (n.jobId) { setOpen(false); setLocation(`/customer/job/${n.jobId}`); }
              }} className={cn("w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 hover:bg-[#F7F7F7]", !n.read && "bg-[#F4C430]/5")}>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", !n.read ? "bg-[#F4C430]/20" : "bg-[#F7F7F7]")}>
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-xs truncate", !n.read ? "font-black" : "font-bold text-muted-foreground")}>{n.title}</p>
                    <span className="text-[9px] text-muted-foreground/60 flex-shrink-0">{fmt(n.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#F4C430] flex-shrink-0 mt-2" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isMobile, logout } = useApp();
  const [location] = useLocation();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const getNavItems = () => {
    if (!user) return [];
    if (user.role === "customer" || user.role === "property_manager") {
      return [
        { label: "Home", icon: Home, href: "/customer/home" },
        { label: "My Jobs", icon: Briefcase, href: "/customer/jobs" },
        { label: "Profile", icon: User, href: "/customer/profile" },
      ];
    }
    if (user.role === "provider") {
      return [
        { label: "Jobs", icon: Briefcase, href: "/provider/jobs" },
        { label: "Earnings", icon: DollarSign, href: "/provider/earnings" },
        { label: "Profile", icon: User, href: "/provider/profile" },
      ];
    }
    if (user.role === "admin") {
      return [
        { label: "Dashboard", icon: Home, href: "/admin/dashboard" },
        { label: "Vetting", icon: ShieldCheck, href: "/admin/providers" },
        { label: "Jobs", icon: Briefcase, href: "/admin/jobs" },
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const showNav = !!user && navItems.length > 0;
  const isAuthPage = location.startsWith("/auth");

  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  // Sign-in modal: Only Individual, Company, Property Manager (NO admin, NO provider)
  const roles = [
    { id: "customer", label: "Individual", description: "I need a home service pro", icon: Home },
    { id: "property_manager", label: "Property Manager", description: "I manage multiple estates", icon: ShieldCheck },
    { id: "company", label: "Company", description: "Business requiring property services", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] flex flex-col font-sans">
      {!isAuthPage && (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <img src="/menda-logo.jpg" alt="Menda" className="h-9 w-auto object-contain" />
                <span className="font-heading font-extrabold text-base tracking-tighter uppercase text-[#111111] leading-none">MENDA</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <span className="text-xs font-black uppercase tracking-widest hidden md:block">{user.name}</span>
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-[#F7F7F7] border border-border" />
                  <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="Log out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                !location.startsWith("/auth") && (
                  <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-black uppercase tracking-[0.2em] text-[#111111] hover:text-[#F4C430] transition-all flex items-center gap-2">
                        <LogIn className="w-3.5 h-3.5" /> Sign In
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-none rounded-3xl shadow-2xl p-0 overflow-hidden bg-white">
                      <DialogHeader className="bg-[#111111] p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-widest text-center">Select Your Role</DialogTitle>
                      </DialogHeader>
                      <div className="p-6 space-y-3">
                        {roles.map((role) => (
                          <Link key={role.id} href={`/auth/${role.id}`} onClick={() => setShowRoleModal(false)}>
                            <div className="flex items-center justify-between p-4 bg-[#F7F7F7] rounded-2xl hover:bg-[#F4C430] group transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-[#111111] group-hover:text-white transition-colors">
                                  <role.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-black text-sm text-[#111111]">{role.label}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground group-hover:text-[#111111]/60">{role.description}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#111111]" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              )}
            </div>
          </div>
        </header>
      )}

      <main className="page-container flex-1">{children}</main>

      <MayaChat />

      {showNav && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur h-[72px] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <nav className="flex items-center justify-around h-full px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn("flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-all duration-300", isActive ? "text-[#F4C430]" : "text-muted-foreground hover:text-[#111111]")}>
                    <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-[#111111]" : "text-muted-foreground")}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

