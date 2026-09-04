import { Link } from "react-router-dom";
import { ShieldCheck, Accessibility, Volume2, Type, Contrast, MousePointerClick, Turtle, Users2 } from "lucide-react";
import { Logo } from "../components/Shells";
import { Card, Button } from "../components/ui";
function StaticShell({
  children
}) {
  return <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-teal-light bg-white sticky top-0 z-10">
        <Logo />
        <Link to="/" className="text-sm font-semibold text-teal hover:underline">Back to Home</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
    </div>;
}
export function About() {
  return <StaticShell>
      <h1 className="text-3xl font-extrabold text-ink mb-4">About MediKiosk</h1>
      <p className="text-ink-soft mb-4">
        MediKiosk is an AI-powered clinical patient intake and case-taking platform built for high-volume Indian hospital OPDs and AYUSH healthcare environments.
      </p>
      <p className="text-ink-soft mb-4">
        The platform reduces repetitive history-taking and documentation workload while keeping the physician fully in control. AI never autonomously diagnoses or prescribes treatment — the generated history is always a draft for physician verification.
      </p>
      <Card className="p-5 mt-6">
        <p className="font-bold text-ink mb-2">Core Principle</p>
        <p className="text-ink-soft text-sm">AI-assisted clinical intake, not AI diagnosis. The physician remains the final decision-maker.</p>
      </Card>
    </StaticShell>;
}
export function Privacy() {
  return <StaticShell>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-teal" size={28} />
        <h1 className="text-3xl font-extrabold text-ink">Privacy &amp; Consent</h1>
      </div>
      <p className="text-ink-soft mb-6">
        Designed to support DPDP Act 2023 and ABDM consent requirements. Some interoperability features (such as live ABHA lookup) require integration with government/hospital systems that this deployment may not yet be connected to — see the identification screen for current status.
      </p>
      <div className="space-y-4">
        {[["Consent-first design", "Patients explicitly consent before any clinical history capture or document processing."], ["Role-based access", "Patients, doctors, triage staff, and admins each see only what their role requires."], ["Audit trails", "Every AI extraction, doctor edit, and consent action is logged with timestamp and user."], ["Revocable consent", "Consent can be revoked according to applicable policy."]].map(([t, d]) => <Card key={t} className="p-5">
            <p className="font-bold text-ink mb-1">{t}</p>
            <p className="text-sm text-ink-soft">{d}</p>
          </Card>)}
      </div>
    </StaticShell>;
}
export function Help() {
  const options = [{
    icon: Volume2,
    label: "Audio Guidance",
    desc: "Reads every screen and question aloud automatically."
  }, {
    icon: Type,
    label: "Large Text",
    desc: "Increases text size across the kiosk for easier reading."
  }, {
    icon: Contrast,
    label: "High Contrast",
    desc: "Sharper borders and deeper text for low-vision patients."
  }, {
    icon: MousePointerClick,
    label: "Large Buttons",
    desc: "Expands touch targets for easier kiosk interaction."
  }, {
    icon: Turtle,
    label: "Slow Voice",
    desc: "Slows down spoken guidance for easier comprehension."
  }, {
    icon: Users2,
    label: "Assisted Mode",
    desc: "Enables attendant controls for staff assisting patients."
  }];
  return <StaticShell>
      <div className="flex items-center gap-2 mb-4">
        <Accessibility className="text-teal" size={28} />
        <h1 className="text-3xl font-extrabold text-ink">Accessibility &amp; Help</h1>
      </div>
      <p className="text-ink-soft mb-6">
        MediKiosk supports the following accessibility options. You can turn these on from the accessibility panel inside the kiosk once you start your intake.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {options.map(o => <div key={o.label} className="flex items-start gap-3 bg-white border border-teal-light rounded-xl px-4 py-3.5">
            <o.icon size={18} className="text-teal mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-ink text-sm">{o.label}</p>
              <p className="text-xs text-ink-soft mt-0.5">{o.desc}</p>
            </div>
          </div>)}
      </div>
      <Link to="/patient/start"><Button size="lg">Start Patient Intake</Button></Link>
    </StaticShell>;
}
export function NotFound() {
  return <StaticShell>
      <div className="text-center py-16">
        <h1 className="text-3xl font-extrabold text-ink mb-3">Page not found</h1>
        <p className="text-ink-soft mb-6">This page doesn't exist in MediKiosk.</p>
        <Link to="/"><Button>Return Home</Button></Link>
      </div>
    </StaticShell>;
}