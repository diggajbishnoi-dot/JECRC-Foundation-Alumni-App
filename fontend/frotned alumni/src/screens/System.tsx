import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Briefcase, GraduationCap, CalendarDays, UsersRound, MessageCircle,
  ChevronRight, LogOut, Trash2, CheckCheck, BellOff, EyeOff, Check, X, Handshake,
} from "lucide-react";
import { useStore, personById } from "../state/store";
import { Btn, EmptyState, InitialsAvatar, ScreenHeader, Sheet, Switch, Tag } from "../components/ui";

const notifIcons = {
  connect: { icon: UserPlus, tint: "#E3EAF7", color: "#0F2A5E" },
  job: { icon: Briefcase, tint: "#FCF0DA", color: "#B87714" },
  mentor: { icon: GraduationCap, tint: "#EFE9FE", color: "#6D3FD4" },
  event: { icon: CalendarDays, tint: "#E8F6F0", color: "#1F8A64" },
  group: { icon: UsersRound, tint: "#FDE8ED", color: "#C94060" },
  chat: { icon: MessageCircle, tint: "#E3F1FD", color: "#1D6FC2" },
};

/* ================= NOTIFICATIONS ================= */
export function NotificationsScreen({ embedded }: { embedded?: boolean }) {
  const { notifList, markNotif, markAllNotifs, pop } = useStore();
  const groups = ["Today", "This Week", "Earlier"] as const;

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-32">
      {embedded ? (
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Notifications</h1>
          <button onClick={markAllNotifs} className="btn-press flex items-center gap-1.5 text-[12.5px] font-bold text-navy">
            <CheckCheck size={15} /> Mark all read
          </button>
        </div>
      ) : (
        <ScreenHeader title="Notifications" onBack={pop} right={
          <button onClick={markAllNotifs} className="btn-press mr-2 flex items-center gap-1 text-[12px] font-bold text-navy">
            <CheckCheck size={14} /> All read
          </button>
        } />
      )}

      <div className="px-5 pt-3">
        {notifList.every((n) => n.read) && (
          <EmptyState icon={<BellOff size={32} />} title="All caught up" copy="New connections, job matches and Alumni Meet updates will land here." />
        )}
        {groups.map((g) => {
          const items = notifList.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="mb-6">
              <h3 className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-sub/60">{g}</h3>
              <div className="space-y-2.5">
                {items.map((n, i) => {
                  const ic = notifIcons[n.icon];
                  return (
                    <motion.button
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => markNotif(n.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition-colors ${n.read ? "bg-white" : "bg-navy-50"}`}
                      style={{ boxShadow: n.read ? "none" : "0 2px 10px rgba(15,42,94,0.05)" }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: ic.tint, color: ic.color }}>
                        <ic.icon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13.5px] leading-snug ${n.read ? "font-semibold text-ink/80" : "font-bold text-ink"}`}>{n.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-sub">{n.body}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[10.5px] font-medium text-sub/60">{n.ago}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-gold" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= SETTINGS ================= */
export function SettingsScreen() {
  const { pop, me, role, logout, deleteAccount } = useStore();
  const [prefs, setPrefs] = useState({ jobs: true, messages: true, events: true, digest: false });
  const [hideSeen, setHideSeen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const Row = ({ label, desc, right, danger }: { label: string; desc?: string; right: React.ReactNode; danger?: boolean }) => (
    <div className="flex items-center justify-between py-3.5">
      <div className="min-w-0 flex-1 pr-3">
        <p className={`text-[14px] font-semibold ${danger ? "text-rose" : "text-ink"}`}>{label}</p>
        {desc && <p className="mt-0.5 text-[11.5px] text-sub">{desc}</p>}
      </div>
      {right}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-10">
      <ScreenHeader title="Settings" onBack={pop} />
      <div className="space-y-4 px-5 pt-2">
        {/* profile card */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-3.5 p-4">
          <InitialsAvatar name={me.name} size={54} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] font-semibold text-ink">{me.name}</p>
            <p className="truncate text-[12.5px] text-sub">{me.headline}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-navy">
              {role === "alumni" ? "Alumni Account" : "Student Account"}
            </span>
          </div>
          <ChevronRight size={18} className="text-sub/40" />
        </motion.div>

        {/* notifications */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card divide-y divide-line px-4">
          <p className="pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-sub/60">Notifications</p>
          <Row label="New jobs & internships" desc="Matches your branch (CSE)" right={<Switch on={prefs.jobs} onChange={(v) => setPrefs((p) => ({ ...p, jobs: v }))} />} />
          <Row label="Messages" desc="Privacy-safe previews only" right={<Switch on={prefs.messages} onChange={(v) => setPrefs((p) => ({ ...p, messages: v }))} />} />
          <Row label="Events & meet updates" right={<Switch on={prefs.events} onChange={(v) => setPrefs((p) => ({ ...p, events: v }))} />} />
          <Row label="Weekly digest email" right={<Switch on={prefs.digest} onChange={(v) => setPrefs((p) => ({ ...p, digest: v }))} />} />
        </motion.div>

        {/* privacy */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card px-4">
          <p className="pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-sub/60">Privacy</p>
          <Row label="Hide my last seen" desc="You'll also stop seeing others' status" right={<Switch on={hideSeen} onChange={setHideSeen} />} />
          <div className="flex items-center gap-2 border-t border-line py-3.5 text-[12px] text-sub">
            <EyeOff size={14} className="text-navy" /> Chat messages are end-to-end encrypted — server stores only ciphertext.
          </div>
        </motion.div>

        {/* danger zone */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card divide-y divide-line px-4">
          <Row label="Log out" right={<button onClick={logout} className="btn-press flex items-center gap-1.5 rounded-lg bg-page px-3.5 py-2 text-[12.5px] font-bold text-ink"><LogOut size={14} /> Logout</button>} />
          <Row label="Delete account" desc="Removes profile, connections & keys" danger right={<button onClick={() => setConfirmDelete(true)} className="btn-press flex items-center gap-1.5 rounded-lg bg-[#FDE8ED] px-3.5 py-2 text-[12.5px] font-bold text-rose"><Trash2 size={14} /> Delete</button>} />
        </motion.div>

        <p className="pb-6 pt-2 text-center text-[11px] font-medium text-sub/50">JECRC Foundation · Alumni Meet · v1.0.0</p>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your account?">
        <p className="text-[13.5px] leading-relaxed text-sub">
          This permanently removes your profile, connections, mentorship links and encryption keys. Messages can never
          be recovered. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Btn variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>Keep account</Btn>
          <Btn variant="danger" className="flex-1" onClick={() => { setConfirmDelete(false); deleteAccount(); }}>
            Delete forever
          </Btn>
        </div>
      </Sheet>
    </div>
  );
}

/* ================= CONNECTIONS ================= */
export function ConnectionsScreen() {
  const { pop, conn, received, sent, acceptConn, rejectConn, unlockChat, push } = useStore();
  const [tabIdx, setTabIdx] = useState(received.length ? 1 : 0);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  const network = Object.entries(conn).filter(([, v]) => v === "connected").map(([k]) => k);
  const tabs: [string, number][] = [["My Network", network.length], ["Received", received.length], ["Sent", sent.length]];

  const openChatFor = (userId: string) => {
    unlockChat(userId);
    push({ name: "chatRoom", id: `c_${userId}` });
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-10">
      <ScreenHeader title="Connections" onBack={pop} />
      <div className="px-5 pt-2">
        <div className="flex rounded-xl bg-white p-1 shadow-[0_2px_10px_rgba(15,42,94,0.05)]">
          {tabs.map(([t, count], i) => (
            <button key={t} onClick={() => setTabIdx(i)} className={`relative flex-1 rounded-lg py-2.5 text-[12.5px] font-semibold transition-colors ${tabIdx === i ? "text-white" : "text-sub"}`}>
              {tabIdx === i && <motion.span layoutId="conn-tab" className="absolute inset-0 rounded-lg bg-navy" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative z-10">{t} · {count}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tabIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
            {tabIdx === 0 && (
              network.length === 0 ? (
                <EmptyState icon={<Handshake size={34} />} title="Build your network" copy="Connect with batchmates and alumni in the directory — chats unlock once they accept." />
              ) : (
                network.map((id, i) => {
                  const p = personById(id);
                  return (
                    <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card flex items-center gap-3 p-3.5">
                      <InitialsAvatar name={p.name} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold text-ink">{p.name}</p>
                        <p className="truncate text-[12px] text-sub">{p.headline}</p>
                      </div>
                      <Btn variant="primary" className="!h-9 !px-4 !text-[12px]" onClick={() => openChatFor(id)}>
                        <MessageCircle size={13} /> Chat
                      </Btn>
                    </motion.div>
                  );
                })
              )
            )}

            {tabIdx === 1 && (
              received.length === 0 ? (
                <EmptyState icon={<UserPlus size={34} />} title="No pending requests" copy="When students or alumni request to connect, they'll show up here for you to accept." />
              ) : (
                received.map((id) => {
                  const p = personById(id);
                  const justAccepted = acceptedId === id;
                  return (
                    <motion.div layout key={id} className="card p-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={p.name} size={48} layoutId={`av-${id}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-bold text-ink">{p.name}</p>
                          <p className="truncate text-[12px] text-sub">{p.headline}</p>
                          <div className="mt-1"><Tag tone={p.role === "alumni" ? "gold" : "peri"}>{p.role}</Tag></div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {justAccepted ? (
                          <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#E3F6EE] text-[13.5px] font-bold text-[#1F8A64]">
                            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
                              <Check size={17} />
                            </motion.span>
                            Connected — chat unlocked
                          </motion.span>
                        ) : (
                          <>
                            <Btn
                              variant="primary" className="h-11 flex-1 !text-[13.5px]"
                              onClick={() => { setAcceptedId(id); setTimeout(() => acceptConn(id), 1400); }}
                            >
                              Accept
                            </Btn>
                            <Btn variant="outline" className="h-11 !w-12 !px-0" onClick={() => rejectConn(id)}>
                              <X size={17} />
                            </Btn>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )
            )}

            {tabIdx === 2 && (
              sent.length === 0 ? (
                <EmptyState icon={<CheckCheck size={34} />} title="Nothing pending" copy="Requests you send will appear here until they're accepted." cta="Find people" onCta={() => pop()} />
              ) : (
                sent.map((id) => {
                  const p = personById(id);
                  return (
                    <div key={id} className="card flex items-center gap-3 p-3.5">
                      <InitialsAvatar name={p.name} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-bold text-ink">{p.name}</p>
                        <p className="truncate text-[12px] text-sub">{p.headline}</p>
                      </div>
                      <Tag tone="gold">Pending</Tag>
                    </div>
                  );
                })
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
