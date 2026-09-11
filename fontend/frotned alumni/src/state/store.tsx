import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Person, people, meAlumni, jobs as seedJobs, Job, threads as seedThreads, Thread, notifs as seedNotifs, Notif, groups as seedGroups, seedChats, repliesPool, SeedMsg } from "../data/mock";
import { api } from "../services/api";

export type Role = "student" | "alumni";
export type Phase = "splash" | "onboard" | "auth" | "app";
export type Tab = "home" | "directory" | "chat" | "alerts" | "profile" | "post";
export interface Route { name: string; id?: string }

export interface ChatMsg {
  id: string;
  fromMe: boolean;
  kind: "text" | "image" | "doc";
  text: string;
  meta?: { name?: string; size?: string };
  time: string;
  status: "sent" | "delivered" | "read";
  uploading?: boolean;
}
export interface Chat {
  id: string;
  userId: string;
  online: boolean;
  unread: number;
  locked?: boolean;
  msgs: ChatMsg[];
}

interface ToastItem { id: number; text: string }

interface RegData { name: string; email: string; role: Role; branch: string; detail: string }

interface Store {
  phase: Phase;
  setPhase: (p: Phase) => void;
  role: Role;
  setRole: (r: Role) => void;
  me: Person;
  setMe: (m: Person) => void;
  completeRegister: (d: RegData) => void;
  tab: Tab;
  goTab: (t: Tab) => void;
  stack: Route[];
  push: (r: Route) => void;
  pop: () => void;
  clearStack: () => void;
  toasts: ToastItem[];
  toast: (text: string) => void;
  // connections
  conn: Record<string, "none" | "pending" | "connected">;
  requestConnect: (userId: string) => void;
  acceptConn: (userId: string) => void;
  rejectConn: (userId: string) => void;
  received: string[];
  sent: string[];
  // chat
  chats: Chat[];
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
  sendChat: (chatId: string, msg: Omit<ChatMsg, "id" | "time" | "status">) => void;
  typing: Record<string, boolean>;
  unlockChat: (userId: string) => void;
  // jobs
  allJobs: Job[];
  addJob: (j: Job) => void;
  // discussions
  allThreads: Thread[];
  upvoted: Set<string>;
  toggleUp: (threadId: string) => void;
  addThread: (t: Thread) => void;
  addReply: (threadId: string, text: string) => void;
  // groups
  joined: Set<string>;
  toggleJoin: (gid: string) => void;
  // mentorship
  mentorReq: Record<string, "none" | "pending" | "active">;
  requestMentor: (pid: string) => void;
  mentorOptIn: boolean;
  setMentorOptIn: (v: boolean) => void;
  // notifications
  notifList: Notif[];
  markNotif: (id: string) => void;
  markAllNotifs: () => void;
  unreadNotifs: number;
  totalUnreadChats: number;
  // auth
  logout: () => void;
  deleteAccount: () => void;
}

const Ctx = createContext<Store | null>(null);

const nowTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("splash");
  const [role, setRole] = useState<Role>("alumni");
  const [me, setMe] = useState<Person>(meAlumni);
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<Route[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [conn, setConn] = useState<Record<string, "none" | "pending" | "connected">>({
    p1: "connected", p2: "connected", p3: "pending", p7: "connected",
  });
  const [received, setReceived] = useState<string[]>(["p9", "p10"]);
  const [sent, setSent] = useState<string[]>(["p3"]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [allJobs, setAllJobs] = useState<Job[]>(seedJobs);
  const [allThreads, setAllThreads] = useState<Thread[]>(seedThreads);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set(["t4"]));
  const [joined, setJoined] = useState<Set<string>>(new Set(["g1", "g5"]));
  const [mentorReq, setMentorReq] = useState<Record<string, "none" | "pending" | "active">>({ p4: "active" });
  const [mentorOptIn, setMentorOptIn] = useState(false);
  const [notifList, setNotifList] = useState<Notif[]>(seedNotifs);

  const [chats, setChats] = useState<Chat[]>(() =>
    seedChats.map((c) => ({
      id: `c_${c.userId}`,
      userId: c.userId,
      online: c.online,
      unread: c.unread,
      locked: c.locked,
      msgs: c.msgs.map((m: SeedMsg) => ({ ...m, kind: "text" as const })),
    }))
  );

  const timers = useRef<number[]>([]);
  const activeChatRef = useRef<string | null>(null);
  activeChatRef.current = activeChat;

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  // Sync state with Backend API
  useEffect(() => {
    // 1. Sync Jobs / Posts
    api.getPosts().then((res) => {
      if (res.success && Array.isArray(res.data?.items)) {
        const backendJobs: Job[] = res.data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          company: item.company || "Enterprise Partner",
          location: item.location || "Bengaluru / Hybrid",
          type: item.type === "INTERNSHIP" ? "Internship" : "Full-time",
          mode: "Hybrid",
          pay: "Competitive",
          skills: ["Cloud", "System Architecture", "Engineering"],
          postedBy: item.user?.name || "Alumni Cell",
          postedAgo: "Recently",
          deadline: "Rolling",
          applicants: 14,
          branch: "CSE",
          desc: item.description,
        }));
        if (backendJobs.length > 0) {
          setAllJobs((existing) => [...backendJobs, ...existing.filter((j) => !backendJobs.some((bj) => bj.id === j.id))]);
        }
      }
    });

    // 2. Sync Discussions
    api.getDiscussions().then((res) => {
      if (res.success && Array.isArray(res.data?.items)) {
        const backendThreads: Thread[] = res.data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category || "Career Guidance",
          author: item.user?.name || "Alumni Mentor",
          authorRole: "alumni",
          upvotes: item.upvotesCount || 12,
          ago: "Recently",
          body: item.description,
          replies: (item.replies || []).map((r: any) => ({
            id: r.id,
            author: r.user?.name || "JECRC Member",
            text: r.content,
            ago: "Recently",
            upvotes: 0,
          })),
        }));
        if (backendThreads.length > 0) {
          setAllThreads((existing) => [...backendThreads, ...existing.filter((t) => !backendThreads.some((bt) => bt.id === t.id))]);
        }
      }
    });
  }, []);

  const goTab = useCallback((t: Tab) => {
    setStack([]);
    setTab(t);
  }, []);

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const clearStack = useCallback(() => setStack([]), []);

  const unlockChat = useCallback((userId: string) => {
    setChats((cs) => {
      const exists = cs.find((c) => c.userId === userId);
      if (exists) return cs.map((c) => (c.userId === userId ? { ...c, locked: false } : c));
      return [{ id: `c_${userId}`, userId, online: false, unread: 0, msgs: [] }, ...cs];
    });
  }, []);

  const requestConnect = useCallback(
    (userId: string) => {
      setConn((c) => ({ ...c, [userId]: "pending" }));
      setSent((s) => (s.includes(userId) ? s : [...s, userId]));
      toast("Connection request sent to backend");
      api.requestConnection(userId).catch(() => {});
      // demo: auto-accept after a while
      window.setTimeout(() => {
        setConn((c) => (c[userId] === "pending" ? { ...c, [userId]: "connected" } : c));
        setSent((s) => s.filter((x) => x !== userId));
        unlockChat(userId);
        toast(`${people.find((p) => p.id === userId)?.name ?? "They"} accepted your request — chat unlocked`);
      }, 6000);
    },
    [toast, unlockChat]
  );

  const acceptConn = useCallback(
    (userId: string) => {
      setConn((c) => ({ ...c, [userId]: "connected" }));
      setReceived((r) => r.filter((x) => x !== userId));
      unlockChat(userId);
      toast("Connection accepted — chat unlocked");
    },
    [toast, unlockChat]
  );

  const rejectConn = useCallback(
    (userId: string) => {
      setReceived((r) => r.filter((x) => x !== userId));
      toast("Request declined");
    },
    [toast]
  );

  const sendChat = useCallback(
    (chatId: string, msg: Omit<ChatMsg, "id" | "time" | "status">) => {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;
      const id = `m_${Date.now()}`;
      setChats((cs) =>
        cs.map((c) =>
          c.id === chatId
            ? { ...c, msgs: [...c.msgs, { ...msg, id, time: nowTime(), status: "sent" }] }
            : c
        )
      );
      // delivered
      const t1 = window.setTimeout(() => {
        setChats((cs) => cs.map((c) => (c.id === chatId ? { ...c, msgs: c.msgs.map((m) => (m.id === id ? { ...m, status: "delivered" } : m)) } : c)));
      }, 700);
      // typing then reply then read
      const t2 = window.setTimeout(() => setTyping((t) => ({ ...t, [chatId]: true })), 1300);
      const t3 = window.setTimeout(() => {
        setTyping((t) => ({ ...t, [chatId]: false }));
        const reply = repliesPool[Math.floor(Math.random() * repliesPool.length)];
        const rid = `r_${Date.now()}`;
        setChats((cs) =>
          cs.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  unread: activeChatRef.current === chatId ? 0 : c.unread + 1,
                  msgs: [
                    ...c.msgs.map((m) => (m.fromMe ? { ...m, status: "read" as const } : m)),
                    { id: rid, fromMe: false, kind: "text", text: reply, time: nowTime(), status: "read" },
                  ],
                }
              : c
          )
        );
      }, 3200);
      timers.current.push(t1, t2, t3);
    },
    [chats]
  );

  const toggleUp = useCallback((threadId: string) => {
    setUpvoted((u) => {
      const s = new Set(u);
      if (s.has(threadId)) s.delete(threadId);
      else s.add(threadId);
      return s;
    });
    api.upvoteDiscussion(threadId).catch(() => {});
  }, []);

  const addThread = useCallback((t: Thread) => {
    setAllThreads((ts) => [t, ...ts]);
    api.createDiscussion({
      title: t.title,
      description: t.body,
      category: t.category,
    }).then((res) => {
      if (res.success) {
        toast("Discussion published to backend network!");
      }
    });
  }, [toast]);

  const addReply = useCallback((threadId: string, text: string) => {
    setAllThreads((ts) =>
      ts.map((t) =>
        t.id === threadId
          ? { ...t, replies: [...t.replies, { id: `r_${Date.now()}`, author: "You", text, ago: "now", upvotes: 0 }] }
          : t
      )
    );
    api.replyDiscussion(threadId, text).catch(() => {});
  }, []);

  const toggleJoin = useCallback((gid: string) => {
    setJoined((j) => {
      const s = new Set(j);
      if (s.has(gid)) s.delete(gid);
      else s.add(gid);
      return s;
    });
    api.joinGroup(gid).catch(() => {});
  }, []);

  const requestMentor = useCallback(
    (pid: string) => {
      setMentorReq((m) => ({ ...m, [pid]: "pending" }));
      toast("Mentorship request sent to backend");
      api.requestMentorship(pid).catch(() => {});
      window.setTimeout(() => {
        setMentorReq((m) => (m[pid] === "pending" ? { ...m, [pid]: "active" } : m));
        unlockChat(pid);
        toast(`${people.find((p) => p.id === pid)?.name ?? "Mentor"} accepted — chat unlocked`);
      }, 8000);
    },
    [toast, unlockChat]
  );

  const addJob = useCallback((j: Job) => {
    setAllJobs((js) => [j, ...js]);
    api.createPost({
      title: j.title,
      description: j.desc,
      type: j.type === "Internship" ? "INTERNSHIP" : "JOB",
      company: j.company,
      location: j.location,
    }).then((res) => {
      if (res.success) {
        toast("Job synced with backend!");
      }
    });
  }, [toast]);

  const markNotif = useCallback((id: string) => {
    setNotifList((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllNotifs = useCallback(() => {
    setNotifList((ns) => ns.map((n) => ({ ...n, read: true })));
  }, []);

  const logout = useCallback(() => {
    clearStack();
    setTab("home");
    setPhase("auth");
    toast("Logged out");
  }, [clearStack, toast]);

  const deleteAccount = useCallback(() => {
    clearStack();
    setTab("home");
    setPhase("splash");
  }, [clearStack]);

  const completeRegister = useCallback((d: RegData) => {
    setRole(d.role);
    setMe({
      id: "me",
      name: d.name || "New Member",
      role: d.role,
      branch: d.branch || "CSE",
      batch: d.detail || (d.role === "alumni" ? "2020" : "2027"),
      city: "Jaipur",
      color: d.role === "alumni" ? "#0F2A5E" : "#2563EB",
      headline:
        d.role === "alumni"
          ? `${d.branch} Batch ${d.detail || "2020"} · JECRC Alumnus`
          : `${d.branch} '${(d.detail || "2027").slice(2)} · JECRC Student`,
      company: d.role === "alumni" ? "—" : undefined,
      about: "New to the JECRC Foundation network. Say hi!",
    });
    setPhase("app");
    setTab("home");
    setStack([]);
  }, []);

  const unreadNotifs = notifList.filter((n) => !n.read).length;
  const totalUnreadChats = chats.reduce((a, c) => a + c.unread, 0);

  const value = useMemo<Store>(
    () => ({
      phase, setPhase, role, setRole, me, setMe, completeRegister,
      tab, goTab, stack, push, pop, clearStack, toasts, toast,
      conn, requestConnect, acceptConn, rejectConn, received, sent,
      chats, activeChat, setActiveChat, sendChat, typing, unlockChat,
      allJobs, addJob, allThreads, upvoted, toggleUp, addThread, addReply,
      joined, toggleJoin, mentorReq, requestMentor, mentorOptIn, setMentorOptIn,
      notifList, markNotif, markAllNotifs, unreadNotifs, totalUnreadChats,
      logout, deleteAccount,
    }),
    [phase, role, me, completeRegister, tab, goTab, stack, push, pop, clearStack, toasts, toast, conn, requestConnect, acceptConn, rejectConn, received, sent, chats, activeChat, sendChat, typing, unlockChat, allJobs, addJob, allThreads, upvoted, toggleUp, addThread, addReply, joined, toggleJoin, mentorReq, requestMentor, mentorOptIn, notifList, markNotif, markAllNotifs, unreadNotifs, totalUnreadChats, logout, deleteAccount]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("store missing");
  return s;
}

export const personById = (id: string): Person => people.find((p) => p.id === id) ?? people[0];
export const allGroups = seedGroups;
