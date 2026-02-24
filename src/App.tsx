import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Hospital Pages
import HospitalRegister from "./pages/hospital/Register";
import HospitalLogin from "./pages/hospital/Login";
import HospitalDashboard from "./pages/hospital/Dashboard";
import AddDoctors from "./pages/hospital/AddDoctors";
import PatientBookings from "./pages/hospital/PatientBookings";

// Patient Pages
import PatientRegister from "./pages/patient/Register";
import PatientLogin from "./pages/patient/Login";
import PatientDashboard from "./pages/patient/Dashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import MyBookings from "./pages/patient/MyBookings";
import Reschedule from "./pages/patient/Reschedule";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Index />} />
          
          {/* Hospital Routes */}
          <Route path="/hospital/register" element={<HospitalRegister />} />
          <Route path="/hospital/login" element={<HospitalLogin />} />
          <Route path="/hospital/dashboard" element={<HospitalDashboard />}>
            <Route path="doctors" element={<AddDoctors />} />
            <Route path="bookings" element={<PatientBookings />} />
          </Route>
          
          {/* Patient Routes */}
          <Route path="/patient/register" element={<PatientRegister />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient" element={<PatientDashboard />}>
            <Route path="book" element={<BookAppointment />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="reschedule" element={<Reschedule />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
