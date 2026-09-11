import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import { JECRC_LOGO } from "../assets/logo";
import { cn } from "../utils/cn";

/* -------- Official JECRC Logo -------- */
export function JecrcLogo({
  className = "h-12 w-auto object-contain",
  white = false,
}: {
  className?: string;
  white?: boolean;
}) {
  return (
    <img
      src={JECRC_LOGO}
      alt="JECRC Foundation Logo"
      className={cn(className, white ? "brightness-0 invert drop-shadow" : "")}
    />
  );
}

/* -------- JECRC seal (double ring + institution glyph) -------- */
export function Seal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-[1.5px] border-white/70"
      style={{ width: size, height: size, boxShadow: "0 0 0 4px rgba(255,255,255,0.14)" }}
    >
      <div
        className="flex items-center justify-center rounded-full border border-white/40"
        style={{ width: size - 14, height: size - 14 }}
      >
        <Landmark size={size * 0.4} strokeWidth={1.8} className="text-white" />
      </div>
    </div>
  );
}

/* -------- Wordmark block (seal + JECRC + FOUNDATION) -------- */
export function SealMark({ scale = 1, white = true }: { scale?: number; white?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3" style={{ transform: `scale(${scale})` }}>
      <JecrcLogo white={white} className="h-16 w-auto max-w-[220px] object-contain drop-shadow-md" />
    </div>
  );
}

/* -------- Wavy auth background ( navy → periwinkle blob waves ) -------- */
export function AuthWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 320" preserveAspectRatio="none" className={className} style={{ display: "block" }}>
      <defs>
        <linearGradient id="wg-base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F2A5E" />
          <stop offset="1" stopColor="#3D5390" />
        </linearGradient>
      </defs>
      <rect width="390" height="320" fill="url(#wg-base)" />
      <circle cx="336" cy="42" r="104" fill="#7C93D6" opacity="0.28" />
      <circle cx="356" cy="16" r="52" fill="#A6B6E4" opacity="0.3" />
      <circle cx="300" cy="120" r="12" fill="#A6B6E4" opacity="0.85" />
      <circle cx="48" cy="72" r="16" fill="#7C93D6" opacity="0.75" />
      <circle cx="92" cy="40" r="8" fill="#F2A93B" opacity="0.95" />
      <circle cx="138" cy="118" r="5" fill="#ffffff" opacity="0.75" />
      <circle cx="210" cy="60" r="7" fill="#7C93D6" opacity="0.6" />
      <path
        d="M0 196 C 70 130 150 238 236 186 C 306 144 352 200 390 168 L390 320 L0 320 Z"
        fill="#7C93D6" opacity="0.38"
      />
      <path
        d="M0 244 C 88 186 168 274 258 222 C 326 182 366 232 390 210 L390 320 L0 320 Z"
        fill="#A6B6E4" opacity="0.22"
      />
      <path
        d="M0 288 C 100 246 190 314 280 272 C 336 246 368 278 390 262 L390 320 L0 320 Z"
        fill="#5A76B8" opacity="0.35"
      />
    </svg>
  );
}

/* -------- Flat illustrations for onboarding -------- */
function Blob({ children, tint = "#E3EAF7" }: { children: React.ReactNode; tint?: string }) {
  return (
    <div className="relative flex h-[248px] w-[248px] items-center justify-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        className="absolute inset-0 rounded-[44%_56%_58%_42%/48%_44%_56%_52%]"
        style={{ background: tint }}
      />
      {children}
    </div>
  );
}

export function IllustDirectory() {
  return (
    <Blob tint="#E3EAF7">
      <svg viewBox="0 0 220 220" className="relative h-[220px] w-[220px]">
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <line x1="110" y1="110" x2="52" y2="62" stroke="#7C93D6" strokeWidth="3" />
          <line x1="110" y1="110" x2="168" y2="52" stroke="#7C93D6" strokeWidth="3" />
          <line x1="110" y1="110" x2="176" y2="158" stroke="#7C93D6" strokeWidth="3" />
          <line x1="110" y1="110" x2="44" y2="156" stroke="#7C93D6" strokeWidth="3" />
          <line x1="52" y1="62" x2="168" y2="52" stroke="#A6B6E4" strokeWidth="2" strokeDasharray="5 5" />
          <motion.circle cx="110" cy="110" r="30" fill="#0F2A5E" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} />
          <circle cx="110" cy="103" r="8.5" fill="#fff" />
          <path d="M95 124a15 15 0 0 1 30 0Z" fill="#fff" />
          {[
            { x: 52, y: 62, c: "#F2A93B" }, { x: 168, y: 52, c: "#34C08D" },
            { x: 176, y: 158, c: "#F2607A" }, { x: 44, y: 156, c: "#7C93D6" },
          ].map((n, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 300, damping: 14 }}>
              <circle cx={n.x} cy={n.y} r="20" fill={n.c} />
              <circle cx={n.x} cy={n.y - 4} r="6" fill="#fff" />
              <path d={`M${n.x - 10} ${n.y + 12}a10 10 0 0 1 20 0Z`} fill="#fff" />
            </motion.g>
          ))}
          <motion.circle cx="110" cy="110" r="42" fill="none" stroke="#F2A93B" strokeWidth="2.5" strokeDasharray="4 8" initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "110px 110px" }} />
        </motion.g>
      </svg>
    </Blob>
  );
}

export function IllustGrowth() {
  return (
    <Blob tint="#FCF0DA">
      <svg viewBox="0 0 220 220" className="relative h-[220px] w-[220px]">
        <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <rect x="34" y="150" width="152" height="10" rx="5" fill="#0F2A5E" opacity="0.12" />
          {[
            { x: 48, h: 42, c: "#A6B6E4" }, { x: 86, h: 66, c: "#7C93D6" },
            { x: 124, h: 92, c: "#0F2A5E" }, { x: 162, h: 122, c: "#F2A93B" },
          ].map((b, i) => (
            <motion.rect
              key={i} x={b.x} width="26" rx="7" fill={b.c}
              initial={{ height: 0, y: 150 }} animate={{ height: b.h, y: 150 - b.h }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 200, damping: 18 }}
            />
          ))}
          <motion.g
            initial={{ x: -80, y: 60, rotate: -20, opacity: 0 }}
            animate={{ x: 120, y: -40, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 60, damping: 12 }}
          >
            <path d="M52 60l26 8-18 14 3-10Z" fill="#0F2A5E" />
            <path d="M52 60l26 8-11 2Z" fill="#7C93D6" />
          </motion.g>
          <circle cx="188" cy="46" r="7" fill="#F2607A" />
          <circle cx="30" cy="60" r="5" fill="#34C08D" />
          <path d="M176 176h24M188 164v24" stroke="#0F2A5E" strokeWidth="4" strokeLinecap="round" opacity="0.25" />
        </motion.g>
      </svg>
    </Blob>
  );
}

export function IllustChat() {
  return (
    <Blob tint="#E8F6F0">
      <svg viewBox="0 0 220 220" className="relative h-[220px] w-[220px]">
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <motion.g initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 18 }}>
            <rect x="30" y="44" width="118" height="52" rx="18" fill="#fff" />
            <path d="M58 96l-8 16 22-10Z" fill="#fff" />
            <rect x="46" y="62" width="72" height="7" rx="3.5" fill="#E6EAF3" />
            <rect x="46" y="76" width="48" height="7" rx="3.5" fill="#E6EAF3" />
          </motion.g>
          <motion.g initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 18 }}>
            <rect x="72" y="118" width="118" height="52" rx="18" fill="#0F2A5E" />
            <path d="M162 170l8 16-22-10Z" fill="#0F2A5E" />
            <rect x="88" y="136" width="72" height="7" rx="3.5" fill="#7C93D6" />
            <rect x="88" y="150" width="48" height="7" rx="3.5" fill="#7C93D6" />
          </motion.g>
          <motion.circle cx="176" cy="52" r="18" fill="#F2A93B" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 12 }} />
          <path d="M169 52l5 5 9-9" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="44" cy="180" r="6" fill="#F2607A" />
          <circle cx="196" cy="180" r="5" fill="#7C93D6" />
        </motion.g>
      </svg>
    </Blob>
  );
}
