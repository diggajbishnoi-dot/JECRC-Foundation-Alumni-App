import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Building2,
  GraduationCap,
  Check,
  UserPlus,
  MessageCircle,
  Lock,
  Award,
  BriefcaseBusiness,
  HeartHandshake,
  Settings,
  Mail,
} from "lucide-react";
import { useStore, personById, registerDynamicUser } from "../state/store";
import { Person, people } from "../data/mock";
import { api } from "../services/api";
import { Btn, EmptyState, InitialsAvatar, ListSkeleton, ScreenHeader, Sheet, Tag } from "../components/ui";
import { cn } from "../utils/cn";

/* ============== DIRECTORY ============== */
export function DirectoryScreen() {
  const { push, conn, requestConnect, acceptConn, received, sent, me } = useStore();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendUsers, setBackendUsers] = useState<Person[]>([]);
  const [filterSheet, setFilterSheet] = useState<"batch" | "branch" | "company" | "city" | null>(null);
  const [filters, setFilters] = useState<{ batch?: string; branch?: string; company?: string; city?: string }>({});
  const [roleTab, setRoleTab] = useState<"alumni" | "student" | "all">("alumni");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch real users from backend database (live search) + fallback/merge with verified alumni
  useEffect(() => {
    setLoading(true);

    const filterMockPeople = (list: Person[], q: string, f: typeof filters) => {
      let res = list;
      if (q.trim()) {
        const lower = q.toLowerCase().trim();
        res = res.filter((p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.company && p.company.toLowerCase().includes(lower)) ||
          p.headline.toLowerCase().includes(lower) ||
          p.branch.toLowerCase().includes(lower) ||
          p.batch.includes(lower) ||
          p.city.toLowerCase().includes(lower)
        );
      }
      if (f.batch) res = res.filter((p) => p.batch === f.batch);
      if (f.branch) res = res.filter((p) => p.branch.toLowerCase() === f.branch?.toLowerCase());
      if (f.company) res = res.filter((p) => p.company?.toLowerCase() === f.company?.toLowerCase());
      if (f.city) res = res.filter((p) => p.city.toLowerCase() === f.city?.toLowerCase());
      return res;
    };

    api.searchUsers(debounced, undefined, filters).then((res) => {
      setLoading(false);
      let backendList: Person[] = [];
      if (res.success && Array.isArray(res.data?.items) && res.data.items.length > 0) {
        backendList = res.data.items.map((u: any) => {
          const mappedPerson: Person = {
            id: u.id,
            name: u.name,
            email: u.email,
            role: (u.role?.toLowerCase() as any) || "alumni",
            headline: u.alumniDetails?.designation
              ? `${u.alumniDetails.designation} @ ${u.alumniDetails.currentCompany || "Enterprise"}`
              : `${u.role === "ALUMNI" ? "Alumnus" : "Student"} · JECRC Foundation`,
            branch: u.alumniDetails?.branch || u.studentDetails?.branch || "CSE",
            batch: u.alumniDetails?.batch || (u.studentDetails?.expectedPassoutYear ? String(u.studentDetails.expectedPassoutYear) : "2024"),
            company: u.alumniDetails?.currentCompany,
            city: u.city || "Jaipur",
            about: u.bio || "JECRC Network Member",
            color: u.role === "ALUMNI" ? "#0F2A5E" : "#2563EB",
          };
          registerDynamicUser(mappedPerson);
          return mappedPerson;
        });
      }

      // Merge backend items with verified institutional mock people
      const combined = [...backendList];
      const localFiltered = filterMockPeople(people, debounced, filters);
      localFiltered.forEach((p) => {
        if (!combined.some((b) => b.id === p.id || (b.name.toLowerCase() === p.name.toLowerCase() && b.branch === p.branch))) {
          combined.push(p);
          registerDynamicUser(p);
        }
      });

      setBackendUsers(combined);
    }).catch(() => {
      setLoading(false);
      const localFiltered = filterMockPeople(people, debounced, filters);
      setBackendUsers(localFiltered);
    });
  }, [debounced, filters]);

  // Directory displays verified network members (strictly excludes the currently logged-in user)
  const allDirectoryPeople = useMemo(() => {
    const myId = me?.id;
    const myEmail = me?.email?.trim().toLowerCase();
    const myName = me?.name?.trim().toLowerCase();

    return backendUsers.filter((u) => {
      if (!u) return false;
      // 1. Exclude by ID
      if (myId && (u.id === myId || u.id === "me")) return false;
      // 2. Exclude by email
      if (myEmail && u.email && u.email.trim().toLowerCase() === myEmail) return false;
      // 3. Exclude by matching full name
      if (myName && u.name && u.name.trim().toLowerCase() === myName) return false;
      return true;
    });
  }, [backendUsers, me]);

  const alumniCount = useMemo(() => allDirectoryPeople.filter((p) => p.role === "alumni").length, [allDirectoryPeople]);
  const studentCount = useMemo(() => allDirectoryPeople.filter((p) => p.role === "student").length, [allDirectoryPeople]);

  const results = useMemo(() => {
    if (roleTab === "alumni") return allDirectoryPeople.filter((p) => p.role === "alumni");
    if (roleTab === "student") return allDirectoryPeople.filter((p) => p.role === "student");
    return allDirectoryPeople;
  }, [allDirectoryPeople, roleTab]);

  const chipData: { id: "batch" | "branch" | "company" | "city"; label: string; active?: string }[] = [
    { id: "branch", label: "Branch", active: filters.branch },
    { id: "batch", label: "Batch", active: filters.batch },
    { id: "company", label: "Company", active: filters.company },
    { id: "city", label: "City", active: filters.city },
  ];

  const optionsFor = (k: "batch" | "branch" | "company" | "city") => {
    const vals = new Set<string>();
    allDirectoryPeople.forEach((p) => {
      const v = k === "batch" ? p.batch : k === "branch" ? p.branch : k === "company" ? p.company : p.city;
      if (v) vals.add(v);
    });
    return [...vals].sort();
  };

  const hasActiveFilters = Boolean(filters.batch || filters.branch || filters.company || filters.city);

  return (
    <div className="relative h-full flex flex-col bg-page">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="px-4 sm:px-5 pt-3">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[24px] font-bold tracking-tight text-ink"
          >
            Directory
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-0.5 text-[13px] text-sub"
          >
            {results.length} {roleTab === "alumni" ? "alumni" : roleTab === "student" ? "students" : "members"} found
          </motion.p>

          {/* Section Tabs: Alumni vs Student vs All */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3.5 flex rounded-xl border border-line bg-white/90 p-1 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setRoleTab("alumni")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                roleTab === "alumni"
                  ? "bg-navy text-white shadow-sm"
                  : "text-sub hover:text-ink"
              }`}
            >
              <BriefcaseBusiness size={15} />
              Alumni ({alumniCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("student")}
              className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                roleTab === "student"
                  ? "bg-navy text-white shadow-sm"
                  : "text-sub hover:text-ink"
              }`}
            >
              <GraduationCap size={15} />
              Students ({studentCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("all")}
              className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                roleTab === "all"
                  ? "bg-navy text-white shadow-sm"
                  : "text-sub hover:text-ink"
              }`}
            >
              All ({allDirectoryPeople.length})
            </button>
          </motion.div>

          {/* Search bar & Filter button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 flex items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub/60 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, company, role…"
                className="input !pl-11 w-full"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sub hover:text-ink px-1"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterSheet((curr) => (curr ? null : "branch"))}
              className={`btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                hasActiveFilters
                  ? "bg-gold text-ink shadow-[0_8px_18px_-6px_rgba(242,169,59,0.5)]"
                  : "bg-navy text-white shadow-[0_8px_18px_-6px_rgba(15,42,94,0.5)] hover:bg-navy-700"
              } active:scale-95`}
              title="Open filters"
              aria-label="Filter directory"
            >
              <SlidersHorizontal size={18} />
            </button>
          </motion.div>

          {/* Filter chips */}
          <div className="no-scrollbar -mx-4 sm:-mx-5 mt-3.5 flex gap-2 overflow-x-auto px-4 sm:px-5">
            {chipData.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterSheet(c.id)}
                className={`btn-press flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                  c.active ? "border-navy bg-navy text-white shadow-sm" : "border-line bg-white text-sub hover:border-navy-400"
                }`}
              >
                {c.active ? `${c.label}: ${c.active}` : c.label}
                {c.active && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((f) => ({ ...f, [c.id]: undefined }));
                    }}
                    className="ml-0.5 rounded-full bg-white/20 px-1 text-[10px] hover:bg-white/30"
                  >
                    ✕
                  </span>
                )}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({})}
                className="btn-press flex shrink-0 items-center rounded-full border border-dashed border-rose/40 bg-rose/5 px-3 py-2 text-[12px] font-bold text-rose hover:bg-rose/10 cursor-pointer"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="mt-5">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : results.length === 0 ? (
              <EmptyState
                icon={<Search size={34} />}
                title={hasActiveFilters || query.trim() ? "No one found" : "No other members registered yet"}
                copy={
                  hasActiveFilters || query.trim()
                    ? "Try a different name or loosen the filters to find members."
                    : "You are currently logged in. As other alumni and students register or sign in, their real profiles will automatically appear here."
                }
                cta={hasActiveFilters || query.trim() ? "Clear filters" : undefined}
                onCta={
                  hasActiveFilters || query.trim()
                    ? () => {
                        setFilters({});
                        setQuery("");
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {results.map((p, i) => {
                    const isReceived = received.includes(p.id);
                    const isSent = sent.includes(p.id);
                    const state: "none" | "pending" | "connected" | "received" =
                      conn[p.id] === "connected"
                        ? "connected"
                        : isReceived
                        ? "received"
                        : isSent || conn[p.id] === "pending"
                        ? "pending"
                        : "none";
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => push({ name: "profile", id: p.id })}
                          className="card flex w-full items-center gap-3 p-3.5 text-left transition-shadow hover:shadow-md cursor-pointer"
                        >
                          <InitialsAvatar name={p.name} size={50} layoutId={`av-${p.id}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[14.5px] font-bold text-ink">{p.name}</p>
                              {p.mentor && <Award size={13} className="shrink-0 text-gold-600" />}
                            </div>
                            <p className="truncate text-[12.5px] text-sub">{p.headline}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Tag tone={p.role === "alumni" ? "gold" : "peri"}>
                                {p.role === "alumni" ? `Alumni '${(p.batch || "2020").slice(-2)}` : "Student"}
                              </Tag>
                              <span className="flex items-center gap-0.5 text-[11px] text-sub/70">
                                <MapPin size={10} /> {p.city}
                              </span>
                            </div>
                          </div>
                          <ConnectButton
                            state={state}
                            onConnect={() => requestConnect(p.id)}
                            onAccept={() => acceptConn(p.id)}
                            compact
                          />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter bottom sheet */}
      <Sheet open={!!filterSheet} onClose={() => setFilterSheet(null)} title="Filter Directory">
        {filterSheet && (
          <div>
            <div className="mb-4 flex rounded-xl bg-page p-1">
              {(["branch", "batch", "company", "city"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilterSheet(k)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-[12px] font-bold capitalize transition-colors cursor-pointer",
                    filterSheet === k ? "bg-navy text-white shadow-sm" : "text-sub hover:text-ink"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto no-scrollbar py-1">
              {optionsFor(filterSheet).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, [filterSheet]: v }));
                    setFilterSheet(null);
                  }}
                  className={`btn-press rounded-full border-[1.5px] px-4 py-2 text-[13px] font-semibold transition-all cursor-pointer ${
                    filters[filterSheet] === v
                      ? "border-navy bg-navy text-white shadow-sm"
                      : "border-line bg-white text-ink hover:border-navy-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {filters[filterSheet] && (
              <div className="mt-4 pt-3 border-t border-line flex justify-between items-center">
                <span className="text-xs text-sub">Currently: <strong className="text-ink">{filters[filterSheet]}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, [filterSheet]: undefined }));
                    setFilterSheet(null);
                  }}
                  className="text-xs font-bold text-rose px-3 py-1.5 cursor-pointer hover:underline"
                >
                  Clear this filter
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

/* connect / pending / connected / received button */
export function ConnectButton({
  state,
  onConnect,
  onAccept,
  compact,
}: {
  state: "none" | "pending" | "connected" | "received";
  onConnect: () => void;
  onAccept?: () => void;
  compact?: boolean;
}) {
  const [justSent, setJustSent] = useState(false);
  if (state === "connected")
    return (
      <span
        className={`flex items-center gap-1 rounded-full bg-[#E3F6EE] font-bold text-[#1F8A64] ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"
        }`}
      >
        <Check size={13} /> Connected
      </span>
    );
  if (state === "received")
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onAccept?.();
        }}
        className={`flex items-center gap-1 rounded-full bg-[#1F8A64] font-bold text-white shadow-sm cursor-pointer hover:bg-[#196F50] transition-colors ${
          compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"
        }`}
      >
        <Check size={13} /> Accept
      </motion.button>
    );
  if (state === "pending" || justSent)
    return (
      <span
        className={`rounded-full bg-page font-bold text-sub ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"
        }`}
      >
        Pending
      </span>
    );
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        setJustSent(true);
        onConnect();
      }}
      className={`flex items-center gap-1 rounded-full bg-navy font-bold text-white shadow-[0_6px_14px_-6px_rgba(15,42,94,0.5)] cursor-pointer hover:bg-navy-700 transition-colors ${
        compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"
      }`}
    >
      {justSent ? <Check size={13} /> : <UserPlus size={13} />} {justSent ? "Sent" : "Connect"}
    </motion.button>
  );
}

/* ============== PROFILE ============== */
export function ProfileScreen({ id, embedded }: { id?: string; embedded?: boolean }) {
  const { pop, push, me, updateProfile, toast, conn, requestConnect, requestMentor, mentorReq, chats, goTab, role, allJobs, allThreads, joinedGroups, unlockChat } = useStore();
  const isMe = !id || id === "me" || id === me.id;
  const p: Person = isMe ? me : personById(id);
  const [tabIdx, setTabIdx] = useState(0);
  const state = conn[p.id] ?? "none";
  const unlocked = state === "connected" || (mentorReq[p.id] ?? "none") === "active";
  const chatFor = chats.find((c) => c.userId === p.id);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: p.name,
    headline: p.headline,
    branch: p.branch || "CSE",
    batch: p.batch || "2026",
    company: p.company || "",
    city: p.city,
    about: p.about,
  });

  useEffect(() => {
    setEditForm({
      name: p.name,
      headline: p.headline,
      branch: p.branch || "CSE",
      batch: p.batch || "2026",
      company: p.company || "",
      city: p.city,
      about: p.about,
    });
  }, [p]);

  return (
    <div className="relative h-full flex flex-col bg-page">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {embedded ? (
          <div className="flex items-center justify-between px-4 sm:px-5 pb-1 pt-3">
            <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">My Profile</h1>
            <button
              onClick={() => push({ name: "settings" })}
              className="btn-press flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors"
              title="Settings"
            >
              <Settings size={18} className="text-ink" />
            </button>
          </div>
        ) : (
          <ScreenHeader title={isMe ? "My Profile" : "Profile"} onBack={pop} />
        )}

        <div className="px-4 sm:px-5 mt-2">
          {/* header card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden !p-0 shadow-sm border border-line"
          >
            {/* Banner with clean badge placement */}
            <div className="relative h-28 sm:h-32 bg-gradient-to-br from-navy via-navy-700 to-peri">
              <div className="hero-dots pointer-events-none absolute inset-0 opacity-30" />
              <div className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/10 blur-md" />
              <div className="pointer-events-none absolute right-16 top-6 h-3 w-3 rounded-full bg-gold" />
              {/* Badge positioned in top-right with clear spacing, NEVER overlapping avatar */}
              <div className="absolute top-3.5 right-4 z-10">
                <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11.5px] font-bold text-navy shadow-sm backdrop-blur-sm">
                  {p.role === "alumni" ? `Alumni · Batch ${p.batch}` : `Student · Class of ${p.batch}`}
                </span>
              </div>
            </div>

            {/* Profile body */}
            <div className="relative z-10 px-5 pb-5">
              <div className="relative z-20 -mt-12 mb-3 flex items-end justify-between">
                <InitialsAvatar
                  name={p.name}
                  size={76}
                  layoutId={isMe ? undefined : `av-${p.id}`}
                  className="relative z-20 ring-4 ring-white shadow-md bg-white shrink-0 rounded-full"
                />
                {p.mentor && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-[11.5px] font-bold text-gold-600">
                    <Award size={13} /> Mentor
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="font-display text-[22px] sm:text-[24px] font-bold text-ink leading-tight break-words break-all">
                  {p.name}
                </h2>
                <p className="mt-1 text-[13.5px] font-medium text-sub break-words">{p.headline}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-sub">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-navy shrink-0" /> {p.branch} · {p.batch}
                </span>
                {p.email && (
                  <span className="flex items-center gap-1.5 font-medium text-navy break-all">
                    <Mail size={14} className="text-navy shrink-0" /> {p.email}
                  </span>
                )}
                {p.company && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-navy shrink-0" /> {p.company}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-navy shrink-0" /> {p.city}
                </span>
              </div>

              {/* contextual actions */}
              <div className="mt-4 flex gap-2.5">
                {isMe ? (
                  <>
                    <Btn
                      variant="primary"
                      className="h-11 flex-1 !text-[14px] font-semibold cursor-pointer"
                      onClick={() => {
                        setEditForm({
                          name: p.name,
                          headline: p.headline,
                          branch: p.branch || "CSE",
                          batch: p.batch || "2026",
                          company: p.company || "",
                          city: p.city,
                          about: p.about,
                        });
                        setEditOpen(true);
                      }}
                    >
                      Edit profile
                    </Btn>
                    <Btn
                      variant="outline"
                      className="h-11 flex-1 !text-[14px] font-semibold cursor-pointer"
                      onClick={() => push({ name: "connections" })}
                    >
                      My network
                    </Btn>
                  </>
                ) : (
                  <>
                    {unlocked ? (
                      <Btn
                        variant="primary"
                        className="h-11 flex-1 !text-[14px] cursor-pointer"
                        onClick={() => {
                          unlockChat(p.id);
                          goTab("chat");
                          push({ name: "chatRoom", id: `c_${p.id}` });
                        }}
                      >
                        <MessageCircle size={15} /> Message
                      </Btn>
                    ) : (
                      <div className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-line bg-page text-[12.5px] font-semibold text-sub">
                        <Lock size={13} className="text-gold-600" /> Connect first to chat
                      </div>
                    )}
                    <ConnectButton state={state} onConnect={() => requestConnect(p.id)} />
                    {!isMe && p.mentor && role === "student" && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => requestMentor(p.id)}
                        className={`flex h-11 items-center gap-1 rounded-xl px-3.5 text-[12px] font-bold cursor-pointer ${
                          (mentorReq[p.id] ?? "none") !== "none" ? "bg-gold-100 text-gold-600" : "bg-gold text-ink"
                        }`}
                      >
                        <HeartHandshake size={14} />
                        {(mentorReq[p.id] ?? "none") === "none"
                          ? "Mentor"
                          : mentorReq[p.id] === "pending"
                          ? "Asked"
                          : "Mentor ✓"}
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* tabs */}
          <div className="mt-5 flex rounded-xl bg-white p-1 shadow-[0_2px_10px_rgba(15,42,94,0.05)] border border-line/60">
            {["About", "Posts", "Activity"].map((t, i) => (
              <button
                key={t}
                onClick={() => setTabIdx(i)}
                className={`relative flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-colors cursor-pointer ${
                  tabIdx === i ? "text-white" : "text-sub hover:text-ink"
                }`}
              >
                {tabIdx === i && (
                  <motion.span
                    layoutId="profile-tab"
                    className="absolute inset-0 rounded-lg bg-navy"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tabIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              {tabIdx === 0 && (
                <div className="card p-4 space-y-4">
                  <div>
                    <p className="label">Bio</p>
                    <p className="text-[13.5px] leading-relaxed text-sub break-words break-all whitespace-pre-wrap">{p.about || "No bio added yet."}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-line/60">
                    <div className="flex items-center justify-between">
                      <p className="label flex items-center gap-1.5 !mb-0">
                        <Mail size={13} className="text-navy" /> Institutional Email
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                        <Lock size={10} /> Verified · Non-editable
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-semibold text-ink select-all">
                      {p.email || me.email || "Registered Institutional Account"}
                    </p>
                  </div>
                  {p.domains && (
                    <div>
                      <p className="label">Mentorship domains</p>
                      <div className="flex flex-wrap gap-2">
                        {p.domains.map((d) => (
                          <Tag key={d} tone="peri">
                            {d}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-page p-3 border border-line/40">
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-sub">
                        <BriefcaseBusiness size={12} /> Open to
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-ink">
                        {p.role === "alumni" ? "Referrals · Mentoring" : "Internships · Advice"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-page p-3 border border-line/40">
                      <p className="text-[11px] font-semibold text-sub">Response time</p>
                      <p className="mt-1 text-[13px] font-bold text-ink">~2 hours</p>
                    </div>
                  </div>
                </div>
              )}
              {tabIdx === 1 && (
                <div>
                  {(() => {
                    const userJobs = allJobs.filter((j) => (isMe && j.mine) || (p.name && j.postedBy === p.name) || (p.id && j.posterId === p.id));
                    const userThreads = allThreads.filter((t) => (isMe && t.mine) || (p.name && t.author === p.name) || (p.id && t.authorId === p.id));
                    const totalPosts = userJobs.length + userThreads.length;

                    if (totalPosts === 0) {
                      return (
                        <EmptyState
                          icon={<BriefcaseBusiness size={32} />}
                          title={isMe ? "No posts yet" : "Nothing posted yet"}
                          copy={
                            isMe
                              ? "Share a job opening or a discussion thread with the community."
                              : "When they post jobs or threads, you'll see them here."
                          }
                          cta={isMe ? "Start a discussion" : undefined}
                          onCta={isMe ? () => push({ name: "discussions" }) : undefined}
                        />
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {userJobs.map((j) => (
                          <div
                            key={j.id}
                            className="card p-4 cursor-pointer hover:border-navy-400/50 transition-colors"
                            onClick={() => push({ name: "jobDetail", id: j.id })}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-navy uppercase tracking-wide bg-navy/10 px-2 py-0.5 rounded-full">
                                Job Opening
                              </span>
                              <span className="text-[11px] text-sub">{j.postedAgo}</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-ink">{j.title}</h3>
                            <p className="text-[13px] text-sub">{j.company} · {j.location} · <strong className="text-navy">{j.pay}</strong></p>
                          </div>
                        ))}
                        {userThreads.map((t) => (
                          <div
                            key={t.id}
                            className="card p-4 cursor-pointer hover:border-peri/50 transition-colors"
                            onClick={() => push({ name: "threadDetail", id: t.id })}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-peri uppercase tracking-wide bg-peri/10 px-2 py-0.5 rounded-full">
                                {t.category} Discussion
                              </span>
                              <span className="text-[11px] text-sub">{t.ago}</span>
                            </div>
                            <h3 className="text-[15px] font-bold text-ink">{t.title}</h3>
                            <p className="text-[13px] text-sub line-clamp-2 mt-1">{t.body}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              {tabIdx === 2 && (
                <div className="space-y-3">
                  {(() => {
                    const userJobs = allJobs.filter((j) => (isMe && j.mine) || (p.name && j.postedBy === p.name) || (p.id && j.posterId === p.id));
                    const userThreads = allThreads.filter((t) => (isMe && t.mine) || (p.name && t.author === p.name) || (p.id && t.authorId === p.id));

                    const activities: { text: string; time: string }[] = [
                      { text: `Verified member of JECRC Foundation Alumni & Student Network`, time: "Active" },
                      { text: `Connected to ${p.branch || "Engineering"} Department Community`, time: "Active" },
                      { text: `Joined Class of ${p.batch || "2024"} Community`, time: "Active" },
                    ];

                    userJobs.forEach((j) => {
                      activities.unshift({ text: `Posted job opening: "${j.title}" at ${j.company}`, time: j.postedAgo });
                    });

                    userThreads.forEach((t) => {
                      activities.unshift({ text: `Started discussion: "${t.title}" in ${t.category}`, time: t.ago });
                    });

                    return activities.map((a, i) => (
                      <div key={i} className="card flex items-center gap-3 p-3.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-navy" />
                        <p className="flex-1 text-[13px] font-medium text-ink leading-snug">{a.text}</p>
                        <span className="text-[11px] font-bold text-sub shrink-0">{a.time}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Profile Bottom Sheet */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isMe) {
              const updatedBranch = editForm.branch.trim() || me.branch;
              const updatedBatch = editForm.batch.trim() || me.batch;
              const updatedName = editForm.name.trim() || me.name;
              const updatedHeadline = editForm.headline.trim() || me.headline;
              const updatedCompany = editForm.company.trim();
              const updatedCity = editForm.city.trim() || me.city;
              const updatedAbout = editForm.about.trim() || me.about;

              await updateProfile({
                name: updatedName,
                headline: updatedHeadline,
                branch: updatedBranch,
                batch: updatedBatch,
                company: updatedCompany,
                city: updatedCity,
                about: updatedAbout,
              });
              toast("Profile updated & saved successfully!");
              setEditOpen(false);
            }
          }}
          className="space-y-4 pt-1 pb-6"
        >
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              placeholder="e.g. Arjun Mehta"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label !mb-0">Email Address</label>
              <span className="text-[11px] font-bold text-sub flex items-center gap-1">
                <Lock size={11} /> Non-editable
              </span>
            </div>
            <input
              type="email"
              value={p.email || me.email || ""}
              disabled
              readOnly
              className="input w-full bg-slate-100 text-sub cursor-not-allowed opacity-80 font-medium select-all"
            />
            <p className="mt-1 text-[11px] text-sub/70">Email is permanently linked to your institutional profile and cannot be changed.</p>
          </div>
          <div>
            <label className="label">Headline</label>
            <input
              type="text"
              value={editForm.headline}
              onChange={(e) => setEditForm((prev) => ({ ...prev, headline: e.target.value }))}
              className="input w-full"
              placeholder="e.g. Senior Software Engineer @ Zomato"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Branch</label>
              <select
                value={editForm.branch}
                onChange={(e) => setEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                className="input w-full cursor-pointer"
              >
                {["CSE", "CSAI", "AIDS", "IT", "ECE", "EE", "ME", "Civil"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Passout Year (Batch)</label>
              <select
                value={editForm.batch}
                onChange={(e) => setEditForm((prev) => ({ ...prev, batch: e.target.value }))}
                className="input w-full cursor-pointer"
              >
                {p.role === "alumni"
                  ? Array.from({ length: 23 }, (_, i) => `${2004 + i}`).map((y) => (
                      <option key={y} value={y}>Batch {y} (Passout {y})</option>
                    ))
                  : ["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                      <option key={y} value={y}>Class of {y} (Batch {y})</option>
                    ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company</label>
              <input
                type="text"
                value={editForm.company}
                onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                className="input w-full"
                placeholder="e.g. Zomato"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                className="input w-full"
                placeholder="e.g. Gurugram"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">About / Bio</label>
            <textarea
              rows={3}
              value={editForm.about}
              onChange={(e) => setEditForm((prev) => ({ ...prev, about: e.target.value }))}
              className="input w-full !h-auto py-2.5 resize-none text-[13.5px]"
              placeholder="Tell alumni about your background and how you can help..."
            />
          </div>
          <div className="pt-3 pb-2 flex gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="btn-press flex-1 h-12 rounded-xl bg-slate-100 font-bold text-sub hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press flex-1 h-12 rounded-xl bg-navy font-bold text-white shadow-[0_4px_16px_rgba(15,42,94,0.3)] hover:bg-navy-700 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
