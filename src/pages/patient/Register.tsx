import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { generateId, setPatientSession } from "@/lib/storage";
import { savePatient, getPatientByPhone } from "@/lib/supabase-storage";

type Step = 'form' | 'otp' | 'password' | 'verified';

const PatientRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = async (): Promise<boolean> => {
    if (!formData.name || !formData.phone) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return false;
    }
    if (formData.phone.length < 10) {
      toast({ title: "Invalid phone number", description: "Please enter a valid phone number.", variant: "destructive" });
      return false;
    }
    const existingPatient = await getPatientByPhone(formData.phone);
    if (existingPatient) {
      toast({ title: "Phone number already registered", description: "This phone number is already associated with an account.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    const valid = await validateForm();
    if (!valid) { setIsLoading(false); return; }
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast({ title: "OTP Sent", description: "A verification code has been sent to your phone (use 123456 for demo)." });
    }, 1000);
  };

  const handleOTPVerify = () => {
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter a 6-digit OTP.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otp === "123456") {
        setStep('password');
        toast({ title: "Verified!", description: "Your phone number has been verified. Now create a password." });
      } else {
        toast({ title: "Invalid OTP", description: "Please enter the correct OTP (use 123456 for demo).", variant: "destructive" });
      }
    }, 1000);
  };

  const handleCreatePassword = () => {
    if (formData.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
      return;
    }
    setStep('verified');
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    const patient = {
      id: generateId(),
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      createdAt: new Date().toISOString(),
    };
    await savePatient(patient);
    setPatientSession({ patientId: patient.id, phone: patient.phone, name: patient.name, isLoggedIn: true });
    setIsLoading(false);
    toast({ title: "Account Created!", description: "Your account has been created successfully." });
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
            <CardTitle className="text-2xl">Patient Registration</CardTitle>
            <CardDescription>
              {step === 'form' && "Create your account to book appointments"}
              {step === 'otp' && "Enter the verification code sent to your phone"}
              {step === 'password' && "Create a secure password for your account"}
              {step === 'verified' && "Your phone has been verified!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'form' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Verify Phone"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}<Link to="/patient/login" className="text-primary hover:underline">Login here</Link>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">Enter the 6-digit code sent to <strong>{formData.phone}</strong></p>
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground">Demo: Use OTP <strong>123456</strong></p>
                </div>
                <Button onClick={handleOTPVerify} className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep('form')}>Back</Button>
              </div>
            )}

            {step === 'password' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreatePassword(); }}>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} />
                </div>
                <Button type="submit" className="w-full gradient-primary">Next</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep('otp')}>Back</Button>
              </form>
            )}

            {step === 'verified' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">All Set!</h3>
                  <p className="text-muted-foreground text-sm">Your account is ready. Click below to start booking appointments.</p>
                </div>
                <Button onClick={handleCreateAccount} className="w-full gradient-success text-primary-foreground" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PatientRegister;
