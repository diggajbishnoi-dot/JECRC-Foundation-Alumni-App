import { useEffect } from "react";
import { motion } from "framer-motion";
import { JecrcLogo } from "../components/visuals";
import { useStore } from "../state/store";

export default function Splash() {
  const { setPhase } = useStore();

  useEffect(() => {
    const t = setTimeout(() => setPhase("onboard"), 2200);
    return () => clearTimeout(t);
  }, [setPhase]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#0B1E45] via-[#0F2A5E] to-[#07132B] px-6 py-16"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

      {/* Top spacing */}
      <div className="h-6" />

      {/* Center Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="flex flex-col items-center text-center"
      >
        <div className="flex h-28 w-auto items-center justify-center rounded-3xl bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md border border-white/15">
          <JecrcLogo white className="h-16 w-auto max-w-[240px] object-contain drop-shadow" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h1 className="font-display text-[30px] font-bold tracking-tight text-white">
            Alumni<span className="text-gold">Meet</span>
          </h1>
          <p className="mt-1.5 text-[14px] font-medium tracking-wide text-white/75">
            JECRC Foundation
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[11.5px] font-semibold text-white/90 backdrop-blur-sm border border-white/10">
            <span>Official Network &bull; 12,000+ Alumni</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
        </div>
        <span className="text-[12px] font-medium text-white/50 tracking-wider uppercase">
          Connecting to Network
        </span>
      </motion.div>
    </motion.div>
  );
}
