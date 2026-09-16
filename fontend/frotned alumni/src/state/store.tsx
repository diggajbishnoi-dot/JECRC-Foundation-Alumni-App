import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Person, people, meAlumni, Job, JobApplicant, Thread, Notif, groups as seedGroups } from "../data/mock";
import { capitalizeName } from "../components/ui";
import { api } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import {
  generateE2EKeyPair,
  encryptClientMessage,
  decryptClientMessage,
} from "../utils/e2e-encryption";

export type Role = "student" | "alumni";
export type Phase = "splash" | "onboard" | "auth" | "app";
export type Tab = "home" | "directory" | "chat" | "alerts" | "profile" | "post";
export interface Route { name: string; id?: string }

export interface ChatMsg {
  id: string;
  fromMe: boolean;
  kind: "text" | "image" | "doc";
  text: string;
  meta?: { name?: string; size?: string; url?: string };
  time: string;
  status: "sent" | "delivered" | "read";
  uploading?: boolean;
}
export interface Chat {
  id: string;
  userId: string;
  online: boolean;
  lastSeen?: string;
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
  sendTyping?: (userId: string) => void;
  sendStopTyping?: (userId: string) => void;
  syncMessages: (userId: string) => Promise<void>;
  syncPresence: (userId: string) => Promise<void>;
  typing: Record<string, boolean>;
  unlockChat: (userId: string) => void;
  deleteMessage: (chatId: string, messageId: string, forEveryone?: boolean) => Promise<void>;
  // jobs
  allJobs: Job[];
  syncJobs: () => Promise<void>;
  addJob: (j: Job) => void;
  applyJob: (
    jobId: string,
    details?:
      | string
      | {
          fullName?: string;
          email?: string;
          phone?: string;
          college?: string;
          course?: string;
          branch?: string;
          graduationYear?: number;
          skills?: string[];
          experience?: string;
          coverLetter?: string;
          resumeData?: string;
          resumeFileName?: string;
          note?: string;
        }
  ) => Promise<void>;
  fetchApplicationsForJob: (jobId: string) => Promise<void>;
  appliedJobIds: Set<string>;
  // discussions
  allThreads: Thread[];
  upvoted: Set<string>;
  toggleUp: (threadId: string) => void;
  addThread: (t: Thread) => void;
  deleteThread: (threadId: string) => Promise<void>;
  addReply: (threadId: string, text: string) => void;
  deleteReply: (threadId: string, replyId: string) => Promise<void>;
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
  updateProfile: (data: {
    name?: string;
    headline?: string;
    branch?: string;
    batch?: string;
    company?: string;
    city?: string;
    about?: string;
  }) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const nowTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const formatRelativeTime = (dateStr?: string | Date): string => {
  if (!dateStr) return nowTime();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return nowTime();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch (_e) {
    return nowTime();
  }
};

const getReadMsgIds = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem("read_msg_ids") || "[]"));
  } catch (e) {
    return new Set();
  }
};

const saveReadMsgId = (msgId: string) => {
  try {
    const s = getReadMsgIds();
    s.add(msgId);
    localStorage.setItem("read_msg_ids", JSON.stringify(Array.from(s)));
  } catch (e) {}
};

const getReadNotifIds = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem("read_notif_ids") || "[]"));
  } catch (e) {
    return new Set();
  }
};

const saveReadNotifId = (notifId: string) => {
  try {
    const s = getReadNotifIds();
    s.add(notifId);
    localStorage.setItem("read_notif_ids", JSON.stringify(Array.from(s)));
  } catch (e) {}
};

const getDeletedMsgIds = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem("deleted_msg_ids_for_me") || "[]"));
  } catch (e) {
    return new Set();
  }
};

const saveDeletedMsgId = (msgId: string) => {
  try {
    const s = getDeletedMsgIds();
    s.add(msgId);
    localStorage.setItem("deleted_msg_ids_for_me", JSON.stringify(Array.from(s)));
  } catch (e) {}
};

const getMyCurrentId = (meObj?: Person): string => {
  const tokenUserId = api.getUserIdFromToken();
  if (tokenUserId) return tokenUserId;
  if (meObj?.id && meObj.id !== "me") return meObj.id;
  try {
    const raw = localStorage.getItem("user_me_profile_latest");
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.id && p.id !== "me") return p.id;
    }
  } catch (e) {}
  return meObj?.id || "me";
};

const getSavedJobs = (): Job[] => {
  try {
    const raw = localStorage.getItem("jecrc_all_jobs_feed");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
};

const getSavedMeProfile = (): Person => {
  try {
    const raw = localStorage.getItem("user_me_profile_latest");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return {
          ...parsed,
          name: capitalizeName(parsed.name),
        };
      }
    }
  } catch (e) {}
  return {
    ...meAlumni,
    name: capitalizeName(meAlumni.name),
  };
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("splash");
  const [role, setRole] = useState<Role>("alumni");
  const [me, setMeState] = useState<Person>(getSavedMeProfile);

  const setMe = useCallback((val: Person | ((prev: Person) => Person)) => {
    setMeState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      const formatted = {
        ...next,
        name: capitalizeName(next.name),
      };
      registerDynamicUser(formatted);
      try {
        if (formatted.id && formatted.id !== "me") {
          localStorage.setItem(`user_me_profile_${formatted.id}`, JSON.stringify(formatted));
          if (formatted.email) {
            localStorage.setItem(`user_me_profile_by_email_${formatted.email.toLowerCase()}`, JSON.stringify(formatted));
          }
        }
        localStorage.setItem("user_me_profile_latest", JSON.stringify(formatted));
      } catch (e) {}
      return formatted;
    });
  }, []);
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<Route[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [conn, setConn] = useState<Record<string, "none" | "pending" | "connected">>({});
  const [received, setReceived] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [activeChat, setActiveChatState] = useState<string | null>(null);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [allJobs, setAllJobs] = useState<Job[]>(getSavedJobs);
  const meRef = useRef<Person>(me);
  meRef.current = me;
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
  const chatsRef = useRef<Chat[]>([]);
  chatsRef.current = chats;
  const knownMsgIds = useRef<Set<string>>(new Set());

  const activeChatRef = useRef<string | null>(null);
  activeChatRef.current = activeChat;

  const stackRef = useRef<Route[]>([]);
  stackRef.current = stack;

  const tabRef = useRef<Tab>("home");
  tabRef.current = tab;

  const historyDepthRef = useRef<number>(0);

  // Handle hardware / mobile back button via popstate
  useEffect(() => {
    const onPopState = () => {
      if (historyDepthRef.current > 0) {
        historyDepthRef.current -= 1;
      }
      if (stackRef.current.length > 0) {
        setStack((s) => s.slice(0, -1));
      } else if (tabRef.current !== "home") {
        setTab("home");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (phase === "app") {
      try {
        window.history.replaceState({ appNav: true, type: "root", tab: "home" }, "");
      } catch (e) {}
    }
  }, [phase]);

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
        const peerList: any[] = [];
        res.data.items.forEach((item: any) => {
          const peer = item.peer;
          if (peer?.id) {
            connIdMap.current[peer.id] = item.connectionId;
            setConn((prev) => ({ ...prev, [peer.id]: "connected" }));
            const mappedPerson: Person = {
              id: peer.id,
              name: peer.name,
              email: peer.email,
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
            peerList.push(peer);
          }
        });

        // Initialize active chats for all accepted connections (defaults to offline until presence check)
        setChats((prev) => {
          const nextChats = [...prev];
          peerList.forEach((peer) => {
            const found = nextChats.find((c) => c.userId === peer.id || c.id === `c_${peer.id}`);
            if (!found) {
              nextChats.push({
                id: `c_${peer.id}`,
                userId: peer.id,
                online: false,
                lastSeen: "Offline",
                unread: 0,
                locked: false,
                msgs: [],
              });
            } else {
              found.locked = false;
            }
          });
          return nextChats;
        });
      }
    }).catch(() => {});

    // 2. Fetch Incoming Pending Requests
    api.getPendingRequests().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const receivedIds: string[] = [];
        const pendingNotifs: Notif[] = [];
        res.data.forEach((item: any) => {
          const reqUser = item.requester;
          if (reqUser?.id) {
            connIdMap.current[reqUser.id] = item.id;
            receivedIds.push(reqUser.id);
            setConn((prev) => ({ ...prev, [reqUser.id]: "received" }));
            const mappedPerson: Person = {
              id: reqUser.id,
              name: reqUser.name,
              email: reqUser.email,
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

            const isRead = item.isRead || getReadNotifIds().has(`req_${item.id}`);
            pendingNotifs.push({
              id: `req_${item.id}`,
              group: "Today",
              title: "Connection Request",
              body: `${reqUser.name} (${mappedPerson.branch} '${mappedPerson.batch ? mappedPerson.batch.slice(-2) : "25"}) sent you a connection request.`,
              icon: "connect",
              read: isRead,
              ago: "Pending",
              userId: reqUser.id,
              connectionId: item.id,
              type: "connection_request",
            });
          }
        });
        setReceived(receivedIds);

        if (pendingNotifs.length > 0) {
          setNotifList((prev) => {
            const existingMap = new Map(prev.map((n) => [n.id, n]));
            pendingNotifs.forEach((pn) => {
              const existing = existingMap.get(pn.id);
              if (existing) {
                existingMap.set(pn.id, { ...pn, read: existing.read || pn.read });
              } else {
                existingMap.set(pn.id, pn);
              }
            });
            return Array.from(existingMap.values());
          });
        }
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
              email: recUser.email,
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

    // 4. Fetch Backend In-App Notifications
    api.getNotifications().then((res) => {
      if (res.success && res.data?.items && Array.isArray(res.data.items)) {
        const dynamicNotifs: Notif[] = [];
        res.data.items.forEach((item: any) => {
          if (item.type === "CONNECTION_ACCEPTED") {
            const accepterId = item.payload?.acceptedByUserId;
            const p = accepterId ? personById(accepterId) : null;
            const isRead = item.isRead || getReadNotifIds().has(`notif_${item.id}`);
            dynamicNotifs.push({
              id: `notif_${item.id}`,
              group: "Today",
              title: "Connection Accepted! 🎉",
              body: `${p?.name || "A fellow member"} accepted your connection request. Say hi in chat!`,
              icon: "connect",
              read: isRead,
              ago: "Recently",
              userId: accepterId,
              connectionId: item.payload?.connectionId,
              type: "connection_accepted",
            });
          }
        });

        if (dynamicNotifs.length > 0) {
          setNotifList((prev) => {
            const existingMap = new Map(prev.map((n) => [n.id, n]));
            dynamicNotifs.forEach((dn) => {
              if (!existingMap.has(dn.id)) {
                existingMap.set(dn.id, dn);
              }
            });
            return Array.from(existingMap.values());
          });
        }
      }
    }).catch(() => {});
  }, []);

  const syncJobs = useCallback(async () => {
    try {
      const res = await api.getPosts();
      if (res.success && Array.isArray(res.data?.items)) {
        const currentUserId = meRef.current?.id;
        const backendJobs: Job[] = res.data.items.map((item: any) => ({
          id: item.id,
          posterId: item.user?.id || item.userId,
          title: item.title,
          company: item.company || "Enterprise Partner",
          location: item.location || "Bengaluru / Hybrid",
          type: item.type === "INTERNSHIP" ? "Internship" : "Full-time",
          mode: "Hybrid",
          pay: item.pay || "Undisclosed",
          skills: ["Cloud", "System Architecture", "Engineering"],
          postedBy: item.user?.name || "Alumni Member",
          postedAgo: "Recently",
          deadline: item.deadline ? new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Rolling",
          applicants: item.applicantCount ?? 0,
          branch: item.user?.alumniDetails?.branch || item.user?.studentDetails?.branch || "CSE",
          desc: item.description,
          mine: (item.user?.id || item.userId) === currentUserId,
        }));
        setAllJobs((existing) => {
          const merged = [...backendJobs];
          existing.forEach((ej) => {
            if (!merged.some((bj) => bj.id === ej.id || (bj.title === ej.title && bj.company === ej.company))) {
              merged.push(ej);
            }
          });
          try {
            localStorage.setItem("jecrc_all_jobs_feed", JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (e) {}
  }, []);

  // Sync state with Backend API
  useEffect(() => {
    // 0. Auto-create client E2E keypair if none exists
    const existingPub = sessionStorage.getItem("e2e_public_key_hex");
    if (!existingPub) {
      generateE2EKeyPair().then((keys) => {
        sessionStorage.setItem("e2e_private_key_jwk", JSON.stringify(keys.privateKeyJwk));
        sessionStorage.setItem("e2e_public_key_hex", keys.publicKeyRawHex);
        if (api.getToken()) {
          api.updateProfile({ publicKey: keys.publicKeyRawHex }).catch(() => {});
        }
      }).catch(() => {});
    }

    // 0. Sync Current User from Token if previously logged in
    if (api.getToken()) {
      api.getMe().then((res) => {
        if (res.success && res.data) {
          const u = res.data;
          const uRole = (u.role?.toLowerCase() as Role) || "alumni";
          const uBranch = u.alumniDetails?.branch || u.studentDetails?.branch || "CSE";
          const uBatch = u.alumniDetails?.batch || (u.studentDetails?.expectedPassoutYear ? String(u.studentDetails.expectedPassoutYear) : (uRole === "alumni" ? "2020" : "2027"));

          let savedLocal: Partial<Person> = {};
          try {
            const rawCache = localStorage.getItem(`user_me_profile_${u.id}`) || localStorage.getItem("user_me_profile_latest");
            if (rawCache) savedLocal = JSON.parse(rawCache);
          } catch (e) {}

          const backendHeadline = u.alumniDetails?.designation
            ? `${u.alumniDetails.designation}${u.alumniDetails.currentCompany ? ` @ ${u.alumniDetails.currentCompany}` : ""}`
            : (uRole === "alumni" ? `Alumni · Batch ${uBatch}` : `Student · Class of ${uBatch}`);

          setRole(uRole);
          const mappedMe: Person = {
            id: u.id,
            name: capitalizeName(savedLocal.name || u.name),
            role: uRole,
            branch: savedLocal.branch || uBranch,
            batch: savedLocal.batch || uBatch,
            company: savedLocal.company !== undefined ? savedLocal.company : (u.alumniDetails?.currentCompany || ""),
            city: savedLocal.city || u.city || "Jaipur",
            about: savedLocal.about || u.bio || "JECRC Alumni Network Member",
            color: uRole === "alumni" ? "#0F2A5E" : "#2563EB",
            headline: savedLocal.headline || backendHeadline,
          };
          setMe(mappedMe);
          registerDynamicUser(mappedMe);
          setPhase("app");
        }
      });
      syncConnections();
      syncJobs();
    }

      // Connect Socket.IO for real-time WebSocket messaging
      const token = api.getToken();
      if (token) {
        const socket = connectSocket(token);
        if (socket) {
          socket.on("connect", () => {
            syncConnections();
            syncJobs();
            chatsRef.current.forEach((c) => {
              if (c.userId) {
                syncMessages(c.userId);
                syncPresence(c.userId);
              }
            });
          });

          socket.on("newMessage", async (m: any) => {
            if (!m || !m.id) return;
            const deletedMsgSet = getDeletedMsgIds();
            if (deletedMsgSet.has(m.id)) return;
            if (knownMsgIds.current.has(m.id)) return;
            knownMsgIds.current.add(m.id);

            const myId = getMyCurrentId(meRef.current);
            const isFromMe = m.senderId === myId || (myId !== "me" && m.senderId === myId) || m.senderId === meRef.current?.id || m.senderId === "me";
            const partnerId = isFromMe ? m.receiverId : m.senderId;
            let content = m.encryptedContent || "";

            const partnerPerson = personById(partnerId);
            const partnerPublicKeyHex = (partnerPerson as any)?.publicKey;
            const myPrivateKeyJwkRaw = sessionStorage.getItem("e2e_private_key_jwk");

            if (myPrivateKeyJwkRaw && partnerPublicKeyHex && m.nonce && m.encryptedContent) {
              try {
                const myPrivateKeyJwk = JSON.parse(myPrivateKeyJwkRaw);
                content = await decryptClientMessage(m.encryptedContent, m.nonce, myPrivateKeyJwk, partnerPublicKeyHex);
              } catch (e) {}
            }

            let kind: "text" | "image" | "doc" = "text";
            let meta: { name?: string; size?: string; url?: string } | undefined = undefined;

            if (
              content.startsWith("data:image/") ||
              ((content.startsWith("http://") || content.startsWith("https://")) &&
                (content.includes(".png") ||
                  content.includes(".jpg") ||
                  content.includes(".jpeg") ||
                  content.includes(".webp") ||
                  content.includes("/chat/")))
            ) {
              kind = "image";
              meta = { name: "Photo", url: content };
            } else if (content.startsWith("[Photo:")) {
              kind = "image";
              const match = content.match(/\[Photo:\s*(.*?)\]/);
              const photoVal = match ? match[1] : "";
              if (photoVal.startsWith("http://") || photoVal.startsWith("https://") || photoVal.startsWith("data:image/")) {
                meta = { name: "Photo", url: photoVal };
              } else {
                meta = { name: photoVal || "Photo" };
              }
            } else if (content.startsWith("[Document:")) {
              kind = "doc";
              const match = content.match(/\[Document:\s*(.*?)\]/);
              meta = { name: match ? match[1] : "Document" };
            }

            const newMsg: ChatMsg = {
              id: m.id,
              fromMe: isFromMe,
              text: kind === "text" ? content : "",
              time: formatRelativeTime(m.createdAt),
              status: m.status?.toLowerCase() === "read" ? "read" : m.status?.toLowerCase() === "delivered" ? "delivered" : "sent",
              kind,
              meta,
            };

            const isCurrentlyInThisChat = activeChatRef.current === partnerId || activeChatRef.current === `c_${partnerId}`;

            if (!isFromMe) {
              socket.emit("messageDelivered", { messageId: m.id });
              if (isCurrentlyInThisChat) {
                socket.emit("messageRead", { messageId: m.id });
              } else {
                const latestIncomingText = kind === "image" ? "📷 Sent a photo" : kind === "doc" ? `📄 ${meta?.name || "Document"}` : content;
                toast(`💬 ${partnerPerson.name}: ${latestIncomingText}`);
              }
            }

            setChats((prev) => {
              const exists = prev.find((c) => c.userId === partnerId || c.id === `c_${partnerId}`);
              if (exists) {
                const msgsExist = exists.msgs.some((msg) => msg.id === m.id);
                const updatedMsgs = msgsExist ? exists.msgs : [...exists.msgs, newMsg];
                const updatedUnread = isCurrentlyInThisChat ? 0 : (exists.unread || 0) + (isFromMe ? 0 : 1);
                return prev.map((c) =>
                  c.userId === partnerId || c.id === `c_${partnerId}`
                    ? { ...c, locked: false, msgs: updatedMsgs, unread: updatedUnread }
                    : c
                );
              } else {
                return [
                  ...prev,
                  {
                    id: `c_${partnerId}`,
                    userId: partnerId,
                    online: false,
                    lastSeen: "Offline",
                    unread: isCurrentlyInThisChat ? 0 : (isFromMe ? 0 : 1),
                    locked: false,
                    msgs: [newMsg],
                  },
                ];
              }
            });
          });

          socket.on("messageDeleted", (data: { messageId: string; chatId?: string; forEveryone?: boolean }) => {
            if (!data?.messageId) return;
            saveDeletedMsgId(data.messageId);
            setChats((prev) =>
              prev.map((c) => ({
                ...c,
                msgs: c.msgs.filter((m) => m.id !== data.messageId),
              }))
            );
          });

          socket.on("messageStatusUpdate", (data: { messageId: string; status: string }) => {
            if (!data?.messageId) return;
            const newStatus = data.status?.toLowerCase() === "read" ? "read" : data.status?.toLowerCase() === "delivered" ? "delivered" : "sent";
            setChats((prev) =>
              prev.map((c) => ({
                ...c,
                msgs: c.msgs.map((m) => (m.id === data.messageId ? { ...m, status: newStatus } : m)),
              }))
            );
          });

          socket.on("userTyping", (data: { senderId: string }) => {
            if (!data?.senderId) return;
            setTyping((prev) => ({ ...prev, [`c_${data.senderId}`]: true, [data.senderId]: true }));
          });

          socket.on("userStoppedTyping", (data: { senderId: string }) => {
            if (!data?.senderId) return;
            setTyping((prev) => ({ ...prev, [`c_${data.senderId}`]: false, [data.senderId]: false }));
          });

          socket.on("connectionRequest", () => {
            syncConnections();
            toast("📩 New connection request received!");
          });

          socket.on("connectionAccepted", () => {
            syncConnections();
            toast("🎉 Connection request accepted!");
          });

          socket.on("notification", () => {
            syncConnections();
            syncJobs();
          });
        }
      }

    const onFocus = () => {
      if (api.getToken()) {
        syncConnections();
        syncJobs();
        chatsRef.current.forEach((c) => {
          if (c.userId) {
            syncMessages(c.userId);
            syncPresence(c.userId);
          }
        });
      }
    };
    window.addEventListener("focus", onFocus);

    // 1. Sync Jobs / Posts
    syncJobs();

    // 2. Sync Discussions
    api.getDiscussions().then((res) => {
      if (res.success && Array.isArray(res.data?.items)) {
        const currentUserId = me.id;
        const backendThreads: Thread[] = res.data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category || "Career Guidance",
          author: item.user?.name || "Alumni Mentor",
          authorId: item.userId || item.user?.id,
          authorRole: item.user?.role?.toLowerCase() === "student" ? "student" : "alumni",
          upvotes: item.totalUpvotes || item.upvotesCount || 1,
          ago: "Recently",
          body: item.description,
          mine: (item.userId && item.userId === currentUserId) || item.user?.id === currentUserId,
          replies: (item.replies || []).map((r: any) => ({
            id: r.id,
            author: r.user?.name || "JECRC Member",
            authorId: r.userId || r.user?.id,
            text: r.content,
            ago: "Recently",
            upvotes: r.totalUpvotes || 0,
            mine: (r.userId && r.userId === currentUserId) || r.user?.id === currentUserId,
          })),
        }));
        if (backendThreads.length > 0) {
          setAllThreads((existing) => [...backendThreads, ...existing.filter((t) => !backendThreads.some((bt) => bt.id === t.id))]);
        }
      }
    });

    const heartbeat = () => {
      if (api.getToken()) {
        api.heartbeat().catch(() => {});
      }
    };
    heartbeat();
    const heartbeatTimer = setInterval(heartbeat, 30000);
    const syncTimer = setInterval(() => {
      if (api.getToken()) {
        syncConnections();
      }
    }, 10000);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(syncTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncConnections]);

  const goTab = useCallback((t: Tab) => {
    if (t !== tabRef.current) {
      if (t !== "home" && tabRef.current === "home" && stackRef.current.length === 0) {
        try {
          window.history.pushState({ appNav: true, type: "tab", tab: t }, "");
          historyDepthRef.current += 1;
        } catch (e) {}
      }
      setStack([]);
      setTab(t);
    } else {
      setStack([]);
    }
  }, []);

  const push = useCallback((r: Route) => {
    try {
      window.history.pushState({ appNav: true, type: "stack", name: r.name, id: r.id }, "");
      historyDepthRef.current += 1;
    } catch (e) {}
    setStack((s) => [...s, r]);
  }, []);

  const pop = useCallback(() => {
    if (historyDepthRef.current > 0) {
      historyDepthRef.current -= 1;
      window.history.back();
    } else {
      setStack((s) => s.slice(0, -1));
    }
  }, []);

  const clearStack = useCallback(() => {
    if (historyDepthRef.current > 0 && stackRef.current.length > 0) {
      historyDepthRef.current = Math.max(0, historyDepthRef.current - stackRef.current.length);
    }
    setStack([]);
  }, []);

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
      setNotifList((ns) =>
        ns.map((n) =>
          n.userId === userId
            ? {
                ...n,
                read: true,
                type: "connection_accepted",
                title: "Connected",
                body: `You are now connected with ${personById(userId).name}. Chat is unlocked.`,
              }
            : n
        )
      );
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
      setNotifList((ns) => ns.filter((n) => n.userId !== userId));
      toast("Request declined");
      const connectionId = connIdMap.current[userId] || userId;
      try {
        await api.rejectConnection(connectionId);
        syncConnections();
      } catch (err: any) {}
    },
    [toast, syncConnections]
  );

  const setActiveChat = useCallback((id: string | null) => {
    setActiveChatState(id);
    activeChatRef.current = id;
    if (id) {
      setChats((cs) =>
        cs.map((c) => {
          if (c.id === id || c.userId === id || `c_${c.userId}` === id) {
            c.msgs.forEach((m) => {
              if (m.id) saveReadMsgId(m.id);
            });
            if (c.userId) {
              api.markMessagesRead(c.userId).catch(() => {});
            }
            return {
              ...c,
              unread: 0,
              msgs: c.msgs.map((m) => ({ ...m, status: "read" as const })),
            };
          }
          return c;
        })
      );
    }
  }, []);

  const syncMessages = useCallback(
    async (userId: string) => {
      if (!api.getToken() || !userId) return;
      try {
        const res = await api.getMessages(userId);
        if (res.success && res.data?.items) {
          const myId = getMyCurrentId(meRef.current);
          const myPrivateKeyJwkRaw = sessionStorage.getItem("e2e_private_key_jwk");
          const readMsgSet = getReadMsgIds();
          const deletedMsgSet = getDeletedMsgIds();
          const chatId = `c_${userId}`;
          const isCurrentlyInThisChat = activeChatRef.current === chatId || activeChatRef.current === userId;

          const nonDeletedItems = res.data.items.filter((m: any) => !deletedMsgSet.has(m.id));

          const formattedMsgs: ChatMsg[] = await Promise.all(
            nonDeletedItems.map(async (m: any) => {
              const d = new Date(m.createdAt);
              const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
              const isFromMe = m.senderId === myId || (myId !== "me" && m.senderId === myId) || m.senderId === meRef.current?.id || m.senderId === "me";
              let content = m.encryptedContent || "";

              const partnerId = isFromMe ? m.receiverId : m.senderId;
              const partnerPerson = personById(partnerId);
              let partnerPublicKeyHex = (partnerPerson as any)?.publicKey;
              if (!partnerPublicKeyHex) {
                try {
                  const keyRes = await api.getPublicKey(partnerId);
                  if (keyRes.success && keyRes.data?.publicKey) {
                    partnerPublicKeyHex = keyRes.data.publicKey;
                    (partnerPerson as any).publicKey = partnerPublicKeyHex;
                  }
                } catch (e) {}
              }

              if (myPrivateKeyJwkRaw && partnerPublicKeyHex && m.nonce && m.encryptedContent) {
                try {
                  const myPrivateKeyJwk = JSON.parse(myPrivateKeyJwkRaw);
                  content = await decryptClientMessage(m.encryptedContent, m.nonce, myPrivateKeyJwk, partnerPublicKeyHex);
                } catch (e) {
                  // Fallback for unencrypted legacy content
                }
              }

              let kind: "text" | "image" | "doc" = "text";
              let meta: { name?: string; size?: string; url?: string } | undefined = undefined;

              if (
                content.startsWith("data:image/") ||
                ((content.startsWith("http://") || content.startsWith("https://")) &&
                  (content.includes(".png") ||
                    content.includes(".jpg") ||
                    content.includes(".jpeg") ||
                    content.includes(".webp") ||
                    content.includes("/chat/")))
              ) {
                kind = "image";
                meta = { name: "Photo", url: content };
              } else if (content.startsWith("[Photo:")) {
                kind = "image";
                const match = content.match(/\[Photo:\s*(.*?)\]/);
                const photoVal = match ? match[1] : "";
                if (photoVal.startsWith("http://") || photoVal.startsWith("https://") || photoVal.startsWith("data:image/")) {
                  meta = { name: "Photo", url: photoVal };
                } else {
                  meta = { name: photoVal || "Photo" };
                }
              } else if (content.startsWith("[Document:")) {
                kind = "doc";
                const match = content.match(/\[Document:\s*(.*?)\]/);
                meta = { name: match ? match[1] : "Document.pdf", size: "Document" };
              }

              const isRead = m.status?.toLowerCase() === "read" || readMsgSet.has(m.id) || isCurrentlyInThisChat;
              if (isRead) {
                saveReadMsgId(m.id);
              }

              return {
                id: m.id,
                fromMe: isFromMe,
                kind,
                text: kind === "text" ? content : "",
                meta,
                time,
                status: isRead ? ("read" as const) : m.status?.toLowerCase() === "delivered" ? ("delivered" as const) : ("sent" as const),
              };
            })
          );

          // Detect unread messages count without triggering toasts on sync
          let newUnreadCount = 0;

          formattedMsgs.forEach((m) => {
            if (!m.fromMe && m.status !== "read" && !readMsgSet.has(m.id) && !isCurrentlyInThisChat) {
              newUnreadCount += 1;
            }
            knownMsgIds.current.add(m.id);
          });

          setChats((prev) => {
            const exists = prev.find((c) => c.userId === userId || c.id === chatId);
            if (exists) {
              const updatedUnread = isCurrentlyInThisChat ? 0 : newUnreadCount;
              return prev.map((c) =>
                c.userId === userId || c.id === chatId
                  ? { ...c, locked: false, msgs: formattedMsgs, unread: updatedUnread }
                  : c
              );
            } else {
              return [
                ...prev,
                {
                  id: chatId,
                  userId,
                  online: false,
                  lastSeen: "Offline",
                  unread: isCurrentlyInThisChat ? 0 : newUnreadCount,
                  locked: false,
                  msgs: formattedMsgs,
                },
              ];
            }
          });
        }
      } catch (err) {}
    },
    []
  );

  const syncPresence = useCallback(async (userId: string) => {
    if (!api.getToken() || !userId) return;
    try {
      const res = await api.getPresence(userId);
      if (res.success && res.data) {
        const isOnline = res.data.online ?? (res.data.status === "online");
        const lastSeen = res.data.lastSeen || (isOnline ? "Online" : "Offline");
        setChats((prev) =>
          prev.map((c) =>
            c.userId === userId || c.id === `c_${userId}`
              ? { ...c, online: isOnline, lastSeen }
              : c
          )
        );
      }
    } catch (e) {}
  }, []);

  const sendTyping = useCallback((receiverId: string) => {
    const s = getSocket();
    if (s && s.connected) {
      s.emit("typing", { receiverId });
    }
  }, []);

  const sendStopTyping = useCallback((receiverId: string) => {
    const s = getSocket();
    if (s && s.connected) {
      s.emit("stopTyping", { receiverId });
    }
  }, []);

  const sendChat = useCallback(
    async (chatId: string, msg: Omit<ChatMsg, "id" | "time" | "status">) => {
      const chat = chats.find((c) => c.id === chatId || c.userId === chatId);
      if (!chat) return;
      const tempId = `m_${Date.now()}`;
      const timeStr = nowTime();

      setChats((cs) =>
        cs.map((c) =>
          c.id === chat.id
            ? { ...c, msgs: [...c.msgs, { ...msg, id: tempId, time: timeStr, status: "sent", fromMe: true }] }
            : c
        )
      );

      try {
        let content = msg.text;
        if (msg.kind === "image") {
          content = msg.meta?.url || (msg.meta?.name ? `[Photo: ${msg.meta.name}]` : "[Photo]");
        } else if (msg.kind === "doc") {
          content = `[Document: ${msg.meta?.name || "Document"}]`;
        }

        let encryptedContent = content;
        let nonce: string | undefined = undefined;

        const myPrivateKeyJwkRaw = sessionStorage.getItem("e2e_private_key_jwk");
        const peerPerson = personById(chat.userId);
        let recipientPublicKeyHex = (peerPerson as any)?.publicKey;
        if (!recipientPublicKeyHex) {
          try {
            const keyRes = await api.getPublicKey(chat.userId);
            if (keyRes.success && keyRes.data?.publicKey) {
              recipientPublicKeyHex = keyRes.data.publicKey;
              (peerPerson as any).publicKey = recipientPublicKeyHex;
            }
          } catch (e) {}
        }

        if (myPrivateKeyJwkRaw && recipientPublicKeyHex) {
          try {
            const myPrivateKeyJwk = JSON.parse(myPrivateKeyJwkRaw);
            const encResult = await encryptClientMessage(content, myPrivateKeyJwk, recipientPublicKeyHex);
            encryptedContent = encResult.encryptedContent;
            nonce = encResult.nonce;
          } catch (_e) {
          }
        }

        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit(
            "sendMessage",
            {
              receiverId: chat.userId,
              encryptedContent,
              nonce,
              senderPublicKey: recipientPublicKeyHex,
            },
            (res: any) => {
              if (res && res.success && res.message?.id) {
                setChats((cs) =>
                  cs.map((c) =>
                    c.id === chat.id
                      ? {
                          ...c,
                          msgs: c.msgs.map((m) => (m.id === tempId ? { ...m, id: res.message.id, status: "delivered", fromMe: true } : m)),
                        }
                      : c
                  )
                );
              }
            }
          );
          sendStopTyping?.(chat.userId);
        } else {
          const res = await api.sendMessage(chat.userId, encryptedContent, nonce);
          if (res.success && res.data?.id) {
            setChats((cs) =>
              cs.map((c) =>
                c.id === chat.id
                  ? {
                      ...c,
                      msgs: c.msgs.map((m) => (m.id === tempId ? { ...m, id: res.data.id, status: "delivered", fromMe: true } : m)),
                    }
                  : c
              )
            );
          }
        }
      } catch (_e) {
      }
    },
    [chats, sendStopTyping]
  );

  const deleteMessage = useCallback(
    async (chatId: string, messageId: string, forEveryone = false) => {
      // 1. Immediately delete locally for snappy experience
      saveDeletedMsgId(messageId);
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId || c.userId === chatId || c.id === `c_${chatId}`
            ? {
                ...c,
                msgs: c.msgs.filter((m) => m.id !== messageId),
              }
            : c
        )
      );

      // 2. Sync with backend & websocket
      const chat = chatsRef.current.find((c) => c.id === chatId || c.userId === chatId || c.id === `c_${chatId}`);
      const partnerId = chat?.userId || chatId.replace(/^c_/, "");
      const socket = getSocket();

      if (socket && socket.connected) {
        socket.emit("deleteMessage", { messageId, partnerId, forEveryone });
      } else {
        api.deleteMessage(messageId, forEveryone).catch(() => {});
      }

      toast(forEveryone ? "Message deleted for everyone" : "Message deleted for you");
    },
    [toast]
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

  const addThread = useCallback(
    (t: Thread) => {
      const threadWithMine: Thread = { ...t, mine: true, authorId: me.id };
      setAllThreads((ts) => [threadWithMine, ...ts]);
      api
        .createDiscussion({
          title: t.title,
          description: t.body,
          category: t.category,
        })
        .then((res) => {
          if (res.success && res.data?.id) {
            setAllThreads((ts) =>
              ts.map((item) =>
                item.id === t.id ? { ...item, id: res.data.id, authorId: me.id, mine: true } : item
              )
            );
            toast("Discussion published to backend network!");
          }
        });
    },
    [me.id, toast]
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      setAllThreads((ts) => ts.filter((t) => t.id !== threadId));
      toast("Discussion post deleted");
      try {
        await api.deleteDiscussion(threadId);
      } catch (_err) {
        // Backend sync failure is non-fatal; optimistic delete already applied
      }
    },
    [toast]
  );

  const addReply = useCallback(
    (threadId: string, text: string) => {
      const tempReplyId = `r_${Date.now()}`;
      setAllThreads((ts) =>
        ts.map((t) =>
          t.id === threadId
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  { id: tempReplyId, author: me.name || "You", authorId: me.id, text, ago: "now", upvotes: 0, mine: true },
                ],
              }
            : t
        )
      );
      api.replyDiscussion(threadId, text).then((res) => {
        if (res.success && res.data?.id) {
          setAllThreads((ts) =>
            ts.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    replies: t.replies.map((r) => (r.id === tempReplyId ? { ...r, id: res.data.id } : r)),
                  }
                : t
            )
          );
        }
      }).catch(() => {});
    },
    [me.id, me.name]
  );

  const deleteReply = useCallback(
    async (threadId: string, replyId: string) => {
      setAllThreads((ts) =>
        ts.map((t) =>
          t.id === threadId
            ? { ...t, replies: t.replies.filter((r) => r.id !== replyId) }
            : t
        )
      );
      toast("Reply deleted");
      try {
        await api.deleteReply(threadId, replyId);
      } catch (err: any) {}
    },
    [toast]
  );

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

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const addJob = useCallback((j: Job) => {
    setAllJobs((js) => {
      const updated = [j, ...js.filter((x) => x.id !== j.id)];
      try {
        localStorage.setItem("jecrc_all_jobs_feed", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    api.createPost({
      title: j.title,
      description: j.desc,
      type: j.type === "Internship" ? "INTERNSHIP" : "JOB",
      company: j.company,
      location: j.location,
      pay: j.pay,
      deadline: j.deadline && !isNaN(new Date(j.deadline).getTime()) ? j.deadline : undefined,
    }).then((res) => {
      if (res.success && res.data?.id) {
        const backendId = res.data.id;
        setAllJobs((js) => {
          const updated = js.map((item) => (item.id === j.id ? { ...item, id: backendId, posterId: meRef.current?.id || item.posterId, mine: true } : item));
          try {
            localStorage.setItem("jecrc_all_jobs_feed", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        toast("Job synced with backend!");
      }
    }).catch(() => {});
  }, [toast]);

  const applyJob = useCallback(
    async (
      jobId: string,
      details?:
        | string
        | {
            fullName?: string;
            email?: string;
            phone?: string;
            college?: string;
            course?: string;
            branch?: string;
            graduationYear?: number;
            skills?: string[];
            experience?: string;
            coverLetter?: string;
            resumeData?: string;
            resumeFileName?: string;
            note?: string;
          }
    ) => {
      setAppliedJobIds((s) => new Set(s).add(jobId));

      const dObj = typeof details === "object" ? details : { note: details };
      const fullName = dObj?.fullName || me.name || "JECRC Student";
      const email = dObj?.email || me.email || "";
      const branch = dObj?.branch || me.branch || "CSE";
      const batch = me.batch || "2027";
      const gradYear = dObj?.graduationYear || parseInt(batch) || 2027;

      const applicant: JobApplicant = {
        id: `app_${Date.now()}`,
        studentId: me.id,
        name: fullName,
        email,
        phone: dObj?.phone,
        college: dObj?.college || "JECRC Foundation",
        course: dObj?.course || "B.Tech",
        branch,
        batch,
        graduationYear: gradYear,
        skills: dObj?.skills || [],
        experience: dObj?.experience,
        coverLetter: dObj?.coverLetter || dObj?.note,
        resumeUrl: dObj?.resumeData,
        resumeOriginalName: dObj?.resumeFileName || (dObj?.resumeData ? "resume.pdf" : undefined),
        appliedAt: "Just now",
        note: dObj?.note || dObj?.coverLetter,
      };

      setAllJobs((jobs) =>
        jobs.map((j) => {
          if (j.id === jobId) {
            const currentList = j.applicantList || [];
            return {
              ...j,
              applicants: (j.applicants || 0) + 1,
              applicantList: [applicant, ...currentList.filter((a) => a.studentId !== me.id)],
            };
          }
          return j;
        })
      );

      toast("Application submitted! Details sent to the alumni.");

      try {
        const res = await api.applyJob(jobId, {
          fullName,
          email,
          phone: dObj?.phone,
          college: dObj?.college || "JECRC Foundation",
          course: dObj?.course || "B.Tech",
          branch,
          graduationYear: gradYear,
          skills: dObj?.skills,
          experience: dObj?.experience,
          coverLetter: dObj?.coverLetter || dObj?.note,
          resumeData: dObj?.resumeData,
          resumeFileName: dObj?.resumeFileName,
        });

        if (res.success && res.data?.application) {
          const apiApp = res.data.application;
          setAllJobs((jobs) =>
            jobs.map((j) => {
              if (j.id === jobId) {
                const currentList = j.applicantList || [];
                const updatedList = currentList.map((a) =>
                  a.studentId === me.id ? { ...a, id: apiApp.id, resumeUrl: apiApp.resumeUrl || a.resumeUrl } : a
                );
                return { ...j, applicantList: updatedList };
              }
              return j;
            })
          );
        } else if (res.error) {
          toast(res.error);
        }
      } catch (_e) {}
    },
    [me, toast]
  );

  const fetchApplicationsForJob = useCallback(async (jobId: string) => {
    try {
      const res = await api.getJobApplications(jobId);
      if (res.success && res.data?.applications) {
        const mappedList: JobApplicant[] = res.data.applications.map((app: any) => ({
          id: app.id,
          studentId: app.studentId,
          name: app.fullName || app.student?.name || "Student Applicant",
          email: app.email || app.student?.email,
          phone: app.phone,
          college: app.college || "JECRC Foundation",
          course: app.course || "B.Tech",
          branch: app.branch || app.student?.studentDetails?.branch || "Engineering",
          batch: app.graduationYear ? String(app.graduationYear) : "2027",
          graduationYear: app.graduationYear,
          skills: app.skills || [],
          experience: app.experience,
          coverLetter: app.coverLetter,
          resumeUrl: app.resumeUrl,
          resumeOriginalName: app.resumeOriginalName,
          appliedAt: new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          note: app.coverLetter || app.experience,
        }));

        setAllJobs((jobs) =>
          jobs.map((j) => {
            if (j.id === jobId) {
              return {
                ...j,
                applicants: res.data?.totalApplicants ?? mappedList.length,
                applicantList: mappedList,
              };
            }
            return j;
          })
        );
      }
    } catch (_err) {}
  }, []);

  const markNotif = useCallback((id: string) => {
    saveReadNotifId(id);
    setNotifList((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const rawId = id.replace("notif_", "").replace("req_", "");
    api.markNotificationRead(rawId).catch(() => {});
  }, []);
  const markAllNotifs = useCallback(() => {
    setNotifList((ns) => {
      ns.forEach((n) => saveReadNotifId(n.id));
      return ns.map((n) => ({ ...n, read: true }));
    });
    api.markAllNotificationsRead().catch(() => {});
  }, []);

  const updateProfile = useCallback(
    async (data: {
      name?: string;
      headline?: string;
      branch?: string;
      batch?: string;
      company?: string;
      city?: string;
      about?: string;
    }) => {
      setMe((prev) => {
        const updated = {
          ...prev,
          ...(data.name && { name: capitalizeName(data.name) }),
          ...(data.headline && { headline: data.headline }),
          ...(data.branch && { branch: data.branch }),
          ...(data.batch && { batch: data.batch }),
          ...(data.company !== undefined && { company: data.company }),
          ...(data.city && { city: data.city }),
          ...(data.about !== undefined && { about: data.about }),
        };
        registerDynamicUser(updated);
        try {
          if (updated.id) {
            localStorage.setItem(`user_me_profile_${updated.id}`, JSON.stringify(updated));
            localStorage.setItem("user_me_profile_latest", JSON.stringify(updated));
          }
        } catch (e) {}
        return updated;
      });

      try {
        await api.updateProfile({
          name: data.name,
          branch: data.branch,
          batch: data.batch,
          currentCompany: data.company,
          designation: data.headline,
          bio: data.about,
          city: data.city,
        });
      } catch (_err) {
        // Backend profile sync failure is non-fatal; local state already updated
      }
    },
    []
  );

  const logout = useCallback(() => {
    disconnectSocket();
    api.logoutBackend();
    clearStack();
    setTab("home");
    setPhase("auth");
    toast("Logged out");
  }, [clearStack, toast]);

  const deleteAccount = useCallback(async () => {
    try {
      await api.deleteAccount();
    } catch (e) {}
    api.logoutBackend();
    clearStack();
    setTab("home");
    setPhase("splash");
    toast("Your account has been deleted permanently.");
  }, [clearStack, toast]);

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
      chats, activeChat, setActiveChat, sendChat, sendTyping, sendStopTyping, syncMessages, syncPresence, typing, unlockChat, deleteMessage,
      allJobs, syncJobs, addJob, applyJob, fetchApplicationsForJob, appliedJobIds, allThreads, upvoted, toggleUp, addThread, deleteThread, addReply, deleteReply,
      joined, toggleJoin, mentorReq, requestMentor, mentorOptIn, setMentorOptIn,
      notifList, markNotif, markAllNotifs, unreadNotifs, totalUnreadChats,
      logout,
      deleteAccount,
      updateProfile,
    }),
    [
      phase, role, me, completeRegister, tab, goTab, stack, push, pop, clearStack,
      toasts, toast, conn, requestConnect, acceptConn, rejectConn, received, sent,
      chats, activeChat, sendChat, sendTyping, sendStopTyping, syncMessages, syncPresence,
      typing, unlockChat, deleteMessage, allJobs, syncJobs, addJob, applyJob, fetchApplicationsForJob, appliedJobIds, allThreads, upvoted,
      toggleUp, addThread, deleteThread, addReply, deleteReply, joined, toggleJoin,
      mentorReq, requestMentor, mentorOptIn, notifList, markNotif, markAllNotifs,
      unreadNotifs, totalUnreadChats, logout, deleteAccount, updateProfile,
    ]
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
  const formatted = {
    ...p,
    name: capitalizeName(p.name),
  };
  dynamicUserMap.set(p.id, formatted);
};

export const personById = (id: string): Person => {
  const p =
    dynamicUserMap.get(id) ||
    people.find((p) => p.id === id) || {
      id: id || "member",
      name: "JECRC Member",
      role: "alumni" as const,
      headline: "JECRC Network Member",
      branch: "CSE",
      batch: "2024",
      city: "Jaipur",
      color: "#0F2A5E",
      about: "Verified member of JECRC Foundation network.",
    };

  return {
    ...p,
    name: capitalizeName(p.name),
  };
};

export const allGroups = seedGroups;
