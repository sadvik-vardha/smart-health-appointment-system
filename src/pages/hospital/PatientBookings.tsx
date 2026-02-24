import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Hospital, Booking, Doctor } from "@/types/healthcare";
import { getBookingsByHospital, getDoctorsByHospital, updateBooking } from "@/lib/supabase-storage";

interface ContextType {
  hospital: Hospital;
}

const PatientBookings = () => {
  const { hospital } = useOutletContext<ContextType>();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, Doctor>>({});
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [hospital.id]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    const [hospitalBookings, doctors] = await Promise.all([
      getBookingsByHospital(hospital.id),
      getDoctorsByHospital(hospital.id),
    ]);
    setBookings(hospitalBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    const map: Record<string, Doctor> = {};
    doctors.forEach(d => { map[d.id] = d; });
    setDoctorMap(map);
    setLoading(false);
  };

  const filterBookings = () => {
    let filtered = [...bookings];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.patientName.toLowerCase().includes(query) || b.bookingId.toLowerCase().includes(query));
    }
    if (statusFilter !== "all") filtered = filtered.filter(b => b.status === statusFilter);
    if (dateFilter) filtered = filtered.filter(b => b.date === dateFilter);
    setFilteredBookings(filtered);
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'appeared' | 'not-appeared') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const updatedBooking = { ...booking, status: newStatus };
    await updateBooking(updatedBooking);
    await loadData();
    toast({ title: "Status Updated", description: `Booking ${booking.bookingId} marked as ${newStatus.replace('-', ' ')}.` });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Pending</Badge>;
      case 'appeared': return <Badge variant="outline" className="bg-success/10 text-success border-success">Appeared</Badge>;
      case 'not-appeared': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Not Appeared</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDoctorName = (doctorId: string): string => {
    const doctor = doctorMap[doctorId];
    return doctor ? `Dr. ${doctor.name}` : 'Unknown';
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground text-center py-12">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Bookings</h1>
        <p className="text-muted-foreground">Manage and track all patient appointments</p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by patient name or booking ID..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="appeared">Appeared</SelectItem>
                <SelectItem value="not-appeared">Not Appeared</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-full md:w-48" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            {(searchQuery || statusFilter !== "all" || dateFilter) && (
              <Button variant="ghost" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setDateFilter(""); }}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {bookings.length === 0 ? "No bookings yet. Patients will appear here once they book appointments." : "No bookings match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead><TableHead>Patient Name</TableHead><TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead><TableHead>Time Slot</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono font-medium">{booking.bookingId}</TableCell>
                      <TableCell>
                        <div><div className="font-medium">{booking.patientName}</div><div className="text-xs text-muted-foreground">{booking.patientPhone}</div></div>
                      </TableCell>
                      <TableCell>{getDoctorName(booking.doctorId)}</TableCell>
                      <TableCell>{format(new Date(booking.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{booking.timeSlot}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking.id, value as any)}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="appeared">Appeared</SelectItem>
                            <SelectItem value="not-appeared">Not Appeared</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {bookings.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {bookings.length}</span>
          <span>Pending: {bookings.filter(b => b.status === 'pending').length}</span>
          <span>Appeared: {bookings.filter(b => b.status === 'appeared').length}</span>
          <span>Not Appeared: {bookings.filter(b => b.status === 'not-appeared').length}</span>
        </div>
      )}
    </div>
  );
};

export default PatientBookings;
