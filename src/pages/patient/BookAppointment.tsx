import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Stethoscope, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Hospital, Doctor, SPECIALIZATIONS } from "@/types/healthcare";
import { getPatientSession, generateBookingId, generateId } from "@/lib/storage";
import {
  getHospitals,
  getDoctorsByHospital,
  getDoctorsBySpecialization,
  getHospitalById,
  getAvailableSlots,
  saveBooking,
} from "@/lib/supabase-storage";
import { DoctorRatingBadge } from "@/components/DoctorReviews";

type BookingStep = 'method' | 'select' | 'doctor' | 'form' | 'payment' | 'receipt';
type BookingMethod = 'hospital' | 'location' | 'specialist';

interface BookingData {
  method: BookingMethod | null;
  hospital: Hospital | null;
  doctor: Doctor | null;
  patientName: string;
  patientAge: string;
  patientGender: 'male' | 'female' | 'other' | '';
  patientPhone: string;
  problemDescription: string;
  selectedDate: Date | undefined;
  selectedSlot: string;
  bookingId: string;
}

const BookAppointment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>('method');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const patientSession = getPatientSession();

  const [bookingData, setBookingData] = useState<BookingData>({
    method: null, hospital: null, doctor: null,
    patientName: patientSession?.name || '', patientAge: '', patientGender: '',
    patientPhone: patientSession?.phone || '', problemDescription: '',
    selectedDate: undefined, selectedSlot: '', bookingId: '',
  });

  // Async state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [specCounts, setSpecCounts] = useState<Record<string, number>>({});

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');

  // Load hospitals on mount
  useEffect(() => {
    getHospitals().then(h => {
      setHospitals(h);
      const locs = [...new Set(h.map(hp => hp.address))];
      setLocations(locs);
      setLoading(false);
    });
  }, []);

  // Load spec counts when specialist method selected
  useEffect(() => {
    if (bookingData.method === 'specialist') {
      const loadCounts = async () => {
        const counts: Record<string, number> = {};
        await Promise.all(SPECIALIZATIONS.map(async (spec) => {
          const docs = await getDoctorsBySpecialization(spec);
          counts[spec] = docs.length;
        }));
        setSpecCounts(counts);
      };
      loadCounts();
    }
  }, [bookingData.method]);

  // Load available slots when date changes
  useEffect(() => {
    if (bookingData.doctor && bookingData.selectedDate) {
      const dateStr = format(bookingData.selectedDate, 'yyyy-MM-dd');
      getAvailableSlots(bookingData.doctor.id, dateStr).then(setAvailableSlots);
    } else {
      setAvailableSlots([]);
    }
  }, [bookingData.doctor, bookingData.selectedDate]);

  const bookingMethods = [
    { id: 'hospital' as BookingMethod, icon: Building2, title: 'Hospital-Wise', description: 'Browse all registered hospitals' },
    { id: 'location' as BookingMethod, icon: MapPin, title: 'Location-Wise', description: 'Find hospitals by location' },
    { id: 'specialist' as BookingMethod, icon: Stethoscope, title: 'Specialist-Wise', description: 'Search by specialization' },
  ];

  const selectMethod = (method: BookingMethod) => {
    setBookingData(prev => ({ ...prev, method }));
    setStep('select');
  };

  const selectHospital = async (hospital: Hospital) => {
    setBookingData(prev => ({ ...prev, hospital }));
    const docs = await getDoctorsByHospital(hospital.id);
    setAvailableDoctors(docs);
    setStep('doctor');
  };

  const selectLocationAndLoadDoctors = async (location: string) => {
    setSelectedLocation(location);
    const hospitalsInLocation = hospitals.filter(h => h.address === location);
    const allDocs = await Promise.all(hospitalsInLocation.map(h => getDoctorsByHospital(h.id)));
    setAvailableDoctors(allDocs.flat());
    setStep('doctor');
  };

  const selectSpecAndLoadDoctors = async (spec: string) => {
    setSelectedSpecialization(spec);
    const docs = await getDoctorsBySpecialization(spec);
    setAvailableDoctors(docs);
    setStep('doctor');
  };

  const selectDoctor = async (doctor: Doctor) => {
    const hospital = await getHospitalById(doctor.hospitalId);
    setBookingData(prev => ({ ...prev, doctor, hospital: hospital || null }));
    setStep('form');
  };

  const getAvailableDates = (): Date[] => {
    if (!bookingData.doctor) return [];
    return bookingData.doctor.availability.map(a => new Date(a.date)).filter(d => d >= new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    setBookingData(prev => ({ ...prev, selectedDate: date, selectedSlot: '' }));
  };

  const handleSlotSelect = (slot: string) => {
    setBookingData(prev => ({ ...prev, selectedSlot: slot }));
  };

  const validateForm = (): boolean => {
    if (!bookingData.patientName || !bookingData.patientAge || !bookingData.patientGender || !bookingData.patientPhone) {
      toast({ title: "Missing fields", description: "Please fill in all patient details.", variant: "destructive" });
      return false;
    }
    if (!bookingData.selectedDate || !bookingData.selectedSlot) {
      toast({ title: "Select appointment", description: "Please select a date and time slot.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleProceedToPay = () => { if (validateForm()) setStep('payment'); };

  const handlePayment = async () => {
    if (!bookingData.doctor || !bookingData.hospital) return;
    setIsProcessing(true);

    const bookingId = generateBookingId();
    const booking = {
      id: generateId(), bookingId,
      hospitalId: bookingData.hospital.id, doctorId: bookingData.doctor.id,
      patientName: bookingData.patientName, patientAge: parseInt(bookingData.patientAge),
      patientGender: bookingData.patientGender as 'male' | 'female' | 'other',
      patientPhone: bookingData.patientPhone, problemDescription: bookingData.problemDescription,
      date: format(bookingData.selectedDate!, 'yyyy-MM-dd'), timeSlot: bookingData.selectedSlot,
      amountPaid: bookingData.doctor.consultationFee, status: 'pending' as const,
      rescheduleCount: 0, createdAt: new Date().toISOString(),
    };

    await saveBooking(booking);
    setBookingData(prev => ({ ...prev, bookingId }));
    setIsProcessing(false);
    setStep('receipt');
    toast({ title: "Booking Confirmed!", description: `Your booking ID is ${bookingId}` });
  };

  const goBack = () => {
    if (step === 'select') setStep('method');
    else if (step === 'doctor') setStep('select');
    else if (step === 'form') setStep('doctor');
    else if (step === 'payment') setStep('form');
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {step !== 'method' && step !== 'receipt' && (
        <Button variant="ghost" onClick={goBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      )}

      {/* Step 1: Select Booking Method */}
      {step === 'method' && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
            <p className="text-muted-foreground">Choose how you'd like to find a doctor</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {bookingMethods.map((method) => (
              <Card key={method.id} className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary" onClick={() => selectMethod(method.id)}>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <method.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{method.title}</h3>
                  <p className="text-muted-foreground text-sm">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {hospitals.length === 0 && (
            <Card className="bg-warning/10 border-warning"><CardContent className="py-4 text-center"><p className="text-warning">No hospitals registered yet. Please check back later.</p></CardContent></Card>
          )}
        </>
      )}

      {/* Step 2: Select Based on Method */}
      {step === 'select' && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {bookingData.method === 'hospital' && 'Select Hospital'}
              {bookingData.method === 'location' && 'Select Location'}
              {bookingData.method === 'specialist' && 'Select Specialization'}
            </h1>
          </div>

          {bookingData.method === 'hospital' && (
            <div className="grid md:grid-cols-2 gap-4">
              {hospitals.map((hospital) => (
                <Card key={hospital.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectHospital(hospital)}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center"><Building2 className="w-6 h-6 text-primary-foreground" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-foreground">{hospital.name}</h3><p className="text-sm text-muted-foreground">{hospital.address}</p></div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {bookingData.method === 'location' && (
            <div className="grid md:grid-cols-2 gap-4">
              {locations.map((location) => (
                <Card key={location} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectLocationAndLoadDoctors(location)}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg gradient-success flex items-center justify-center"><MapPin className="w-6 h-6 text-primary-foreground" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-foreground">{location}</h3><p className="text-sm text-muted-foreground">{hospitals.filter(h => h.address === location).length} hospital(s)</p></div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {locations.length === 0 && <p className="text-muted-foreground">No locations available.</p>}
            </div>
          )}

          {bookingData.method === 'specialist' && (
            <div className="grid md:grid-cols-3 gap-4">
              {SPECIALIZATIONS.map((spec) => {
                const doctorCount = specCounts[spec] || 0;
                return (
                  <Card key={spec} className={cn("cursor-pointer transition-shadow", doctorCount > 0 ? "hover:shadow-lg" : "opacity-50 cursor-not-allowed")}
                    onClick={() => { if (doctorCount > 0) selectSpecAndLoadDoctors(spec); }}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-primary" /></div>
                        <div className="flex-1"><h3 className="font-medium text-foreground">{spec}</h3><p className="text-xs text-muted-foreground">{doctorCount} doctor(s)</p></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Step 3: Select Doctor */}
      {step === 'doctor' && (
        <>
          <div><h1 className="text-2xl font-bold text-foreground">Select Doctor</h1><p className="text-muted-foreground">Choose from available doctors</p></div>
          <div className="grid gap-4">
            {availableDoctors.map((doctor) => (
              <Card key={doctor.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectDoctor(doctor)}>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">Dr. {doctor.name}</h3>
                        <Badge variant="secondary">{doctor.specialization}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doctor.experience} years exp</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm font-medium text-primary">${doctor.consultationFee} per consultation</span>
                        <DoctorRatingBadge doctorId={doctor.id} />
                      </div>
                    </div>
                    <Button className="gradient-primary">Select <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {availableDoctors.length === 0 && (
              <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No doctors available for this selection.</p></CardContent></Card>
            )}
          </div>
        </>
      )}

      {/* Step 4: Patient Details & Slot Selection */}
      {step === 'form' && bookingData.doctor && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointment Details</h1>
            <p className="text-muted-foreground">Booking with Dr. {bookingData.doctor.name} at {bookingData.hospital?.name}</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Patient Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Patient Name</Label><Input placeholder="Enter full name" value={bookingData.patientName} onChange={(e) => setBookingData(prev => ({ ...prev, patientName: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="Age" value={bookingData.patientAge} onChange={(e) => setBookingData(prev => ({ ...prev, patientAge: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Gender</Label>
                    <Select value={bookingData.patientGender} onValueChange={(value) => setBookingData(prev => ({ ...prev, patientGender: value as any }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" placeholder="+1 (555) 000-0000" value={bookingData.patientPhone} onChange={(e) => setBookingData(prev => ({ ...prev, patientPhone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Problem Description (Optional)</Label><Textarea placeholder="Briefly describe your symptoms..." value={bookingData.problemDescription} onChange={(e) => setBookingData(prev => ({ ...prev, problemDescription: e.target.value }))} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Select Date & Time</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Available Dates</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {bookingData.selectedDate ? format(bookingData.selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={bookingData.selectedDate} onSelect={handleDateSelect}
                        disabled={(date) => { const avail = getAvailableDates(); return !avail.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')); }}
                        className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>

                {bookingData.selectedDate && (
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => (
                        <Badge key={slot} variant={bookingData.selectedSlot === slot ? "default" : "outline"}
                          className={cn("cursor-pointer transition-colors py-2 px-3", bookingData.selectedSlot === slot && "gradient-primary border-0")}
                          onClick={() => handleSlotSelect(slot)}>{slot}</Badge>
                      ))}
                      {availableSlots.length === 0 && <p className="text-sm text-muted-foreground">No slots available for this date.</p>}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="text-2xl font-bold text-foreground">${bookingData.doctor.consultationFee}</span>
                  </div>
                </div>

                <Button onClick={handleProceedToPay} className="w-full gradient-primary" disabled={!bookingData.selectedDate || !bookingData.selectedSlot}>
                  Proceed to Pay
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Step 5: Payment */}
      {step === 'payment' && bookingData.doctor && (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center"><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Doctor</span><span className="font-medium">Dr. {bookingData.doctor.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-medium">{bookingData.selectedDate && format(bookingData.selectedDate, 'MMM d, yyyy')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Time</span><span className="font-medium">{bookingData.selectedSlot}</span></div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="font-medium">Total Amount</span><span className="font-bold text-primary">${bookingData.doctor.consultationFee}</span></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label>UPI ID (Demo)</Label><Input placeholder="yourname@upi" /></div>
                <div className="text-center text-muted-foreground text-sm">OR</div>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center mb-2"><span className="text-xs text-muted-foreground">QR Code</span></div>
                  <p className="text-sm text-muted-foreground">Scan to pay (Demo)</p>
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full gradient-success text-primary-foreground" disabled={isProcessing}>
                {isProcessing ? <span className="flex items-center gap-2"><span className="animate-pulse-gentle">Processing Payment...</span></span> : `Pay $${bookingData.doctor.consultationFee}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 6: Receipt */}
      {step === 'receipt' && bookingData.doctor && bookingData.hospital && (
        <div className="max-w-md mx-auto">
          <Card className="overflow-hidden">
            <div className="gradient-primary p-6 text-center text-primary-foreground">
              <h2 className="text-2xl font-bold">{bookingData.hospital.name}</h2>
              <p className="text-primary-foreground/80 text-sm">{bookingData.hospital.address}</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="text-center pb-4 border-b"><Badge className="gradient-success text-lg px-4 py-1">BOOKED</Badge></div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Booking ID</span><span className="font-mono font-bold">{bookingData.bookingId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Specialist</span><span className="font-medium">Dr. {bookingData.doctor.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Patient Name</span><span className="font-medium">{bookingData.patientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{bookingData.selectedDate && format(bookingData.selectedDate, 'MMMM d, yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time Slot</span><span className="font-medium">{bookingData.selectedSlot}</span></div>
                <div className="flex justify-between border-t pt-3"><span className="font-medium">Amount Paid</span><span className="font-bold text-primary">${bookingData.doctor.consultationFee}</span></div>
              </div>
              <div className="border-t pt-4 mt-4 text-center">
                <p className="font-bold text-foreground">{bookingData.hospital.name}</p>
                <Badge className="mt-2 gradient-success">BOOKED</Badge>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>Print Receipt</Button>
                <Button className="flex-1 gradient-primary" onClick={() => navigate('/patient/bookings')}>View Bookings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
