import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Hospital, Doctor, DoctorAvailability, SPECIALIZATIONS, TIME_SLOTS } from "@/types/healthcare";
import { generateId } from "@/lib/storage";
import { getDoctorsByHospital, saveDoctor, deleteDoctor } from "@/lib/supabase-storage";

interface ContextType {
  hospital: Hospital;
}

const AddDoctors = () => {
  const { hospital } = useOutletContext<ContextType>();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    experience: "",
    consultationFee: "",
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateTimeSlots, setDateTimeSlots] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadDoctors();
  }, [hospital.id]);

  const loadDoctors = async () => {
    setLoading(true);
    const hospitalDoctors = await getDoctorsByHospital(hospital.id);
    setDoctors(hospitalDoctors);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: "", specialization: "", experience: "", consultationFee: "" });
    setSelectedDates([]);
    setDateTimeSlots({});
    setIsAddingDoctor(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    if (isSelected) {
      setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
      setDateTimeSlots(prev => { const updated = { ...prev }; delete updated[dateStr]; return updated; });
    } else {
      setSelectedDates(prev => [...prev, date]);
      setDateTimeSlots(prev => ({ ...prev, [dateStr]: [] }));
    }
  };

  const toggleTimeSlot = (dateStr: string, slot: string) => {
    setDateTimeSlots(prev => {
      const currentSlots = prev[dateStr] || [];
      const isSelected = currentSlots.includes(slot);
      return { ...prev, [dateStr]: isSelected ? currentSlots.filter(s => s !== slot) : [...currentSlots, slot] };
    });
  };

  const handleAddDoctor = async () => {
    if (!formData.name || !formData.specialization || !formData.experience || !formData.consultationFee) {
      toast({ title: "Missing fields", description: "Please fill in all doctor details.", variant: "destructive" });
      return;
    }
    if (selectedDates.length === 0) {
      toast({ title: "No availability", description: "Please select at least one available date.", variant: "destructive" });
      return;
    }
    const hasTimeSlots = Object.values(dateTimeSlots).some(slots => slots.length > 0);
    if (!hasTimeSlots) {
      toast({ title: "No time slots", description: "Please select time slots for the available dates.", variant: "destructive" });
      return;
    }

    const availability: DoctorAvailability[] = selectedDates
      .map(date => ({ date: format(date, 'yyyy-MM-dd'), timeSlots: dateTimeSlots[format(date, 'yyyy-MM-dd')] || [] }))
      .filter(a => a.timeSlots.length > 0);

    const newDoctor: Doctor = {
      id: generateId(),
      hospitalId: hospital.id,
      name: formData.name,
      specialization: formData.specialization,
      experience: parseInt(formData.experience),
      consultationFee: parseFloat(formData.consultationFee),
      availability,
    };

    await saveDoctor(newDoctor);
    await loadDoctors();
    resetForm();
    toast({ title: "Doctor Added", description: `Dr. ${formData.name} has been added successfully.` });
  };

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    await deleteDoctor(doctorId);
    await loadDoctors();
    toast({ title: "Doctor Removed", description: `Dr. ${doctorName} has been removed.` });
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground text-center py-12">Loading doctors...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Doctors</h1>
          <p className="text-muted-foreground">Manage your hospital's doctors and their availability</p>
        </div>
        {!isAddingDoctor && (
          <Button onClick={() => setIsAddingDoctor(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />Add Doctor
          </Button>
        )}
      </div>

      {isAddingDoctor && (
        <Card>
          <CardHeader><CardTitle>New Doctor</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Doctor Name</Label>
                <Input id="name" placeholder="Dr. John Smith" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select value={formData.specialization} onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                  <SelectContent>{SPECIALIZATIONS.map((spec) => (<SelectItem key={spec} value={spec}>{spec}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input id="experience" type="number" min="0" placeholder="5" value={formData.experience} onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Consultation Fee ($)</Label>
                <Input id="fee" type="number" min="0" placeholder="50" value={formData.consultationFee} onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Available Dates</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Calendar className="w-4 h-4 mr-2" />Select Dates ({selectedDates.length} selected)
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      if (dates) {
                        const newDates = dates.filter(d => !selectedDates.some(sd => format(sd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')));
                        const removedDates = selectedDates.filter(sd => !dates.some(d => format(d, 'yyyy-MM-dd') === format(sd, 'yyyy-MM-dd')));
                        if (newDates.length > 0) newDates.forEach(d => handleDateSelect(d));
                        if (removedDates.length > 0) removedDates.forEach(d => handleDateSelect(d));
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {selectedDates.length > 0 && (
                <div className="space-y-4">
                  {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const selectedSlots = dateTimeSlots[dateStr] || [];
                    return (
                      <div key={dateStr} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <Badge key={slot} variant={selectedSlots.includes(slot) ? "default" : "outline"}
                              className={cn("cursor-pointer transition-colors", selectedSlots.includes(slot) && "gradient-primary border-0")}
                              onClick={() => toggleTimeSlot(dateStr, slot)}>{slot}</Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleAddDoctor} className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Add Availability</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {doctors.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No doctors added yet. Click "Add Doctor" to get started.</p></CardContent></Card>
        ) : (
          doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">Dr. {doctor.name}</h3>
                      <Badge variant="secondary">{doctor.specialization}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{doctor.experience} years experience • ${doctor.consultationFee} per consultation</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doctor.availability.slice(0, 3).map((avail) => (
                        <Badge key={avail.date} variant="outline" className="text-xs">{format(new Date(avail.date), 'MMM d')} ({avail.timeSlots.length} slots)</Badge>
                      ))}
                      {doctor.availability.length > 3 && (<Badge variant="outline" className="text-xs">+{doctor.availability.length - 3} more</Badge>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AddDoctors;
