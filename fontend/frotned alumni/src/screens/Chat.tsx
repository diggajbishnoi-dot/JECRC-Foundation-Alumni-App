import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lock, ShieldCheck, Camera, Image as ImageIcon, FileText, Send,
  Check, CheckCheck, ChevronLeft, Plus, MessageCircle, Download,
} from "lucide-react";
import { useStore, personById, ChatMsg } from "../state/store";
import { EmptyState, InitialsAvatar, ListSkeleton, Sheet, TypingDots } from "../components/ui";
import { api } from "../services/api";

function Ticks({ status }: { status: ChatMsg["status"] }) {
  if (status === "sent") return <Check size={14} className="text-white/60" />;
  if (status === "delivered") return <CheckCheck size={14} className="text-white/60" />;
  return (
    <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
      <CheckCheck size={14} className="text-gold" />
    </motion.span>
  );
}

/* ============== CHAT LIST ============== */
export function ChatListScreen() {
  const { chats, push, setActiveChat, syncMessages, syncPresence } = useStore();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    // Sync all chats & presences on mount (real-time updates driven by Socket.IO)
    chats.forEach((c) => {
      if (c.userId) {
        syncMessages(c.userId);
        syncPresence(c.userId);
      }
    });
    const t = setTimeout(() => setLoading(false), 500);
    return () => {
      clearTimeout(t);
    };
  }, [chats.length, syncMessages, syncPresence]);

  const filtered = chats.filter((c) => personById(c.userId).name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 pt-3">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Chats</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-sub">
          <ShieldCheck size={13} className="text-mint" /> End-to-end encrypted · only you &amp; them can read
        </p>

        <div className="relative mt-4">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub/60" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="input !pl-11" />
        </div>

        <div className="mt-5">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={34} />}
              title="No conversations yet"
              copy="Chats unlock when a connection or mentorship request gets accepted. Go say hi in the directory!"
              cta="Open directory"
              onCta={() => push({ name: "directoryTab" })}
            />
          ) : (
            <div className="space-y-1">
              {filtered.map((c, i) => {
                const p = personById(c.userId);
                const last = c.msgs[c.msgs.length - 1];
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { if (c.locked) return; setActiveChat(c.id); push({ name: "chatRoom", id: c.id }); }}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors active:bg-white"
                  >
                    <div className="relative">
                      <InitialsAvatar name={p.name} size={52} />
                      {!c.locked && c.online && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-[2.5px] ring-page bg-mint" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-[15px] font-bold text-ink">{p.name}</p>
                        {!c.locked && last && <span className={`text-[11px] ${c.unread ? "font-bold text-navy" : "text-sub/60"}`}>{last.time}</span>}
                      </div>
                      {c.locked ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-medium text-sub/70">
                          <Lock size={12} className="text-gold-600" /> Locked — request pending
                        </p>
                      ) : (
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className={`truncate text-[13px] ${c.unread ? "font-semibold text-ink" : "text-sub"}`}>
                            {last ? (last.fromMe ? "You: " : "") + (last.kind === "doc" ? `Document: ${last.meta?.name}` : last.kind === "image" ? "Sent a photo" : last.text) : "Say hello"}
                          </p>
                          {c.unread > 0 && (
                            <span className="flex h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-full bg-navy px-1.5 text-[10.5px] font-bold text-white">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== CHAT ROOM ============== */
export function ChatRoomScreen({ id }: { id: string }) {
  const { pop, chats, sendChat, syncMessages, syncPresence, typing } = useStore();
  const chat = chats.find((c) => c.id === id || c.userId === id) || { id, userId: id, online: false, lastSeen: "Offline", unread: 0, msgs: [] };
  const p = personById(chat.userId);
  const [text, setText] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isTyping = typing[chat.id];

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chat.userId) {
      syncMessages(chat.userId);
      syncPresence(chat.userId);
      api.markMessagesRead(chat.userId).catch(() => {});
    }
  }, [chat.userId, syncMessages, syncPresence]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.msgs.length, isTyping]);

  const send = () => {
    if (!text.trim()) return;
    sendChat(chat.id, { fromMe: true, kind: "text", text: text.trim() });
    setText("");
  };

  const handleFilePicked = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "camera" | "gallery" | "doc"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (type === "camera" || type === "gallery" || file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        try {
          const res = await api.uploadChatAttachment(dataUrl, file.name);
          const s3Url = (res.success && res.data?.url) ? res.data.url : dataUrl;
          sendChat(chat.id, {
            fromMe: true,
            kind: "image",
            text: "",
            meta: { name: file.name, size: sizeStr, url: s3Url },
          });
        } catch (e) {
          sendChat(chat.id, {
            fromMe: true,
            kind: "image",
            text: "",
            meta: { name: file.name, size: sizeStr, url: dataUrl },
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      const ext = file.name.split(".").pop()?.toUpperCase() || "DOC";
      sendChat(chat.id, {
        fromMe: true,
        kind: "doc",
        text: "",
        meta: { name: file.name, size: `${sizeStr} · ${ext}` },
      });
    }
    e.target.value = "";
  };

  return (
    <div className="flex h-full flex-col bg-page">
      {/* Hidden file inputs for Camera, Gallery, and Document picker */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={(e) => handleFilePicked(e, "camera")}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={(e) => handleFilePicked(e, "gallery")}
        className="hidden"
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
        ref={docInputRef}
        onChange={(e) => handleFilePicked(e, "doc")}
        className="hidden"
      />

      {/* app bar */}
      <div className="mesh-navy z-20 flex items-center gap-2 px-3 pb-3 pt-2 text-white shadow-lg">
        <button onClick={pop} className="btn-press flex h-10 w-10 items-center justify-center rounded-full">
          <ChevronLeft size={24} />
        </button>
        <InitialsAvatar name={p.name} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-bold">{p.name}</p>
            <ShieldCheck size={13} className="shrink-0 text-gold" />
          </div>
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.p key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11.5px] font-medium text-gold">
                typing…
              </motion.p>
            ) : chat.online ? (
              <motion.p key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11.5px] font-medium text-mint">
                <span className="h-2 w-2 rounded-full bg-mint animate-pulse" /> Online
              </motion.p>
            ) : (
              <motion.p key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11.5px] text-white/60">
                {chat.lastSeen || "Offline"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[10.5px] font-semibold text-sub shadow-sm">
          <ShieldCheck size={11} className="text-mint" /> Messages are end-to-end encrypted
        </div>
        <AnimatePresence initial={false}>
          {chat.msgs.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
            >
              {!m.fromMe && <InitialsAvatar name={p.name} size={26} className="mr-2 mt-auto" />}
              <div
                className={`max-w-[76%] rounded-[18px] px-3.5 py-2.5 shadow-sm ${
                  m.fromMe
                    ? "rounded-br-md bg-navy text-white"
                    : "rounded-bl-md bg-white text-ink"
                }`}
              >
                {m.kind === "image" && (
                  <div className={`mb-1.5 overflow-hidden rounded-xl ${m.fromMe ? "bg-navy-700" : "bg-page"}`}>
                    {m.meta?.url ? (
                      <img
                        src={m.meta.url}
                        alt={m.meta?.name || "Uploaded photo"}
                        className="max-h-56 max-w-full rounded-xl object-contain"
                      />
                    ) : (
                      <div className="relative flex h-36 w-44 items-center justify-center bg-gradient-to-br from-peri to-navy-800 rounded-xl">
                        <Camera size={26} className="text-white/70" />
                      </div>
                    )}
                    {m.meta?.name && (
                      <p className={`px-2 py-1 truncate text-[10.5px] ${m.fromMe ? "text-white/70" : "text-sub"}`}>
                        {m.meta.name}
                      </p>
                    )}
                  </div>
                )}
                {m.kind === "doc" && (
                  <div className={`mb-1.5 flex w-52 items-center gap-2.5 rounded-xl p-2.5 ${m.fromMe ? "bg-white/15 text-white" : "bg-page text-ink"}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.fromMe ? "bg-white/20 text-gold" : "bg-white text-navy shadow-sm"}`}>
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[12.5px] font-bold ${m.fromMe ? "text-white" : "text-ink"}`}>{m.meta?.name || "Document"}</p>
                      <p className={`text-[10.5px] ${m.fromMe ? "text-white/60" : "text-sub"}`}>{m.meta?.size || "PDF"}</p>
                    </div>
                    <Download size={15} className={m.fromMe ? "text-white/80 shrink-0" : "text-sub shrink-0"} />
                  </div>
                )}
                {m.kind === "text" && <p className="text-[14px] leading-snug break-words">{m.text}</p>}
                <div className={`mt-1 flex items-center justify-end gap-1 ${m.fromMe ? "" : "text-sub/60"}`}>
                  <span className={`text-[9.5px] font-medium ${m.fromMe ? "text-white/50" : ""}`}>{m.time}</span>
                  {m.fromMe && <Ticks status={m.status} />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* typing bubble */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-end gap-2"
            >
              <InitialsAvatar name={p.name} size={26} />
              <div className="rounded-[18px] rounded-bl-md bg-white px-4 py-3 shadow-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* input */}
      <div className="z-20 flex items-end gap-2 bg-page px-3 pb-6 pt-2">
        <button onClick={() => setAttachOpen(true)} className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-navy shadow-sm cursor-pointer">
          <Plus size={20} />
        </button>
        <div className="flex flex-1 items-center rounded-full bg-white py-1 pl-4 pr-1 shadow-sm">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="h-10 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-sub/50"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={send}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-lg transition-colors cursor-pointer ${text.trim() ? "bg-navy text-white" : "bg-white text-sub/50"}`}
        >
          <Send size={18} className={text.trim() ? "translate-x-[1px]" : ""} />
        </motion.button>
      </div>

      {/* attachment sheet */}
      <Sheet open={attachOpen} onClose={() => setAttachOpen(false)} title="Share Media">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Camera,
              label: "Camera",
              tint: "#FDE8ED",
              color: "#C94060",
              fn: () => {
                setAttachOpen(false);
                cameraInputRef.current?.click();
              },
            },
            {
              icon: ImageIcon,
              label: "Gallery",
              tint: "#E3EAF7",
              color: "#0F2A5E",
              fn: () => {
                setAttachOpen(false);
                galleryInputRef.current?.click();
              },
            },
            {
              icon: FileText,
              label: "Document",
              tint: "#FCF0DA",
              color: "#B87714",
              fn: () => {
                setAttachOpen(false);
                docInputRef.current?.click();
              },
            },
          ].map((a) => (
            <motion.button key={a.label} whileTap={{ scale: 0.93 }} onClick={a.fn} className="card flex flex-col items-center gap-2.5 py-5 cursor-pointer">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: a.tint, color: a.color }}>
                <a.icon size={21} />
              </span>
              <span className="text-[12px] font-semibold text-ink">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
