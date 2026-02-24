import { Link } from "react-router-dom";
import { Building2, User, Heart, Calendar, Clock, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Book appointments with your preferred doctors in just a few clicks",
    },
    {
      icon: Clock,
      title: "Real-time Availability",
      description: "View available time slots and book instantly",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your health data is protected with industry-standard security",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HealthCare+</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/patient" className="text-muted-foreground hover:text-foreground transition-colors">
              For Patients
            </Link>
            <Link to="/hospital/login" className="text-muted-foreground hover:text-foreground transition-colors">
              For Hospitals
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Smart Healthcare
              <span className="text-gradient-primary"> Appointment </span>
              System
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in">
              Connecting patients with healthcare providers seamlessly. 
              Book appointments, manage schedules, and access quality healthcare with ease.
            </p>
            
            {/* Main Entry Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <div className="flex flex-col gap-2">
                <Link to="/patient/login">
                  <Button size="lg" className="w-full sm:w-auto gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 h-auto">
                    <User className="w-5 h-5 mr-2" />
                    I'm a Patient
                  </Button>
                </Link>
                <div className="text-center text-sm text-muted-foreground">
                  <Link to="/patient/register" className="text-primary hover:underline">
                    New patient? Sign up
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/hospital/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 h-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Building2 className="w-5 h-5 mr-2" />
                    I'm a Hospital
                  </Button>
                </Link>
                <div className="text-center text-sm text-muted-foreground">
                  <Link to="/hospital/register" className="text-primary hover:underline">
                    New hospital? Register
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/admin/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 h-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    I'm an Admin
                  </Button>
                </Link>
                <div className="text-center text-sm text-muted-foreground">
                  <span className="text-muted-foreground">Manage hospital approvals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose HealthCare+?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-primary border-0 overflow-hidden">
            <CardContent className="py-12 px-8 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of patients and healthcare providers who trust HealthCare+ 
                for their appointment management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/hospital/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Register Your Hospital
                  </Button>
                </Link>
                <Link to="/patient">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Book an Appointment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">HealthCare+</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 HealthCare+. This is a demo application.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
