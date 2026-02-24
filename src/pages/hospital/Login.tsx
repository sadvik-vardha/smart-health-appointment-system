import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setHospitalSession } from "@/lib/storage";
import { getHospitalByEmail } from "@/lib/supabase-storage";

const HospitalLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({ title: "Missing fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const hospital = await getHospitalByEmail(formData.email);

    if (!hospital) {
      setIsLoading(false);
      toast({ title: "Account not found", description: "No hospital account found with this email.", variant: "destructive" });
      return;
    }

    if (hospital.password !== formData.password) {
      setIsLoading(false);
      toast({ title: "Invalid password", description: "The password you entered is incorrect.", variant: "destructive" });
      return;
    }

    if (!hospital.approved) {
      setIsLoading(false);
      toast({ title: "Pending Approval", description: "Your hospital account is waiting for admin approval. Please try again later.", variant: "destructive" });
      return;
    }

    setHospitalSession({ hospitalId: hospital.id, isLoggedIn: true });
    setIsLoading(false);
    toast({ title: "Welcome back!", description: `Logged in as ${hospital.name}` });
    navigate('/hospital/dashboard');
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
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Hospital Login</CardTitle>
            <CardDescription>Sign in to manage your hospital's appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input id="email" name="email" type="email" placeholder="hospital@example.com" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/hospital/register" className="text-primary hover:underline">Register here</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HospitalLogin;
