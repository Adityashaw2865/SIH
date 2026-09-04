import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, HelpCircle, Accessibility, LayoutDashboard, AlertTriangle, Search, Bell, LogOut, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { AccessibilityDrawer } from "./AccessibilityDrawer";
import { useIntake } from "../context/IntakeContext";
export function Logo({
  className
}) {
  return <Link to="/" className={clsx("inline-flex items-center gap-2 font-extrabold text-lg text-teal", className)}>
      <span className="w-8 h-8 rounded-lg bg-teal text-white flex items-center justify-center">
        <HeartPulse size={18} />
      </span>
      MediKiosk
    </Link>;
}
export function KioskShell({
  children,
  step,
  total
}) {
  const navigate = useNavigate();
  const {
    accessibility,
    updateAccessibility,
    accessibilityOpen,
    setAccessibilityOpen,
    patientId
  } = useIntake();
  return <div className={clsx("min-h-screen bg-bg flex flex-col", accessibility.largeText && "text-lg", accessibility.highContrast && "contrast-125 saturate-150")}>
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-teal-light bg-white/80 backdrop-blur sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-4">
          {step && total ? <div className="hidden sm:flex items-center gap-2 text-sm text-ink-soft font-medium">
              Step {step} of {total}
            </div> : null}
          {patientId && <button onClick={() => navigate("/patient/manage-consent")} className={clsx("flex items-center gap-2 px-3 rounded-xl text-ink-soft hover:bg-teal-light/60 font-medium text-sm", accessibility.largeButtons ? "min-h-[64px] min-w-[64px]" : "min-h-[44px] min-w-[44px]")}>
            <ShieldCheck size={20} /> Privacy
          </button>}
          <button onClick={() => setAccessibilityOpen(true)} className={clsx("flex items-center gap-2 px-3 rounded-xl text-ink-soft hover:bg-teal-light/60 font-medium text-sm", accessibility.largeButtons ? "min-h-[64px] min-w-[64px]" : "min-h-[44px] min-w-[44px]")}>
            <Accessibility size={20} /> Accessibility
          </button>
          <button onClick={() => navigate("/help")} className={clsx("flex items-center gap-2 px-3 rounded-xl text-ink-soft hover:bg-teal-light/60 font-medium text-sm", accessibility.largeButtons ? "min-h-[64px] min-w-[64px]" : "min-h-[44px] min-w-[44px]")}>
            <HelpCircle size={20} /> Help
          </button>
        </div>
      </header>
      {step && total ? <div className="h-1.5 bg-slate-100">
          <div className="h-full bg-teal transition-all duration-500" style={{
        width: `${step / total * 100}%`
      }} />
        </div> : null}
      <main className="flex-1 flex flex-col">{children}</main>

      <AccessibilityDrawer isOpen={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} settings={accessibility} onUpdateSettings={updateAccessibility} />
    </div>;
}
// Admin no longer gets its own separate pages/nav items — admins share the
// same Triage Dashboard (Queue + Manage tabs) as triage staff now.
const staffNav = [{
  to: "/doctor/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  roles: ["doctor"]
}, {
  to: "/triage/dashboard",
  label: "Triage",
  icon: AlertTriangle,
  roles: ["triage", "admin"]
}];
export function StaffShell({
  children,
  role,
  title
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const nav = staffNav.filter(n => n.roles.includes(role));

  const handleExit = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return <div className="min-h-screen bg-bg flex">
      <aside className="w-64 bg-white border-r border-teal-light hidden lg:flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-teal-light">
          <Logo />
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(item => {
          const active = location.pathname.startsWith(item.to);
          return <Link key={item.to} to={item.to} className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors", active ? "bg-teal-light text-teal" : "text-ink-soft hover:bg-slate-50")}>
                <item.icon size={18} />
                {item.label}
              </Link>;
        })}
        </nav>
        <div className="p-3 border-t border-teal-light">
          <button onClick={handleExit} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-soft hover:bg-slate-50">
            <LogOut size={18} /> Exit
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-teal-light bg-white sticky top-0 z-10">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft font-semibold">{role}</p>
            <h1 className="text-lg font-bold text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 min-w-[220px]">
              <Search size={16} className="text-ink-soft" />
              <input placeholder="Search patients, token, ABHA..." className="bg-transparent outline-none text-sm w-full" />
            </div>
            <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-ink-soft relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emergency" />
            </button>
            <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-semibold text-sm">DS</div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>;
}