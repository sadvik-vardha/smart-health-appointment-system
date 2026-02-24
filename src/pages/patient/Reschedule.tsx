import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Booking, Doctor } from "@/types/healthcare";
import { getBookingById, getDoctorById, getHospitalById, getAvailableSlots, updateBooking } from "@/lib/supabase-storage";

const Reschedule = () => {
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospitalName, setHospitalName] = useState<string>("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newSlot, setNewSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Load slots when date changes
  useEffect(() => {
    if (doctor && newDate) {
      getAvailableSlots(doctor.id, format(newDate, 'yyyy-MM-dd')).then(setAvailableSlots);
    } else {
      setAvailableSlots([]);
    }
  }, [doctor, newDate]);

  const handleSearch = async () => {
    if (!searchId.trim()) { setError("Please enter a booking ID"); return; }

    setIsSearching(true);
    setError("");
    setBooking(null);
    setDoctor(null);

    const foundBooking = await getBookingById(searchId.trim());
    if (!foundBooking) {
      setError("No booking found with this ID");
      setIsSearching(false);
      return;
    }

    const [foundDoctor, foundHospital] = await Promise.all([
      getDoctorById(foundBooking.doctorId),
      getHospitalById(foundBooking.hospitalId),
    ]);

    setBooking(foundBooking);
    setDoctor(foundDoctor || null);
    setHospitalName(foundHospital?.name || 'Unknown');
    setIsSearching(false);
  };

  const canReschedule = (): { allowed: boolean; reason: string } => {
    if (!booking) return { allowed: false, reason: "No booking found" };
    if (booking.status !== 'not-appeared') return { allowed: false, reason: "Only bookings marked as 'Not Appeared' can be rescheduled" };
    if (booking.rescheduleCount >= 2) return { allowed: false, reason: "Maximum reschedule limit (2) reached. Please book a new appointment." };
    return { allowed: true, reason: "" };
  };

  const getAvailableDates = (): Date[] => {
    if (!doctor) return [];
    return doctor.availability.map(a => new Date(a.date)).filter(d => d >= new Date() && format(d, 'yyyy-MM-dd') !== booking?.date);
  };

  const handleReschedule = async () => {
    if (!booking || !newDate || !newSlot) {
      toast({ title: "Select new slot", description: "Please select a new date and time slot.", variant: "destructive" });
      return;
    }

    setIsRescheduling(true);
    const updatedBooking: Booking = {
      ...booking,
      date: format(newDate, 'yyyy-MM-dd'),
      timeSlot: newSlot,
      status: 'pending',
      rescheduleCount: booking.rescheduleCount + 1,
    };

    await updateBooking(updatedBooking);
    setBooking(updatedBooking);
    setNewDate(undefined);
    setNewSlot("");
    setIsRescheduling(false);
    toast({ title: "Appointment Rescheduled!", description: `Your appointment has been rescheduled to ${format(newDate, 'MMM d, yyyy')} at ${newSlot}` });
  };

  const rescheduleStatus = canReschedule();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reschedule Appointment</h1>
        <p className="text-muted-foreground">Enter your booking ID to reschedule</p>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="bookingId" className="sr-only">Booking ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="bookingId" placeholder="Enter Booking ID (e.g., BK-12345)" className="pl-10"
                  value={searchId} onChange={(e) => setSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="gradient-primary">
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
        </CardContent>
      </Card>

      {booking && doctor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Badge className={
                booking.status === 'appeared' ? 'bg-success/10 text-success border-success' :
                booking.status === 'not-appeared' ? 'bg-destructive/10 text-destructive border-destructive' :
                'bg-warning/10 text-warning border-warning'
              }>{booking.status.replace('-', ' ').toUpperCase()}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Booking ID:</span><span className="ml-2 font-mono font-bold">{booking.bookingId}</span></div>
              <div><span className="text-muted-foreground">Patient:</span><span className="ml-2 font-medium">{booking.patientName}</span></div>
              <div><span className="text-muted-foreground">Doctor:</span><span className="ml-2 font-medium">Dr. {doctor.name}</span></div>
              <div><span className="text-muted-foreground">Hospital:</span><span className="ml-2 font-medium">{hospitalName}</span></div>
              <div><span className="text-muted-foreground">Current Date:</span><span className="ml-2 font-medium">{format(new Date(booking.date), 'MMM d, yyyy')}</span></div>
              <div><span className="text-muted-foreground">Current Time:</span><span className="ml-2 font-medium">{booking.timeSlot}</span></div>
              <div><span className="text-muted-foreground">Reschedules Used:</span><span className="ml-2 font-medium">{booking.rescheduleCount} / 2</span></div>
            </div>

            {!rescheduleStatus.allowed ? (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div><p className="font-medium">Cannot Reschedule</p><p className="text-sm opacity-80">{rescheduleStatus.reason}</p></div>
              </div>
            ) : (
              <>
                {booking.rescheduleCount === 1 && (
                  <div className="bg-warning/10 text-warning rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div><p className="font-medium">Last Free Reschedule</p><p className="text-sm opacity-80">This is your last free reschedule. Further changes will require a new booking.</p></div>
                  </div>
                )}

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Select New Appointment</h3>
                  <div className="space-y-2">
                    <Label>New Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="w-4 h-4 mr-2" />
                          {newDate ? format(newDate, 'EEEE, MMMM d, yyyy') : 'Select a new date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={newDate}
                          onSelect={(date) => { setNewDate(date); setNewSlot(""); }}
                          disabled={(date) => { const avail = getAvailableDates(); return !avail.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')); }}
                          className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {newDate && (
                    <div className="space-y-2">
                      <Label>Available Time Slots</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map((slot) => (
                          <Badge key={slot} variant={newSlot === slot ? "default" : "outline"}
                            className={cn("cursor-pointer transition-colors py-2 px-3", newSlot === slot && "gradient-primary border-0")}
                            onClick={() => setNewSlot(slot)}>{slot}</Badge>
                        ))}
                        {availableSlots.length === 0 && <p className="text-sm text-muted-foreground">No slots available.</p>}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleReschedule} disabled={!newDate || !newSlot || isRescheduling} className="w-full gradient-success text-primary-foreground">
                    {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-secondary/50 border-0">
        <CardContent className="py-4">
          <h3 className="font-medium text-foreground mb-2">📋 Reschedule Policy</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span>Rescheduling is <strong>only available</strong> when hospital marks your booking as <strong>"Not Appeared"</strong></span></li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span>You can reschedule <strong>maximum 1-2 times</strong> without additional payment</span></li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span>After maximum reschedules are used, you need to <strong>book a new appointment</strong> with payment</span></li>
            <li className="flex items-start gap-2"><span className="text-warning font-bold">⚠</span><span>Please attend your appointments to avoid losing reschedule opportunities</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reschedule;
