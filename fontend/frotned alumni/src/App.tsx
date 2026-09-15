import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { House, Users, MessageCircle, Bell, CircleUserRound, Plus, Sparkles, Landmark } from "lucide-react";
import { StoreProvider, useStore, Tab } from "./state/store";
import { StatusBar, InitialsAvatar } from "./components/ui";
import Splash from "./screens/Splash";
import Onboarding from "./screens/Onboarding";
import AuthFlow from "./screens/Auth";
import HomeScreen from "./screens/Home";
import { DirectoryScreen, ProfileScreen } from "./screens/Directory";
import { ChatListScreen, ChatRoomScreen } from "./screens/Chat";
import { JobsScreen, JobDetailScreen, PostJobScreen } from "./screens/Jobs";
import { DiscussionsScreen, ThreadDetailScreen, GroupsScreen, GroupDetailScreen, MentorshipScreen } from "./screens/Community";
import { NotificationsScreen, SettingsScreen, ConnectionsScreen } from "./screens/System";
import { AuthWave, SealMark } from "./components/visuals";
import ErrorBoundary from "./components/ErrorBoundary";

function useMediaQuery(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [q]);
  return m;
}

/* ---------------- Toasts ---------------- */
function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-5 z-[95] flex flex-col items-center gap-2 px-6 sm:top-8">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_12px_30px_rgba(16,28,58,0.4)]"
          >
            <Sparkles size={13} className="text-gold" />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- nav config ---------------- */
function navItems(_role: string, chatBadge: number, notifBadge: number) {
  const base: { id: Tab; icon: typeof House; label: string; badge?: number }[] = [
    { id: "home", icon: House, label: "Home" },
    { id: "directory", icon: Users, label: "Directory" },
    { id: "chat", icon: MessageCircle, label: "Chats", badge: chatBadge },
    { id: "alerts", icon: Bell, label: "Updates", badge: notifBadge },
    { id: "profile", icon: CircleUserRound, label: "Profile" },
  ];
  return base;
}

/* ---------------- Bottom nav (phones) ---------------- */
function BottomNav() {
  const { tab, goTab, role, totalUnreadChats, unreadNotifs } = useStore();
  const items = navItems(role, totalUnreadChats, unreadNotifs);
  return (
    <div className="relative z-30 border-t border-line bg-white/95 pb-5 pt-2 backdrop-blur-xl">
      <div className="flex items-end justify-around px-2">
        {items.map(({ id, icon: Icon, label, badge }) => {
          const active = tab === id;
          if (id === "post") {
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.9 }}
                onClick={() => goTab(id)}
                className="relative -mt-6 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gold text-ink shadow-[0_12px_26px_-6px_rgba(242,169,59,0.7)] ring-4 ring-page"
              >
                <Plus size={26} strokeWidth={2.6} />
              </motion.button>
            );
          }
          return (
            <button key={id} onClick={() => goTab(id)} className="relative flex w-16 flex-col items-center gap-1 py-1">
              <span className="relative flex h-9 w-14 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 460, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-navy"
                  />
                )}
                <span className={`relative z-10 transition-colors ${active ? "text-white" : "text-sub/60"}`}>
                  <Icon size={21} strokeWidth={active ? 2.3 : 2} />
                </span>
                {badge != null && badge > 0 && (
                  <span className="absolute -right-0.5 -top-1 z-20 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[9.5px] font-bold text-ink ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-bold tracking-wide ${active ? "text-navy" : "text-sub/50"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Rail nav (tablets) ---------------- */
function RailNav() {
  const { tab, goTab, role, totalUnreadChats, unreadNotifs, me } = useStore();
  const items = navItems(role, totalUnreadChats, unreadNotifs);
  return (
    <div className="relative z-40 flex w-[76px] shrink-0 flex-col items-center border-r border-line bg-white py-5 md:w-[86px]">
      <button
        onClick={() => goTab("home")}
        className="btn-press mb-7 flex h-12 w-12 items-center justify-center rounded-[18px] bg-navy shadow-[0_10px_22px_-8px_rgba(15,42,94,0.55)]"
      >
        <Landmark size={20} className="text-gold" />
      </button>
      <div className="flex flex-col gap-1.5">
        {items.map(({ id, icon: Icon, label, badge }) => {
          const active = tab === id;
          if (id === "post") {
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.9 }}
                onClick={() => goTab(id)}
                className="my-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-ink shadow-[0_10px_20px_-6px_rgba(242,169,59,0.65)]"
              >
                <Plus size={22} strokeWidth={2.6} />
              </motion.button>
            );
          }
          return (
            <button key={id} onClick={() => goTab(id)} className="relative flex flex-col items-center gap-0.5 px-1 py-1">
              <span className="relative flex h-10 w-12 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="rail-pill"
                    transition={{ type: "spring", stiffness: 460, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-navy"
                  />
                )}
                <span className={`relative z-10 transition-colors ${active ? "text-white" : "text-sub/55"}`}>
                  <Icon size={20} strokeWidth={active ? 2.3 : 2} />
                </span>
                {badge != null && badge > 0 && (
                  <span className="absolute -right-0.5 -top-1 z-20 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className={`text-[9px] font-bold tracking-wide ${active ? "text-navy" : "text-sub/50"}`}>{label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex w-full justify-center border-t border-line pt-4">
        <button onClick={() => goTab("profile")} className="btn-press">
          <InitialsAvatar name={me.name} size={40} className={tab === "profile" ? "ring-2 ring-navy ring-offset-2" : ""} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Tab screens ---------------- */
const tabAnim = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: "spring" as const, stiffness: 320, damping: 32 },
};

function TabView() {
  const { tab } = useStore();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={tab} {...tabAnim} className="h-full">
        {tab === "home" && <HomeScreen />}
        {tab === "directory" && <DirectoryScreen />}
        {tab === "chat" && <ChatListScreen />}
        {tab === "alerts" && <NotificationsScreen embedded />}
        {tab === "profile" && <ProfileScreen embedded />}
        {tab === "post" && <PostJobScreen embedded />}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------- Stack screens ---------------- */
function StackScreen({ name, id }: { name: string; id?: string }) {
  switch (name) {
    case "profile": return <ProfileScreen id={id} />;
    case "jobs": return <JobsScreen />;
    case "jobDetail": return <JobDetailScreen id={id!} />;
    case "discussions": return <DiscussionsScreen />;
    case "threadDetail": return <ThreadDetailScreen id={id!} />;
    case "groups": return <GroupsScreen />;
    case "groupDetail": return <GroupDetailScreen id={id!} />;
    case "mentorship": return <MentorshipScreen />;
    case "connections": return <ConnectionsScreen />;
    case "notifications": return <NotificationsScreen />;
    case "settings": return <SettingsScreen />;
    case "chatRoom": return <ChatRoomScreen id={id!} />;
    case "postJob": return <PostJobScreen />;
    default: return null;
  }
}

function useDirectoryRedirect() {
  const { stack, clearStack, goTab } = useStore();
  const top = stack[stack.length - 1];
  useEffect(() => {
    if (top?.name === "directoryTab") {
      clearStack();
      goTab("directory");
    }
  }, [top, clearStack, goTab]);
  return top;
}

/* ---------------- PHONE SHELL (<640px) ---------------- */
function PhoneShell() {
  const { stack } = useStore();
  const top = useDirectoryRedirect();
  const isChat = top?.name === "chatRoom";

  return (
    <div className="relative h-full w-full overflow-hidden bg-page">
      <div className="absolute inset-0 flex flex-col">
        <StatusBar tone="dark" />
        <div className="relative min-h-0 flex-1">
          <TabView />
        </div>
        <AnimatePresence>
          {stack.length === 0 && (
            <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}>
              <BottomNav />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {top && top.name !== "directoryTab" && (
          <motion.div
            key={`${stack.length}-${top.name}-${top.id ?? ""}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="absolute inset-0 z-40 shadow-[-20px_0_60px_rgba(15,42,94,0.25)]"
            style={{ background: isChat ? "#0F2A5E" : "#F7F8FA" }}
          >
            <div className="flex h-full flex-col">
              <StatusBar tone={isChat ? "light" : "dark"} />
              <div className="min-h-0 flex-1 bg-page">
                <StackScreen name={top.name} id={top.id} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toasts />
    </div>
  );
}

/* ---------------- TABLET SHELL (640px–1279px) ---------------- */
function TabletShell() {
  const { stack, pop } = useStore();
  const top = useDirectoryRedirect();

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-page">
      <RailNav />
      <div className="relative min-w-0 flex-1 bg-page">
        <div className="mx-auto h-full max-w-[680px]">
          <TabView />
        </div>

        {/* iPad-style detail panel */}
        <AnimatePresence>
          {top && top.name !== "directoryTab" && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={pop}
                className="absolute inset-0 z-40 bg-ink/25 backdrop-blur-[2px]"
              />
              <motion.div
                key={`${stack.length}-${top.name}-${top.id ?? ""}`}
                initial={{ x: "104%" }} animate={{ x: 0 }} exit={{ x: "104%" }}
                transition={{ type: "spring", stiffness: 320, damping: 36 }}
                className="absolute right-0 top-0 z-50 h-full w-full max-w-[540px] border-l border-line bg-page shadow-[-24px_0_70px_rgba(15,42,94,0.22)]"
              >
                <StackScreen name={top.name} id={top.id} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <Toasts />
    </div>
  );
}

function AdaptiveShell() {
  const tablet = useMediaQuery("(min-width: 640px) and (max-width: 1279px)");
  return tablet ? <TabletShell /> : <PhoneShell />;
}

/* ---------------- Phase router ---------------- */
function Root({ desktop }: { desktop: boolean }) {
  const { phase } = useStore();
  const content = (
    <AnimatePresence mode="wait">
      <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
        {phase !== "app" && (
          <div className="absolute inset-x-0 top-0 z-50 sm:max-xl:hidden">
            <StatusBar tone={phase === "onboard" ? "dark" : "light"} />
          </div>
        )}
        {phase === "splash" && <Splash />}
        {phase === "onboard" && <Onboarding />}
        {phase === "auth" && <AuthFlow />}
        {phase === "app" && <AdaptiveShell />}
      </motion.div>
    </AnimatePresence>
  );

  if (!desktop) return <div className="h-dvh w-full overflow-hidden">{content}</div>;
  return <PhoneFrame>{content}</PhoneFrame>;
}

/* ---------------- Desktop showcase frame (>=1280px) ---------------- */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070D21]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 520px at 10% 6%, rgba(124,147,214,0.14), transparent 60%), radial-gradient(820px 620px at 90% 94%, rgba(15,42,94,0.55), transparent 62%), radial-gradient(480px 380px at 84% 10%, rgba(242,169,59,0.07), transparent 60%)",
        }}
      />
      <span className="text-stroke-w pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[20vw] font-bold tracking-tight">
        JECRC
      </span>

      <motion.aside
        initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute left-10 top-1/2 hidden w-[320px] -translate-y-1/2 xl:block"
      >
        <SealMark scale={0.82} />
        <h1 className="mt-8 font-display text-[42px] font-bold leading-[1.06] tracking-tight text-white">
          Alumni<br /><span className="text-gold">Meet</span>
        </h1>
        <p className="mt-4 text-[14.5px] leading-relaxed text-white/50">
          The official networking app for the JECRC Foundation — directory, referrals, mentorship
          and encrypted chats for 12,000+ alumni.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/60">
          <span className="h-2 w-2 rounded-full bg-gold" />
          Open on your phone or tablet for the full app
        </div>
      </motion.aside>

      <motion.aside
        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.8 }}
        className="absolute right-10 top-1/2 hidden w-[240px] -translate-y-1/2 space-y-6 xl:block"
      >
        {[
          { t: "Role-based homes", d: "Students and alumni get their own dashboards & tabs" },
          { t: "Unlock-to-chat", d: "Chats open only after a request is accepted" },
          { t: "Fully responsive", d: "Phones, foldables, tablets and desktop showcase" },
        ].map((f) => (
          <div key={f.t} className="flex gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-gold">
              <span className="h-2 w-2 rounded-full bg-gold" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{f.t}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/40">{f.d}</p>
            </div>
          </div>
        ))}
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: 44, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative z-10 py-8"
      >
        <div className="absolute -left-[2.5px] top-32 h-14 w-[3px] rounded-l-md bg-neutral-700" />
        <div className="absolute -left-[2.5px] top-52 h-20 w-[3px] rounded-l-md bg-neutral-700" />
        <div className="absolute -right-[2.5px] top-44 h-24 w-[3px] rounded-r-md bg-neutral-700" />
        <div className="rounded-[58px] bg-neutral-800 p-[3px] shadow-[0_50px_140px_rgba(0,0,0,0.85),0_0_100px_rgba(124,147,214,0.08)]">
          <div className="rounded-[55px] bg-black p-[11px]">
            <div className="relative overflow-hidden rounded-[44px] bg-page" style={{ height: "min(844px, 90vh)", aspectRatio: "390 / 844" }}>
              {children}
              <div className="pointer-events-none absolute left-1/2 top-3 z-[96] flex h-[30px] w-[112px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1a1a22] ring-1 ring-white/10" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-6 text-[11px] font-medium uppercase tracking-[0.22em] text-white/25 md:flex"
      >
        <span>JECRC Foundation</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Alumni Meet</span>
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span>Mobile App Frontend</span>
      </motion.div>
    </div>
  );
}

export default function App() {
  const desktop = useMediaQuery("(min-width: 1280px)");
  return (
    <ErrorBoundary>
      <StoreProvider>
        <LayoutGroup>
          <Root desktop={desktop} />
        </LayoutGroup>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export { AuthWave };
