import { useEffect } from "react";
import { motion } from "framer-motion";
import { SealMark } from "../components/visuals";
import { useStore } from "../state/store";

export default function Splash() {
  const { setPhase } = useStore();

  useEffect(() => {
    const t = setTimeout(() => setPhase("onboard"), 2400);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45 }}
      className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-navy"
    >
      {/* subtle tint blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-peri/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-navy-700/50 blur-2xl" />

      <div className="relative">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.55, opacity: 0.45 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-peri/40"
          />
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="relative"
        >
          <SealMark />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 160, damping: 20 }}
        className="mt-12 flex flex-col items-center"
      >
        <h1 className="text-[24px] font-bold tracking-tight text-white">Alumni Meet</h1>
        <p className="mt-2 text-[14px] font-medium tracking-wide text-white/60">JECRC Foundation</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-24"
      >
        <svg viewBox="0 0 40 40" className="spin-arc h-9 w-9">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5" />
          <path d="M36 20a16 16 0 0 0-16-16" fill="none" stroke="#F2A93B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
