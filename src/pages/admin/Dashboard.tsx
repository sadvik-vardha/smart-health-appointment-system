import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Shield, LogOut, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminSession, clearAdminSession } from "@/lib/storage";
import { getHospitals, approveHospital, rejectHospital } from "@/lib/supabase-storage";
import { Hospital } from "@/types/healthcare";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getAdminSession();
    if (!session || !session.isLoggedIn) {
      navigate('/admin/login');
      return;
    }
    loadHospitals();
  }, [navigate]);

  const loadHospitals = async () => {
    setLoading(true);
    const allHospitals = await getHospitals();
    setHospitals(allHospitals);
    setLoading(false);
  };

  const handleLogout = () => {
    clearAdminSession();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate('/admin/login');
  };

  const handleApprove = async (hospitalId: string) => {
    await approveHospital(hospitalId);
    await loadHospitals();
    toast({ title: "Hospital Approved", description: "The hospital can now login to their account." });
  };

  const handleReject = async (hospitalId: string) => {
    await rejectHospital(hospitalId);
    await loadHospitals();
    toast({ title: "Hospital Removed", description: "The hospital registration has been rejected.", variant: "destructive" });
  };

  const pendingHospitals = hospitals.filter(h => !h.approved);
  const approvedHospitals = hospitals.filter(h => h.approved);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">HealthCare+</span>
              <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" />Admin</Badge>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="animate-pulse text-muted-foreground text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 bg-warning/10 text-warning">
                <div className="text-3xl font-bold mb-1">{pendingHospitals.length}</div>
                <div className="text-sm opacity-80">Pending Approval</div>
              </div>
              <div className="rounded-xl p-6 bg-success/10 text-success">
                <div className="text-3xl font-bold mb-1">{approvedHospitals.length}</div>
                <div className="text-sm opacity-80">Approved Hospitals</div>
              </div>
              <div className="rounded-xl p-6 bg-primary/10 text-primary col-span-2 lg:col-span-1">
                <div className="text-3xl font-bold mb-1">{hospitals.length}</div>
                <div className="text-sm opacity-80">Total Registrations</div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-warning" />Pending Hospital Approvals</CardTitle>
                <CardDescription>Review and approve hospital registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingHospitals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No pending hospital approvals</p></div>
                ) : (
                  <div className="space-y-4">
                    {pendingHospitals.map((hospital) => (
                      <div key={hospital.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">{hospital.name}</div>
                          <div className="text-sm text-muted-foreground">{hospital.email}</div>
                          <div className="text-sm text-muted-foreground">{hospital.phone}</div>
                          <div className="text-sm text-muted-foreground">{hospital.address}</div>
                          <div className="text-xs text-muted-foreground">Registered: {new Date(hospital.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gradient-success" onClick={() => handleApprove(hospital.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(hospital.id)}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-success" />Approved Hospitals</CardTitle>
                <CardDescription>List of all approved hospitals</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedHospitals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No approved hospitals yet</p></div>
                ) : (
                  <div className="space-y-4">
                    {approvedHospitals.map((hospital) => (
                      <div key={hospital.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{hospital.name}</span>
                            <Badge variant="default" className="bg-success text-success-foreground">Approved</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{hospital.email}</div>
                          <div className="text-sm text-muted-foreground">{hospital.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
