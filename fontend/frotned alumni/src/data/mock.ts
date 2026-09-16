export interface Person {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
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

export interface JobApplicant {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  college?: string;
  course?: string;
  branch: string;
  batch: string;
  graduationYear?: number;
  skills?: string[];
  experience?: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  appliedAt: string;
  note?: string;
}

export interface Job {
  id: string;
  posterId?: string;
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
  applicantList?: JobApplicant[];
}

export interface Thread {
  id: string;
  title: string;
  category: string;
  author: string;
  authorId?: string;
  authorRole: "student" | "alumni";
  upvotes: number;
  ago: string;
  body: string;
  mine?: boolean;
  replies: {
    id: string;
    author: string;
    authorId?: string;
    text: string;
    ago: string;
    upvotes: number;
    mine?: boolean;
  }[];
}

export interface Group {
  id: string;
  name: string;
  members: number;
  tag: string;
  desc: string;
  batch?: string;
  branch?: string;
  type?: "batch" | "department" | "general";
}

export interface Notif {
  id: string;
  group: "Today" | "This Week" | "Earlier";
  title: string;
  body: string;
  icon: "connect" | "job" | "mentor" | "event" | "group" | "chat";
  read: boolean;
  ago: string;
  userId?: string;
  connectionId?: string;
  type?: "connection_request" | "connection_accepted" | "general";
}

export const people: Person[] = [
  {
    id: "alumni-1",
    name: "Rohit Khandelwal",
    email: "rohit.khandelwal@jecrc.ac.in",
    mobile: "+91 98290 11223",
    role: "alumni",
    headline: "Lead Software Architect @ Microsoft",
    branch: "CSE",
    batch: "2017",
    company: "Microsoft",
    city: "Bengaluru",
    color: "#0F2A5E",
    about: "JECRC 2017 CSE Alumnus. Working on Azure distributed systems and large scale cloud infrastructure. Happy to mentor JECRC students for system design and cloud careers.",
    mentor: true,
    domains: ["Cloud Architecture", "System Design", "Distributed Systems", "FAANG Preparation"],
    mentees: 18,
  },
  {
    id: "alumni-2",
    name: "Priya Sharma",
    email: "priya.sharma@jecrc.ac.in",
    mobile: "+91 98290 22334",
    role: "alumni",
    headline: "Senior Product Manager @ Amazon",
    branch: "IT",
    batch: "2018",
    company: "Amazon",
    city: "Hyderabad",
    color: "#0F2A5E",
    about: "JECRC 2018 IT Alumna. Leading e-commerce logistics and customer experience products. Passionate about product strategy, PM interviews, and tech career transitions.",
    mentor: true,
    domains: ["Product Management", "Tech Consulting", "Amazon Interviews", "Agile"],
    mentees: 14,
  },
  {
    id: "alumni-3",
    name: "Gaurav Meena",
    email: "gaurav.meena@jecrc.ac.in",
    mobile: "+91 98290 33445",
    role: "alumni",
    headline: "Senior Backend Engineer @ TCS Digital",
    branch: "CSE",
    batch: "2020",
    company: "TCS Digital",
    city: "Pune",
    color: "#0F2A5E",
    about: "Passionate about high-throughput microservices, Spring Boot, and enterprise data pipelines. Active contributor to JECRC Alumni network.",
    mentor: false,
    domains: ["Java Backend", "Spring Boot", "Enterprise Architecture"],
    mentees: 6,
  },
  {
    id: "alumni-4",
    name: "Ananya Joshi",
    email: "ananya.joshi@jecrc.ac.in",
    mobile: "+91 98290 44556",
    role: "alumni",
    headline: "Cloud DevOps Consultant @ Infosys",
    branch: "ECE",
    batch: "2019",
    company: "Infosys",
    city: "Bengaluru",
    color: "#0F2A5E",
    about: "ECE 2019 Graduate from JECRC. Helping companies scale with Kubernetes, CI/CD pipelines, Terraform, and multi-cloud architectures.",
    mentor: true,
    domains: ["DevOps", "Kubernetes", "AWS & GCP", "ECE to Tech Pivot"],
    mentees: 11,
  },
  {
    id: "alumni-5",
    name: "Vikas Choudhary",
    email: "vikas.choudhary@jecrc.ac.in",
    mobile: "+91 98290 55667",
    role: "alumni",
    headline: "AI/ML Research Engineer @ Celebal Technologies",
    branch: "AIDS",
    batch: "2022",
    company: "Celebal Technologies",
    city: "Jaipur",
    color: "#0F2A5E",
    about: "Specialized in Generative AI, LLM fine-tuning, and Computer Vision solutions. Conduct regular technical workshops for JECRC students.",
    mentor: true,
    domains: ["Machine Learning", "Generative AI", "Python & PyTorch", "AI Research"],
    mentees: 22,
  },
  {
    id: "alumni-6",
    name: "Neha Gupta",
    email: "neha.gupta@jecrc.ac.in",
    mobile: "+91 98290 66778",
    role: "alumni",
    headline: "Full Stack Developer @ Accenture",
    branch: "CSE",
    batch: "2021",
    company: "Accenture",
    city: "Gurgaon",
    color: "#0F2A5E",
    about: "Building scalable web apps with React, Next.js, Node.js, and GraphQL. Always excited to review resumes and share placement referrals.",
    mentor: false,
    domains: ["Frontend Engineering", "React & Next.js", "Full Stack Web"],
    mentees: 8,
  },
  {
    id: "alumni-7",
    name: "Aman Verma",
    email: "aman.verma@jecrc.ac.in",
    mobile: "+91 98290 77889",
    role: "alumni",
    headline: "Data Platform Engineer @ Cognizant",
    branch: "IT",
    batch: "2020",
    company: "Cognizant",
    city: "Noida",
    color: "#0F2A5E",
    about: "Working on Big Data analytics pipelines, Apache Spark, Snowflake, and SQL optimization. JECRC Alumni Foundation contributor.",
    mentor: false,
    domains: ["Data Engineering", "SQL & Spark", "ETL Pipelines"],
    mentees: 5,
  },
  {
    id: "alumni-8",
    name: "Divya Rathore",
    email: "divya.rathore@jecrc.ac.in",
    mobile: "+91 98290 88990",
    role: "alumni",
    headline: "Systems Design Lead @ Pinnacle Infotech",
    branch: "Civil",
    batch: "2018",
    company: "Pinnacle Infotech",
    city: "Jaipur",
    color: "#0F2A5E",
    about: "BIM Specialist and Infrastructure Modeling Lead. Guiding civil engineering students in modern CAD/BIM technologies and international careers.",
    mentor: true,
    domains: ["BIM & Revit", "Civil Tech", "Infrastructure Design", "Project Engineering"],
    mentees: 15,
  },
  {
    id: "alumni-9",
    name: "Kunal Pareek",
    email: "kunal.pareek@jecrc.ac.in",
    mobile: "+91 98290 99001",
    role: "alumni",
    headline: "Senior Consultant @ Wipro",
    branch: "ECE",
    batch: "2019",
    company: "Wipro",
    city: "Pune",
    color: "#0F2A5E",
    about: "Digital transformation consultant assisting Fortune 500 BFSI clients in modernizing legacy architectures.",
    mentor: false,
    domains: ["IT Consulting", "BFSI Tech", "Corporate Strategy"],
    mentees: 4,
  },
  {
    id: "alumni-10",
    name: "Tanmay Mathur",
    email: "tanmay.mathur@jecrc.ac.in",
    mobile: "+91 98290 12345",
    role: "alumni",
    headline: "Core Platform Engineer @ Swiggy",
    branch: "CSE",
    batch: "2021",
    company: "Swiggy",
    city: "Bengaluru",
    color: "#0F2A5E",
    about: "Working on ultra low-latency delivery dispatch algorithms and Go microservices. Happy to mentor on DSA and Competitive Coding.",
    mentor: true,
    domains: ["Golang", "Microservices", "DSA & Algorithms", "Startup Tech"],
    mentees: 19,
  },
  {
    id: "alumni-11",
    name: "Pooja Agarwal",
    email: "pooja.agarwal@jecrc.ac.in",
    mobile: "+91 98290 23456",
    role: "alumni",
    headline: "Senior QA Automation Lead @ Capgemini",
    branch: "IT",
    batch: "2020",
    company: "Capgemini",
    city: "Mumbai",
    color: "#0F2A5E",
    about: "Specialist in Cypress, Selenium, Playwright, and test architecture frameworks. Mentoring students on software testing careers.",
    mentor: false,
    domains: ["QA Automation", "Cypress & Playwright", "SDET Careers"],
    mentees: 7,
  },
  {
    id: "alumni-12",
    name: "Deepak Singh",
    email: "deepak.singh@jecrc.ac.in",
    mobile: "+91 98290 34567",
    role: "alumni",
    headline: "Thermal Design Lead @ L&T Technology",
    branch: "ME",
    batch: "2017",
    company: "L&T Technology Services",
    city: "Jaipur",
    color: "#0F2A5E",
    about: "Leading CFD analysis and thermal structural simulations for aerospace and defense clients. JECRC Mechanical Engineering alumnus.",
    mentor: true,
    domains: ["CFD Analysis", "Ansys & SolidWorks", "Mechanical Design", "GATE / PSU Guidance"],
    mentees: 16,
  },
  {
    id: "student-1",
    name: "Aryan Agarwal",
    email: "aryan.22bcse101@jecrc.ac.in",
    mobile: "+91 98290 45678",
    role: "student",
    headline: "Final Year CSE Scholar · Full Stack & Cloud",
    branch: "CSE",
    batch: "2026",
    city: "Jaipur",
    color: "#2563EB",
    about: "Final year B.Tech Computer Science student at JECRC. Active open-source contributor and President of campus coding chapter. Seeking 2026 SDE graduate roles.",
  },
  {
    id: "student-2",
    name: "Riya Jain",
    email: "riya.23baids204@jecrc.ac.in",
    mobile: "+91 98290 56789",
    role: "student",
    headline: "3rd Year AI & Data Science Scholar",
    branch: "AIDS",
    batch: "2027",
    city: "Jaipur",
    color: "#2563EB",
    about: "3rd year AI & Data Science student. Deeply interested in NLP, Transformers, and Data Science. Winner of JECRC Hackathon 2025.",
  },
  {
    id: "student-3",
    name: "Siddharth Saxena",
    email: "siddharth.23bit308@jecrc.ac.in",
    mobile: "+91 98290 67890",
    role: "student",
    headline: "3rd Year IT Scholar · Mobile & Web Dev",
    branch: "IT",
    batch: "2027",
    city: "Jaipur",
    color: "#2563EB",
    about: "Building cross-platform mobile apps with React Native and Flutter. Exploring modern frontend architectures.",
  },
  {
    id: "student-4",
    name: "Simran Kaur",
    email: "simran.22bece415@jecrc.ac.in",
    mobile: "+91 98290 78901",
    role: "student",
    headline: "Final Year ECE Scholar · Embedded & VLSI",
    branch: "ECE",
    batch: "2026",
    city: "Jaipur",
    color: "#2563EB",
    about: "Electronics & Communication Engineering scholar at JECRC Foundation. Working on embedded IoT automation and FPGA design.",
  },
  {
    id: "student-5",
    name: "Yashraj Rathore",
    email: "yashraj.24bcse512@jecrc.ac.in",
    mobile: "+91 98290 89012",
    role: "student",
    headline: "2nd Year CSE Scholar · Competitive Programmer",
    branch: "CSE",
    batch: "2028",
    city: "Jaipur",
    color: "#2563EB",
    about: "Candidate Master on Codeforces and 4-star on CodeChef. Keen on algorithmic problem solving and backend infrastructure.",
  },
];

export const meAlumni: Person = {
  id: "me",
  name: "JECRC Member",
  role: "alumni",
  headline: "JECRC Network Member",
  branch: "CSE",
  batch: "2024",
  city: "Jaipur",
  color: "#0F2A5E",
  about: "Verified member of JECRC Foundation network.",
};

export const jobs: Job[] = [
  {
    id: "job-1",
    posterId: "alumni-5",
    title: "Associate AI / ML Software Engineer",
    company: "Celebal Technologies",
    location: "Jaipur / Hybrid",
    type: "Full-time",
    mode: "Hybrid",
    pay: "₹7.5 - 11.5 LPA",
    skills: ["Python", "PyTorch", "LLM", "Generative AI", "FastAPI"],
    postedBy: "Vikas Choudhary",
    postedAgo: "2d ago",
    deadline: "30 Apr 2026",
    applicants: 16,
    branch: "CSE & AI-DS",
    desc: "Celebal Technologies is hiring freshers and 2025/2026 batch JECRC graduates for enterprise Generative AI and Machine Learning engineering roles. Direct alumni referral.",
  },
  {
    id: "job-2",
    posterId: "alumni-1",
    title: "Software Development Engineer - 1 (Cloud Backend)",
    company: "Microsoft",
    location: "Bengaluru / Hyderabad",
    type: "Full-time",
    mode: "Hybrid",
    pay: "₹18 - 24 LPA",
    skills: ["C# / Java", "Distributed Systems", "Cloud", "Data Structures"],
    postedBy: "Rohit Khandelwal",
    postedAgo: "4d ago",
    deadline: "15 May 2026",
    applicants: 34,
    branch: "CSE / IT / ECE",
    desc: "Open referral for JECRC alumni and final year graduates with strong DSA fundamentals and passion for building scalable distributed cloud infrastructure.",
  },
  {
    id: "job-3",
    posterId: "alumni-6",
    title: "Full Stack React / Node Developer",
    company: "Accenture",
    location: "Gurgaon / Noida",
    type: "Full-time",
    mode: "Hybrid",
    pay: "₹6.5 - 9.5 LPA",
    skills: ["React", "Node.js", "TypeScript", "SQL", "Tailwind CSS"],
    postedBy: "Neha Gupta",
    postedAgo: "1w ago",
    deadline: "20 May 2026",
    applicants: 21,
    branch: "All Branches",
    desc: "Accenture Digital transformation team is expanding. Seeking engineers with solid web development experience in modern React and Node stack.",
  },
  {
    id: "job-4",
    posterId: "alumni-2",
    title: "Product Operations Analyst Intern",
    company: "Amazon",
    location: "Hyderabad / Remote",
    type: "Internship",
    mode: "Remote",
    pay: "₹35,000 / month",
    skills: ["Product Strategy", "SQL", "Excel Analytics", "User Research"],
    postedBy: "Priya Sharma",
    postedAgo: "3d ago",
    deadline: "10 May 2026",
    applicants: 29,
    branch: "Open to All",
    desc: "6-month product analytics and operations internship at Amazon. Opportunity to work closely with senior PMs on customer delivery optimizations.",
  },
];

export const threads: Thread[] = [
  {
    id: "thread-1",
    title: "Placement Preparation Playbook: What top tech companies expect from 2026 & 2027 batch students",
    category: "Career",
    author: "Rohit Khandelwal",
    authorId: "alumni-1",
    authorRole: "alumni",
    upvotes: 42,
    ago: "2d",
    body: "Sharing the step-by-step roadmap that helped me and many JECRC juniors clear technical interviews: 1. Core DSA (Leetcode blind 75), 2. CS Fundamentals (OS, DBMS, Computer Networks), 3. At least 2 full-stack projects with live deployment. Feel free to ask your questions below!",
    replies: [
      {
        id: "rep-1",
        author: "Aryan Agarwal",
        authorId: "student-1",
        text: "Thank you Rohit sir! How much system design is asked for fresher SDE-1 roles?",
        ago: "1d",
        upvotes: 8,
      },
      {
        id: "rep-2",
        author: "Rohit Khandelwal",
        authorId: "alumni-1",
        text: "For freshers, focus mostly on Low-Level Design (OOP principles, Design Patterns like Factory/Singleton) and basic High-Level concepts like API design and caching.",
        ago: "18h",
        upvotes: 12,
      },
    ],
  },
  {
    id: "thread-2",
    title: "Guidelines for requesting Alumni Referrals: How to write impactful cold emails and DMs",
    category: "Referrals",
    author: "Priya Sharma",
    authorId: "alumni-2",
    authorRole: "alumni",
    upvotes: 38,
    ago: "4d",
    body: "When reaching out to alumni for job referrals: 1. Always include the exact Job ID and link, 2. Attach a 1-page clean PDF resume, 3. Highlight top 3 matching skills. Keep it brief and polite!",
    replies: [
      {
        id: "rep-3",
        author: "Riya Jain",
        authorId: "student-2",
        text: "Super helpful tip ma'am! Should we also include GitHub/LinkedIn links in the message?",
        ago: "2d",
        upvotes: 5,
      },
    ],
  },
  {
    id: "thread-3",
    title: "AI & Data Science Workshop Series for JECRC Students (Hands-on LLM & Python)",
    category: "Events",
    author: "Vikas Choudhary",
    authorId: "alumni-5",
    authorRole: "alumni",
    upvotes: 27,
    ago: "5d",
    body: "Excited to announce an upcoming 3-part weekend workshop on building Generative AI agents and deploying LLMs on cloud. Open to all JECRC students. Drop a comment if you'd like to join!",
    replies: [],
  },
];

const generateBatchGroups = (): Group[] => {
  const list: Group[] = [];
  for (let y = 2004; y <= 2030; y++) {
    list.push({
      id: `batch-${y}`,
      name: `Class of ${y} (Batch ${y})`,
      members: 0,
      tag: "Batch",
      type: "batch",
      batch: String(y),
      desc: `Official JECRC Foundation alumni & student group for the Class of ${y} (Passout Batch ${y}). Connect with your batchmates, share milestones and stay in touch.`,
    });
  }
  return list;
};

const departmentCommunities: Group[] = [
  {
    id: "dept-cse",
    name: "CSE Department Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "CSE",
    desc: "Official Community for Computer Science & Engineering students and alumni of JECRC Foundation.",
  },
  {
    id: "dept-csai",
    name: "CSAI Department Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "CSAI",
    desc: "Official Community for Computer Science & Artificial Intelligence (CSAI) at JECRC Foundation.",
  },
  {
    id: "dept-aids",
    name: "AIDS Department Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "AIDS",
    desc: "Official Community for Artificial Intelligence & Data Science (AIDS) at JECRC Foundation.",
  },
  {
    id: "dept-it",
    name: "Information Technology (IT) Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "IT",
    desc: "Official Community for Information Technology students and alumni of JECRC Foundation.",
  },
  {
    id: "dept-ece",
    name: "Electronics & Communication (ECE) Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "ECE",
    desc: "Official Community for Electronics & Communication Engineering at JECRC Foundation.",
  },
  {
    id: "dept-me",
    name: "Mechanical Engineering (ME) Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "ME",
    desc: "Official Community for Mechanical Engineering students and alumni of JECRC Foundation.",
  },
  {
    id: "dept-ee",
    name: "Electrical Engineering (EE) Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "EE",
    desc: "Official Community for Electrical Engineering students and alumni of JECRC Foundation.",
  },
  {
    id: "dept-civil",
    name: "Civil Engineering Community",
    members: 0,
    tag: "Department",
    type: "department",
    branch: "Civil",
    desc: "Official Community for Civil Engineering students and alumni of JECRC Foundation.",
  },
];

export const groups: Group[] = [
  ...generateBatchGroups(),
  ...departmentCommunities,
];

export const notifs: Notif[] = [];

export const categories = ["All", "Career", "Referrals", "Higher Studies", "Startups", "Campus Life", "Events"];

export const repliesPool: string[] = [];

export interface SeedMsg {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
}

export const seedChats: { userId: string; online: boolean; unread: number; locked?: boolean; msgs: SeedMsg[] }[] = [];
