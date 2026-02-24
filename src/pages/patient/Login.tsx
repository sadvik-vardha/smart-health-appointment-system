import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setPatientSession } from "@/lib/storage";
import { getPatientByPhone } from "@/lib/supabase-storage";

const PatientLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({ phone: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.password) {
      toast({ title: "Missing fields", description: "Please enter both phone number and password.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const patient = await getPatientByPhone(formData.phone);

    if (!patient) {
      setIsLoading(false);
      toast({ title: "Account not found", description: "No account found with this phone number.", variant: "destructive" });
      return;
    }

    if (patient.password !== formData.password) {
      setIsLoading(false);
      toast({ title: "Invalid password", description: "The password you entered is incorrect.", variant: "destructive" });
      return;
    }

    setPatientSession({ patientId: patient.id, phone: patient.phone, name: patient.name, isLoggedIn: true });
    setIsLoading(false);
    toast({ title: "Welcome back!", description: `Logged in as ${patient.name}` });
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthCare+</span>
          </Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Patient Login</CardTitle>
            <CardDescription>Welcome back! Sign in to manage your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}<Link to="/patient/register" className="text-primary hover:underline">Sign up here</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PatientLogin;
