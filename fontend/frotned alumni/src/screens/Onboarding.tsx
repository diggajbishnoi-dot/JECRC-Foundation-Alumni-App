import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IllustChat, IllustDirectory, IllustGrowth } from "../components/visuals";
import { useStore } from "../state/store";
import { Btn } from "../components/ui";

const slides = [
  {
    ill: <IllustDirectory />,
    title: "Find your people",
    copy: "Search the alumni directory by batch, branch, company or city — and connect with JECRCites everywhere.",
  },
  {
    ill: <IllustGrowth />,
    title: "Jobs & mentorship",
    copy: "Alumni-posted jobs, referrals and one-on-one mentorship from seniors who've walked your path.",
  },
  {
    ill: <IllustChat />,
    title: "Chat & discussions",
    copy: "End-to-end encrypted chats, lively discussion boards and groups for every batch, chapter and interest.",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const { setPhase } = useStore();
  const last = index === slides.length - 1;

  const next = () => {
    if (last) return setPhase("auth");
    setDir(1);
    setIndex((i) => i + 1);
  };
  const skip = () => setPhase("auth");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full flex-col overflow-hidden bg-white"
    >
      {/* top wave detail */}
      <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-navy-50" />
      <div className="pointer-events-none absolute -left-24 top-40 h-40 w-40 rounded-full bg-gold-100" />

      <div className="flex items-center justify-between px-6 pt-3">
        <span className="font-display text-[15px] font-semibold text-navy">JECRC Foundation</span>
        <button onClick={skip} className="btn-press rounded-full px-4 py-2 text-[13.5px] font-semibold text-sub">
          Skip
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            initial={{ opacity: 0, x: 70 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -70 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="flex flex-col items-center px-8"
          >
            {slides[index].ill}
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-center font-display text-[26px] font-bold tracking-tight text-ink"
            >
              {slides[index].title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 max-w-[290px] text-center text-[14.5px] leading-relaxed text-sub"
            >
              {slides[index].copy}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-6 pb-10">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <motion.span
              key={i}
              animate={{ width: i === index ? 26 : 8, backgroundColor: i === index ? "#0F2A5E" : "#D9E0EF" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
        <Btn onClick={next} className="!h-12 min-w-[128px]" variant={last ? "gold" : "primary"}>
          {last ? "Get Started" : "Next"} <ArrowRight size={17} />
        </Btn>
      </div>
    </motion.div>
  );
}
