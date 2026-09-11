import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Users, Briefcase, MessagesSquare, UsersRound, GraduationCap, Plus,
  Clock, ChevronRight, TrendingUp, Handshake, Inbox, MapPin,
} from "lucide-react";
import { useStore, personById, allGroups } from "../state/store";
import { InitialsAvatar, ListSkeleton, Refreshable, SectionHeader, Tag } from "../components/ui";
import { JecrcLogo } from "../components/visuals";
import { categories } from "../data/mock";

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
};

function HomeHeader() {
  const { me, unreadNotifs, goTab, push, role } = useStore();
  return (
    <div className="flex items-center justify-between">
      <button className="btn-press flex items-center gap-3 cursor-pointer" onClick={() => goTab("profile")}>
        <InitialsAvatar name={me.name} size={42} />
        <div className="text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sub/70">
            {role === "alumni" ? `Alumni · Batch ${me.batch}` : `Student · ${me.branch} '${me.batch.slice(2)}`}
          </p>
          <p className="font-display text-[17px] font-semibold text-ink">{me.name.split(" ")[0]}</p>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <JecrcLogo className="h-7 w-auto max-w-[90px] object-contain opacity-90 hidden sm:block" />
        <button
          onClick={() => (role === "student" ? goTab("alerts") : push({ name: "notifications" }))}
          className="btn-press relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_10px_rgba(15,42,94,0.08)] cursor-pointer"
        >
          <Bell size={19} />
          {unreadNotifs > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink ring-2 ring-page">
              {unreadNotifs}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function HeroBanner() {
  return (
    <motion.div variants={item} className="mesh-navy relative mt-5 overflow-hidden rounded-[20px] p-5">
      <div className="hero-dots pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-peri/25 blur-xl" />
      <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-gold/20 blur-xl" />
      <div className="flex items-start justify-between">
        <Tag tone="gold"><MapPin size={11} /> Jaipur Campus</Tag>
        <JecrcLogo white className="h-7 w-auto max-w-[85px] object-contain opacity-85" />
      </div>
      <h2 className="mt-3 font-display text-[22px] font-semibold leading-snug text-white">
        Upcoming Alumni <span className="text-gold">Meet 2026</span>
      </h2>
      <p className="mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-white/75">
        Reunions, keynote panels, mentorship lounge & the grand campus dinner. See you soon!
      </p>
      <div className="mt-4 flex items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/40 px-3.5 py-1.5 text-[12px] font-bold text-gold backdrop-blur-sm">
          ✨ See you soon on campus!
        </div>
        <span className="text-[11px] font-medium text-white/60">
          Passes opening soon
        </span>
      </div>
    </motion.div>
  );
}

function QuickGrid() {
  const { push, goTab } = useStore();
  const items = [
    { label: "Directory", icon: Users, tint: "#E3EAF7", color: "#0F2A5E", go: () => goTab("directory") },
    { label: "Jobs", icon: Briefcase, tint: "#FCF0DA", color: "#B87714", go: () => push({ name: "jobs" }) },
    { label: "Discussions", icon: MessagesSquare, tint: "#E8F6F0", color: "#1F8A64", go: () => push({ name: "discussions" }) },
    { label: "Groups", icon: UsersRound, tint: "#FDE8ED", color: "#C94060", go: () => push({ name: "groups" }) },
    { label: "Mentorship", icon: GraduationCap, tint: "#EFE9FE", color: "#6D3FD4", go: () => push({ name: "mentorship" }) },
    { label: "Connections", icon: Handshake, tint: "#E3F1FD", color: "#1D6FC2", go: () => push({ name: "connections" }) },
  ];
  return (
    <motion.div variants={item} className="mt-6">
      <SectionHeader title="Quick access" />
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((q) => (
          <motion.button
            key={q.label}
            whileTap={{ scale: 0.94 }}
            onClick={q.go}
            className="card flex flex-col items-center justify-center gap-2 py-3 px-1.5 overflow-hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: q.tint, color: q.color }}>
              <q.icon size={19} />
            </span>
            <span className="text-[12px] font-semibold text-ink text-center truncate w-full px-1">{q.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function JobMiniCards() {
  const { allJobs, push } = useStore();
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
      {allJobs.slice(0, 5).map((j) => (
        <motion.button
          key={j.id}
          whileTap={{ scale: 0.96 }}
          onClick={() => push({ name: "jobDetail", id: j.id })}
          className="card w-[218px] shrink-0 p-4 text-left"
        >
          <div className="flex items-start justify-between">
            <InitialsAvatar name={j.company} size={40} rounded="rounded-xl" />
            <Tag tone={j.type === "Internship" ? "mint" : "peri"}>{j.type}</Tag>
          </div>
          <p className="mt-3 truncate text-[14.5px] font-bold text-ink">{j.title}</p>
          <p className="truncate text-[12.5px] text-sub">{j.company} · {j.location}</p>
          <div className="mt-3 flex items-center justify-between text-[11.5px] text-sub/80">
            <span className="font-bold text-navy">{j.pay}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {j.postedAgo}</span>
          </div>
        </motion.button>
      ))}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => push({ name: "jobs" })}
        className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-navy-400/40 text-navy"
      >
        <ChevronRight size={20} />
        <span className="text-[11px] font-bold">View all</span>
      </motion.button>
    </div>
  );
}

function DiscussionHighlights() {
  const { allThreads, push, upvoted, toggleUp } = useStore();
  return (
    <div className="space-y-3">
      {allThreads.slice(0, 3).map((t) => {
        const up = upvoted.has(t.id);
        return (
          <motion.div key={t.id} whileTap={{ scale: 0.98 }} className="card p-4" onClick={() => push({ name: "threadDetail", id: t.id })}>
            <div className="flex items-center gap-2">
              <Tag tone={t.category === "Events" ? "gold" : t.category === "Career" ? "peri" : "mint"}>{t.category}</Tag>
              <span className="text-[11px] text-sub/70">{t.ago} ago</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink">{t.title}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] font-medium text-sub">{t.author}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleUp(t.id); }}
                className={`btn-press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${up ? "bg-navy text-white" : "bg-page text-sub"}`}
              >
                <TrendingUp size={13} /> {t.upvotes + (up ? 1 : 0)}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* =============== STUDENT HOME =============== */
function StudentHome() {
  const { push, received, acceptConn, rejectConn } = useStore();
  return (
    <>
      <HeroBanner />
      {received.length > 0 && (
        <motion.div variants={item} className="mt-4">
          <SectionHeader title={`Pending requests (${received.length})`} action="All" onAction={() => push({ name: "connections" })} />
          <div className="space-y-3">
            {received.slice(0, 2).map((id) => {
              const p = personById(id);
              return (
                <div key={id} className="card flex items-center gap-3 p-3.5">
                  <InitialsAvatar name={p.name} size={44} layoutId={`av-${id}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                    <p className="truncate text-[12px] text-sub">{p.headline}</p>
                  </div>
                  <button onClick={() => acceptConn(id)} className="btn-press rounded-lg bg-navy px-3.5 py-2 text-[12px] font-bold text-white">Accept</button>
                  <button onClick={() => rejectConn(id)} className="btn-press rounded-lg bg-page px-3 py-2 text-[12px] font-bold text-sub">Skip</button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      <motion.button
        variants={item}
        whileTap={{ scale: 0.97 }}
        onClick={() => push({ name: "mentorship" })}
        className="mt-4 flex w-full items-center gap-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-gold to-[#E89A22] p-5 text-left shadow-[0_14px_30px_-12px_rgba(242,169,59,0.65)]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25">
          <GraduationCap size={24} className="text-ink" />
        </span>
        <div className="flex-1">
          <p className="font-display text-[17px] font-bold text-ink">Find a Mentor</p>
          <p className="text-[12.5px] font-medium text-ink/70">Connect 1-on-1 with verified alumni</p>
        </div>
        <ChevronRight size={20} className="text-ink/70" />
      </motion.button>
      <QuickGrid />
      <motion.div variants={item} className="mt-6">
        <SectionHeader title="Jobs & internships for you" action="See all" onAction={() => push({ name: "jobs" })} />
        <JobMiniCards />
      </motion.div>
      <motion.div variants={item} className="mt-6">
        <SectionHeader title="Discussion highlights" action="Board" onAction={() => push({ name: "discussions" })} />
        <DiscussionHighlights />
      </motion.div>
    </>
  );
}

/* =============== ALUMNI HOME =============== */
function AlumniHome() {
  const { push, goTab, received, acceptConn, rejectConn, mentorOptIn, unreadNotifs } = useStore();
  return (
    <>
      <HeroBanner />
      <motion.button
        variants={item}
        whileTap={{ scale: 0.97 }}
        onClick={() => goTab("post")}
        className="mt-4 flex w-full items-center gap-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-gold to-[#E89A22] p-5 text-left shadow-[0_14px_30px_-12px_rgba(242,169,59,0.65)]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25">
          <Plus size={24} className="text-ink" />
        </span>
        <div className="flex-1">
          <p className="font-display text-[17px] font-bold text-ink">Post a Job / Internship</p>
          <p className="text-[12.5px] font-medium text-ink/70">Refer juniors straight from your team</p>
        </div>
        <ChevronRight size={20} className="text-ink/70" />
      </motion.button>

      {/* pending requests */}
      <motion.div variants={item} className="mt-6">
        <SectionHeader title={`Pending requests ${received.length ? `(${received.length})` : ""}`} action="All" onAction={() => push({ name: "connections" })} />
        {received.length === 0 ? (
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy"><Inbox size={18} /></span>
            <p className="text-[13px] font-medium text-sub">No pending requests — you're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.slice(0, 2).map((id) => {
              const p = personById(id);
              return (
                <div key={id} className="card flex items-center gap-3 p-3.5">
                  <InitialsAvatar name={p.name} size={44} layoutId={`av-${id}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                    <p className="truncate text-[12px] text-sub">{p.headline}</p>
                  </div>
                  <button onClick={() => acceptConn(id)} className="btn-press rounded-lg bg-navy px-3.5 py-2 text-[12px] font-bold text-white">Accept</button>
                  <button onClick={() => rejectConn(id)} className="btn-press rounded-lg bg-page px-3 py-2 text-[12px] font-bold text-sub">Skip</button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* my mentees */}
      <motion.div variants={item} className="mt-6">
        <SectionHeader title="My Mentees" action="Manage" onAction={() => push({ name: "mentorship" })} />
        <div className="card p-4">
          {mentorOptIn ? (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600"><GraduationCap size={20} /></span>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-ink">Mentor Mode Active</p>
                <p className="text-[12px] text-sub">You are listed in the mentor directory</p>
              </div>
              <ChevronRight size={18} className="text-sub/50" />
            </div>
          ) : (
            <button onClick={() => push({ name: "mentorship" })} className="flex w-full items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600"><GraduationCap size={18} /></span>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-ink">Become a mentor</p>
                <p className="text-[12px] text-sub">Opt in to guide juniors from your branch</p>
              </div>
              <ChevronRight size={18} className="text-sub/50" />
            </button>
          )}
        </div>
      </motion.div>

      <QuickGrid />
      <motion.div variants={item} className="mt-6">
        <SectionHeader title="Your impact this week" />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { v: "214", l: "Profile views", tint: "text-navy" },
            { v: "12", l: "Referrals made", tint: "text-gold-600" },
            { v: unreadNotifs.toString(), l: "New updates", tint: "text-mint" },
          ].map((s) => (
            <div key={s.l} className="card p-3 text-center min-w-0">
              <p className={`font-display text-[20px] font-bold ${s.tint}`}>{s.v}</p>
              <p className="mt-0.5 text-[10.5px] font-semibold text-sub truncate">{s.l}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

/* =============== WRAPPER =============== */
export default function HomeScreen() {
  const { role } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const refresh = async () => {
    setLoading(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
  };

  return (
    <Refreshable onRefresh={refresh}>
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden" animate="show"
        className="px-5 pb-32 pt-3"
      >
        <motion.div variants={item}><HomeHeader /></motion.div>
        {loading ? (
          <div className="mt-5 space-y-4">
            <div className="skeleton h-40 w-full !rounded-[20px]" />
            <div className="skeleton h-16 w-full !rounded-[20px]" />
            <ListSkeleton rows={3} />
          </div>
        ) : role === "student" ? (
          <StudentHome />
        ) : (
          <AlumniHome />
        )}
        <motion.p variants={item} className="mt-8 text-center text-[11px] font-medium tracking-wide text-sub/50">
          JECRC Foundation network · {allGroups.length} groups · 46 mentors · {categories.length - 1} topics
        </motion.p>
      </motion.div>
    </Refreshable>
  );
}
