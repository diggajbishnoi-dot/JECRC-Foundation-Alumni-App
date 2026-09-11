import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Person, people, meAlumni, Job, Thread, Notif, groups as seedGroups } from "../data/mock";
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

interface RegData {
  name: string;
  email: string;
  role: Role;
  branch: string;
  detail: string;
  city?: string;
  company?: string;
  title?: string;
  about?: string;
}

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
  const [conn, setConn] = useState<Record<string, "none" | "pending" | "connected">>({});
  const [received, setReceived] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [typing] = useState<Record<string, boolean>>({});
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [mentorReq, setMentorReq] = useState<Record<string, "none" | "pending" | "active">>({});
  const [mentorOptIn, setMentorOptIn] = useState(false);
  const [notifList, setNotifList] = useState<Notif[]>([
    {
      id: "n-welcome",
      group: "Today",
      title: "Welcome to JECRC Alumni Network",
      body: "Your profile is active. Connect with fellow members and explore opportunities.",
      icon: "event",
      read: true,
      ago: "Just now",
    },
  ]);

  const [chats, setChats] = useState<Chat[]>([]);

  const timers = useRef<number[]>([]);
  const activeChatRef = useRef<string | null>(null);
  activeChatRef.current = activeChat;

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const connIdMap = useRef<Record<string, string>>({});

  const syncConnections = useCallback(() => {
    if (!api.getToken()) return;

    // 1. Fetch Accepted Connections
    api.getConnections().then((res) => {
      if (res.success && res.data?.items && Array.isArray(res.data.items)) {
        res.data.items.forEach((item: any) => {
          const peer = item.peer;
          if (peer?.id) {
            connIdMap.current[peer.id] = item.connectionId;
            setConn((prev) => ({ ...prev, [peer.id]: "connected" }));
            const mappedPerson: Person = {
              id: peer.id,
              name: peer.name,
              role: (peer.role?.toLowerCase() as Role) || "alumni",
              headline: peer.alumniDetails?.designation
                ? `${peer.alumniDetails.designation} @ ${peer.alumniDetails.currentCompany || "Enterprise"}`
                : `${peer.role === "ALUMNI" ? "Alumnus" : "Student"} · JECRC Foundation`,
              branch: peer.alumniDetails?.branch || peer.studentDetails?.branch || "CSE",
              batch: peer.alumniDetails?.batch || (peer.studentDetails?.expectedPassoutYear ? String(peer.studentDetails.expectedPassoutYear) : "2024"),
              company: peer.alumniDetails?.currentCompany,
              city: peer.city || "Jaipur",
              about: peer.bio || "Connected JECRC Member",
              color: peer.role === "ALUMNI" ? "#0F2A5E" : "#2563EB",
            };
            registerDynamicUser(mappedPerson);
          }
        });
      }
    }).catch(() => {});

    // 2. Fetch Incoming Pending Requests
    api.getPendingRequests().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const receivedIds: string[] = [];
        res.data.forEach((item: any) => {
          const reqUser = item.requester;
          if (reqUser?.id) {
            connIdMap.current[reqUser.id] = item.id;
            receivedIds.push(reqUser.id);
            setConn((prev) => ({ ...prev, [reqUser.id]: "none" }));
            const mappedPerson: Person = {
              id: reqUser.id,
              name: reqUser.name,
              role: (reqUser.role?.toLowerCase() as Role) || "alumni",
              headline: reqUser.alumniDetails?.designation
                ? `${reqUser.alumniDetails.designation} @ ${reqUser.alumniDetails.currentCompany || "Enterprise"}`
                : `${reqUser.role === "ALUMNI" ? "Alumnus" : "Student"} · JECRC Foundation`,
              branch: reqUser.alumniDetails?.branch || reqUser.studentDetails?.branch || "CSE",
              batch: reqUser.alumniDetails?.batch || (reqUser.studentDetails?.expectedPassoutYear ? String(reqUser.studentDetails.expectedPassoutYear) : "2024"),
              company: reqUser.alumniDetails?.currentCompany,
              city: reqUser.city || "Jaipur",
              about: reqUser.bio || "JECRC Member",
              color: reqUser.role === "ALUMNI" ? "#0F2A5E" : "#2563EB",
            };
            registerDynamicUser(mappedPerson);
          }
        });
        setReceived(receivedIds);
      }
    }).catch(() => {});

    // 3. Fetch Outgoing Sent Requests
    api.getSentRequests().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const sentIds: string[] = [];
        res.data.forEach((item: any) => {
          const recUser = item.receiver;
          if (recUser?.id) {
            connIdMap.current[recUser.id] = item.id;
            sentIds.push(recUser.id);
            setConn((prev) => ({ ...prev, [recUser.id]: "pending" }));
            const mappedPerson: Person = {
              id: recUser.id,
              name: recUser.name,
              role: (recUser.role?.toLowerCase() as Role) || "alumni",
              headline: recUser.alumniDetails?.designation
                ? `${recUser.alumniDetails.designation} @ ${recUser.alumniDetails.currentCompany || "Enterprise"}`
                : `${recUser.role === "ALUMNI" ? "Alumnus" : "Student"} · JECRC Foundation`,
              branch: recUser.alumniDetails?.branch || recUser.studentDetails?.branch || "CSE",
              batch: recUser.alumniDetails?.batch || (recUser.studentDetails?.expectedPassoutYear ? String(recUser.studentDetails.expectedPassoutYear) : "2024"),
              company: recUser.alumniDetails?.currentCompany,
              city: recUser.city || "Jaipur",
              about: recUser.bio || "JECRC Member",
              color: recUser.role === "ALUMNI" ? "#0F2A5E" : "#2563EB",
            };
            registerDynamicUser(mappedPerson);
          }
        });
        setSent(sentIds);
      }
    }).catch(() => {});
  }, []);

  // Sync state with Backend API
  useEffect(() => {
    // 0. Sync Current User from Token if previously logged in
    if (api.getToken()) {
      api.getMe().then((res) => {
        if (res.success && res.data) {
          const u = res.data;
          const uRole = (u.role?.toLowerCase() as Role) || "alumni";
          setRole(uRole);
          setMe({
            id: u.id,
            name: u.name,
            role: uRole,
            branch: u.alumniDetails?.branch || u.studentDetails?.branch || "CSE",
            batch: u.alumniDetails?.batch || "2020",
            company: u.alumniDetails?.currentCompany,
            city: u.city || "Jaipur",
            about: u.bio || "JECRC Alumni Network Member",
            color: uRole === "alumni" ? "#0F2A5E" : "#2563EB",
            headline: u.alumniDetails?.designation
              ? `${u.alumniDetails.designation} @ ${u.alumniDetails.currentCompany || "JECRC"}`
              : `${uRole === "alumni" ? "Alumnus" : "Student"} · JECRC Foundation`,
          });
          setPhase("app");
        }
      });
      syncConnections();
    }

    const pollTimer = setInterval(() => {
      if (api.getToken()) {
        syncConnections();
      }
    }, 5000);

    const onFocus = () => {
      if (api.getToken()) {
        syncConnections();
      }
    };
    window.addEventListener("focus", onFocus);

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

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncConnections]);

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
    async (userId: string) => {
      setConn((c) => ({ ...c, [userId]: "pending" }));
      setSent((s) => (s.includes(userId) ? s : [...s, userId]));
      toast("Connection request sent");
      try {
        const res = await api.requestConnection(userId);
        if (res.success && res.data?.id) {
          connIdMap.current[userId] = res.data.id;
        }
      } catch (err: any) {}
    },
    [toast]
  );

  const acceptConn = useCallback(
    async (userId: string) => {
      setConn((c) => ({ ...c, [userId]: "connected" }));
      setReceived((r) => r.filter((x) => x !== userId));
      unlockChat(userId);
      toast("Connected! Chat unlocked");
      const connectionId = connIdMap.current[userId] || userId;
      try {
        await api.acceptConnection(connectionId);
        syncConnections();
      } catch (err: any) {}
    },
    [toast, unlockChat, syncConnections]
  );

  const rejectConn = useCallback(
    async (userId: string) => {
      setConn((c) => ({ ...c, [userId]: "none" }));
      setReceived((r) => r.filter((x) => x !== userId));
      toast("Request declined");
      const connectionId = connIdMap.current[userId] || userId;
      try {
        await api.rejectConnection(connectionId);
        syncConnections();
      } catch (err: any) {}
    },
    [toast, syncConnections]
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
      // mark as delivered
      const t1 = window.setTimeout(() => {
        setChats((cs) =>
          cs.map((c) =>
            c.id === chatId
              ? { ...c, msgs: c.msgs.map((m) => (m.id === id ? { ...m, status: "delivered" } : m)) }
              : c
          )
        );
      }, 500);
      timers.current.push(t1);
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
      toast("Mentorship request sent to mentor");
      api.requestMentorship(pid).catch(() => {});
    },
    [toast]
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
    api.setToken(null);
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
    const batchYear = d.detail || (d.role === "alumni" ? "2020" : "2027");
    const headline =
      d.role === "alumni"
        ? (d.title && d.company ? `${d.title} @ ${d.company}` : `${d.branch || "CSE"} Batch ${batchYear} · JECRC Alumnus`)
        : `${d.branch || "CSE"} '${batchYear.length >= 2 ? batchYear.slice(-2) : "27"} · JECRC Student`;

    setMe({
      id: "me",
      name: d.name || "New Member",
      email: d.email,
      role: d.role,
      branch: d.branch || "CSE",
      batch: batchYear,
      city: d.city || "Jaipur",
      color: d.role === "alumni" ? "#0F2A5E" : "#2563EB",
      headline,
      company: d.company || (d.role === "alumni" ? "—" : undefined),
      about: d.about || "New to the JECRC Foundation network. Say hi!",
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

const dynamicUserMap = new Map<string, Person>();
export const registerDynamicUser = (p: Person) => {
  dynamicUserMap.set(p.id, p);
};

export const personById = (id: string): Person => {
  return dynamicUserMap.get(id) || people.find((p) => p.id === id) || people[0];
};

export const allGroups = seedGroups;
