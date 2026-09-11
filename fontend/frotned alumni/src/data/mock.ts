export interface Person {
  id: string;
  name: string;
  role: "student" | "alumni";
  headline: string;
  branch: string;
  batch: string;
  company?: string;
  city: string;
  about: string;
  color: string;
  mentor?: boolean;
  domains?: string[];
  mentees?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Internship" | "Part-time";
  mode: "Onsite" | "Remote" | "Hybrid";
  pay: string;
  skills: string[];
  postedBy: string;
  postedAgo: string;
  deadline: string;
  applicants: number;
  branch: string;
  desc: string;
  mine?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  category: string;
  author: string;
  authorRole: "student" | "alumni";
  upvotes: number;
  ago: string;
  body: string;
  replies: { id: string; author: string; text: string; ago: string; upvotes: number }[];
}

export interface Group {
  id: string;
  name: string;
  members: number;
  tag: string;
  desc: string;
}

export interface Notif {
  id: string;
  group: "Today" | "This Week" | "Earlier";
  title: string;
  body: string;
  icon: "connect" | "job" | "mentor" | "event" | "group" | "chat";
  read: boolean;
  ago: string;
}

export const people: Person[] = [
  { id: "p1", name: "Aarav Sharma", role: "alumni", headline: "SDE-2 @ Amazon", branch: "CSE", batch: "2019", company: "Amazon", city: "Bengaluru", color: "#0F2A5E", mentor: true, domains: ["DSA", "System Design", "FAANG Prep"], mentees: 4, about: "Building payment infra at Amazon. Happy to help with interview prep, referrals and system-design guidance." },
  { id: "p2", name: "Priya Verma", role: "alumni", headline: "Product Manager @ Microsoft", branch: "ECE", batch: "2018", company: "Microsoft", city: "Hyderabad", color: "#7C93D6", mentor: true, domains: ["PM Interviews", "Career Switch"], mentees: 3, about: "ECE to PM — switched tracks after 2 years in core. I mentor on product thinking and PM interview loops." },
  { id: "p3", name: "Rahul Jain", role: "alumni", headline: "Data Scientist @ Flipkart", branch: "IT", batch: "2020", company: "Flipkart", city: "Bengaluru", color: "#F2A93B", about: "Working on recommendation systems. EDA, ML pipelines and a lot of SQL." },
  { id: "p4", name: "Sneha Khandelwal", role: "alumni", headline: "VP Analytics @ Goldman Sachs", branch: "CSE", batch: "2017", company: "Goldman Sachs", city: "Mumbai", color: "#34C08D", mentor: true, domains: ["Finance Careers", "Analytics"], mentees: 5, about: "8 years across fintech and banking analytics. Ask me about breaking into finance from engineering." },
  { id: "p5", name: "Ananya Gupta", role: "alumni", headline: "ML Engineer @ Adobe", branch: "AIML", batch: "2021", company: "Adobe", city: "Noida", color: "#F2607A", about: "Shipping generative-AI features. Research-to-production is my happy place." },
  { id: "p6", name: "Devansh Pareek", role: "alumni", headline: "Staff Engineer @ Samsung R&D", branch: "ECE", batch: "2015", company: "Samsung R&D", city: "Noida", color: "#8B5CF6", mentor: true, domains: ["Embedded", "Semiconductors"], mentees: 2, about: "A decade in embedded systems and mobile platforms. Core engineering is alive and well." },
  { id: "p7", name: "Meera Nair", role: "alumni", headline: "Consultant @ Deloitte", branch: "IT", batch: "2019", company: "Deloitte", city: "Gurugram", color: "#0E9F8A", about: "Strategy + tech consulting. I write the discussion threads on switching from services to product." },
  { id: "p8", name: "Kabir Rathore", role: "alumni", headline: "Founder, FleetFox (Y Combinator)", branch: "ME", batch: "2016", company: "FleetFox", city: "Pune", color: "#C2410C", about: "Mechanical grad who ended up founding a logistics startup. Building in public." },
  { id: "p9", name: "Vikram Singh", role: "student", headline: "CSE '26 · Pre-final year", branch: "CSE", batch: "2026", city: "Jaipur", color: "#2563EB", about: "Pre-final year, grinding DSA and open source. Looking for summer '26 internships." },
  { id: "p10", name: "Ishita Agarwal", role: "student", headline: "AIML '27 · Second year", branch: "AIML", batch: "2027", city: "Jaipur", color: "#DB2777", about: "Second year, exploring ML and design. GDSC core member." },
  { id: "p11", name: "Rohan Khanna", role: "student", headline: "ECE '28 · First year", branch: "ECE", batch: "2028", city: "Jaipur", color: "#0891B2", about: "First year ECE. Robotics club, trying to figure life out." },
];

export const meAlumni: Person = {
  id: "me",
  name: "Arjun Mehta",
  role: "alumni",
  headline: "Senior Software Engineer @ Zomato",
  branch: "CSE",
  batch: "2018",
  company: "Zomato",
  city: "Gurugram",
  color: "#0F2A5E",
  about: "CSE Batch 2018. Building restaurant-side systems at Zomato. Previously at Infosys Jaipur. Always up for helping juniors from JECRC.",
};

export const jobs: Job[] = [
  { id: "j1", title: "SDE-1 (Backend)", company: "Amazon", location: "Bengaluru", type: "Full-time", mode: "Hybrid", pay: "₹22–27 LPA", skills: ["Java", "AWS", "Distributed Systems"], postedBy: "Aarav Sharma", postedAgo: "2d", deadline: "12 Jan 2026", applicants: 34, branch: "CSE", desc: "Join the Payments team building high-throughput transaction services. You will own services end-to-end, from design to on-call. Great first role for candidates with strong DSA fundamentals." },
  { id: "j2", title: "Product Analyst", company: "Zomato", location: "Gurugram", type: "Full-time", mode: "Onsite", pay: "₹14–18 LPA", skills: ["SQL", "Analytics", "Problem Solving"], postedBy: "Meera Nair", postedAgo: "3d", deadline: "18 Jan 2026", applicants: 52, branch: "IT", desc: "Work with city teams to decode ordering funnels. Heavy SQL, dashboards, and direct exposure to leadership reviews." },
  { id: "j3", title: "Frontend Engineer Intern", company: "Flipkart", location: "Remote", type: "Internship", mode: "Remote", pay: "₹40K /month", skills: ["React", "TypeScript", "Tailwind"], postedBy: "Rahul Jain", postedAgo: "5h", deadline: "05 Jan 2026", applicants: 118, branch: "CSE", desc: "6-month internship with the Seller Growth team. Ship real features to production in your first month. PPO for top performers." },
  { id: "j4", title: "Data Analyst", company: "Deloitte", location: "Hyderabad", type: "Full-time", mode: "Hybrid", pay: "₹9–12 LPA", skills: ["Python", "SQL", "Tableau"], postedBy: "Meera Nair", postedAgo: "1w", deadline: "20 Jan 2026", applicants: 76, branch: "IT", desc: "Consulting analytics for BFSI clients. Strong communication skills matter as much as technical ones here." },
  { id: "j5", title: "Embedded Software Engineer", company: "Samsung R&D", location: "Noida", type: "Full-time", mode: "Onsite", pay: "₹18–24 LPA", skills: ["C/C++", "RTOS", "Linux Kernel"], postedBy: "Devansh Pareek", postedAgo: "4d", deadline: "15 Jan 2026", applicants: 27, branch: "ECE", desc: "Work on next-gen Exynos platform bring-up. Deep systems work, world-class mentors." },
  { id: "j6", title: "QA Automation Intern", company: "Paytm", location: "Noida", type: "Internship", mode: "Hybrid", pay: "₹25K /month", skills: ["Java", "Selenium", "APIs"], postedBy: "Priya Verma", postedAgo: "2d", deadline: "10 Jan 2026", applicants: 64, branch: "CSE", desc: "Own automation suites for payments-critical flows. Learn how quality is done at scale." },
  { id: "j7", title: "Business Technology Analyst", company: "Goldman Sachs", location: "Mumbai", type: "Full-time", mode: "Hybrid", pay: "₹20–24 LPA", skills: ["Analytics", "Python", "Stakeholder Mgmt"], postedBy: "Sneha Khandelwal", postedAgo: "6d", deadline: "25 Jan 2026", applicants: 41, branch: "CSE", desc: "Bridge engineering and the trading floor. Steep learning curve, unmatched exposure to global markets." },
  { id: "j8", title: "Cloud Support Associate", company: "Microsoft", location: "Hyderabad", type: "Full-time", mode: "Onsite", pay: "₹16–19 LPA", skills: ["Azure", "Networking", "Linux"], postedBy: "Priya Verma", postedAgo: "1w", deadline: "28 Jan 2026", applicants: 89, branch: "ECE", desc: "Front-line engineering support for Azure enterprise customers. Fast track into cloud engineering roles." },
];

export const threads: Thread[] = [
  { id: "t1", title: "Referral playbook for SDE-1 roles at Amazon (from a 2019 alum)", category: "Career", author: "Aarav Sharma", authorRole: "alumni", upvotes: 128, ago: "3h", body: "Every referral season I get 50+ DMs. Here's exactly what makes me hit 'refer' vs ignore — resume format, projects that matter, and the follow-up cadence that works.", replies: [
    { id: "r1", author: "Vikram Singh", text: "This is gold. Could you also cover the LP rounds? Mine is scheduled for Feb.", ago: "2h", upvotes: 14 },
    { id: "r2", author: "Ishita Agarwal", text: "The resume section alone changed how I write bullets. Thank you!", ago: "1h", upvotes: 9 },
    { id: "r3", author: "Rohan Khanna", text: "Bookmarking for next year. Does this apply to internships too?", ago: "44m", upvotes: 3 },
  ] },
  { id: "t2", title: "MS abroad Fall '26 — shortlisting universities (GRE 321, CGPA 8.7)", category: "Higher Studies", author: "Vikram Singh", authorRole: "student", upvotes: 86, ago: "6h", body: "Targeting MSCS in the US. My list: ASU, NEU, UTD, NCSU, Stony Brook. Seniors who took this path — am I being too ambitious or too safe? Budget is a constraint.", replies: [
    { id: "r4", author: "Ananya Gupta", text: "Add UIUC as a dream and Syracuse as a safe. Also — apply to scholarships separately, most people miss deadlines.", ago: "4h", upvotes: 21 },
    { id: "r5", author: "Meera Nair", text: "NEU co-op is underrated for recovering costs. DM me if you want my exact sheet.", ago: "3h", upvotes: 17 },
  ] },
  { id: "t3", title: "How I switched from services to product in 8 months", category: "Career", author: "Meera Nair", authorRole: "alumni", upvotes: 74, ago: "1d", body: "Infosys Jaipur → Deloitte Consulting. The honest playbook: what I studied, what I skipped, and the internal-switch tactic nobody talks about.", replies: [
    { id: "r6", author: "Kabir Rathore", text: "The internal-switch point is so real. Did the same back in 2017.", ago: "20h", upvotes: 8 },
  ] },
  { id: "t4", title: "Alumni Meet — volunteer signups are OPEN", category: "Events", author: "JECRC Foundation", authorRole: "alumni", upvotes: 210, ago: "2d", body: "24–25 January, on campus. We need alumni volunteers for registration desks, chapter meets, and the mentorship lounge. First 50 volunteers get the limited edition kit.", replies: [
    { id: "r7", author: "Priya Verma", text: "Signed up for the mentorship lounge. Flying in from Hyderabad!", ago: "1d", upvotes: 33 },
    { id: "r8", author: "Devansh Pareek", text: "Count me in for the ECE chapter meet.", ago: "1d", upvotes: 18 },
  ] },
  { id: "t5", title: "Funding winter? My startup's seed journey so far", category: "Startups", author: "Kabir Rathore", authorRole: "alumni", upvotes: 67, ago: "2d", body: "84 investor meetings, 61 no's, 1 term sheet. What actually moved the needle for FleetFox — and why 'warm intro from alumni' beat every cold email.", replies: [
    { id: "r9", author: "Sneha Khandelwal", text: "This community's network is criminally underused. Great writeup.", ago: "1d", upvotes: 12 },
  ] },
  { id: "t6", title: "Best open electives for an AIML minor in 5th sem?", category: "Campus Life", author: "Ishita Agarwal", authorRole: "student", upvotes: 45, ago: "3d", body: "Choosing between NLP, Computer Vision and Reinforcement Learning for the minor. Seniors — which one has the best faculty + placement relevance?", replies: [
    { id: "r10", author: "Ananya Gupta", text: "CV with Dr. Sharma — hardest course, best payoff. NLP if you want an easier semester.", ago: "2d", upvotes: 15 },
  ] },
];

export const groups: Group[] = [
  { id: "g1", name: "CSE Batch 2019", members: 184, tag: "Batch", desc: "Official group for CSE class of 2019 — reunions, referrals, random nostalgia." },
  { id: "g2", name: "Bengaluru Chapter", members: 96, tag: "City", desc: "JECRCites in Bengaluru. Monthly meetups, flat-hunting help, weekend treks." },
  { id: "g3", name: "Startup Circle", members: 141, tag: "Interest", desc: "Founders, early employees and the startup-curious. Weekly demo threads." },
  { id: "g4", name: "Higher Studies Abroad", members: 210, tag: "Interest", desc: "MS/MBA aspirants and admits — SOP reviews, university threads, visa help." },
  { id: "g5", name: "Alumni Meet — Volunteers", members: 58, tag: "Event", desc: "Coordination group for the Alumni Meet volunteer team." },
  { id: "g6", name: "ECE Network", members: 122, tag: "Branch", desc: "Core engineering careers, semiconductors, and everything ECE." },
];

export const notifs: Notif[] = [
  { id: "n1", group: "Today", title: "Aarav Sharma accepted your connection", body: "Chat is now unlocked — say hello!", icon: "connect", read: false, ago: "12m" },
  { id: "n2", group: "Today", title: "2 new jobs match your branch (CSE)", body: "SDE-1 at Amazon · QA Intern at Paytm", icon: "job", read: false, ago: "1h" },
  { id: "n3", group: "Today", title: "Priya Verma replied to your message", body: "That timeline works. Let's set up a call…", icon: "chat", read: true, ago: "3h" },
  { id: "n4", group: "This Week", title: "Mentorship request update", body: "Sneha Khandelwal accepted your request", icon: "mentor", read: false, ago: "1d" },
  { id: "n5", group: "This Week", title: "Alumni Meet — early bird ends Sunday", body: "Reserve your seat for 24–25 Jan on campus", icon: "event", read: true, ago: "2d" },
  { id: "n6", group: "This Week", title: "You're invited to Startup Circle", body: "Kabir Rathore invited you to join", icon: "group", read: true, ago: "3d" },
  { id: "n7", group: "Earlier", title: "12 alumni viewed your profile", body: "Profiles with a bio get 3× more views", icon: "connect", read: true, ago: "1w" },
  { id: "n8", group: "Earlier", title: "Your post got 34 upvotes", body: '"Tips for the mentorship lounge" is trending', icon: "chat", read: true, ago: "2w" },
];

export const categories = ["All", "Career", "Referrals", "Higher Studies", "Startups", "Campus Life", "Events"];

export const repliesPool = [
  "That makes sense. Let's catch up during the meet!",
  "Sure — I'll share the doc by tonight.",
  "Haha, classic JECRC story",
  "Done. Check your mail, I've looped you in.",
  "Great question — short answer: yes, but start with the fundamentals first.",
  "Let's take this to a call this weekend?",
];

export interface SeedMsg {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
}

export const seedChats: { userId: string; online: boolean; unread: number; locked?: boolean; msgs: SeedMsg[] }[] = [
  {
    userId: "p1", online: true, unread: 0,
    msgs: [
      { id: "m1", fromMe: false, text: "Hey Arjun! Good to see a 2018 CSE senior here", time: "10:02", status: "read" },
      { id: "m2", fromMe: true, text: "Aarav! Congrats on Amazon. I saw your referral playbook thread — brilliant.", time: "10:05", status: "read" },
      { id: "m3", fromMe: false, text: "Thanks! Took me 3 failed seasons to learn all that", time: "10:06", status: "read" },
      { id: "m4", fromMe: true, text: "I'm mentoring 2 juniors for SDE prep. Mind if I point them to your thread?", time: "10:09", status: "read" },
      { id: "m5", fromMe: false, text: "Please do! Happy to do a group call before the meet too.", time: "10:11", status: "read" },
    ],
  },
  {
    userId: "p2", online: false, unread: 2,
    msgs: [
      { id: "m6", fromMe: true, text: "Hi Priya, requesting a mentorship slot for PM transition guidance", time: "09:12", status: "read" },
      { id: "m7", fromMe: false, text: "Hi Arjun! Happy to help. PM from SWE is a smoother jump than people think.", time: "09:40", status: "read" },
      { id: "m8", fromMe: false, text: "Let's start with a 30-min call — how's Saturday 11am?", time: "09:41", status: "delivered" },
    ],
  },
  { userId: "p3", online: true, unread: 0, locked: true, msgs: [] },
];
