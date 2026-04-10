import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useApp, SERVICES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, Camera, X, Image as ImageIcon, Wallet, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MAX_PHOTOS = 5;

export default function CustomerBook() {
  const [, params] = useRoute("/customer/book/:serviceId");
  const [, setLocation] = useLocation();
  const { user, addJob } = useApp();
  const serviceId = params?.serviceId;
  const service = SERVICES.find(s => s.id === serviceId);
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPM = user?.role === "property_manager";
  const properties = ["Sandton Sky Apts", "Rosebank Heights", "Pretoria East Villas", "Standard Residential"];

  if (!service) return <div className="container px-4 py-20 text-center text-muted-foreground">Service not found</div>;
  const total = service.basePrice;
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const validFiles = files.filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024).slice(0, remaining);
    const newPhotos = validFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos(prev => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => { const u = [...prev]; URL.revokeObjectURL(u[index].preview); u.splice(index, 1); return u; });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payfast/initiate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          title: service.name + " — " + description.slice(0, 60),
          description,
          address,
          price: total,
          scheduledAt: date ? date.toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Payment initiation failed");
      const { paymentUrl, paymentData } = await res.json();

      // Build and auto-submit a hidden PayFast form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;
      Object.entries(paymentData).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => window.history.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold font-heading mt-2">Book {service.name}</h1>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className={cn("h-full bg-[#F4C430] transition-all duration-300", step >= s ? "w-full" : "w-0")} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Step {step} of 4 — {step === 1 ? "Details" : step === 2 ? "Photos" : step === 3 ? "Location & Date" : "Review"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="border-[#F4C430]/20 shadow-2xl">
            {step === 1 && (
              <>
                <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {isPM && (
                    <div className="space-y-2">
                      <Label>Select Property</Label>
                      <Select onValueChange={setSelectedProperty} defaultValue={selectedProperty}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Which property?" /></SelectTrigger>
                        <SelectContent>{properties.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>What needs to be done?</Label>
                    <Textarea placeholder="Describe the issue in detail — the more info, the better the quote..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black" onClick={handleNext} disabled={!description || (isPM && !selectedProperty)}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-[#F4C430]" /> Upload Photos</CardTitle>
                  <p className="text-sm text-muted-foreground">Add photos of the issue to help providers give an accurate quote. Up to {MAX_PHOTOS} photos.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                        <img src={photo.preview} alt={"Photo " + (i+1)} className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[#F4C430]/40 bg-[#F4C430]/5 hover:bg-[#F4C430]/10 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <Camera className="w-6 h-6 text-[#F4C430]" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                  {photos.length === 0 && (
                    <div className="text-center py-6 bg-[#F7F7F7] rounded-2xl">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">No photos yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Photos help providers assess the job accurately</p>
                      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="w-4 h-4" /> Choose Photos
                      </Button>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center">{photos.length}/{MAX_PHOTOS} photos added &middot; Max 5MB per photo &middot; Optional</p>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">Back</Button>
                  <Button className="flex-1 h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black" onClick={handleNext}>
                    {photos.length === 0 ? "Skip" : "Next"} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader><CardTitle>Location & Date</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Unit / Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g. Unit 402, 123 Street" className="pl-9" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">Back</Button>
                  <Button className="flex-1 h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black" onClick={handleNext} disabled={!address || !date}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader><CardTitle>Review & Confirm</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-[#F4C430]/5 border border-[#F4C430]/20 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Service</span><span className="font-bold">{service.name}</span></div>
                    {isPM && selectedProperty && <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Property</span><span className="font-bold flex items-center"><Building2 className="w-3 h-3 mr-1" /> {selectedProperty}</span></div>}
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Date</span><span className="font-bold">{date ? format(date, "PPP") : "—"}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Address</span><span className="font-bold text-right max-w-[180px] truncate">{address}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Photos</span><span className="font-bold">{photos.length} attached</span></div>
                    <div className="h-px bg-[#F4C430]/20" />
                    <div className="flex justify-between items-center text-lg font-black"><span>Total to Pay</span><span>R {total}</span></div>
                  </div>
                  {photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {photos.map((photo, i) => <img key={i} src={photo.preview} alt={"Photo " + (i+1)} className="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0" />)}
                    </div>
                  )}
                  <div className="p-4 border rounded-xl bg-green-50/50 border-green-200 flex gap-4">
                    <div className="bg-green-600 rounded-lg p-2 h-10 w-10 flex items-center justify-center text-white shrink-0"><Wallet className="w-5 h-5" /></div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-green-800">{isPM ? "Account Billing" : "Escrow Payment"}</p>
                      <p className="text-xs text-green-700/70">{isPM ? "Consolidated monthly statement" : "Your payment is held safely until job completion"}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">Back</Button>
                  <Button className="flex-1 h-12 bg-[#F4C430] text-[#111111] hover:bg-[#111111] hover:text-white font-black shadow-lg" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : isPM ? "Confirm Booking" : "Confirm & Pay"}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
