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

export const people: Person[] = [];

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

export const jobs: Job[] = [];

export const threads: Thread[] = [];

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
