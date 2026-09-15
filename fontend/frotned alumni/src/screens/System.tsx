import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Briefcase, GraduationCap, CalendarDays, UsersRound, MessageCircle,
  LogOut, Trash2, CheckCheck, BellOff, EyeOff, Check, X, Handshake,
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
  const { notifList, markNotif, markAllNotifs, pop, push, acceptConn, rejectConn, conn, received } = useStore();
  const [actingId, setActingId] = useState<string | null>(null);
  const groups = ["Today", "This Week", "Earlier"] as const;

  const handleAccept = (e: React.MouseEvent, userId: string, notifId: string) => {
    e.stopPropagation();
    setActingId(userId);
    markNotif(notifId);
    setTimeout(() => {
      acceptConn(userId);
      setActingId(null);
    }, 400);
  };

  const handleReject = (e: React.MouseEvent, userId: string, notifId: string) => {
    e.stopPropagation();
    markNotif(notifId);
    rejectConn(userId);
  };

  const handleOpenChat = (e: React.MouseEvent, userId: string, notifId: string) => {
    e.stopPropagation();
    markNotif(notifId);
    push({ name: "chatRoom", id: `c_${userId}` });
  };

  const handleOpenProfile = (userId?: string) => {
    if (userId) {
      push({ name: "profile", id: userId });
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-page pb-32">
      {embedded ? (
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Notifications</h1>
            <p className="text-[12px] text-sub">Connection requests, messages &amp; recent activity</p>
          </div>
          <button onClick={markAllNotifs} className="btn-press flex items-center gap-1.5 text-[12.5px] font-bold text-navy cursor-pointer">
            <CheckCheck size={15} /> Mark all read
          </button>
        </div>
      ) : (
        <ScreenHeader
          title="Notifications"
          onBack={pop}
          right={
            <button onClick={markAllNotifs} className="btn-press mr-2 flex items-center gap-1 text-[12px] font-bold text-navy cursor-pointer">
              <CheckCheck size={14} /> All read
            </button>
          }
        />
      )}

      <div className="px-5 pt-3">
        {notifList.length === 0 && (
          <EmptyState icon={<BellOff size={32} />} title="All caught up" copy="New connections, job matches and Alumni updates will appear here." />
        )}
        {groups.map((g) => {
          const items = notifList.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="mb-6">
              <h3 className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-sub/60">{g}</h3>
              <div className="space-y-3">
                {items.map((n, i) => {
                  const ic = notifIcons[n.icon] || notifIcons.connect;
                  const isConnReq = n.type === "connection_request" || (n.icon === "connect" && n.userId && (received.includes(n.userId) || conn[n.userId] !== "connected"));
                  const isConnected = n.userId && (conn[n.userId] === "connected" || n.type === "connection_accepted");
                  const person = n.userId ? personById(n.userId) : null;

                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => {
                        markNotif(n.id);
                        if (n.userId) handleOpenProfile(n.userId);
                      }}
                      className={`relative flex flex-col gap-2.5 rounded-2xl p-4 transition-all cursor-pointer ${
                        n.read ? "bg-white border border-line/60" : "bg-white border-2 border-navy/20 shadow-[0_4px_16px_rgba(15,42,94,0.06)]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {person ? (
                          <div className="relative shrink-0">
                            <InitialsAvatar name={person.name} size={42} />
                            <span
                              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px]"
                              style={{ background: ic.tint, color: ic.color }}
                            >
                              <ic.icon size={11} />
                            </span>
                          </div>
                        ) : (
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: ic.tint, color: ic.color }}
                          >
                            <ic.icon size={18} />
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[13.5px] leading-snug ${n.read ? "font-semibold text-ink/90" : "font-bold text-navy"}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10.5px] font-medium text-sub/60">{n.ago}</span>
                          </div>
                          <p className="mt-0.5 text-[12.5px] text-sub leading-snug">{n.body}</p>
                        </div>
                        {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />}
                      </div>

                      {/* Action buttons for Connection Request / Chat */}
                      {n.userId && (
                        <div className="mt-1 flex items-center gap-2 pt-2 border-t border-line/50">
                          {isConnected ? (
                            <div className="flex w-full items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1F8A64]">
                                <Check size={14} strokeWidth={3} /> Connected
                              </span>
                              <button
                                onClick={(e) => handleOpenChat(e, n.userId!, n.id)}
                                className="btn-press flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm cursor-pointer"
                              >
                                <MessageCircle size={13} /> Chat Now
                              </button>
                            </div>
                          ) : isConnReq ? (
                            <div className="flex w-full items-center gap-2">
                              <button
                                disabled={actingId === n.userId}
                                onClick={(e) => handleAccept(e, n.userId!, n.id)}
                                className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-navy py-2 text-[12.5px] font-bold text-white shadow-sm hover:bg-navy-600 transition-colors cursor-pointer"
                              >
                                <Check size={14} strokeWidth={2.5} /> Accept Request
                              </button>
                              <button
                                onClick={(e) => handleReject(e, n.userId!, n.id)}
                                className="btn-press flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-page text-sub hover:bg-rose-50 hover:text-rose transition-colors cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProfile(n.userId);
                              }}
                              className="btn-press text-[12px] font-bold text-navy hover:underline cursor-pointer"
                            >
                              View Profile →
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
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
