import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Heart, Home, UserPlus, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getHospitalSession, clearHospitalSession } from "@/lib/storage";
import { getHospitalById, getDoctorsByHospital, getBookingsByHospital } from "@/lib/supabase-storage";
import { Hospital, Doctor, Booking } from "@/types/healthcare";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    const session = getHospitalSession();
    if (!session || !session.isLoggedIn) {
      navigate('/hospital/login');
      return;
    }

    getHospitalById(session.hospitalId).then(hospitalData => {
      if (!hospitalData) {
        clearHospitalSession();
        navigate('/hospital/login');
        return;
      }
      setHospital(hospitalData);
    });
  }, [navigate]);

  const handleLogout = () => {
    clearHospitalSession();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate('/hospital/login');
  };

  const navItems = [
    { path: '/hospital/dashboard', label: 'Home', icon: Home },
    { path: '/hospital/dashboard/doctors', label: 'Add Doctors', icon: UserPlus },
    { path: '/hospital/dashboard/bookings', label: 'Patient Bookings', icon: ClipboardList },
  ];

  const isActivePath = (path: string) => {
    if (path === '/hospital/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  if (!hospital) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/hospital/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">HealthCare+</span>
              <span className="text-sm text-muted-foreground ml-2">| {hospital.name}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button variant={isActivePath(item.path) ? "default" : "ghost"} size="sm" className={isActivePath(item.path) ? "gradient-primary" : ""}>
                  <item.icon className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {location.pathname === '/hospital/dashboard' ? (
          <HospitalHome hospital={hospital} />
        ) : (
          <Outlet context={{ hospital }} />
        )}
      </main>
    </div>
  );
};

const HospitalHome = ({ hospital }: { hospital: Hospital }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDoctorsByHospital(hospital.id),
      getBookingsByHospital(hospital.id),
    ]).then(([d, b]) => {
      setDoctors(d);
      setBookings(b);
      setLoading(false);
    });
  }, [hospital.id]);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground text-center py-12">Loading dashboard...</div>;
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const appearedBookings = bookings.filter(b => b.status === 'appeared');

  const stats = [
    { label: 'Total Doctors', value: doctors.length, color: 'bg-primary/10 text-primary' },
    { label: 'Total Bookings', value: bookings.length, color: 'bg-accent/10 text-accent' },
    { label: 'Pending', value: pendingBookings.length, color: 'bg-warning/10 text-warning' },
    { label: 'Appeared', value: appearedBookings.length, color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">{hospital.name} Dashboard</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-xl p-6 ${stat.color}`}>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/hospital/dashboard/doctors" className="block">
          <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Add Doctors</h3>
            <p className="text-muted-foreground text-sm">Add new doctors and manage their availability schedules</p>
          </div>
        </Link>
        <Link to="/hospital/dashboard/bookings" className="block">
          <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 rounded-lg gradient-success flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Patient Bookings</h3>
            <p className="text-muted-foreground text-sm">View and manage all patient appointment bookings</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HospitalDashboard;
