import { Link } from "react-router-dom";
import { Mic, Languages, Brain, FileText, Leaf, AlertTriangle, Stethoscope, Link2, ShieldCheck, ArrowRight, HeartPulse } from "lucide-react";
import { Logo } from "../components/Shells";
import { Badge } from "../components/ui";
const features = [{
  icon: Mic,
  title: "Voice + Touch",
  text: "Speak naturally or answer using touch — every question works both ways."
}, {
  icon: Languages,
  title: "Indian Languages",
  text: "Designed for multilingual Indian healthcare environments."
}, {
  icon: Brain,
  title: "Adaptive History",
  text: "Questions dynamically adapt to patient responses."
}, {
  icon: FileText,
  title: "Medical Document AI",
  text: "Scan prescriptions, reports and discharge summaries."
}, {
  icon: Leaf,
  title: "AYUSH Assessment",
  text: "Structured AYUSH history and Dashavidha Pariksha."
}, {
  icon: AlertTriangle,
  title: "Red-Flag Detection",
  text: "Identify potentially urgent symptoms and alert triage staff."
}, {
  icon: Stethoscope,
  title: "Doctor Verification",
  text: "AI generates a draft; physician always remains in control."
}, {
  icon: Link2,
  title: "FHIR / ABDM Ready",
  text: "Structured interoperability architecture."
}];
const steps = [{
  n: "01",
  title: "Identify",
  text: "ABHA / hospital ID"
}, {
  n: "02",
  title: "Converse",
  text: "Voice + touch clinical history"
}, {
  n: "03",
  title: "Scan",
  text: "Previous medical documents"
}, {
  n: "04",
  title: "Structure",
  text: "AI extracts and organizes information"
}, {
  n: "05",
  title: "Verify",
  text: "Doctor reviews before consultation"
}];
const comparison = [["Manual history", "AI-assisted structured history"], ["Repeated questioning", "Adaptive questioning"], ["Paper records", "Digital timeline"], ["Manual document review", "OCR + extraction"], ["English-centric", "Multilingual"], ["Generic intake", "AYUSH-aware"], ["Hidden uncertainty", "Confidence + source"], ["AI-only output", "Physician verification"], ["Isolated records", "FHIR/ABDM-ready"]];
export default function Landing() {
  return <div className="bg-bg">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-teal-light bg-white/80 backdrop-blur sticky top-0 z-20">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft">
          <Link to="/about" className="hover:text-teal">About</Link>
          <Link to="/privacy" className="hover:text-teal">Privacy</Link>
          <Link to="/help" className="hover:text-teal">Accessibility</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/doctor/dashboard" className="hidden sm:inline-flex text-sm font-semibold text-teal border border-teal/30 rounded-xl px-4 py-2.5 hover:bg-teal-light/50">
            View Doctor Dashboard
          </Link>
          <Link to="/patient/start" className="text-sm font-semibold bg-teal text-white rounded-xl px-4 py-2.5 shadow-soft hover:bg-teal/90">
            Start Patient Intake
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 py-16 md:py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Badge tone="teal" className="mb-5">AI-Powered Clinical Intake</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-ink">
            Complete the History <span className="text-teal">Before the Consultation Begins.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-soft max-w-xl">
            AI-powered multilingual clinical intake that transforms patient conversations and medical documents into structured, physician-ready case histories.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/patient/start" className="inline-flex items-center gap-2 bg-teal text-white rounded-xl px-6 py-3.5 font-semibold shadow-soft hover:bg-teal/90 text-[15px]">
              Start Patient Intake <ArrowRight size={18} />
            </Link>
            <Link to="/doctor/dashboard" className="inline-flex items-center gap-2 border border-teal/30 text-teal rounded-xl px-6 py-3.5 font-semibold hover:bg-teal-light/50 text-[15px]">
              View Doctor Dashboard
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-ink-soft">
            <ShieldCheck size={18} className="text-teal" />
            AI assists. Doctors decide. Every draft is physician-verified.
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative">
          <div className="bg-gradient-to-br from-teal-light/70 to-white rounded-3xl p-6 md:p-8 border border-teal-light">
            <div className="grid gap-5">
              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-xs font-semibold text-ink-soft mb-2">Patient Kiosk</p>
                <p className="font-devanagari text-lg font-semibold text-ink mb-4">
                  नमस्ते! आज आपको किस समस्या के लिए अस्पताल आना पड़ा?
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-teal-light text-teal text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Mic size={14} /> Speak
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-ink-soft text-xs font-semibold px-3 py-1.5 rounded-full">
                    👆 Tap
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-saffron text-xs font-semibold px-3 py-1.5 rounded-full">
                    🌐 हिंदी
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal w-2/5 rounded-full" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-xs font-semibold text-ink-soft mb-3">Doctor Dashboard Preview</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-teal-light/50 rounded-xl p-3">
                    <p className="text-ink-soft font-medium">Chief Complaint</p>
                    <p className="font-semibold text-ink mt-1">Knee pain, 6 months</p>
                  </div>
                  <div className="bg-teal-light/50 rounded-xl p-3">
                    <p className="text-ink-soft font-medium">Medications</p>
                    <p className="font-semibold text-ink mt-1">Metformin 500mg</p>
                  </div>
                  <div className="bg-teal-light/50 rounded-xl p-3">
                    <p className="text-ink-soft font-medium">Allergies</p>
                    <p className="font-semibold text-ink mt-1">None reported</p>
                  </div>
                  <div className="bg-teal-light/50 rounded-xl p-3">
                    <p className="text-ink-soft font-medium">AI Confidence</p>
                    <p className="font-semibold text-success mt-1">92% complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-10">Everything an OPD needs, built in.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => <div key={f.title} className="bg-white rounded-card border border-teal-light/60 shadow-card p-5">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <p className="font-semibold text-ink mb-1.5">{f.title}</p>
              <p className="text-sm text-ink-soft leading-relaxed">{f.text}</p>
            </div>)}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-10 py-16 bg-white border-y border-teal-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-10">How MediKiosk works</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map(s => <div key={s.n}>
                <p className="text-3xl font-extrabold text-teal-light mb-2" style={{
              WebkitTextStroke: "1.5px #0F766E",
              color: "transparent"
            }}>
                  {s.n}
                </p>
                <p className="font-bold text-ink mb-1">{s.title}</p>
                <p className="text-sm text-ink-soft">{s.text}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-3">AI Assists. Doctors Decide.</h2>
        <p className="text-ink-soft max-w-2xl mx-auto mb-10">
          Every AI-generated field carries a confidence score and a source. Low-confidence extractions require verification. Nothing is final until a physician confirms it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
          {["Patient", "AI captures information", "Structured history", "Confidence + source", "Doctor verification", "Clinical decision"].map((s, i, arr) => <div key={s} className="flex items-center gap-3">
              <span className="bg-teal-light text-teal rounded-full px-4 py-2">{s}</span>
              {i < arr.length - 1 && <ArrowRight size={16} className="text-ink-soft" />}
            </div>)}
        </div>
      </section>

      {/* AYUSH */}
      <section className="px-6 md:px-10 py-16 bg-gradient-to-br from-ayur/5 to-white border-y border-teal-light">
        <div className="max-w-5xl mx-auto text-center">
          <Leaf className="text-ayur mx-auto mb-4" size={28} />
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-3">Designed for AYUSH. Built for Modern Healthcare.</h2>
          <p className="text-ink-soft max-w-2xl mx-auto mb-8">
            Structured capture of Prakriti, Vikriti, Agni, Koshtha, Ahara, Vihara and full Dashavidha Pariksha — presented clinically, without stereotype.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Prakriti", "Vikriti", "Agni", "Koshtha", "Ahara", "Vihara", "Dashavidha Pariksha"].map(t => <Badge key={t} tone="saffron">{t}</Badge>)}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-3 text-center">Healthcare Data Deserves Healthcare-Grade Privacy</h2>
        <p className="text-ink-soft text-center max-w-2xl mx-auto mb-8">
          Designed to support DPDP Act 2023 and ABDM consent requirements.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {["Consent-first design", "Role-based access", "Audit trails", "Secure processing", "Minimal data exposure", "Revocable consent"].map(t => <div key={t} className="flex items-center gap-2 bg-white border border-teal-light rounded-xl px-4 py-3">
              <ShieldCheck size={16} className="text-teal shrink-0" /> <span className="font-medium text-ink">{t}</span>
            </div>)}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 md:px-10 py-16 bg-white border-y border-teal-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-10 text-center">Traditional OPD vs MediKiosk</h2>
          <div className="rounded-card border border-teal-light overflow-hidden">
            {comparison.map(([a, b], i) => <div key={a} className={clsxRow(i)}>
                <div className="px-5 py-3.5 text-ink-soft text-sm">{a}</div>
                <div className="px-5 py-3.5 text-ink font-semibold text-sm flex items-center gap-2">
                  <HeartPulse size={14} className="text-teal shrink-0" /> {b}
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-ink mb-4">Prepare Your History Before You Meet Your Doctor</h2>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link to="/patient/start" className="bg-teal text-white rounded-xl px-6 py-3.5 font-semibold shadow-soft hover:bg-teal/90">
            Start Patient Intake
          </Link>
          <Link to="/doctor/dashboard" className="border border-teal/30 text-teal rounded-xl px-6 py-3.5 font-semibold hover:bg-teal-light/50">
            Explore Doctor Dashboard
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-teal-light bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <Logo />
            <p className="text-sm text-ink-soft mt-2">Better Intake. Better Care.</p>
            <p className="text-xs text-ink-soft/70 mt-3">© {new Date().getFullYear()} MediKiosk. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
            <Link to="/about" className="hover:text-teal">About</Link>
            <Link to="/privacy" className="hover:text-teal">Privacy</Link>
            <Link to="/help" className="hover:text-teal">Accessibility</Link>
            <span>For Hospitals</span>
            <span>For Doctors</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>;
}
function clsxRow(i) {
  return `grid grid-cols-2 ${i !== 0 ? "border-t border-teal-light" : ""} ${i % 2 === 0 ? "bg-bg" : "bg-white"}`;
}