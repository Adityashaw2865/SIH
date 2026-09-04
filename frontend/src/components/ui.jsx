import React from "react";
import clsx from "clsx";
export function Card({
  className,
  children,
  ...rest
}) {
  return <div className={clsx("bg-white rounded-card shadow-card border border-teal-light/60", className)} {...rest}>
      {children}
    </div>;
}
export function Badge({
  tone = "neutral",
  children,
  className
}) {
  const tones = {
    neutral: "bg-slate-100 text-ink-soft",
    success: "bg-green-50 text-success",
    warn: "bg-amber-50 text-warn",
    emergency: "bg-red-50 text-emergency",
    teal: "bg-teal-light text-teal",
    saffron: "bg-amber-50 text-saffron"
  };
  return <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>;
}
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}) {
  const variants = {
    primary: "bg-teal text-white hover:bg-teal/90 shadow-soft",
    secondary: "bg-white text-teal border border-teal/30 hover:bg-teal-light/50",
    ghost: "bg-transparent text-ink hover:bg-slate-100",
    danger: "bg-emergency text-white hover:bg-emergency/90"
  };
  const sizes = {
    sm: "text-sm px-3.5 py-2 min-h-[40px]",
    md: "text-[15px] px-5 py-3 min-h-[44px]",
    lg: "text-lg px-7 py-4 min-h-[52px]"
  };
  return <button className={clsx("rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>;
}
export function ProgressBar({
  value,
  tone = "teal"
}) {
  const tones = {
    teal: "bg-teal",
    success: "bg-success",
    warn: "bg-warn"
  };
  return <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={clsx("h-full rounded-full transition-all duration-500", tones[tone])} style={{
      width: `${value}%`
    }} />
    </div>;
}
export function ConfidenceBadge({
  value
}) {
  const tone = value >= 85 ? "success" : value >= 65 ? "warn" : "emergency";
  const label = value >= 85 ? "🟢" : value >= 65 ? "🟡" : "🔴";
  return <Badge tone={tone}>
      {label} {value}% confidence
    </Badge>;
}
export function PriorityBadge({
  priority
}) {
  // FIXED BUG: backend Patient.priority is only ever "normal" or
  // "critical" — this map was missing a "normal" entry entirely, so
  // map[priority] came back undefined for every non-critical patient
  // (i.e. most patients), and m.tone crashed the whole component with
  // "Cannot read properties of undefined (reading 'tone')". Added
  // "normal" and a safe fallback for any other/unexpected value so an
  // unrecognised priority renders a neutral badge instead of crashing.
  const map = {
    normal: {
      tone: "neutral",
      label: "⚪ Normal"
    },
    critical: {
      tone: "emergency",
      label: "🚨 Critical"
    },
    high: {
      tone: "warn",
      label: "🟠 High Priority"
    },
    review: {
      tone: "warn",
      label: "🟡 Needs Review"
    },
    routine: {
      tone: "success",
      label: "🟢 Routine"
    }
  };
  const m = map[priority] || { tone: "neutral", label: priority || "Unknown" };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
export function EmptyState({
  icon,
  title,
  message
}) {
  return <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-ink-soft">
      <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center text-teal mb-4">{icon}</div>
      <p className="font-semibold text-ink mb-1">{title}</p>
      <p className="text-sm max-w-sm">{message}</p>
    </div>;
}
export function SkeletonLine({
  className
}) {
  return <div className={clsx("bg-slate-100 rounded animate-pulse-soft", className)} />;
}