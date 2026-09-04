import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, User, Stethoscope, ClipboardList, Lock, Eye, EyeOff } from "lucide-react";
import { Logo } from "../components/Shells";
import { Button } from "../components/ui";
import api from "../services/api";

const roles = [
  {
    key: "patient",
    label: "Patient",
    icon: User,
    to: "/patient/start",
  },
  {
    key: "doctor",
    label: "Doctor",
    icon: Stethoscope,
    to: "/doctor/dashboard",
  },
  {
    key: "triage",
    label: "Triage",
    icon: ClipboardList,
    to: "/triage/dashboard",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("patient");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const active = roles.find(r => r.key === activeRole);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");

    // Patient flow is the kiosk flow — no backend login, just proceed.
    if (activeRole === "patient") {
      navigate(active.to);
      return;
    }

    // Doctor / Triage / Admin — real backend login. The tab picked is just
    // a UI shortcut; the actual destination is decided by the role that
    // comes back from the backend, so an account can't accidentally
    // land on the wrong dashboard by picking the wrong tab, etc.
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", {
        username: username.trim(),
        password
      });
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "triage") {
        navigate("/triage/dashboard");
      } else {
        navigate("/doctor/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const usernamePlaceholder = {
    patient: "e.g. patient01",
    doctor: "e.g. dr.sharma",
    triage: "e.g. triage.desk"
  }[activeRole];

  const usernameLabel = activeRole === "patient"
    ? "Username / ABHA / Hospital ID"
    : `${active.label} Username`;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="px-6 md:px-10 py-5">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md animate-rise">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal text-white flex items-center justify-center mx-auto mb-4 shadow-soft">
              <HeartPulse size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>
            <p className="text-ink-soft text-sm mt-1">Sign in to continue to MediKiosk</p>
          </div>

          <div className="bg-white rounded-card shadow-card border border-teal-light/60 p-6 sm:p-8">
            {/* Role tabs */}
            <div className="bg-slate-100 rounded-xl p-1 mb-6 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("patient");
                  setError("");
                }}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  activeRole === "patient"
                    ? "bg-white text-teal shadow-soft"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <User size={16} />
                Patient
              </button>
              <div className="grid grid-cols-2 gap-2">
                {roles.filter(r => r.key !== "patient").map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setActiveRole(r.key);
                      setError("");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      activeRole === r.key
                        ? "bg-white text-teal shadow-soft"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <r.icon size={16} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {usernameLabel}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={usernamePlaceholder}
                  className="w-full rounded-xl border border-teal-light bg-bg px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-teal-light bg-bg pl-11 pr-11 py-3 text-sm text-ink placeholder:text-ink-soft/60 outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-emergency font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full justify-center" size="lg" disabled={loading}>
                {loading ? "Signing in..." : `Login as ${active.label}`}
              </Button>
            </form>

            {activeRole === "patient" && (
              <p className="text-xs text-ink-soft text-center mt-6">
                No account needed — enter any details to start your kiosk visit.
              </p>
            )}
          </div>

          <p className="text-center text-sm text-ink-soft mt-6">
            Just exploring?{" "}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="text-teal font-semibold hover:underline"
            >
              View the landing page
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}