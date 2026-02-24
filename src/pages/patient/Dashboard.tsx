import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heart, Home, Calendar, RefreshCw, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPatientSession, clearPatientSession } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const PatientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getPatientSession();

  useEffect(() => {
    if (!session?.isLoggedIn) {
      navigate('/patient/login');
    }
  }, [session, navigate]);

  const handleLogout = () => {
    clearPatientSession();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/');
  };

  const navItems = [
    { path: '/patient', label: 'Home', icon: Home, exact: true },
    { path: '/patient/book', label: 'Book Appointment', icon: Calendar },
    { path: '/patient/reschedule', label: 'Reschedule', icon: RefreshCw },
    { path: '/patient/bookings', label: 'My Bookings', icon: ClipboardList },
  ];

  const isActivePath = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (!session?.isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthCare+</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActivePath(item.path, item.exact) ? "default" : "ghost"}
                  size="sm"
                  className={isActivePath(item.path, item.exact) ? "gradient-primary" : ""}
                >
                  <item.icon className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {location.pathname === '/patient' ? (
          <PatientHome name={session.name} />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

// Patient Home Component
const PatientHome = ({ name }: { name: string }) => {
  const quickActions = [
    {
      icon: Calendar,
      title: "Book Appointment",
      description: "Find doctors and book your appointment",
      link: "/patient/book",
      gradient: "gradient-primary",
    },
    {
      icon: ClipboardList,
      title: "My Bookings",
      description: "View all your appointments and receipts",
      link: "/patient/bookings",
      gradient: "gradient-success",
    },
    {
      icon: RefreshCw,
      title: "Reschedule",
      description: "Reschedule an existing appointment",
      link: "/patient/reschedule",
      gradient: "bg-warning",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {name}!</h1>
        <p className="text-muted-foreground">What would you like to do today?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.link} className="block">
            <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className={`w-12 h-12 rounded-lg ${action.gradient} flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{action.title}</h3>
              <p className="text-muted-foreground text-sm">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-secondary/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">How to Book an Appointment</h2>
        <ol className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">1</span>
            <span>Choose your preferred way to find a doctor (by hospital, location, or specialty)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">2</span>
            <span>Select an available date and time slot</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">3</span>
            <span>Fill in your details and complete the payment</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">4</span>
            <span>Receive your booking confirmation and receipt</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PatientDashboard;
