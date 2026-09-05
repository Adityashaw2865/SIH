import { useCallback, useEffect, useState } from "react";
import {
  Users, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  ShieldCheck, UserPlus, LayoutList, Settings
} from "lucide-react";
import { StaffShell } from "../../components/Shells";
import { Card, PriorityBadge, Badge, Button, SkeletonLine, EmptyState } from "../../components/ui";
import api from "../../services/api";

export default function TriageDashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "admin";
  const [tab, setTab] = useState("queue");

  return (
    <StaffShell role={currentUser?.role || "triage"} title="Triage Desk">
      <div className="flex items-center gap-2 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("queue")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "queue" ? "bg-white text-teal shadow-soft" : "text-ink-soft hover:text-ink"
          }`}
        >
          <LayoutList size={16} /> Queue
        </button>
        <button
          onClick={() => setTab("manage")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "manage" ? "bg-white text-teal shadow-soft" : "text-ink-soft hover:text-ink"
          }`}
        >
          <Settings size={16} /> Manage
        </button>
      </div>

      {tab === "queue" ? <QueueTab /> : <ManageTab isAdmin={isAdmin} />}
    </StaffShell>
  );
}

// ---------------------------------------------------------------------
// Queue tab — live patient list, red-flag acknowledgement, doctor assign
// ---------------------------------------------------------------------
function QueueTab() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/api/patients"), api.get("/api/patients/doctors")])
      .then(([patientsRes, doctorsRes]) => {
        setPatients(patientsRes.data.data);
        setDoctors(doctorsRes.data.data);
      })
      .catch(() => setError("Couldn't load the queue. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignDoctor = (patientId, doctorName) => {
    if (!doctorName) return;
    setBusyId(patientId);
    api.post(`/api/patients/${patientId}/assign`, { doctorName })
      .then(res => {
        setPatients(prev => prev.map(p => (p._id === patientId ? res.data.data : p)));
      })
      .catch(() => setError("Couldn't assign doctor. Please try again."))
      .finally(() => setBusyId(null));
  };

  const acknowledgeFlag = (patientId, flagId) => {
    setBusyId(patientId);
    api.post(`/api/patients/${patientId}/red-flags/${flagId}/acknowledge`)
      .then(res => {
        setPatients(prev => prev.map(p => (p._id === patientId ? res.data.data : p)));
      })
      .catch(() => setError("Couldn't acknowledge the alert. Please try again."))
      .finally(() => setBusyId(null));
  };

  const stats = [
    { icon: Users, label: "Total Patients", value: String(patients.length) },
    { icon: Clock, label: "In Progress", value: String(patients.filter(p => p.intakeStatus !== "complete").length) },
    { icon: CheckCircle2, label: "Intake Complete", value: String(patients.filter(p => p.intakeStatus === "complete").length) },
    {
      icon: AlertTriangle,
      label: "Unacknowledged Alerts",
      value: String(patients.filter(p => p.redFlags?.some(f => !f.acknowledged)).length),
      tone: "emergency"
    }
  ];

  if (loading) {
    return (
      <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} className="p-5">
              <SkeletonLine className="w-10 h-10 rounded-xl mb-3" />
              <SkeletonLine className="h-6 w-12 mb-2" />
              <SkeletonLine className="h-4 w-24" />
            </Card>
          ))}
        </div>
        <Card className="p-5 space-y-3">
          {[0, 1, 2, 3, 4].map(i => <SkeletonLine key={i} className="h-10 w-full" />)}
        </Card>
      </>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-emergency/30 text-emergency text-sm rounded-xl px-4 py-3">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={load}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label} className="p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              s.tone === "emergency" ? "bg-red-50 text-emergency" : "bg-teal-light text-teal"
            }`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-light flex items-center justify-between">
          <h2 className="font-bold text-ink">Patient Queue</h2>
          <span className="text-xs text-ink-soft">{patients.length} shown</span>
        </div>
        {patients.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No patients yet" message="New kiosk registrations will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft uppercase border-b border-teal-light">
                  <th className="px-5 py-3 font-semibold">Token</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Assign Doctor</th>
                  <th className="px-5 py-3 font-semibold">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id} className="border-b border-teal-light/60 last:border-0 hover:bg-teal-light/20">
                    <td className="px-5 py-4 font-mono text-xs text-ink-soft">{p.token}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink-soft">{p.age} {p.gender}</p>
                    </td>
                    <td className="px-5 py-4"><PriorityBadge priority={p.priority} /></td>
                    <td className="px-5 py-4">
                      <Badge tone={p.intakeStatus === "complete" ? "success" : "warn"}>
                        {p.intakeStatus === "complete" ? "✓ Complete" : "In progress"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={p.assignedDoctor || ""}
                        disabled={busyId === p._id}
                        onChange={e => assignDoctor(p._id, e.target.value)}
                        className="rounded-lg border border-teal-light bg-white px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-teal/30"
                      >
                        <option value="">
                          {p.suggestedDoctor ? `Suggested: ${p.suggestedDoctor.name}` : "Unassigned"}
                        </option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.name}>{d.name} — {d.department}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      {p.redFlags?.length ? (
                        <div className="flex flex-col gap-1.5">
                          {p.redFlags.map(f => (
                            <button
                              key={f._id}
                              disabled={f.acknowledged || busyId === p._id}
                              onClick={() => acknowledgeFlag(p._id, f._id)}
                              className={`text-left text-xs font-medium rounded-lg px-2.5 py-1.5 ${
                                f.acknowledged
                                  ? "bg-slate-100 text-ink-soft"
                                  : "bg-red-50 text-emergency hover:bg-red-100"
                              }`}
                            >
                              {f.acknowledged ? "✓ " : "⚠ "}{f.description}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------
// Manage tab — hospital analytics + staff creation/list
// ---------------------------------------------------------------------
function ManageTab({ isAdmin }) {
  const [analytics, setAnalytics] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "triage", doctorName: "", department: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/api/patients/analytics"), api.get("/api/auth/staff")])
      .then(([analyticsRes, staffRes]) => {
        setAnalytics(analyticsRes.data.data);
        setStaff(staffRes.data.data);
      })
      .catch(() => setError("Couldn't load management data. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const createStaff = async e => {
    e.preventDefault();
    setFormError("");
    if (!form.username.trim() || !form.password.trim()) {
      setFormError("Username and password are required.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/api/auth/staff", form);
      setForm({ username: "", password: "", role: "triage", doctorName: "", department: "" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || "Couldn't create the account.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5 space-y-3">
        {[0, 1, 2, 3, 4].map(i => <SkeletonLine key={i} className="h-10 w-full" />)}
      </Card>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-red-50 border border-emergency/30 text-emergency text-sm rounded-xl px-4 py-3">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={load}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      )}

      {analytics && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-teal-light text-teal">
              <Users size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{analytics.totalPatients}</p>
            <p className="text-sm text-ink-soft">Total Patients</p>
          </Card>
          <Card className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-teal-light text-teal">
              <ShieldCheck size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{analytics.verificationRate}%</p>
            <p className="text-sm text-ink-soft">Verification Rate</p>
          </Card>
          <Card className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-teal-light text-teal">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{analytics.completionRate}%</p>
            <p className="text-sm text-ink-soft">Completion Rate</p>
          </Card>
          <Card className="p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-red-50 text-emergency">
              <AlertTriangle size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{analytics.priorityAlerts}</p>
            <p className="text-sm text-ink-soft">Unacknowledged Alerts</p>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-teal-light">
            <h2 className="font-bold text-ink">Staff Accounts</h2>
          </div>
          {staff.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title="No staff yet" message="Create the first account using the form." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-soft uppercase border-b border-teal-light">
                    <th className="px-5 py-3 font-semibold">Username</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s._id} className="border-b border-teal-light/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-ink">{s.username}</td>
                      <td className="px-5 py-3"><Badge tone="teal">{s.role}</Badge></td>
                      <td className="px-5 py-3 text-xs text-ink-soft">
                        {s.role === "doctor" ? `${s.doctorName || "—"} · ${s.department || "—"}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
            <UserPlus size={18} /> Create Staff Account
          </h2>
          <form onSubmit={createStaff} className="space-y-3">
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Username"
              className="w-full rounded-xl border border-teal-light bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40"
            />
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              className="w-full rounded-xl border border-teal-light bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full rounded-xl border border-teal-light bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40"
            >
              <option value="triage">Triage</option>
              <option value="doctor">Doctor</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
            {form.role === "doctor" && (
              <>
                <input
                  value={form.doctorName}
                  onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))}
                  placeholder="Doctor display name"
                  className="w-full rounded-xl border border-teal-light bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40"
                />
                <input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Department"
                  className="w-full rounded-xl border border-teal-light bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/40"
                />
              </>
            )}
            {formError && <p className="text-sm text-emergency font-medium">{formError}</p>}
            <Button type="submit" className="w-full justify-center" disabled={creating}>
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}