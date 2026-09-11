import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

/* ---------------- Status Bar (Removed fake bar for real native app experience) ---------------- */
export function StatusBar(_props?: { tone?: "light" | "dark" }) {
  return null;
}

/* ---------------- Buttons ---------------- */
export function Btn({
  children, onClick, variant = "primary", className, loading, disabled,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  className?: string; loading?: boolean; disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-navy text-white shadow-[0_10px_24px_-10px_rgba(15,42,94,0.55)]",
    gold: "bg-gold text-ink font-bold shadow-[0_10px_24px_-10px_rgba(242,169,59,0.6)]",
    outline: "border-[1.5px] border-line bg-white text-ink",
    ghost: "text-navy",
    danger: "bg-rose/10 text-rose",
  };
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-opacity",
        styles[variant],
        (disabled || loading) && "opacity-60",
        className
      )}
    >
      {loading && <Loader2 size={17} className="animate-spin" />}
      {children}
    </motion.button>
  );
}

/* ---------------- Form field ---------------- */
export function Field({
  label, type = "text", value, onChange, placeholder, error, password,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; password?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPw = password || type === "password";
  return (
    <div className="w-full">
      <span className="label">{label}</span>
      <div className="relative">
        <input
          className={cn("input", error && "!border-rose !shadow-[0_0_0_3.5px_rgba(242,96,122,0.1)]", isPw && "pr-11")}
          type={isPw ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sub/70 transition active:scale-90"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1.5 text-xs font-medium text-rose"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Avatar ---------------- */
const gradients = [
  ["#0F2A5E", "#24468F"], ["#7C93D6", "#4A5FA0"], ["#F2A93B", "#DB8A1E"],
  ["#34C08D", "#1F8A64"], ["#F2607A", "#C94060"], ["#8B5CF6", "#6D3FD4"],
  ["#0E9F8A", "#0B7A6A"], ["#C2410C", "#9A3309"], ["#2563EB", "#1D4FBC"], ["#DB2777", "#B01D61"],
];
export function InitialsAvatar({
  name, size = 48, layoutId, className, rounded = "rounded-full",
}: { name: string; size?: number; layoutId?: string; className?: string; rounded?: string }) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0)) % gradients.length;
  const [a, b] = gradients[idx];
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <motion.div
      layoutId={layoutId}
      className={cn("flex shrink-0 items-center justify-center font-semibold text-white", rounded, className)}
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </motion.div>
  );
}

/* ---------------- Tag / Badge ---------------- */
export function Tag({ children, tone = "navy" }: { children: React.ReactNode; tone?: "navy" | "gold" | "mint" | "rose" | "peri" | "plain" }) {
  const tones: Record<string, string> = {
    navy: "bg-navy-50 text-navy",
    gold: "bg-gold-100 text-gold-600",
    mint: "bg-[#E3F6EE] text-[#1F8A64]",
    rose: "bg-[#FDE8ED] text-rose",
    peri: "bg-navy-100 text-navy-700",
    plain: "bg-page text-sub",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

/* ---------------- Section header ---------------- */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>
      {action && (
        <button onClick={onAction} className="btn-press text-[13px] font-semibold text-navy">
          {action}
        </button>
      )}
    </div>
  );
}

/* ---------------- Skeletons ---------------- */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-3.5">
          <div className="skeleton h-12 w-12 !rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-3/5" />
            <div className="skeleton h-3 w-2/5" />
          </div>
          <div className="skeleton h-7 w-14 !rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon, title, copy, cta, onCta,
}: { icon: React.ReactNode; title: string; copy: string; cta?: string; onCta?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-8 py-12 text-center"
    >
      <div className="relative mb-5">
        <div className="floaty flex h-24 w-24 items-center justify-center rounded-[28px] bg-navy-50 text-navy">
          {icon}
        </div>
        <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-gold" />
        <span className="absolute -bottom-2 -left-2 h-2.5 w-2.5 rounded-full bg-peri" />
      </div>
      <h4 className="font-display text-[17px] font-semibold text-ink">{title}</h4>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-sub">{copy}</p>
      {cta && (
        <Btn variant="primary" className="mt-5 !h-11 px-6" onClick={onCta}>
          {cta}
        </Btn>
      )}
    </motion.div>
  );
}

/* ---------------- Typing dots ---------------- */
export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="tdot h-[7px] w-[7px] rounded-full bg-sub/60" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

/* ---------------- Bottom sheet ---------------- */
export function Sheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[70] bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ y: "105%" }} animate={{ y: 0 }} exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.4}
            onDragEnd={(_, i) => i.offset.y > 110 && onClose()}
            className="absolute inset-x-0 bottom-0 z-[71] max-h-[82%] overflow-y-auto no-scrollbar rounded-t-[24px] bg-white p-5 pb-9"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            {title && <h3 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h3>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Switch ---------------- */
export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        on ? "bg-navy" : "bg-neutral-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          on ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

/* ---------------- Stack screen header ---------------- */
export function ScreenHeader({
  title, onBack, right, tone = "light",
}: { title: string; onBack: () => void; right?: React.ReactNode; tone?: "light" | "navy" }) {
  return (
    <div className={cn(
      "sticky top-0 z-30 flex items-center gap-2 px-3 pb-3 pt-2",
      tone === "navy" ? "bg-navy text-white shadow-sm" : "bg-page text-ink border-b border-line/60 shadow-[0_1px_3px_rgba(15,42,94,0.02)]"
    )}>
      <button
        onClick={onBack}
        className={cn("btn-press flex h-10 w-10 items-center justify-center rounded-full cursor-pointer", tone === "navy" ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5")}
      >
        <ChevronLeft size={24} />
      </button>
      <h2 className="flex-1 truncate font-display text-[17px] font-semibold">{title}</h2>
      {right}
    </div>
  );
}

/* ---------------- Upload progress ring ---------------- */
export function ProgressRing({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        <motion.circle
          cx="18" cy="18" r="15.5" fill="none" stroke="#F2A93B" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0.05 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (!done.current) { done.current = true; onDone(); }
          }}
        />
      </svg>
    </span>
  );
}

/* ---------------- Segmented control ---------------- */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl bg-page p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn("relative flex-1 rounded-[10px] py-2.5 text-[13.5px] font-semibold transition-colors", value === o.id ? "text-white" : "text-sub")}
        >
          {value === o.id && (
            <motion.span
              layoutId={undefined}
              className="absolute inset-0 rounded-[10px] bg-navy shadow-[0_4px_12px_-4px_rgba(15,42,94,0.5)]"
            />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pull to refresh wrapper ---------------- */
export function Refreshable({
  onRefresh, children, className,
}: { onRefresh: () => Promise<void> | void; children: React.ReactNode; className?: string }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const end = async () => {
    if (pull > 64 && !busy) {
      setBusy(true);
      await onRefresh();
      window.setTimeout(() => setBusy(false), 800);
    }
    setPull(0);
    startY.current = null;
  };

  return (
    <div
      ref={ref}
      className={cn("relative h-full overflow-y-auto no-scrollbar", className)}
      onTouchStart={(e) => {
        if ((ref.current?.scrollTop ?? 1) <= 0) startY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (startY.current == null || busy) return;
        const dy = e.touches[0].clientY - startY.current;
        setPull(dy > 0 ? Math.min(dy * 0.45, 92) : 0);
      }}
      onTouchEnd={end}
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2" style={{ opacity: pull > 8 || busy ? 1 : 0 }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
          <Loader2 size={17} className={cn("text-navy", busy ? "animate-spin" : "")} style={!busy ? { transform: `rotate(${pull * 3}deg)` } : undefined} />
        </div>
      </div>
      <div style={{ transform: `translateY(${busy ? 44 : pull}px)`, transition: pull === 0 || busy ? "transform .3s cubic-bezier(.2,0,.2,1)" : "none" }}>
        {children}
      </div>
    </div>
  );
}
