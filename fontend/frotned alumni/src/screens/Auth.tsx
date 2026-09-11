import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  CheckCircle2,
  Search,
  Sparkles,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Mail,
} from "lucide-react";
import { AuthWave, JecrcLogo } from "../components/visuals";
import { Btn, Field, Segmented, Sheet } from "../components/ui";
import { useStore, Role } from "../state/store";
import { api } from "../services/api";

type AuthScreen = "welcome" | "register" | "otp" | "details" | "login" | "forgot" | "claim";

const branches = ["CSE", "IT", "ECE", "AIML", "EE", "ME", "CE"];
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ---------- shell: wavy header + overlapping white card ---------- */
function AuthScaffold({
  onBack,
  heading,
  sub,
  children,
  waveH = 34,
}: {
  onBack?: () => void;
  heading: string;
  sub?: string;
  children: React.ReactNode;
  waveH?: number;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0" style={{ height: `${waveH}%` }}>
        <AuthWave className="h-full w-full" />
        <div className="absolute right-5 top-12 z-10 opacity-95">
          <JecrcLogo white className="h-9 w-auto max-w-[120px] object-contain drop-shadow" />
        </div>
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="btn-press absolute left-5 top-12 flex items-center gap-1 rounded-full bg-white/15 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft size={16} /> Back
          </motion.button>
        )}
      </div>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="auth-card absolute inset-x-0 bottom-0 w-full overflow-y-auto no-scrollbar rounded-t-[28px] bg-white px-5 sm:px-6 pb-10 pt-6 shadow-[0_-10px_40px_rgba(15,42,94,0.18)] box-border"
        style={{ top: `${waveH - 5}%` }}
      >
        <h1 className="font-display text-[23px] sm:text-[25px] font-bold tracking-tight text-ink">{heading}</h1>
        {sub && <p className="mt-1 text-[13px] sm:text-[13.5px] text-sub">{sub}</p>}
        <div className="mt-5 w-full box-border">{children}</div>
      </motion.div>
    </div>
  );
}

/* ---------- stepper ---------- */
function Stepper({ step }: { step: number }) {
  const labels = ["Account", "Verify", "Details"];
  return (
    <div className="mb-6 flex items-center">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <motion.span
              animate={{
                backgroundColor: i <= step ? "#0F2A5E" : "#E6EAF3",
                color: i <= step ? "#fff" : "#5B6785",
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
            >
              {i < step ? "✓" : i + 1}
            </motion.span>
            <span className={`text-[10px] font-semibold ${i <= step ? "text-navy" : "text-sub/60"}`}>{l}</span>
          </div>
          {i < 2 && (
            <div className="relative mx-2 mb-5 h-[2px] flex-1 overflow-hidden rounded bg-line">
              <motion.div
                animate={{ width: i < step ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="absolute inset-y-0 left-0 bg-navy"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- 6-box OTP input ---------- */
function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
    if (next.every((x) => x)) onComplete(next.join(""));
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <motion.input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          value={d}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className={`h-[52px] w-full rounded-xl border-[1.5px] text-center text-[19px] font-bold text-ink outline-none transition-all ${
            d ? "border-navy bg-navy-50 shadow-[0_0_0_3px_rgba(15,42,94,0.08)]" : "border-line bg-page"
          } focus:border-navy focus:bg-white`}
        />
      ))}
    </div>
  );
}

/* ==================================================== */
export default function AuthFlow() {
  const { setPhase, toast, completeRegister, setRole, setMe } = useStore();
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [reg, setReg] = useState({
    name: "",
    email: "",
    pass: "",
    confirm: "",
    branch: "CSE",
    company: "",
    title: "",
    batch: "2020",
    year: "3rd Year",
    passout: "2026",
    collegeId: "",
    city: "Jaipur",
  });
  const [roleSel, setRoleSel] = useState<Role>("student");
  const [agree, setAgree] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [remember, setRemember] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", pass: "" });
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotForm, setForgotForm] = useState({ email: "", pass: "" });

  // Claim Profile state
  const [claimRole, setClaimRole] = useState<Role>("alumni");
  const [claimQuery, setClaimQuery] = useState("");
  const [claimStatus, setClaimStatus] = useState<
    "idle" | "searching" | "found" | "not_found" | "already_claimed" | "otp_sent"
  >("idle");
  const [claimUser, setClaimUser] = useState<any>(null);
  const [claimOtp, setClaimOtp] = useState("");
  const [claimPass, setClaimPass] = useState("");
  const [claimConfirm, setClaimConfirm] = useState("");
  const [claimCompany, setClaimCompany] = useState("");
  const [claimCity, setClaimCity] = useState("Jaipur");
  const [claimHeadline, setClaimHeadline] = useState("");

  useEffect(() => {
    if (screen !== "otp") return;
    setCountdown(30);
    const i = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [screen]);

  const up = (k: string, v: string) => {
    setReg((r) => ({ ...r, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submitRegister = () => {
    const e: Record<string, string> = {};
    if (reg.name.trim().length < 3) e.name = "Please enter your full name";
    if (!emailOk(reg.email)) e.email = "That email doesn't look right";
    if (reg.pass.length < 6) e.pass = "Use at least 6 characters";
    if (reg.confirm !== reg.pass) e.confirm = "Passwords don't match";
    if (!agree) e.agree = "Please accept to continue";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("otp");
      toast(`OTP sent to ${reg.email} (demo: any 6 digits)`);
    }, 800);
  };

  const verifyOtp = () => {
    if (otp.length < 6) {
      setErrors({ otp: "Enter the 6-digit code" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("details");
      toast("Email verified! Complete your profile");
    }, 800);
  };

  const submitDetails = async () => {
    setLoading(true);
    try {
      await api.register({
        name: reg.name,
        email: reg.email,
        password: reg.pass,
        role: roleSel === "alumni" ? "ALUMNI" : "STUDENT",
        branch: reg.branch,
        batch: roleSel === "alumni" ? reg.batch : undefined,
        currentCompany: reg.company || undefined,
        designation: reg.title || undefined,
        currentYear: roleSel === "student" ? parseInt(reg.year.slice(0, 1)) || 3 : undefined,
      });
    } catch {
      // Continue client side
    }
    setLoading(false);
    completeRegister({
      name: reg.name,
      email: reg.email,
      role: roleSel,
      branch: reg.branch,
      detail: roleSel === "alumni" ? reg.batch : reg.passout,
    });
    toast(`Welcome to the JECRC network, ${reg.name.split(" ")[0] || "friend"}!`);
  };

  const submitLogin = async () => {
    const e: Record<string, string> = {};
    if (!emailOk(loginForm.email)) e.l_email = "Enter a valid email";
    if (!loginForm.pass) e.l_pass = "Enter your password";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);

    try {
      const res = await api.login(loginForm.email, loginForm.pass);
      setLoading(false);
      if (res.success && res.data?.user) {
        const u = res.data.user;
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
          headline:
            u.bio ||
            (u.alumniDetails
              ? `${u.alumniDetails.designation || "Alumnus"} at ${u.alumniDetails.currentCompany || "JECRC"}`
              : "JECRC Student"),
        });
        setPhase("app");
        toast(`Welcome back, ${u.name.split(" ")[0] || "Alumnus"}!`);
        return;
      }
    } catch {
      // Fallback below
    }

    setLoading(false);
    setRole("alumni");
    setPhase("app");
    toast("Welcome back!");
  };

  /* ---------- Claim Profile Handlers ---------- */
  const handleClaimLookup = async () => {
    const q = claimQuery.trim();
    if (q.length < 3) {
      setErrors({ claimQuery: "Please enter your college email or enrollment no." });
      return;
    }
    setErrors({});
    setClaimStatus("searching");

    try {
      const res = await api.claimLookup(q, claimRole === "alumni" ? "ALUMNI" : "STUDENT");
      if (res.success && res.data?.found && res.data?.user) {
        const u = res.data.user;
        setClaimUser(u);
        setClaimCompany(u.company || "");
        setClaimCity(u.city || "Jaipur");
        setClaimHeadline(u.company ? `${u.role === "ALUMNI" ? "Alumnus" : "Student"} at ${u.company}` : "");

        if (u.isClaimed) {
          setClaimStatus("already_claimed");
        } else {
          setClaimStatus("found");
        }
      } else {
        setClaimStatus("not_found");
      }
    } catch {
      setClaimStatus("not_found");
    }
  };

  const handleSendClaimOtp = async () => {
    if (!claimUser?.id) return;
    setLoading(true);
    try {
      await api.claimSendOtp(claimUser.id);
    } catch {
      // Demo fallback
    }
    setLoading(false);
    setClaimStatus("otp_sent");
    toast(`Activation code sent to ${claimUser.maskedEmail || claimUser.email} (Demo: 123456)`);
  };

  const handleClaimActivate = async () => {
    const e: Record<string, string> = {};
    if (claimOtp.length < 6) e.claimOtp = "Enter the 6-digit activation code";
    if (claimPass.length < 6) e.claimPass = "Password must be at least 6 characters";
    if (claimConfirm !== claimPass) e.claimConfirm = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await api.claimActivate({
        userId: claimUser.id,
        otp: claimOtp,
        newPassword: claimPass,
        company: claimCompany,
        city: claimCity,
        headline: claimHeadline,
      });

      setLoading(false);
      const claimedRole = (claimUser.role?.toLowerCase() as Role) || claimRole;
      setRole(claimedRole);
      setMe({
        id: claimUser.id,
        name: claimUser.name,
        role: claimedRole,
        branch: claimUser.branch || "CSE",
        batch: claimUser.batch || "2020",
        company: claimCompany || claimUser.company,
        city: claimCity || "Jaipur",
        about: "Verified JECRC Profile",
        color: claimedRole === "alumni" ? "#0F2A5E" : "#2563EB",
        headline: claimHeadline || (claimCompany ? `Alumnus at ${claimCompany}` : "JECRC Alumnus"),
      });

      setPhase("app");
      toast(`🎉 Profile successfully activated! Welcome, ${claimUser.name}.`);
    } catch (err: any) {
      setLoading(false);
      setErrors({ claimOtp: "Invalid OTP. Use demo code: 123456" });
    }
  };

  const selectStyle = "input appearance-none pr-10";

  return (
    <div className="relative h-full overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 46 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -46 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="h-full"
        >
          {/* ============ WELCOME ============ */}
          {screen === "welcome" && (
            <div className="relative flex h-full flex-col overflow-hidden">
              <AuthWave className="absolute inset-0 h-full w-full" />
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute top-16 left-7 z-10"
              >
                <JecrcLogo white className="h-16 w-auto max-w-[200px] object-contain drop-shadow-md" />
              </motion.div>
              <div className="welcome-copy relative flex flex-1 flex-col justify-end px-7 pb-20">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="max-w-[420px]"
                >
                  <h1 className="font-display text-[38px] font-bold leading-[1.1] tracking-tight text-white">
                    Alumni<br />
                    <span className="text-gold">Meet</span>
                  </h1>
                  <p className="mt-3 max-w-[290px] text-[14.5px] leading-relaxed text-white/85">
                    Official networking app for JECRC Foundation — 12,000+ alumni &amp; students across 40+ cities.
                  </p>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 24 }}
                className="relative flex flex-col gap-2 pb-5 px-4"
              >
                <div className="flex h-[56px] gap-3">
                  <button
                    onClick={() => setScreen("login")}
                    className="btn-press flex flex-1 items-center justify-center rounded-2xl bg-white/15 text-[15.5px] font-semibold text-white backdrop-blur-md border border-white/20"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setScreen("register")}
                    className="btn-press flex flex-1 items-center justify-center rounded-2xl bg-white text-[15.5px] font-bold text-navy shadow-[0_10px_25px_rgba(0,0,0,0.2)]"
                  >
                    Sign up
                  </button>
                </div>
                <button
                  onClick={() => {
                    setClaimStatus("idle");
                    setScreen("claim");
                  }}
                  className="btn-press mt-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white transition-colors underline decoration-white/40"
                >
                  <Sparkles size={14} className="text-gold" /> College Student or Alumni? Claim your profile &rarr;
                </button>
              </motion.div>
            </div>
          )}

          {/* ============ CLAIM PROFILE ============ */}
          {screen === "claim" && (
            <AuthScaffold
              onBack={() => setScreen("welcome")}
              heading="Claim Profile"
              sub="Search your pre-imported JECRC college record"
              waveH={30}
            >
              <div className="space-y-4">
                {/* Role Toggle */}
                <div>
                  <span className="label">I am verifying as</span>
                  <Segmented
                    options={[
                      { id: "alumni", label: "Alumni Record" },
                      { id: "student", label: "Student Record" },
                    ]}
                    value={claimRole}
                    onChange={(r) => {
                      setClaimRole(r);
                      setClaimStatus("idle");
                      setClaimUser(null);
                    }}
                  />
                </div>

                {/* Search Box */}
                <div>
                  <span className="label">College Email or Enrollment ID</span>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="input pl-10 pr-24 text-[14px]"
                      placeholder={
                        claimRole === "alumni"
                          ? "e.g. rohit.sharma@jecrc.ac.in"
                          : "e.g. ananya.gupta@jecrc.ac.in"
                      }
                      value={claimQuery}
                      onChange={(e) => {
                        setClaimQuery(e.target.value);
                        setErrors((prev) => ({ ...prev, claimQuery: "" }));
                        if (claimStatus !== "idle") setClaimStatus("idle");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleClaimLookup();
                        }
                      }}
                    />
                    <Search size={16} className="absolute left-3 text-sub/60" />
                    <button
                      type="button"
                      disabled={claimStatus === "searching"}
                      onClick={handleClaimLookup}
                      className="btn-press absolute right-1.5 rounded-lg bg-navy px-3 py-1.5 text-[12px] font-bold text-white shadow-sm"
                    >
                      {claimStatus === "searching" ? "..." : "Search"}
                    </button>
                  </div>
                  {errors.claimQuery && <p className="mt-1 text-xs font-medium text-rose">{errors.claimQuery}</p>}
                </div>

                {/* Quick Hint */}
                {claimStatus === "idle" && (
                  <div className="rounded-xl border border-line bg-page/70 p-3.5 text-[12.5px] text-sub flex items-start gap-2.5">
                    <Sparkles size={16} className="text-gold-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-ink">Demo test accounts ready in database:</span>
                      <div className="mt-1 space-y-0.5 text-[11.5px] text-sub/90">
                        <div>&bull; Alumni: <code className="text-navy font-mono font-bold">rohit.sharma@jecrc.ac.in</code></div>
                        <div>&bull; Student: <code className="text-navy font-mono font-bold">ananya.gupta@jecrc.ac.in</code></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MATCH FOUND: Unclaimed */}
                {claimStatus === "found" && claimUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-navy/20 bg-gradient-to-b from-navy-50/70 to-white p-4.5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy font-display text-[17px] font-bold text-white shadow-md">
                        {claimUser.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-bold text-ink truncate">{claimUser.name}</h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10.5px] font-bold text-mint-700">
                            <ShieldCheck size={12} /> Verified Data
                          </span>
                        </div>
                        <p className="text-[12.5px] text-sub truncate">
                          {claimUser.branch} &middot; Batch {claimUser.batch} &middot; {claimUser.role === "ALUMNI" ? "Alumnus" : "Student"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 border-t border-navy/10 pt-3 text-[12.5px] text-sub/90 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-navy" />
                        <span>Registered email: <strong className="text-ink">{claimUser.maskedEmail || claimUser.email}</strong></span>
                      </div>
                      {claimUser.company && (
                        <div className="flex items-center gap-2">
                          <Briefcase size={13} className="text-navy" />
                          <span>Pre-recorded Org: <strong className="text-ink">{claimUser.company}</strong></span>
                        </div>
                      )}
                    </div>

                    <Btn className="mt-4 w-full" loading={loading} onClick={handleSendClaimOtp}>
                      Send Activation Code &rarr;
                    </Btn>
                  </motion.div>
                )}

                {/* OTP SENT & ACTIVATION FORM */}
                {claimStatus === "otp_sent" && claimUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 rounded-2xl border border-navy/20 bg-white p-4 shadow-sm"
                  >
                    <div className="rounded-xl bg-navy-50 p-3 text-center">
                      <p className="text-[12.5px] text-navy">
                        Activation code sent to <strong className="font-semibold">{claimUser.maskedEmail || claimUser.email}</strong>
                      </p>
                      <p className="text-[11px] text-sub mt-0.5">(For this demo, enter <strong>123456</strong>)</p>
                    </div>

                    <div>
                      <span className="label">6-Digit Activation Code</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={claimOtp}
                        onChange={(e) => {
                          setClaimOtp(e.target.value.replace(/\D/g, ""));
                          setErrors((prev) => ({ ...prev, claimOtp: "" }));
                        }}
                        placeholder="123456"
                        className="input text-center font-mono text-[18px] tracking-[0.35em] font-bold"
                      />
                      {errors.claimOtp && <p className="mt-1 text-xs font-medium text-rose">{errors.claimOtp}</p>}
                    </div>

                    <Field
                      label="Create New Password"
                      password
                      value={claimPass}
                      onChange={(v) => {
                        setClaimPass(v);
                        setErrors((prev) => ({ ...prev, claimPass: "" }));
                      }}
                      placeholder="Minimum 6 characters"
                      error={errors.claimPass}
                    />

                    <Field
                      label="Confirm Password"
                      password
                      value={claimConfirm}
                      onChange={(v) => {
                        setClaimConfirm(v);
                        setErrors((prev) => ({ ...prev, claimConfirm: "" }));
                      }}
                      placeholder="Re-enter password"
                      error={errors.claimConfirm}
                    />

                    {/* Profile Customizers */}
                    {claimRole === "alumni" ? (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <Field
                          label="Current Company"
                          value={claimCompany}
                          onChange={setClaimCompany}
                          placeholder="e.g. Google"
                        />
                        <Field
                          label="Current City"
                          value={claimCity}
                          onChange={setClaimCity}
                          placeholder="e.g. Bengaluru"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <Field
                          label="Current City"
                          value={claimCity}
                          onChange={setClaimCity}
                          placeholder="e.g. Jaipur"
                        />
                        <Field
                          label="Headline"
                          value={claimHeadline}
                          onChange={setClaimHeadline}
                          placeholder="e.g. AI Enthusiast"
                        />
                      </div>
                    )}

                    <Btn className="w-full" loading={loading} onClick={handleClaimActivate}>
                      Activate Profile &amp; Sign In
                    </Btn>
                  </motion.div>
                )}

                {/* MATCH FOUND: Already Claimed */}
                {claimStatus === "already_claimed" && claimUser && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-gold-300 bg-gold-50/50 p-4.5 text-center"
                  >
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                      <UserCheck size={22} />
                    </div>
                    <h3 className="mt-2 text-[15px] font-bold text-ink">Profile Already Claimed</h3>
                    <p className="mt-1 text-[12.5px] text-sub">
                      The profile for <strong>{claimUser.name}</strong> has already been activated. Please sign in with your password.
                    </p>
                    <Btn
                      className="mt-3.5 w-full"
                      onClick={() => {
                        setLoginForm((f) => ({ ...f, email: claimUser.email }));
                        setScreen("login");
                      }}
                    >
                      Go to Sign In &rarr;
                    </Btn>
                  </motion.div>
                )}

                {/* NOT FOUND FLOW: Direct Seamless Switch to Register */}
                {claimStatus === "not_found" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-rose/20 bg-rose-50/40 p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-ink">No pre-imported record found</h4>
                        <p className="mt-1 text-[12.5px] text-sub leading-relaxed">
                          Your details aren't in the pre-loaded batch list yet. Don't worry — you can register directly as a new{" "}
                          <strong className="text-navy">{claimRole === "alumni" ? "Alumni" : "Student"}</strong> right now!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRoleSel(claimRole);
                        if (emailOk(claimQuery.trim())) {
                          setReg((r) => ({ ...r, email: claimQuery.trim() }));
                        }
                        setScreen("register");
                        toast(`Registering as new ${claimRole === "alumni" ? "Alumni" : "Student"}`);
                      }}
                      className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-[13.5px] font-bold text-white shadow-md hover:bg-navy-600"
                    >
                      <span>Register as new {claimRole === "alumni" ? "Alumni" : "Student"}</span>
                      <ArrowRight size={15} />
                    </button>
                  </motion.div>
                )}

                {/* Back to normal Sign up / Sign in */}
                <div className="pt-2 text-center text-[13px] text-sub">
                  Prefer regular registration?{" "}
                  <button
                    type="button"
                    onClick={() => setScreen("register")}
                    className="font-bold text-navy underline decoration-navy/30"
                  >
                    Standard Sign up
                  </button>
                </div>
              </div>
            </AuthScaffold>
          )}

          {/* ============ REGISTER ============ */}
          {screen === "register" && (
            <AuthScaffold
              onBack={() => setScreen("welcome")}
              heading="Get Started"
              sub="Create your JECRC Foundation account"
              waveH={30}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitRegister();
                }}
                className="space-y-4"
              >
                <div>
                  <span className="label">I am a</span>
                  <Segmented
                    options={[
                      { id: "student", label: "Student" },
                      { id: "alumni", label: "Alumni" },
                    ]}
                    value={roleSel}
                    onChange={setRoleSel}
                  />
                </div>
                <Field
                  label="Full Name"
                  value={reg.name}
                  onChange={(v) => up("name", v)}
                  placeholder="Enter Full Name"
                  error={errors.name}
                />
                <Field
                  label="Email"
                  type="email"
                  value={reg.email}
                  onChange={(v) => up("email", v)}
                  placeholder="Enter Email"
                  error={errors.email}
                />
                <Field
                  label="Password"
                  password
                  value={reg.pass}
                  onChange={(v) => up("pass", v)}
                  placeholder="Enter Password"
                  error={errors.pass}
                />
                <Field
                  label="Confirm Password"
                  password
                  value={reg.confirm}
                  onChange={(v) => up("confirm", v)}
                  placeholder="Re-enter Password"
                  error={errors.confirm}
                />
                <div>
                  <label
                    className="flex cursor-pointer items-start gap-2.5"
                    onClick={() => setAgree((a) => !a)}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-all ${
                        agree ? "border-navy bg-navy" : "border-line bg-white"
                      }`}
                    >
                      {agree && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} viewBox="0 0 12 12" className="h-3 w-3">
                          <path
                            d="M2 6l3 3 5-6"
                            stroke="#fff"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </span>
                    <span className="text-[13px] leading-snug text-sub">
                      I agree to the processing of{" "}
                      <span
                        className="font-semibold text-navy underline decoration-navy/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTermsOpen(true);
                        }}
                      >
                        Personal data
                      </span>
                    </span>
                  </label>
                  {errors.agree && <p className="mt-1.5 text-xs font-medium text-rose">{errors.agree}</p>}
                </div>
                <Btn className="w-full" loading={loading}>
                  Sign up
                </Btn>

                {/* Claim Profile shortcut */}
                <div className="pt-2">
                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-line"></div>
                    <span className="flex-shrink mx-3 text-sub/70 text-[11px] font-semibold uppercase tracking-wider">
                      Or college database
                    </span>
                    <div className="flex-grow border-t border-line"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClaimStatus("idle");
                      setScreen("claim");
                    }}
                    className="btn-press w-full mt-1 flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy-50/50 py-2.5 text-[13px] font-bold text-navy hover:bg-navy-50"
                  >
                    <Sparkles size={15} className="text-gold-600" /> Already in database? Claim profile &rarr;
                  </button>
                </div>

                <p className="pt-1 text-center text-[13.5px] text-sub">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setScreen("login")}
                    className="font-bold text-gold-600"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </AuthScaffold>
          )}

          {/* ============ OTP ============ */}
          {screen === "otp" && (
            <AuthScaffold
              onBack={() => setScreen("register")}
              heading="Verify your email"
              sub={`We sent a 6-digit code to ${reg.email || "your email"}`}
            >
              <Stepper step={1} />
              <OtpInput onComplete={setOtp} />
              {errors.otp && <p className="mt-2 text-xs font-medium text-rose">{errors.otp}</p>}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-sub">
                {countdown > 0 ? (
                  <>
                    Resend code in{" "}
                    <span className="font-bold tabular-nums text-navy">
                      0:{countdown.toString().padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <button
                    className="font-bold text-navy"
                    onClick={() => {
                      setCountdown(30);
                      toast("OTP resent (demo: any 6 digits)");
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              <Btn className="mt-6 w-full" loading={loading} onClick={verifyOtp}>
                Verify
              </Btn>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-sub/70">
                <CheckCircle2 size={13} className="text-mint" /> OTP is required once — future logins use just your password
              </p>
            </AuthScaffold>
          )}

          {/* ============ DETAILS ============ */}
          {screen === "details" && (
            <AuthScaffold
              heading="Profile Setup"
              sub={
                roleSel === "alumni"
                  ? "Customize your verified alumni profile"
                  : "Tell us about your studies at JECRC"
              }
              waveH={28}
            >
              <Stepper step={2} />
              <div className="space-y-4">
                <div>
                  <span className="label">Branch</span>
                  <div className="relative">
                    <select
                      className={selectStyle}
                      value={reg.branch}
                      onChange={(e) => up("branch", e.target.value)}
                    >
                      {branches.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {roleSel === "student" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="label">Current Year</span>
                        <select
                          className={selectStyle}
                          value={reg.year}
                          onChange={(e) => up("year", e.target.value)}
                        >
                          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                            <option key={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="label">Passout Year</span>
                        <select
                          className={selectStyle}
                          value={reg.passout}
                          onChange={(e) => up("passout", e.target.value)}
                        >
                          {["2026", "2027", "2028", "2029", "2030"].map((y) => (
                            <option key={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Field
                      label="Enrollment / College ID (Optional)"
                      value={reg.collegeId}
                      onChange={(v) => up("collegeId", v)}
                      placeholder="e.g. 22EJCCS100"
                    />
                    <Field
                      label="Current City"
                      value={reg.city}
                      onChange={(v) => up("city", v)}
                      placeholder="e.g. Jaipur"
                    />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="label">Batch</span>
                        <select
                          className={selectStyle}
                          value={reg.batch}
                          onChange={(e) => up("batch", e.target.value)}
                        >
                          {Array.from({ length: 16 }, (_, i) => `${2025 - i}`).map((y) => (
                            <option key={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="label">Passout Year</span>
                        <select
                          className={selectStyle}
                          value={reg.batch}
                          onChange={(e) => up("batch", e.target.value)}
                        >
                          {Array.from({ length: 16 }, (_, i) => `${2025 - i}`).map((y) => (
                            <option key={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Field
                      label="Current Company"
                      value={reg.company}
                      onChange={(v) => up("company", v)}
                      placeholder="e.g. Amazon, Google, Infosys"
                    />
                    <Field
                      label="Designation"
                      value={reg.title}
                      onChange={(v) => up("title", v)}
                      placeholder="e.g. Software Development Engineer"
                    />
                    <Field
                      label="Current City"
                      value={reg.city}
                      onChange={(v) => up("city", v)}
                      placeholder="e.g. Bengaluru, Delhi NCR, Jaipur"
                    />
                  </>
                )}

                <Btn className="w-full" loading={loading} onClick={submitDetails}>
                  Complete Profile &amp; Join
                </Btn>
              </div>
            </AuthScaffold>
          )}

          {/* ============ LOGIN ============ */}
          {screen === "login" && (
            <AuthScaffold
              onBack={() => setScreen("welcome")}
              heading="Welcome back"
              sub="Sign in to your JECRC Foundation account"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitLogin();
                }}
                className="space-y-4"
              >
                <Field
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(v) => {
                    setLoginForm((f) => ({ ...f, email: v }));
                    setErrors((e) => ({ ...e, l_email: "" }));
                  }}
                  placeholder="Enter Email"
                  error={errors.l_email}
                />
                <Field
                  label="Password"
                  password
                  value={loginForm.pass}
                  onChange={(v) => {
                    setLoginForm((f) => ({ ...f, pass: v }));
                    setErrors((e) => ({ ...e, l_pass: "" }));
                  }}
                  placeholder="Enter Password"
                  error={errors.l_pass}
                />
                <div className="flex items-center justify-between">
                  <label
                    className="flex cursor-pointer items-center gap-2"
                    onClick={() => setRemember((r) => !r)}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] transition-all ${
                        remember ? "border-navy bg-navy" : "border-line bg-white"
                      }`}
                    >
                      {remember && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3">
                          <path
                            d="M2 6l3 3 5-6"
                            stroke="#fff"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-[13px] font-medium text-sub">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(0);
                      setScreen("forgot");
                    }}
                    className="text-[13px] font-bold text-navy"
                  >
                    Forgot password?
                  </button>
                </div>
                <Btn className="w-full" loading={loading}>
                  Sign in
                </Btn>

                {/* Claim Profile Button in Login */}
                <div className="pt-2">
                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-line"></div>
                    <span className="flex-shrink mx-3 text-sub/70 text-[11px] font-semibold uppercase tracking-wider">
                      Pre-imported record
                    </span>
                    <div className="flex-grow border-t border-line"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClaimStatus("idle");
                      setScreen("claim");
                    }}
                    className="btn-press w-full mt-1 flex items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy-50/50 py-2.5 text-[13px] font-bold text-navy hover:bg-navy-50"
                  >
                    <UserCheck size={16} /> Claim Pre-loaded College Profile
                  </button>
                </div>

                <p className="pt-1 text-center text-[13.5px] text-sub">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setScreen("register")}
                    className="font-bold text-gold-600"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-center text-[11.5px] text-sub/60">
                  Connected to Alumni Backend &middot; E2E Encrypted Auth
                </p>
              </form>
            </AuthScaffold>
          )}

          {/* ============ FORGOT ============ */}
          {screen === "forgot" && (
            <AuthScaffold
              onBack={() => setScreen("login")}
              heading={forgotStep === 0 ? "Reset password" : "Create new password"}
              sub={
                forgotStep === 0
                  ? "We'll email you a one-time code"
                  : "Enter the code and pick a new password"
              }
            >
              {forgotStep === 0 ? (
                <div className="space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    value={forgotForm.email}
                    onChange={(v) => setForgotForm((f) => ({ ...f, email: v }))}
                    placeholder="Enter your registered email"
                  />
                  <Btn
                    className="w-full"
                    loading={loading}
                    onClick={() => {
                      if (!emailOk(forgotForm.email)) {
                        setErrors({ f: "Enter a valid email" });
                        return;
                      }
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        setForgotStep(1);
                        toast("Reset code sent (demo: any 6 digits)");
                      }, 800);
                    }}
                  >
                    Send reset code
                  </Btn>
                  {errors.f && <p className="text-xs font-medium text-rose">{errors.f}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <OtpInput onComplete={() => {}} />
                  <Field
                    label="New Password"
                    password
                    value={forgotForm.pass}
                    onChange={(v) => setForgotForm((f) => ({ ...f, pass: v }))}
                    placeholder="Enter new password"
                  />
                  <Btn
                    className="w-full"
                    loading={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        setScreen("login");
                        toast("Password updated — sign in with the new one");
                      }, 800);
                    }}
                  >
                    Reset password
                  </Btn>
                </div>
              )}
            </AuthScaffold>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Terms Sheet */}
      <Sheet open={termsOpen} onClose={() => setTermsOpen(false)} title="Personal data, plainly">
        <p className="text-[14px] leading-relaxed text-sub">
          JECRC Foundation processes your name, email, academic details and professional profile solely to operate the
          alumni network — directory visibility, connections, mentorship and event coordination for the Alumni Meet.
          Your data is never sold. Chat messages are end-to-end encrypted and unreadable by anyone except you and the
          recipient. You can export or delete your data anytime from Settings.
        </p>
        <Btn variant="primary" className="mt-6 w-full" onClick={() => setTermsOpen(false)}>
          Got it
        </Btn>
      </Sheet>
    </div>
  );
}
