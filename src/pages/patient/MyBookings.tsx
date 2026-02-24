import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Building2, User, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Booking, Hospital, Doctor } from "@/types/healthcare";
import { getPatientSession } from "@/lib/storage";
import { getBookingsByPatientPhone, getHospitalById, getDoctorById, getFeedbackByBookingId } from "@/lib/supabase-storage";
import { FeedbackForm } from "@/components/FeedbackForm";

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hospitalMap, setHospitalMap] = useState<Record<string, Hospital>>({});
  const [doctorMap, setDoctorMap] = useState<Record<string, Doctor>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, boolean>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [feedbackBooking, setFeedbackBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const patientSession = getPatientSession();

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    if (!patientSession?.phone) { setLoading(false); return; }

    const patientBookings = await getBookingsByPatientPhone(patientSession.phone);
    const sorted = patientBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(sorted);

    // Load hospital and doctor data
    const hMap: Record<string, Hospital> = {};
    const dMap: Record<string, Doctor> = {};
    const fMap: Record<string, boolean> = {};

    const uniqueHospitalIds = [...new Set(sorted.map(b => b.hospitalId))];
    const uniqueDoctorIds = [...new Set(sorted.map(b => b.doctorId))];

    await Promise.all([
      ...uniqueHospitalIds.map(async id => {
        const h = await getHospitalById(id);
        if (h) hMap[id] = h;
      }),
      ...uniqueDoctorIds.map(async id => {
        const d = await getDoctorById(id);
        if (d) dMap[id] = d;
      }),
      ...sorted.map(async b => {
        const fb = await getFeedbackByBookingId(b.id);
        fMap[b.id] = !!fb;
      }),
    ]);

    setHospitalMap(hMap);
    setDoctorMap(dMap);
    setFeedbackMap(fMap);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-warning/10 text-warning border-warning">Pending</Badge>;
      case 'appeared': return <Badge className="bg-success/10 text-success border-success">Appeared</Badge>;
      case 'not-appeared': return <Badge className="bg-destructive/10 text-destructive border-destructive">Not Appeared</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground text-center py-12">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground">View all your appointment bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No bookings yet. Book your first appointment!</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            const hospital = hospitalMap[booking.hospitalId];
            const doctor = doctorMap[booking.doctorId];
            const hasFeedback = feedbackMap[booking.id];
            const showFeedbackPrompt = booking.status === 'appeared' && !hasFeedback;

            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2 cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{booking.bookingId}</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{hospital?.name || 'Unknown Hospital'}</span>
                        <span className="flex items-center gap-1"><User className="w-4 h-4" />Dr. {doctor?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-primary" />{format(new Date(booking.date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" />{booking.timeSlot}</span>
                      </div>
                      {showFeedbackPrompt && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-2 mt-2">
                          <p className="text-sm text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4" />You appeared for this appointment. Please give feedback!</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right"><p className="text-lg font-bold text-foreground">${booking.amountPaid}</p><p className="text-xs text-muted-foreground">paid</p></div>
                      <div className="flex gap-2">
                        {showFeedbackPrompt && (
                          <Button size="sm" className="gradient-primary" onClick={(e) => { e.stopPropagation(); setFeedbackBooking(booking); }}>Give Feedback</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          {selectedBooking && (
            <>
              <DialogHeader><DialogTitle className="text-center">Booking Receipt</DialogTitle></DialogHeader>
              <ReceiptContent booking={selectedBooking} hospital={hospitalMap[selectedBooking.hospitalId]} doctor={doctorMap[selectedBooking.doctorId]} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackBooking} onOpenChange={() => setFeedbackBooking(null)}>
        <DialogContent className="max-w-md">
          {feedbackBooking && (
            <>
              <DialogHeader><DialogTitle className="text-center">Rate Your Experience</DialogTitle></DialogHeader>
              <FeedbackForm
                bookingId={feedbackBooking.id} doctorId={feedbackBooking.doctorId}
                hospitalId={feedbackBooking.hospitalId} patientId={patientSession?.patientId || ''}
                doctorName={doctorMap[feedbackBooking.doctorId]?.name || 'Unknown'}
                hospitalName={hospitalMap[feedbackBooking.hospitalId]?.name || 'Unknown'}
                onSubmit={() => { setFeedbackBooking(null); setRefreshKey(prev => prev + 1); }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReceiptContent = ({ booking, hospital, doctor }: { booking: Booking; hospital?: Hospital; doctor?: Doctor }) => {
  return (
    <div className="space-y-4">
      <div className="gradient-primary rounded-lg p-4 text-center text-primary-foreground">
        <h2 className="text-xl font-bold">{hospital?.name || 'Hospital'}</h2>
        <p className="text-primary-foreground/80 text-sm">{hospital?.address}</p>
      </div>
      <div className="text-center">
        <Badge className={booking.status === 'appeared' ? 'gradient-success' : booking.status === 'not-appeared' ? 'bg-destructive' : 'bg-warning'}>
          {booking.status.toUpperCase().replace('-', ' ')}
        </Badge>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Booking ID</span><span className="font-mono font-bold">{booking.bookingId}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Specialist</span><span className="font-medium">Dr. {doctor?.name || 'Unknown'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Patient Name</span><span className="font-medium">{booking.patientName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(new Date(booking.date), 'MMMM d, yyyy')}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Time Slot</span><span className="font-medium">{booking.timeSlot}</span></div>
        <div className="flex justify-between border-t pt-3"><span className="font-medium">Amount Paid</span><span className="font-bold text-primary">${booking.amountPaid}</span></div>
      </div>
      <div className="border-t pt-4 text-center">
        <p className="font-bold text-foreground">{hospital?.name}</p>
        <Badge className="mt-2 gradient-success">BOOKED</Badge>
      </div>
    </div>
  );
};

export default MyBookings;
