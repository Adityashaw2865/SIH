import React from "react";
import { Volume2, Type, Eye, Hand, Sparkles, X, Check } from "lucide-react";
const OPTIONS = [{
  key: "audioGuidance",
  icon: Volume2,
  label: "Audio Guidance",
  labelHi: "ध्वनि निर्देश",
  desc: "Reads every screen, question, and consent aloud automatically."
}, {
  key: "largeText",
  icon: Type,
  label: "Large Text Mode",
  labelHi: "बड़ा फ़ॉन्ट",
  desc: "Increases text sizing across all questions and options for easier reading."
}, {
  key: "highContrast",
  icon: Eye,
  label: "High Contrast",
  labelHi: "उच्च कंट्रास्ट",
  desc: "Sharper borders and deep black text for low-vision patients."
}, {
  key: "largeButtons",
  icon: Hand,
  label: "Large Touch Buttons",
  labelHi: "बटन आकार",
  desc: "Expands button height to 64px for easy kiosk touch interaction."
}, {
  key: "assistedMode",
  icon: Sparkles,
  label: "Staff Assisted Mode",
  labelHi: "सहायक मोड",
  desc: "Enables attendant controls for nurses assisting elderly or illiterate patients.",
  accent: "amber"
}];
export function AccessibilityDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Accessibility & Assistance</h2>
              <p className="text-xs text-ink-soft">सुगमता और सहायता सेटिंग्स</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-slate-100 transition-colors" aria-label="Close accessibility settings">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="py-6 space-y-4 flex-1">
          {OPTIONS.map(({
          key,
          icon: Icon,
          label,
          labelHi,
          desc,
          accent
        }) => {
          const active = settings[key];
          const activeBorder = accent === "amber" ? "border-amber-500 bg-amber-50/50" : "border-teal bg-teal-light/50";
          const activeIconBg = accent === "amber" ? "bg-amber-500 text-white" : "bg-teal text-white";
          const activeCheck = accent === "amber" ? "text-amber-600" : "text-teal";
          return <div key={key} onClick={() => onUpdateSettings({
            [key]: !active
          })} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${active ? activeBorder : "border-slate-200 hover:border-slate-300"}`}>
                <div className={`p-2.5 rounded-lg shrink-0 ${active ? activeIconBg : "bg-slate-100 text-ink-soft"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-ink">
                      {label} ({labelHi})
                    </span>
                    {active && <Check className={`w-4 h-4 font-bold ${activeCheck}`} />}
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">{desc}</p>
                </div>
              </div>;
        })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-teal-light flex justify-between items-center">
          <button onClick={() => onUpdateSettings({
          audioGuidance: true,
          largeText: false,
          highContrast: false,
          largeButtons: true,
          slowVoice: false,
          assistedMode: false
        })} className="text-xs text-ink-soft hover:text-ink underline">
            Reset Defaults
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal/90 transition-colors shadow-soft">
            Apply Settings
          </button>
        </div>
      </div>
    </div>;
}
