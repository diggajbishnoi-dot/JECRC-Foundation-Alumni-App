import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Users, CalendarDays, ExternalLink, X, BadgeCheck, Link2, MessageCircle, ListFilter, Plus } from "lucide-react";
import { useStore } from "../state/store";
import { Job } from "../data/mock";
import { Btn, EmptyState, Field, InitialsAvatar, ListSkeleton, ScreenHeader, Sheet, Tag } from "../components/ui";

const typeFilters = ["All", "Full-time", "Internship", "Part-time"] as const;
const modeFilters = ["Any mode", "Onsite", "Remote", "Hybrid"] as const;

/* ============== JOBS BOARD ============== */
export function JobsScreen() {
  const { allJobs, push, pop, toast, me } = useStore();
  const [type, setType] = useState<(typeof typeFilters)[number]>("All");
  const [mode, setMode] = useState<(typeof modeFilters)[number]>("Any mode");
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const hasActiveFilters = type !== "All" || mode !== "Any mode";

  const results = useMemo(
    () => allJobs.filter((j) => (type === "All" || j.type === type) && (mode === "Any mode" || j.mode === mode)),
    [allJobs, type, mode]
  );

  return (
    <div className="relative flex h-full flex-col bg-page">
      {/* Pinned Header & Filters */}
      <div className="shrink-0 z-20 bg-page border-b border-line/70">
        <ScreenHeader
          title="Jobs & Internships"
          onBack={pop}
          right={
            <div className="mr-1 flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => push({ name: "postJob" })}
                className="flex h-9 items-center gap-1 rounded-full bg-gold px-3 text-[12px] font-bold text-ink shadow-sm cursor-pointer"
                title="Post an Opportunity"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Post</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setFilterSheetOpen(true)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm border transition-colors cursor-pointer ${
                  hasActiveFilters
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-navy border-line/70 hover:bg-page"
                }`}
                title="Filter opportunities"
              >
                <ListFilter size={16} />
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-white" />
                )}
              </motion.button>
            </div>
          }
        />
        <div className="px-4 sm:px-5 pb-3 pt-1 space-y-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {typeFilters.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`btn-press shrink-0 rounded-full border-[1.5px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer ${
                  type === t ? "border-navy bg-navy text-white shadow-sm" : "border-line bg-white text-sub hover:border-navy-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {modeFilters.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`btn-press shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all cursor-pointer ${
                  mode === m ? "bg-gold text-ink shadow-sm" : "bg-white text-sub border border-line hover:border-navy-400"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Jobs List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 pt-3 pb-16">
        <div className="space-y-3">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : results.length === 0 ? (
            allJobs.length === 0 ? (
              <EmptyState
                icon={<Clock size={34} />}
                title="No roles posted yet"
                copy="Be the first to share an internship lead or job opening with fellow JECRC members."
                cta="Post an Opportunity"
                onCta={() => push({ name: "postJob" })}
              />
            ) : (
              <EmptyState
                icon={<Clock size={34} />}
                title="No matching roles"
                copy={`No roles found for ${type} (${mode}). Tap below to show all ${allJobs.length} opportunities.`}
                cta="Show all roles"
                onCta={() => {
                  setType("All");
                  setMode("Any mode");
                  toast("Showing all opportunities");
                }}
              />
            )
          ) : (
            <AnimatePresence>
              {results.map((j, i) => (
                <motion.div
                  key={j.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => push({ name: "jobDetail", id: j.id })} className="card w-full p-4 text-left">
                    <div className="flex items-start gap-3">
                      <InitialsAvatar name={j.company} size={46} rounded="rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[15px] font-bold text-ink">{j.title}</p>
                          {j.mine && <BadgeCheck size={14} className="shrink-0 text-gold-600" />}
                        </div>
                        <p className="mt-0.5 truncate text-[12.5px] text-sub">{j.company} · {j.location}</p>
                      </div>
                      <Tag tone={j.type === "Internship" ? "mint" : j.type === "Part-time" ? "rose" : "peri"}>{j.type}</Tag>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 3).map((s) => <Tag key={s} tone="plain">{s}</Tag>)}
                      <Tag tone="plain"><MapPin size={10} /> {j.mode}</Tag>
                    </div>
                    <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-[13.5px] font-bold text-navy">{j.pay}</span>
                      <div className="flex items-center gap-3 text-[11px] text-sub/70">
                        <span className="flex items-center gap-1"><Users size={11} /> {j.applicants}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {j.postedAgo}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (applied.has(j.id)) return;
                          setApplied((s) => new Set(s).add(j.id));
                          toast("Application sent — good luck!");
                        }}
                        className={`btn-press rounded-lg px-3.5 py-2 text-[12px] font-bold ${applied.has(j.id) ? "bg-[#E3F6EE] text-[#1F8A64]" : "bg-navy text-white"}`}
                      >
                        {applied.has(j.id) ? "Applied ✓" : "Apply"}
                      </button>
                    </div>
                    {j.mine && <p className="mt-2 text-[10.5px] font-semibold text-gold-600">Posted by you · {j.applicants} applicants</p>}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      <Sheet
        title="Filter Opportunities"
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      >
        <div className="space-y-5 p-5">
          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Role Type</label>
            <div className="grid grid-cols-2 gap-2">
              {typeFilters.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`btn-press rounded-xl border-[1.5px] p-2.5 text-center text-[13px] font-semibold transition-all ${
                    type === t
                      ? "border-navy bg-navy text-white shadow-sm"
                      : "border-line bg-page text-sub hover:border-navy-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Work Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {modeFilters.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`btn-press rounded-xl border-[1.5px] p-2.5 text-center text-[13px] font-semibold transition-all ${
                    mode === m
                      ? "border-gold bg-gold text-ink shadow-sm"
                      : "border-line bg-page text-sub hover:border-navy-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-line">
            <button
              onClick={() => {
                setType("All");
                setMode("Any mode");
                toast("Filters reset");
              }}
              className="btn-press flex-1 rounded-xl bg-page py-3 text-[13.5px] font-bold text-sub"
            >
              Reset All
            </button>
            <button
              onClick={() => setFilterSheetOpen(false)}
              className="btn-press flex-1 rounded-xl bg-navy py-3 text-[13.5px] font-bold text-white shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ============== JOB DETAIL ============== */
export function JobDetailScreen({ id }: { id: string }) {
  const { allJobs, pop, toast } = useStore();
  const j = allJobs.find((x) => x.id === id);
  const [applied, setApplied] = useState(false);
  const [sheet, setSheet] = useState(false);
  if (!j) return null;

  return (
    <div className="flex h-full flex-col bg-page">
      <ScreenHeader title="Opportunity" onBack={pop} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-start gap-3.5">
            <InitialsAvatar name={j.company} size={54} rounded="rounded-2xl" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[19px] font-bold leading-tight text-ink">{j.title}</h2>
              <p className="mt-1 text-[13px] font-medium text-sub">{j.company} · {j.location}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag tone="peri">{j.type}</Tag>
            <Tag tone="gold"><MapPin size={10} /> {j.mode}</Tag>
            <Tag tone="mint">{j.pay}</Tag>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { icon: Users, l: "Applicants", v: `${j.applicants}` },
              { icon: CalendarDays, l: "Deadline", v: j.deadline.split(" ").slice(0, 2).join(" ") },
              { icon: Clock, l: "Posted", v: `${j.postedAgo} ago` },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-page p-3 text-center">
                <m.icon size={15} className="mx-auto text-navy" />
                <p className="mt-1.5 text-[12.5px] font-bold text-ink">{m.v}</p>
                <p className="text-[10px] font-medium text-sub">{m.l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card mt-4 p-5">
          <h3 className="font-display text-[16px] font-semibold text-ink">About the role</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">{j.desc}</p>
          <h3 className="mt-5 font-display text-[16px] font-semibold text-ink">Required skills</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {j.skills.map((s) => <Tag key={s} tone="peri">{s}</Tag>)}
          </div>
          <div className="mt-5 rounded-xl bg-navy-50 p-3.5">
            <p className="text-[12.5px] font-semibold text-navy">Posted by {j.postedBy}</p>
            <p className="text-[11.5px] text-sub">JECRC alumnus · replies within a day</p>
          </div>
        </motion.div>
      </div>
      <div className="border-t border-line bg-white px-5 pb-8 pt-3.5">
        <Btn variant="primary" className="w-full" onClick={() => (applied ? undefined : setSheet(true))} disabled={applied}>
          {applied ? "Application sent ✓" : "Apply now"}
        </Btn>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Apply via">
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSheet(false); setApplied(true); toast("Application sent — referral attached"); }}
            className="card flex w-full items-center gap-3.5 p-4 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy"><MessageCircle size={19} /></span>
            <div className="flex-1">
              <p className="text-[14.5px] font-bold text-ink">Message {j.postedBy.split(" ")[0]}</p>
              <p className="text-[12px] text-sub">Alumni referral fast-lane · recommended</p>
            </div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSheet(false); setApplied(true); toast("Opening external application…"); }}
            className="card flex w-full items-center gap-3.5 p-4 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-600"><Link2 size={19} /></span>
            <div className="flex-1">
              <p className="text-[14.5px] font-bold text-ink">External link</p>
              <p className="flex items-center gap-1 text-[12px] text-sub">careers.{j.company.toLowerCase().replace(/[^a-z]/g, "")}.com <ExternalLink size={10} /></p>
            </div>
          </motion.button>
        </div>
      </Sheet>
    </div>
  );
}

/* ============== POST OPPORTUNITY (alumni only) ============== */
export function PostJobScreen({ embedded }: { embedded?: boolean }) {
  const { pop, toast, addJob, me } = useStore();
  const [f, setF] = useState({
    title: "", company: me.company && me.company !== "—" ? me.company : "", role: "", location: "",
    type: "Full-time" as Job["type"], mode: "Hybrid" as Job["mode"], desc: "", exp: "0–2 years",
    deadline: "", via: "message" as "message" | "link", link: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const up = (k: string, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 6) setSkills((x) => [...x, s]);
    setSkillInput("");
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.title.trim().length < 4) e.title = "Give the role a clear title";
    if (!f.company.trim()) e.company = "Company is required";
    if (!f.location.trim()) e.location = "Add a location or 'Remote'";
    if (f.desc.trim().length < 30) e.desc = "Describe the role in at least 30 characters";
    if (skills.length === 0) e.skills = "Add at least one skill";
    if (!f.deadline) e.deadline = "Pick a deadline";
    if (f.via === "link" && !/^https?:\/\/.+\..+/.test(f.link)) e.link = "Enter a valid https link";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => {
      addJob({
        id: `j_${Date.now()}`, title: f.title, company: f.company, location: f.location,
        type: f.type, mode: f.mode, pay: f.exp === "0–2 years" ? "₹8–14 LPA" : "₹15–25 LPA",
        skills, postedBy: me.name, postedAgo: "now", deadline: f.deadline, applicants: 0,
        branch: me.branch, desc: f.desc, mine: true,
      });
      setLoading(false);
      setDone(true);
      toast("Opportunity posted to the board");
      setTimeout(() => { setDone(false); pop(); }, 1400);
    }, 1100);
  };

  const pills = (opts: string[], val: string, set: (v: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <button key={o} type="button" onClick={() => set(o)} className={`btn-press rounded-full border-[1.5px] px-4 py-2 text-[12.5px] font-semibold ${val === o ? "border-navy bg-navy text-white" : "border-line bg-white text-sub"}`}>
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`flex h-full flex-col bg-page ${embedded ? "" : ""}`}>
      {embedded ? (
        <div className="px-5 pb-2 pt-3">
          <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Post an Opportunity</h1>
          <p className="mt-0.5 text-[12.5px] text-sub">Only alumni can post — thank you for giving back</p>
        </div>
      ) : (
        <ScreenHeader title="Post an Opportunity" onBack={pop} />
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-3">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center pt-16 text-center">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E3F6EE] text-[#1F8A64]">
                <BadgeCheck size={40} />
              </motion.span>
              <h3 className="mt-5 font-display text-[20px] font-bold text-ink">Posted!</h3>
              <p className="mt-1.5 max-w-[240px] text-[13.5px] text-sub">Your opportunity is live for 12,000+ students and alumni.</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-4">
              <Field label="Job title" value={f.title} onChange={(v) => up("title", v)} placeholder="e.g. SDE-1 (Backend)" error={errors.title} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company" value={f.company} onChange={(v) => up("company", v)} placeholder="Company" error={errors.company} />
                <Field label="Role / Team" value={f.role} onChange={(v) => up("role", v)} placeholder="e.g. Payments" />
              </div>
              <Field label="Location" value={f.location} onChange={(v) => up("location", v)} placeholder="e.g. Bengaluru / Remote" error={errors.location} />
              <div><span className="label">Type</span>{pills(["Full-time", "Internship", "Part-time"], f.type, (v) => up("type", v))}</div>
              <div><span className="label">Work mode</span>{pills(["Onsite", "Remote", "Hybrid"], f.mode, (v) => up("mode", v))}</div>
              <div>
                <span className="label">Description</span>
                <textarea
                  value={f.desc}
                  onChange={(e) => up("desc", e.target.value)}
                  placeholder="What will they work on? What makes this a great first/second role?"
                  rows={4}
                  className={`input h-auto resize-none py-3 leading-relaxed ${errors.desc ? "!border-rose" : ""}`}
                />
                <div className="mt-1 flex justify-between text-[11px]">
                  <span className="font-medium text-rose">{errors.desc}</span>
                  <span className="text-sub/60">{f.desc.length}/500</span>
                </div>
              </div>
              <div>
                <span className="label">Required skills</span>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="e.g. React — press Enter"
                  />
                  <Btn variant="outline" className="!h-12 !w-12 !px-0" onClick={addSkill}>+</Btn>
                </div>
                {errors.skills && <p className="mt-1 text-xs font-medium text-rose">{errors.skills}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <AnimatePresence>
                    {skills.map((s) => (
                      <motion.span
                        key={s} layout
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                        className="flex items-center gap-1.5 rounded-full bg-navy-50 py-1.5 pl-3.5 pr-2 text-[12.5px] font-semibold text-navy"
                      >
                        {s}
                        <button onClick={() => setSkills((x) => x.filter((k) => k !== s))} className="rounded-full bg-navy/10 p-0.5"><X size={12} /></button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label">Experience</span>
                  <select className="input appearance-none" value={f.exp} onChange={(e) => up("exp", e.target.value)}>
                    {["0–2 years", "2–4 years", "4–6 years", "6+ years"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <span className="label">Apply deadline</span>
                  <input type="date" className={`input text-[13px] ${errors.deadline ? "!border-rose" : ""}`} value={f.deadline} onChange={(e) => up("deadline", e.target.value)} />
                </div>
              </div>
              <div>
                <span className="label">Candidates apply via</span>
                {pills(["Message me", "External link"], f.via === "message" ? "Message me" : "External link", (v) => up("via", v === "Message me" ? "message" : "link"))}
                {f.via === "link" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                    <Field label="Application link" value={f.link} onChange={(v) => up("link", v)} placeholder="https://careers.company.com/role" error={errors.link} />
                  </motion.div>
                )}
              </div>
              <Btn className="w-full !h-13" loading={loading} onClick={submit}>
                Post opportunity
              </Btn>
              <p className="pb-4 text-center text-[11.5px] text-sub/60">Posts are visible to verified students &amp; alumni only</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
