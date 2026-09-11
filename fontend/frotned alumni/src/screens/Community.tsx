import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, MessageSquare, Plus, Send, Users, GraduationCap, Check,
  MessagesSquare, HeartHandshake, UserCheck, Inbox, ChevronRight, Trash2,
} from "lucide-react";
import { useStore, personById, allGroups, registerDynamicUser } from "../state/store";
import { categories, Thread, Person } from "../data/mock";
import { api } from "../services/api";
import { Btn, EmptyState, InitialsAvatar, ListSkeleton, ScreenHeader, Sheet, Switch, Tag } from "../components/ui";

/* ================= DISCUSSION BOARD ================= */
export function DiscussionsScreen() {
  const { allThreads, push, pop, upvoted, toggleUp, addThread, deleteThread, me, toast } = useStore();
  const [cat, setCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", cat: "Career" });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const list = allThreads.filter((t) => cat === "All" || t.category === cat);

  return (
    <div className="relative flex h-full flex-col bg-page">
      {/* Pinned Top: Header and Category filter chips */}
      <div className="shrink-0 z-20 bg-page border-b border-line/70">
        <ScreenHeader
          title="Discussion Board"
          onBack={pop}
          right={<span className="mr-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-navy shadow-sm border border-line/40">{allThreads.length} live</span>}
        />
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:px-5 pb-3 pt-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`btn-press shrink-0 rounded-full border-[1.5px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer ${
                cat === c ? "border-navy bg-navy text-white shadow-sm" : "border-line bg-white text-sub hover:border-navy-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable threads list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 pt-3 pb-28">
        <div className="space-y-3">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : list.length === 0 ? (
            <EmptyState icon={<MessagesSquare size={34} />} title="Quiet in here" copy={`No threads in ${cat} yet — be the one who starts the conversation.`} cta="Start a discussion" onCta={() => setCompose(true)} />
          ) : (
            list.map((t, i) => {
              const up = upvoted.has(t.id);
              const isOwner = t.mine || (t.authorId && t.authorId === me.id) || (t.author && t.author.trim().toLowerCase() === me.name.trim().toLowerCase());

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4 shadow-sm border border-line hover:shadow-md transition-shadow"
                >
                  <button onClick={() => push({ name: "threadDetail", id: t.id })} className="w-full text-left cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Tag tone={t.category === "Events" ? "gold" : t.category === "Career" || t.category === "Referrals" ? "peri" : "mint"}>{t.category}</Tag>
                      <span className="text-[11px] text-sub/60">{t.ago} ago · {t.replies.length} replies</span>
                      {isOwner && <span className="rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-bold text-navy">Your Post</span>}
                    </div>
                    <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">{t.title}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <InitialsAvatar name={t.author} size={20} />
                      <span className="text-[12px] font-medium text-sub">{t.author}</span>
                      <Tag tone={t.authorRole === "alumni" ? "gold" : "plain"}>{t.authorRole}</Tag>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div className="flex items-center gap-2">
                      <UpvoteButton active={up} count={t.upvotes + (up ? 1 : 0)} onClick={() => toggleUp(t.id)} />
                      <button
                        onClick={() => push({ name: "threadDetail", id: t.id })}
                        className="btn-press flex items-center gap-1.5 rounded-full bg-page px-3.5 py-2 text-[12px] font-bold text-sub cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        <MessageSquare size={13} /> Reply
                      </button>
                    </div>
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete your discussion post?")) {
                            deleteThread(t.id);
                          }
                        }}
                        title="Delete your post"
                        className="btn-press flex h-8 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold text-rose hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 18 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setCompose(true)}
        className="absolute bottom-6 right-5 z-30 flex h-13 items-center gap-2 rounded-full bg-navy px-5 text-[13.5px] font-bold text-white shadow-[0_14px_30px_-8px_rgba(15,42,94,0.6)] cursor-pointer hover:bg-navy-700 transition-colors"
      >
        <Plus size={18} /> New thread
      </motion.button>

      <Sheet open={compose} onClose={() => setCompose(false)} title="Start a discussion">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.slice(1).map((c) => (
              <button key={c} onClick={() => setForm((f) => ({ ...f, cat: c }))} className={`btn-press rounded-full border-[1.5px] px-3.5 py-2 text-[12px] font-semibold ${form.cat === c ? "border-navy bg-navy text-white" : "border-line bg-white text-sub"}`}>
                {c}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Give it a clear title…" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="input h-auto resize-none py-3 leading-relaxed" rows={4} placeholder="Share context, links, what you tried…" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <Btn
            className="w-full"
            disabled={form.title.trim().length < 8}
            onClick={() => {
              const t: Thread = { id: `t_${Date.now()}`, title: form.title, category: form.cat, author: me.name, authorRole: me.role, upvotes: 1, ago: "now", body: form.body, replies: [], mine: true, authorId: me.id };
              addThread(t);
              setCompose(false);
              setForm({ title: "", body: "", cat: "Career" });
            }}
          >
            Post thread
          </Btn>
        </div>
      </Sheet>
    </div>
  );
}

export function UpvoteButton({ active, count, onClick }: { active: boolean; count: number; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors cursor-pointer ${active ? "bg-navy text-white" : "bg-page text-sub"}`}
    >
      <motion.span animate={active ? { scale: [1, 1.5, 1], rotate: [0, -12, 0] } : {}} transition={{ duration: 0.35 }}>
        <TrendingUp size={13} />
      </motion.span>
      <motion.span key={count} initial={{ y: active ? -8 : 0, opacity: active ? 0 : 1 }} animate={{ y: 0, opacity: 1 }}>
        {count}
      </motion.span>
    </motion.button>
  );
}

/* ================= THREAD DETAIL ================= */
export function ThreadDetailScreen({ id }: { id: string }) {
  const { allThreads, pop, upvoted, toggleUp, addReply, deleteThread, deleteReply, me } = useStore();
  const t = allThreads.find((x) => x.id === id);
  const [reply, setReply] = useState("");
  if (!t) return null;
  const up = upvoted.has(t.id);
  const isOwner = t.mine || (t.authorId && t.authorId === me.id) || (t.author && t.author.trim().toLowerCase() === me.name.trim().toLowerCase());

  const handleDeleteThread = () => {
    if (window.confirm("Are you sure you want to delete this discussion post?")) {
      deleteThread(t.id);
      pop();
    }
  };

  return (
    <div className="flex h-full flex-col bg-page">
      <ScreenHeader
        title={t.category}
        onBack={pop}
        right={
          isOwner ? (
            <button
              onClick={handleDeleteThread}
              title="Delete post"
              className="btn-press mr-2 flex h-8 items-center gap-1 rounded-full bg-rose-50 px-3 text-[12px] font-bold text-rose cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between">
            <Tag tone="gold">{t.category}</Tag>
            {isOwner && <span className="rounded-md bg-navy/10 px-2 py-0.5 text-[11px] font-bold text-navy">Your Post</span>}
          </div>
          <h2 className="mt-3 font-display text-[19px] font-bold leading-snug text-ink">{t.title}</h2>
          <div className="mt-3 flex items-center gap-2.5">
            <InitialsAvatar name={t.author} size={34} />
            <div>
              <p className="text-[13px] font-bold text-ink">{t.author}</p>
              <p className="text-[11px] text-sub">{t.authorRole === "alumni" ? "Alumni" : "Student"} · {t.ago} ago</p>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-ink/85">{t.body}</p>
          <div className="mt-4 border-t border-line pt-3.5">
            <UpvoteButton active={up} count={t.upvotes + (up ? 1 : 0)} onClick={() => toggleUp(t.id)} />
          </div>
        </motion.div>

        <h3 className="mb-3 mt-6 font-display text-[16px] font-semibold text-ink">{t.replies.length} replies</h3>
        <div className="space-y-3">
          <AnimatePresence>
            {t.replies.map((r) => {
              const isReplyOwner = r.mine || (r.authorId && r.authorId === me.id) || r.author === me.name || r.author === "You";
              return (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex gap-3 p-3.5">
                  <InitialsAvatar name={r.author} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-ink">{r.author}</p>
                        <span className="text-[10.5px] text-sub/60">{r.ago}</span>
                      </div>
                      {isReplyOwner && (
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this reply?")) {
                              deleteReply(t.id, r.id);
                            }
                          }}
                          title="Delete reply"
                          className="btn-press p-1 text-sub/60 hover:text-rose cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink/85">{r.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-white px-4 pb-8 pt-3">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) { addReply(t.id, reply.trim()); setReply(""); } }}
          placeholder="Add a helpful reply…"
          className="input !h-11 flex-1 !rounded-full"
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { if (reply.trim()) { addReply(t.id, reply.trim()); setReply(""); } }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full cursor-pointer ${reply.trim() ? "bg-navy text-white shadow-lg" : "bg-page text-sub/50"}`}
        >
          <Send size={17} />
        </motion.button>
      </div>
    </div>
  );
}

/* ================= GROUPS & DEPARTMENT COMMUNITIES ================= */
const normalizeBatch = (rawBatch?: string): string => {
  if (!rawBatch) return "2024";
  const match = rawBatch.match(/20\d{2}/);
  return match ? match[0] : "2024";
};

const normalizeBranch = (rawBranch?: string): string => {
  if (!rawBranch) return "CSE";
  const b = rawBranch.toUpperCase().trim();
  if (b.includes("AIML") || b.includes("AI & ML") || b.includes("AI/ML") || b.includes("CSAI") || b.includes("ARTIFICIAL")) return "AIML";
  if (b.includes("AIDS") || b.includes("DATA SCIENCE") || b.includes("DS")) return "AIDS";
  if (b.includes("CSE") || b.includes("COMPUTER")) return "CSE";
  if (b.includes("ECE") || b.includes("ELECTRONIC")) return "ECE";
  if (b.includes("IT") || b.includes("INFORMATION")) return "IT";
  if (b.includes("ME") || b.includes("MECHANIC")) return "ME";
  if (b.includes("EE") || b.includes("ELECTRICAL")) return "EE";
  if (b.includes("CIVIL")) return "Civil";
  return "CSE";
};

export function GroupsScreen() {
  const { pop, push, joined, toggleJoin, toast, me } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const userBatch = normalizeBatch(me.batch);
  const userBranch = normalizeBranch(me.branch);

  // Strictly filter: ONLY user's own batch group and user's own department community
  const myBatchGroup = allGroups.find(
    (g) => g.type === "batch" && g.batch === userBatch
  ) || allGroups.find((g) => g.type === "batch" && g.batch === "2024");

  const myDeptCommunity = allGroups.find(
    (g) => g.type === "department" && g.branch === userBranch
  ) || allGroups.find((g) => g.type === "department" && g.branch === "CSE");

  const userGroups = [myBatchGroup, myDeptCommunity].filter(Boolean) as (typeof allGroups)[0];

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-12">
      <ScreenHeader
        title="Groups & Communities"
        onBack={pop}
        right={
          <span className="mr-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-navy shadow-sm border border-line/40">
            Batch {userBatch} · {userBranch}
          </span>
        }
      />
      {loading ? (
        <div className="px-5 pt-4"><ListSkeleton rows={3} /></div>
      ) : (
        <div className="px-5 pt-3 space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-navy to-navy-800 p-4 text-white shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Personalized Hub</p>
            <h3 className="mt-1 font-display text-[17px] font-bold">Your Official Groups</h3>
            <p className="mt-1 text-[12px] text-white/75 leading-relaxed">
              Exclusively mapped to your graduating batch ({userBatch}) and academic department ({userBranch}).
            </p>
          </div>

          {/* 1. Official Batch Group */}
          {myBatchGroup && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-sub/70">🎓 Official Batch Group</h3>
                <Tag tone="gold">Batch {myBatchGroup.batch}</Tag>
              </div>
              <div className="card p-4.5 space-y-3.5 border border-line shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold-700 font-bold text-[16px] ring-2 ring-gold/30">
                    {myBatchGroup.batch?.slice(-2) || "24"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-[16px] font-bold text-ink">{myBatchGroup.name}</h4>
                    <p className="mt-0.5 text-[12px] text-sub flex items-center gap-1.5">
                      <Users size={12} className="text-navy" /> {myBatchGroup.members} members registered
                    </p>
                    <p className="mt-2 text-[12.5px] text-ink/75 leading-relaxed">{myBatchGroup.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                  <Btn
                    variant="primary"
                    className="flex-1 !h-10 !text-[13px]"
                    onClick={() => push({ name: "groupDetail", id: myBatchGroup.id })}
                  >
                    Open Batch Hub →
                  </Btn>
                  <Btn
                    variant={joined.has(myBatchGroup.id) ? "outline" : "secondary"}
                    className="!h-10 !px-4 !text-[12px]"
                    onClick={() => {
                      toggleJoin(myBatchGroup.id);
                      toast(joined.has(myBatchGroup.id) ? `Left ${myBatchGroup.name}` : `Joined ${myBatchGroup.name}`);
                    }}
                  >
                    {joined.has(myBatchGroup.id) ? "Joined ✓" : "Join"}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* 2. Department Community */}
          {myDeptCommunity && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-sub/70">🏛️ Department Community</h3>
                <Tag tone="peri">{myDeptCommunity.branch} Department</Tag>
              </div>
              <div className="card p-4.5 space-y-3.5 border border-line shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy font-bold text-[15px] ring-2 ring-navy/20">
                    <GraduationCap size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-[16px] font-bold text-ink">{myDeptCommunity.name}</h4>
                    <p className="mt-0.5 text-[12px] text-sub flex items-center gap-1.5">
                      <Users size={12} className="text-navy" /> {myDeptCommunity.members} members registered
                    </p>
                    <p className="mt-2 text-[12.5px] text-ink/75 leading-relaxed">{myDeptCommunity.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                  <Btn
                    variant="primary"
                    className="flex-1 !h-10 !text-[13px]"
                    onClick={() => push({ name: "groupDetail", id: myDeptCommunity.id })}
                  >
                    Open Community Hub →
                  </Btn>
                  <Btn
                    variant={joined.has(myDeptCommunity.id) ? "outline" : "secondary"}
                    className="!h-10 !px-4 !text-[12px]"
                    onClick={() => {
                      toggleJoin(myDeptCommunity.id);
                      toast(joined.has(myDeptCommunity.id) ? `Left ${myDeptCommunity.name}` : `Joined ${myDeptCommunity.name}`);
                    }}
                  >
                    {joined.has(myDeptCommunity.id) ? "Joined ✓" : "Join"}
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GroupDetailScreen({ id }: { id: string }) {
  const { pop, joined, toggleJoin, toast, me } = useStore();
  const g = allGroups.find((x) => x.id === id);
  const [posts, setPosts] = useState<Array<{ id: string; author: string; authorId?: string; role?: string; text: string; ago: string }>>([]);
  const [draft, setDraft] = useState("");
  if (!g) return null;
  const isJoined = joined.has(g.id);

  const handlePost = () => {
    if (!draft.trim()) return;
    const newPost = {
      id: `gp_${Date.now()}`,
      author: me.name || "Member",
      authorId: me.id,
      role: me.role,
      text: draft.trim(),
      ago: "Just now",
    };
    setPosts((ps) => [newPost, ...ps]);
    setDraft("");
    toast("Message posted to group feed");
  };

  const handleDeletePost = (postId: string) => {
    setPosts((ps) => ps.filter((p) => p.id !== postId));
    toast("Post removed");
  };

  return (
    <div className="flex h-full flex-col bg-page">
      <ScreenHeader title={g.tag === "Batch" ? `Batch ${g.batch}` : `${g.branch} Community`} onBack={pop} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden !p-0 shadow-sm border border-line">
          <div className="flex h-20 items-end bg-gradient-to-br from-navy to-navy-800 p-4">
            <Tag tone="gold">{g.tag === "Batch" ? `Class of ${g.batch}` : `${g.branch} Dept`}</Tag>
          </div>
          <div className="relative z-10 p-4">
            <div className="relative z-20 -mt-10 mb-2">
              <InitialsAvatar name={g.name} size={64} rounded="rounded-2xl" className="ring-4 ring-white shadow-sm" />
            </div>
            <h2 className="font-display text-[19px] font-bold text-ink">{g.name}</h2>
            <p className="mt-1 text-[12.5px] text-sub">{g.members + (isJoined ? 1 : 0)} verified members</p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/80">{g.desc}</p>
            <Btn
              variant={isJoined ? "outline" : "primary"}
              className="mt-4 w-full !h-11"
              onClick={() => {
                toggleJoin(g.id);
                toast(isJoined ? `Left “${g.name}”` : `Joined “${g.name}”`);
              }}
            >
              {isJoined ? "Joined ✓ — Leave group" : "Join group"}
            </Btn>
          </div>
        </motion.div>

        <h3 className="mb-3 mt-6 font-display text-[16px] font-semibold text-ink">Group Discussion &amp; Updates</h3>
        <div className="space-y-3">
          {posts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={32} />}
              title="No posts yet"
              copy={`Be the first to share an update, internship lead, or question with your ${g.tag === "Batch" ? "batchmates" : "department community"}.`}
            />
          ) : (
            <AnimatePresence>
              {posts.map((p) => {
                const isAuthor = p.authorId === me.id || p.author === me.name;
                return (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex gap-3 p-3.5 border border-line">
                    <InitialsAvatar name={p.author} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-ink">{p.author}</p>
                          <span className="text-[10.5px] text-sub/60">{p.ago}</span>
                        </div>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            title="Delete post"
                            className="btn-press p-1 text-sub/60 hover:text-rose cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink/85">{p.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-white px-4 pb-8 pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handlePost();
            }
          }}
          placeholder={`Post to ${g.tag === "Batch" ? "Batch " + g.batch : g.branch + " Community"}…`}
          className="input !h-11 flex-1 !rounded-full text-[13px]"
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handlePost}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full cursor-pointer ${
            draft.trim() ? "bg-navy text-white shadow-lg" : "bg-page text-sub/50"
          }`}
        >
          <Send size={17} />
        </motion.button>
      </div>
    </div>
  );
}

/* ================= MENTORSHIP ================= */
export function MentorshipScreen() {
  const { role, pop, mentorReq, requestMentor, mentorOptIn, setMentorOptIn, goTab, push, toast } = useStore();
  const [mentors, setMentors] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getMentors()
      .then((res) => {
        setLoading(false);
        if (res.success && Array.isArray(res.data?.items)) {
          const mapped: Person[] = res.data.items.map((m: any) => {
            const u = m.user || {};
            const al = u.alumniDetails || {};
            const p: Person = {
              id: m.userId || u.id || m.id,
              name: u.name || "Alumni Mentor",
              role: "alumni",
              headline: al.designation
                ? `${al.designation} @ ${al.currentCompany || "Enterprise"}`
                : `${al.branch || "CSE"} Batch ${al.batch || "2020"} · Alumni Mentor`,
              branch: al.branch || "CSE",
              batch: al.batch || "2020",
              company: al.currentCompany,
              city: u.city || "Jaipur",
              about: m.bio || "Available for 1-on-1 mentorship and guidance.",
              color: "#0F2A5E",
              mentor: true,
              domains: m.domains || ["Placements", "Career Guidance"],
              mentees: m.activeMenteesCount || 0,
            };
            registerDynamicUser(p);
            return p;
          });
          setMentors(mapped);
        } else {
          setMentors([]);
        }
      })
      .catch(() => {
        setLoading(false);
        setMentors([]);
      });
  }, []);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-10">
      <ScreenHeader title="Mentorship" onBack={pop} />
      <div className="px-5 pt-2">
        {role === "alumni" && (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-600"><GraduationCap size={22} /></span>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-ink">Mentor mode</p>
                  <p className="text-[12px] text-sub">Students can request your guidance</p>
                </div>
                <Switch on={mentorOptIn} onChange={(v) => { setMentorOptIn(v); toast(v ? "You're now listed as a mentor" : "Mentor mode off"); }} />
              </div>
              <AnimatePresence>
                {mentorOptIn && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line pt-3.5">
                      {["DSA", "System Design", "Referrals", "Career Switch"].map((d) => <Tag key={d} tone="peri">{d}</Tag>)}
                      <span className="text-[11.5px] font-medium text-sub/70">· up to 4 mentees</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {mentorOptIn && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="mb-3 mt-6 font-display text-[17px] font-semibold text-ink">Incoming requests</h3>
                  <div className="card p-4 text-center">
                    <p className="text-[13px] text-sub font-medium">No pending mentorship requests at this time.</p>
                  </div>
                  <h3 className="mb-3 mt-6 font-display text-[17px] font-semibold text-ink">My Mentees</h3>
                  <div className="card p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy font-bold text-[13px]">0</span>
                      <p className="flex-1 text-[13px] font-semibold text-ink">0 active mentees</p>
                      <Btn variant="outline" className="!h-9 !px-3.5 !text-[12px]" onClick={() => goTab("chat")}>Open chats</Btn>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!mentorOptIn && (
              <div className="mt-4">
                <EmptyState icon={<Inbox size={34} />} title="You're hidden from students" copy="Turn on mentor mode to appear in the mentor directory and start receiving requests from juniors." cta="Turn on mentor mode" onCta={() => setMentorOptIn(true)} />
              </div>
            )}
          </>
        )}

        {role === "student" && (
          <>
            {/* my requests tracker */}
            <h3 className="mb-3 mt-2 font-display text-[17px] font-semibold text-ink">My Requests</h3>
            <div className="space-y-2.5">
              {mentors.filter((m) => (mentorReq[m.id] ?? "none") !== "none").length === 0 && (
                <div className="card flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy"><HeartHandshake size={18} /></span>
                  <p className="text-[13px] font-medium text-sub">No requests yet — choose an alumni mentor below.</p>
                </div>
              )}
              {mentors.filter((m) => (mentorReq[m.id] ?? "none") !== "none").map((m) => {
                const st = mentorReq[m.id];
                return (
                  <motion.div layout key={m.id} className="card flex items-center gap-3 p-3.5">
                    <InitialsAvatar name={m.name} size={42} />
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-ink">{m.name}</p>
                      <p className="text-[11.5px] text-sub">{m.headline}</p>
                    </div>
                    <Tag tone={st === "active" ? "mint" : "gold"}>
                      {st === "active" ? <><UserCheck size={11} /> Active</> : "Pending"}
                    </Tag>
                  </motion.div>
                );
              })}
            </div>

            <h3 className="mb-3 mt-6 font-display text-[17px] font-semibold text-ink">Mentor directory</h3>
            {loading ? (
              <ListSkeleton rows={3} />
            ) : mentors.length === 0 ? (
              <EmptyState
                icon={<GraduationCap size={36} />}
                title="No Alumni Mentors Available"
                copy="Verified alumni mentors will appear here as soon as they enable mentor mode. You can connect with alumni directly in the Directory."
                cta="Explore Directory"
                onCta={() => goTab("directory")}
              />
            ) : (
              <div className="space-y-3">
                {mentors.map((m, i) => {
                  const st = mentorReq[m.id] ?? "none";
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                      <div className="flex items-start gap-3">
                        <InitialsAvatar name={m.name} size={50} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-bold text-ink">{m.name}</p>
                          <p className="truncate text-[12.5px] text-sub">{m.headline}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(m.domains ?? []).slice(0, 3).map((d) => <Tag key={d} tone="peri">{d}</Tag>)}
                          </div>
                        </div>
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sub/70"><GraduationCap size={11} /> {m.mentees}</span>
                      </div>
                      <div className="mt-3.5 flex gap-2">
                        <Btn variant="outline" className="h-10 flex-1 !text-[13px]" onClick={() => push({ name: "profile", id: m.id })}>Profile</Btn>
                        {st === "none" ? (
                          <Btn variant="gold" className="h-10 flex-1 !text-[13px]" onClick={() => { setSheetFor(m.id); setNote(""); }}>
                            Request mentorship
                          </Btn>
                        ) : (
                          <span className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-[13px] font-bold ${st === "active" ? "bg-[#E3F6EE] text-[#1F8A64]" : "bg-page text-sub"}`}>
                            {st === "active" ? <><Check size={15} /> Mentor</> : "Requested"}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={!!sheetFor} onClose={() => setSheetFor(null)} title={sheetFor ? `Request ${personById(sheetFor).name.split(" ")[0]}` : ""}>
        <p className="text-[13px] leading-relaxed text-sub">
          A short note massively improves accept rates. What do you want to work on together?
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="e.g. Preparing for SDE-1 loops in Jan placement season — need help with system design basics…"
          className="input mt-4 h-auto resize-none py-3 leading-relaxed"
        />
        <Btn
          className="mt-4 w-full"
          disabled={note.trim().length < 10}
          onClick={() => { if (sheetFor) requestMentor(sheetFor); setSheetFor(null); }}
        >
          <HeartHandshake size={16} /> Send request
        </Btn>
      </Sheet>
    </div>
  );
}
