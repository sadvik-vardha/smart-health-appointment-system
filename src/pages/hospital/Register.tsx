import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/storage";
import { saveHospital, getHospitalByEmail } from "@/lib/supabase-storage";

type Step = 'form' | 'otp' | 'verified' | 'pending';

const HospitalRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = async (): Promise<boolean> => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return false;
    }

    const existingHospital = await getHospitalByEmail(formData.email);
    if (existingHospital) {
      toast({
        title: "Email already registered",
        description: "This email is already associated with a hospital account.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const valid = await validateForm();
    if (!valid) {
      setIsLoading(false);
      return;
    }
    
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your email (use 123456 for demo).",
      });
    }, 1000);
  };

  const handleOTPVerify = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otp === "123456") {
        setStep('verified');
        toast({
          title: "Verified!",
          description: "Your email has been verified successfully.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please enter the correct OTP (use 123456 for demo).",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    
    const hospital = {
      id: generateId(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      password: formData.password,
      approved: false,
      createdAt: new Date().toISOString(),
    };

    await saveHospital(hospital);

    setTimeout(() => {
      setIsLoading(false);
      setStep('pending');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Hospital Registration</CardTitle>
            <CardDescription>
              {step === 'form' && "Create your hospital account to manage appointments"}
              {step === 'otp' && "Enter the verification code sent to your email"}
              {step === 'verified' && "Your email has been verified!"}
              {step === 'pending' && "Your registration is under review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'form' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input id="name" name="name" placeholder="Enter hospital name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email ID</Label>
                  <Input id="email" name="email" type="email" placeholder="hospital@example.com" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address / Location</Label>
                  <Input id="address" name="address" placeholder="123 Medical Center Drive, City" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Verify"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/hospital/login" className="text-primary hover:underline">Login here</Link>
                </p>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code sent to <strong>{formData.email}</strong>
                  </p>
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
                <Button variant="ghost" className="w-full" onClick={() => setStep('form')}>Back to Form</Button>
              </div>
            )}

            {step === 'verified' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Email Verified!</h3>
                  <p className="text-muted-foreground text-sm">Your email has been verified successfully. Click below to submit your registration for approval.</p>
                </div>
                <Button onClick={handleCreateAccount} className="w-full gradient-success text-primary-foreground" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Create Account"}
                </Button>
              </div>
            )}

            {step === 'pending' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center animate-scale-in">
                    <Clock className="w-12 h-12 text-warning" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Wait for Approval</h3>
                  <p className="text-muted-foreground text-sm">Your hospital registration has been submitted successfully. Please wait for admin approval before you can login.</p>
                  <p className="text-muted-foreground text-xs mt-2">You will be able to login with your email and password once approved.</p>
                </div>
                <Link to="/hospital/login">
                  <Button variant="outline" className="w-full">Go to Login Page</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HospitalRegister;
