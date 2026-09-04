import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle2, Clock, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { StaffShell } from "../../components/Shells";
import { Card, PriorityBadge, Badge, Button, SkeletonLine, EmptyState } from "../../components/ui";
import api from "../../services/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real logged-in doctor, taken from the JWT payload Login.jsx stored —
  // no more manual "viewing as" dropdown / localStorage guesswork.
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentDoctor = currentUser?.doctorName || null;

  const loadPatients = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/api/patients")
      .then(res => setAllPatients(res.data.data))
      .catch(() => setError("Couldn't load patients. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Doctors only ever see patients triage has assigned to them. Admins
  // (who have no doctorName) can still see everyone, for oversight.
  const patients = currentUser?.role === "admin"
    ? allPatients
    : allPatients.filter(p => p.assignedDoctor === currentDoctor);

  const stats = [{
    icon: Users,
    label: "Today's Patients",
    value: String(patients.length)
  }, {
    icon: CheckCircle2,
    label: "Intake Completed",
    value: String(patients.filter(p => p.intakeStatus === "complete").length)
  }, {
    icon: Clock,
    label: "Waiting",
    value: String(patients.filter(p => p.intakeStatus !== "complete").length)
  }, {
    icon: AlertTriangle,
    label: "Priority Alerts",
    value: String(patients.filter(p => p.redFlags?.length > 0).length),
    tone: "emergency"
  }, {
    icon: CheckCircle2,
    label: "Reviewed by You",
    value: String(patients.filter(p => p.reviewedByDoctor?.reviewed).length)
  }];

  return <StaffShell role="doctor" title={currentDoctor ? `Good Morning, ${currentDoctor}` : "Good Morning"}>
      {error && <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-emergency/30 text-emergency text-sm rounded-xl px-4 py-3">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={loadPatients}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>}

      {loading ? <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map(i => <Card key={i} className="p-5">
                <SkeletonLine className="w-10 h-10 rounded-xl mb-3" />
                <SkeletonLine className="h-6 w-12 mb-2" />
                <SkeletonLine className="h-4 w-24" />
              </Card>)}
          </div>
          <Card className="p-5 space-y-3">
            {[0, 1, 2, 3, 4].map(i => <SkeletonLine key={i} className="h-10 w-full" />)}
          </Card>
        </> : <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(s => <Card key={s.label} className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.tone === "emergency" ? "bg-red-50 text-emergency" : "bg-teal-light text-teal"}`}>
                  <s.icon size={20} />
                </div>
                <p className="text-2xl font-extrabold text-ink">{s.value}</p>
                <p className="text-sm text-ink-soft">{s.label}</p>
              </Card>)}
          </div>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-teal-light flex items-center justify-between">
              <h2 className="font-bold text-ink">Patients</h2>
              <span className="text-xs text-ink-soft">{patients.length} shown</span>
            </div>
            {patients.length === 0 && !error ? <EmptyState
                icon={<Users size={22} />}
                title="No patients yet"
                message="Patients assigned to you by triage will show up here."
              /> : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-soft uppercase border-b border-teal-light">
                      <th className="px-5 py-3 font-semibold">Token</th>
                      <th className="px-5 py-3 font-semibold">Patient</th>
                      <th className="px-5 py-3 font-semibold">Intake Status</th>
                      <th className="px-5 py-3 font-semibold">Priority</th>
                      <th className="px-5 py-3 font-semibold">Documents</th>
                      <th className="px-5 py-3 font-semibold">Summary</th>
                      <th className="px-5 py-3 font-semibold">Reviewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => <tr key={p._id} className="border-b border-teal-light/60 last:border-0 hover:bg-teal-light/20 cursor-pointer" onClick={() => navigate(`/doctor/patient/${p._id}`)}>
                        <td className="px-5 py-4 font-mono text-xs text-ink-soft">{p.token}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-ink">{p.name}</p>
                          <p className="text-xs text-ink-soft">{p.age} {p.gender}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={p.intakeStatus === "complete" ? "success" : "warn"}>
                            {p.intakeStatus === "complete" ? "✓ Complete" : "In progress"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4"><PriorityBadge priority={p.priority} /></td>
                        <td className="px-5 py-4 flex items-center gap-1.5 text-ink-soft">
                          <FileText size={14} /> {p.documents?.length || 0}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={p.verificationStatus === "verified" ? "success" : "neutral"}>
                            {p.verificationStatus === "verified" ? "✓ Verified" : "Ready"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={p.reviewedByDoctor?.reviewed ? "success" : "neutral"}>
                            {p.reviewedByDoctor?.reviewed ? "✓ Reviewed" : "Not yet"}
                          </Badge>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </Card>
        </>}
    </StaffShell>;
}