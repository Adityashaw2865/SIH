import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Languages, Sparkles, RefreshCw, Users, Stethoscope, Search, Plus, TrendingUp, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StaffShell } from "../../components/Shells";
import { Card, Button, Badge, ProgressBar, PriorityBadge, SkeletonLine } from "../../components/ui";
import api from "../../services/api";

const columns = [{
  key: "critical",
  title: "🚨 Critical",
  tone: "border-emergency/40 bg-red-50/40"
}, {
  key: "high",
  title: "🟠 High Priority",
  tone: "border-warn/40 bg-amber-50/40"
}, {
  key: "review",
  title: "🟡 Needs Review",
  tone: "border-warn/30 bg-amber-50/20"
}, {
  key: "routine",
  title: "🟢 Routine",
  tone: "border-success/30 bg-green-50/30"
}];

const statusTone = {
  "complete": { tone: "success", label: "Completed" },
  "in-progress": { tone: "warn", label: "In Progress" },
  "not-started": { tone: "neutral", label: "Not Started" }
};

// SVG line chart with grid lines + axis labels — drawn straight from the
// real per-day counts returned by /api/patients/analytics.
function CasesLineChart({ data }) {
  const width = 560;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.newCases, d.resolvedCases)));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const toPoints = key => data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d[key] / maxVal) * innerH;
    return `${x},${y}`;
  }).join(" ");
  const yTicks = [0, 0.5, 1].map(f => Math.round(maxVal * f));

  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {yTicks.map((t, i) => {
        const y = padding.top + innerH - (t / maxVal) * innerH;
        return <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eef2f1" strokeWidth="1" />
            <text x={4} y={y + 4} fontSize="10" fill="#8a9694">{t}</text>
          </g>;
      })}
      <polyline points={toPoints("newCases")} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={toPoints("resolvedCases")} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
      const x = padding.left + i * stepX;
      return <g key={d.date}>
          <circle cx={x} cy={padding.top + innerH - (d.newCases / maxVal) * innerH} r="3.5" fill="#0f766e" />
          <circle cx={x} cy={padding.top + innerH - (d.resolvedCases / maxVal) * innerH} r="3.5" fill="#22c55e" />
          <text x={x} y={height - 6} fontSize="10" fill="#8a9694" textAnchor="middle">{d.label}</text>
        </g>;
    })}
    </svg>;
}

// SVG donut for the "Users Overview" card (patients / doctors / admins).
function UsersDonut({ segments, total }) {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map(seg => {
          const value = total ? seg.value / total : 0;
          const dash = value * circumference;
          const circle = <circle key={seg.label} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={seg.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />;
          offset += dash;
          return circle;
        })}
      </g>
      <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1f2937">{total}</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="#8a9694">Total Users</text>
    </svg>;
}

export default function TriageDashboard() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = currentUser?.role === "admin" ? "admin" : "triage";
  const [tab, setTab] = useState("queue"); // "queue" | "manage"

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const initialLoadDone = useRef(false);

  const [staff, setStaff] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ username: "", password: "", doctorName: "", department: "" });
  const [addDoctorError, setAddDoctorError] = useState("");
  const [addDoctorSaving, setAddDoctorSaving] = useState(false);

  const loadPatients = useCallback(() => {
    if (!initialLoadDone.current) setLoading(true);
    api.get("/api/patients")
      .then(res => {
        setPatients(res.data.data);
        setError(null);
      })
      .catch(() => setError("Couldn't refresh patients. Retrying automatically…"))
      .finally(() => {
        setLoading(false);
        initialLoadDone.current = true;
      });
  }, []);

  const loadDoctors = useCallback(() => {
    api.get("/api/patients/doctors").then(res => setDoctors(res.data.data)).catch(() => {});
  }, []);

  const loadManageData = useCallback(() => {
    setManageLoading(true);
    Promise.all([
      api.get("/api/auth/staff"),
      api.get("/api/patients/analytics")
    ]).then(([staffRes, analyticsRes]) => {
      setStaff(staffRes.data.data);
      setAnalytics(analyticsRes.data.data);
    }).catch(() => {}).finally(() => setManageLoading(false));
  }, []);

  useEffect(() => {
    loadPatients();
    loadDoctors();
    const interval = setInterval(loadPatients, 5000);
    return () => clearInterval(interval);
  }, [loadPatients, loadDoctors]);

  useEffect(() => {
    if (tab === "manage") loadManageData();
  }, [tab, loadManageData]);

  const clearActionError = (patientId) => {
    setActionErrors(prev => {
      const next = { ...prev };
      delete next[patientId];
      return next;
    });
  };

  const acknowledge = (patientId, flagId) => {
    clearActionError(patientId);
    api.post(`/api/patients/${patientId}/red-flags/${flagId}/acknowledge`)
      .then(loadPatients)
      .catch(() => setActionErrors(prev => ({ ...prev, [patientId]: "Couldn't acknowledge. Try again." })));
  };

  const assignDoctor = (patientId, doctorName) => {
    if (!doctorName) return;
    clearActionError(patientId);
    api.post(`/api/patients/${patientId}/assign`, { doctorName })
      .then(loadPatients)
      .catch(() => setActionErrors(prev => ({ ...prev, [patientId]: "Couldn't assign doctor. Try again." })));
  };

  const submitAddDoctor = (e) => {
    e.preventDefault();
    setAddDoctorError("");
    if (!newDoctor.username || !newDoctor.password || !newDoctor.doctorName || !newDoctor.department) {
      setAddDoctorError("All fields are required.");
      return;
    }
    setAddDoctorSaving(true);
    api.post("/api/auth/staff", { ...newDoctor, role: "doctor" })
      .then(() => {
        setNewDoctor({ username: "", password: "", doctorName: "", department: "" });
        setShowAddDoctor(false);
        loadManageData();
        loadDoctors();
      })
      .catch(err => setAddDoctorError(err?.response?.data?.error?.message || "Couldn't add doctor. Try again."))
      .finally(() => setAddDoctorSaving(false));
  };

  const doctorStaff = staff.filter(s => s.role === "doctor");
  const pendingCount = patients.filter(p => p.intakeStatus !== "complete").length;

  const filteredPatients = searchQuery.trim()
    ? patients.filter(p => {
        const q = searchQuery.trim().toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.token?.toLowerCase().includes(q) || p.abhaNumber?.toLowerCase?.().includes(q);
      })
    : [];

  const tabs = [{ key: "queue", label: "Queue" }, { key: "manage", label: "Manage" }];

  if (loading) {
    return <StaffShell role={role} title="Emergency / Priority Dashboard">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {columns.map(col => <div key={col.key}>
              <SkeletonLine className="h-5 w-32 mb-3" />
              <div className="space-y-3">
                {[0, 1].map(i => <Card key={i} className="p-4">
                    <SkeletonLine className="h-4 w-3/4 mb-2" />
                    <SkeletonLine className="h-3 w-1/2 mb-3" />
                    <SkeletonLine className="h-8 w-full" />
                  </Card>)}
              </div>
            </div>)}
        </div>
      </StaffShell>;
  }

  const usersTotal = analytics ? analytics.totalPatients + analytics.totalDoctors + analytics.totalAdmins : 0;
  const userSegments = analytics ? [
    { label: "Patients", value: analytics.totalPatients, color: "#7c3aed" },
    { label: "Doctors", value: analytics.totalDoctors, color: "#0f766e" },
    { label: "Admins", value: analytics.totalAdmins, color: "#f59e0b" }
  ] : [];

  return <StaffShell role={role} title="Emergency / Priority Dashboard">
      {error && <div className="mb-5 flex items-center justify-between gap-3 bg-red-50 border border-emergency/30 text-emergency text-sm rounded-xl px-4 py-3">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={loadPatients}>
            <RefreshCw size={14} /> Retry now
          </Button>
        </div>}

      <div className="flex items-center gap-2 mb-5 border-b border-teal-light">
        {tabs.map(t => <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? "border-teal text-teal" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </button>)}
      </div>

      {tab === "queue" && <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map(col => {
        const colPatients = patients.filter(p => p.priority === col.key);
        return <div key={col.key}>
              <h2 className="font-bold text-ink mb-3">{col.title} <span className="text-ink-soft font-normal text-sm">({colPatients.length})</span></h2>
              <div className="space-y-3">
                {colPatients.length === 0 && <Card className="p-4 text-sm text-ink-soft text-center">No patients in this queue.</Card>}
                {colPatients.map(p => <Card key={p._id} className={`p-4 border-2 ${col.tone}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-ink text-sm">{p.name}</p>
                      <span className="text-xs font-mono text-ink-soft">{p.token}</span>
                    </div>
                    {p.redFlags?.length > 0 && <ul className="text-xs text-emergency font-semibold space-y-0.5 mb-2">
                        {p.redFlags.map(f => <li key={f._id}>• {f.description} {f.acknowledged ? "(acknowledged)" : ""}</li>)}
                      </ul>}
                    <p className="text-xs text-ink-soft mb-1 capitalize">Intake: {p.intakeStatus}</p>
                    <div className="flex items-center gap-3 text-xs text-ink-soft mb-3">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(p.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}</span>
                      <span className="flex items-center gap-1"><Languages size={12} /> {p.language}</span>
                    </div>
                    {p.suggestedDoctor && <div className="flex items-center gap-1.5 text-xs text-teal font-semibold mb-2 bg-teal-light/30 rounded-lg px-2 py-1.5">
                        <Sparkles size={12} />
                        Suggested: {p.suggestedDoctor.name} ({p.suggestedDoctor.department})
                      </div>}
                    <div className="mb-3">
                      <label className="text-xs text-ink-soft font-semibold block mb-1">Assign to doctor</label>
                      <select
                        className="w-full text-xs rounded-lg border border-teal-light px-2 py-1.5 bg-white"
                        value={p.assignedDoctor || ""}
                        onChange={e => assignDoctor(p._id, e.target.value)}
                      >
                        <option value="">— Not assigned —</option>
                        {doctors.map(d => <option key={d.id} value={d.name}>{d.name} ({d.department})</option>)}
                      </select>
                      {actionErrors[p._id] && <p className="text-xs text-emergency mt-1">{actionErrors[p._id]}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate(`/doctor/patient/${p._id}`)}>Open Case</Button>
                      {p.redFlags?.some(f => !f.acknowledged) && <Button size="sm" variant="secondary" onClick={() => acknowledge(p._id, p.redFlags.find(f => !f.acknowledged)._id)}>Acknowledge</Button>}
                    </div>
                  </Card>)}
              </div>
            </div>;
      })}
      </div>}

      {tab === "manage" && <div className="space-y-6">
        {/* Search bar */}
        <Card className="p-4">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-ink-soft" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients, token, doctors..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          {searchQuery.trim() && <div className="space-y-2 mt-3">
            {filteredPatients.length === 0 && <p className="text-sm text-ink-soft">No matches found.</p>}
            {filteredPatients.map(p => <div key={p._id} className="flex items-center justify-between border border-teal-light/60 rounded-lg px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-soft font-mono">{p.token}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/doctor/patient/${p._id}`)}>Open</Button>
              </div>)}
          </div>}
        </Card>

        {manageLoading && !analytics ? <p className="text-sm text-ink-soft">Loading dashboard…</p> : analytics && <>
          {/* KPI cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><Users size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{analytics.totalPatients}</p>
              <p className="text-sm text-ink-soft">Total Patients</p>
            </Card>
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><Stethoscope size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{analytics.totalDoctors}</p>
              <p className="text-sm text-ink-soft">Total Doctors</p>
            </Card>
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><AlertTriangle size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{pendingCount}</p>
              <p className="text-sm text-ink-soft">Pending Cases</p>
            </Card>
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><CheckCircle2 size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{analytics.completionRate}%</p>
              <p className="text-sm text-ink-soft">Completion Rate</p>
            </Card>
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><FileText size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{analytics.documentsProcessed}</p>
              <p className="text-sm text-ink-soft">Documents Processed</p>
            </Card>
            <Card className="p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-3"><Clock size={20} /></div>
              <p className="text-2xl font-extrabold text-ink">{analytics.avgIntakeMinutes != null ? `${analytics.avgIntakeMinutes} min` : "N/A"}</p>
              <p className="text-sm text-ink-soft">Avg. Intake Time</p>
            </Card>
          </div>

          {/* Cases trend + Users donut */}
          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal" />
                  <p className="font-bold text-ink">Cases Overview</p>
                </div>
                <Badge tone="neutral">Last 7 Days</Badge>
              </div>
              <CasesLineChart data={analytics.casesOverview} />
              <div className="flex items-center gap-5 mt-2 text-xs font-medium text-ink-soft">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]" /> New Cases</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Resolved Cases</span>
              </div>
            </Card>

            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="font-bold text-ink mb-4 self-start">Users Overview</p>
              <UsersDonut segments={userSegments} total={usersTotal} />
              <div className="w-full mt-4 space-y-1.5 text-sm">
                {userSegments.map(s => <div key={s.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-ink-soft">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="font-semibold text-ink">{s.value}</span>
                  </div>)}
              </div>
            </Card>
          </div>

          {/* Recent cases + language distribution */}
          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-ink">Recent Cases</p>
                <Button size="sm" variant="secondary" onClick={() => setTab("queue")}>View All</Button>
              </div>
              {analytics.recentCases.length === 0
                ? <p className="text-sm text-ink-soft">No patients registered yet.</p>
                : <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-ink-soft border-b border-teal-light/60">
                          <th className="pb-2 pr-3 font-medium">Patient</th>
                          <th className="pb-2 pr-3 font-medium">Token</th>
                          <th className="pb-2 pr-3 font-medium">Status</th>
                          <th className="pb-2 pr-3 font-medium">Priority</th>
                          <th className="pb-2 font-medium">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentCases.map(c => <tr key={c.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2.5 pr-3 font-semibold text-ink">{c.name}</td>
                            <td className="py-2.5 pr-3 text-ink-soft">{c.token}</td>
                            <td className="py-2.5 pr-3">
                              <Badge tone={statusTone[c.status]?.tone || "neutral"}>{statusTone[c.status]?.label || c.status}</Badge>
                            </td>
                            <td className="py-2.5 pr-3"><PriorityBadge priority={c.priority} /></td>
                            <td className="py-2.5 text-ink-soft whitespace-nowrap">{new Date(c.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Languages size={18} className="text-teal" />
                <p className="font-bold text-ink">Language Distribution</p>
              </div>
              {analytics.languageDistribution.length === 0
                ? <p className="text-sm text-ink-soft">No patients registered yet.</p>
                : <div className="space-y-3">
                    {analytics.languageDistribution.map(l => <div key={l.lang}>
                        <div className="flex justify-between text-xs font-medium text-ink-soft mb-1">
                          <span>{l.lang}</span><span>{l.pct}%</span>
                        </div>
                        <ProgressBar value={l.pct} />
                      </div>)}
                  </div>}
            </Card>
          </div>

          {/* Doctors list + add doctor */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-ink">Doctors ({doctorStaff.length})</p>
              <Button size="sm" onClick={() => setShowAddDoctor(v => !v)}>
                <Plus size={14} /> Add Doctor
              </Button>
            </div>

            {showAddDoctor && <form onSubmit={submitAddDoctor} className="grid sm:grid-cols-2 gap-3 mb-4 bg-slate-50 rounded-xl p-4">
              <input placeholder="Username" value={newDoctor.username} onChange={e => setNewDoctor({ ...newDoctor, username: e.target.value })} className="text-sm rounded-lg border border-teal-light px-3 py-2" />
              <input placeholder="Password" type="password" value={newDoctor.password} onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })} className="text-sm rounded-lg border border-teal-light px-3 py-2" />
              <input placeholder="Doctor Name" value={newDoctor.doctorName} onChange={e => setNewDoctor({ ...newDoctor, doctorName: e.target.value })} className="text-sm rounded-lg border border-teal-light px-3 py-2" />
              <input placeholder="Department" value={newDoctor.department} onChange={e => setNewDoctor({ ...newDoctor, department: e.target.value })} className="text-sm rounded-lg border border-teal-light px-3 py-2" />
              {addDoctorError && <p className="text-xs text-emergency sm:col-span-2">{addDoctorError}</p>}
              <div className="sm:col-span-2 flex gap-2">
                <Button size="sm" type="submit" disabled={addDoctorSaving}>{addDoctorSaving ? "Saving…" : "Save Doctor"}</Button>
                <Button size="sm" type="button" variant="secondary" onClick={() => setShowAddDoctor(false)}>Cancel</Button>
              </div>
            </form>}

            <div className="space-y-2">
              {doctorStaff.length === 0 && <p className="text-sm text-ink-soft">No doctors added yet.</p>}
              {doctorStaff.map(d => <div key={d._id || d.username} className="flex items-center justify-between border border-teal-light/60 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{d.doctorName}</p>
                    <p className="text-xs text-ink-soft">{d.department}</p>
                  </div>
                  <Badge tone="neutral">{d.username}</Badge>
                </div>)}
            </div>
          </Card>

          <Card className="p-5">
            <Badge tone="neutral" className="mb-3">Live data</Badge>
            <p className="text-sm text-ink-soft">
              All figures above are computed in real time from patient and staff records in the database — no sample or placeholder data is used.
            </p>
          </Card>
        </>}
      </div>}
    </StaffShell>;
}