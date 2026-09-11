import { Role, ConnectionStatus, MentorshipStatus, MessageStatus, PostType, GroupRole, GroupType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

export class InMemoryDb {
  users: any[] = [];
  studentDetails: any[] = [];
  alumniDetails: any[] = [];
  mentorProfiles: any[] = [];
  posts: any[] = [];
  discussionThreads: any[] = [];
  discussionReplies: any[] = [];
  discussionUpvotes: any[] = [];
  groups: any[] = [];
  groupMemberships: any[] = [];
  connections: any[] = [];
  mentorshipRequests: any[] = [];
  messages: any[] = [];
  notifications: any[] = [];
  otpVerifications: any[] = [];
  deviceTokens: any[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Admin
    this.users.push({
      id: 'u-admin-1',
      name: 'JECRC Alumni Cell Admin',
      email: 'admin@jecrc.ac.in',
      mobile: '+919999900000',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      isVerified: true,
      bio: 'JECRC Foundation Alumni Relations & Placement Directorate',
      city: 'Jaipur',
      profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      publicKey: 'admin-public-key',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Alumni - Aarav Mehta
    this.users.push({
      id: 'u-alumni-1',
      name: 'Aarav Mehta',
      email: 'aarav.mehta@jecrc.ac.in',
      mobile: '+919811122233',
      passwordHash: defaultPasswordHash,
      role: Role.ALUMNI,
      isVerified: true,
      bio: 'Staff Engineer at Google | Cloud Infrastructure & Distributed Systems',
      city: 'Bengaluru',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      publicKey: 'dGhpcy1pcy1hYXJhdnMteDI1NTE5LXB1YmxpYy1rZXk=',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.alumniDetails.push({
      id: 'ad-1',
      userId: 'u-alumni-1',
      branch: 'Computer Science and Engineering',
      batch: '2016-2020',
      passoutYear: 2020,
      currentCompany: 'Google',
      designation: 'Staff Software Engineer',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.mentorProfiles.push({
      id: 'mp-1',
      userId: 'u-alumni-1',
      domains: ['Cloud Architecture', 'Distributed Systems', 'FAANG Interview Prep'],
      bio: 'Passionate about mentoring juniors on high-scale systems and career planning.',
      availability: '2 sessions per month (45m)',
      maxMentees: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Alumni - Pooja Iyer
    this.users.push({
      id: 'u-alumni-2',
      name: 'Pooja Iyer',
      email: 'pooja.iyer@jecrc.ac.in',
      mobile: '+919822233344',
      passwordHash: defaultPasswordHash,
      role: Role.ALUMNI,
      isVerified: true,
      bio: 'Product Lead at Stripe | FinTech & API Ecosystems',
      city: 'San Francisco',
      profilePicUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
      publicKey: 'dGhpcy1pcy1wb29qYXMteDI1NTE5LXB1YmxpYy1rZXk=',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.alumniDetails.push({
      id: 'ad-2',
      userId: 'u-alumni-2',
      branch: 'Information Technology',
      batch: '2015-2019',
      passoutYear: 2019,
      currentCompany: 'Stripe',
      designation: 'Lead Product Manager',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.mentorProfiles.push({
      id: 'mp-2',
      userId: 'u-alumni-2',
      domains: ['Product Strategy', 'FinTech APIs', 'Study Abroad & MS Guidance'],
      bio: 'Mentoring aspiring PMs and engineers navigating international careers.',
      availability: 'Alternate weekends',
      maxMentees: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Alumni - Rohan Verma
    this.users.push({
      id: 'u-alumni-3',
      name: 'Rohan Verma',
      email: 'rohan.verma@jecrc.ac.in',
      mobile: '+919833344455',
      passwordHash: defaultPasswordHash,
      role: Role.ALUMNI,
      isVerified: true,
      bio: 'VP Engineering at Razorpay | Fintech Scaling & Banking APIs',
      city: 'Bengaluru',
      profilePicUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      publicKey: 'dGhpcy1pcy1yb2hhbnMteDI1NTE5LXB1YmxpYy1rZXk=',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.alumniDetails.push({
      id: 'ad-3',
      userId: 'u-alumni-3',
      branch: 'Computer Science and Engineering',
      batch: '2014-2018',
      passoutYear: 2018,
      currentCompany: 'Razorpay',
      designation: 'VP of Engineering',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Student - Kabir Sen
    this.users.push({
      id: 'u-student-1',
      name: 'Kabir Sen',
      email: 'kabir.sen@jecrc.ac.in',
      mobile: '+919855566677',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      isVerified: true,
      bio: 'Final Year CSE Student | Open Source Contributor & Full Stack Dev',
      city: 'Jaipur',
      profilePicUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      publicKey: 'dGhpcy1pcy1rYWJpcnMteDI1NTE5LXB1YmxpYy1rZXk=',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.studentDetails.push({
      id: 'sd-1',
      userId: 'u-student-1',
      branch: 'Computer Science and Engineering',
      currentYear: 4,
      expectedPassoutYear: 2026,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 6. Student - Riya Patel
    this.users.push({
      id: 'u-student-2',
      name: 'Riya Patel',
      email: 'riya.patel@jecrc.ac.in',
      mobile: '+919866677788',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      isVerified: true,
      bio: 'Pre-final Year AI/DS Enthusiast | Kaggle Competitor & Research Scholar',
      city: 'Jaipur',
      profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      publicKey: 'dGhpcy1pcy1yaXlhcy14MjU1MTktcHVibGljLWtleQ==',
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.studentDetails.push({
      id: 'sd-2',
      userId: 'u-student-2',
      branch: 'Artificial Intelligence and Data Science',
      currentYear: 3,
      expectedPassoutYear: 2027,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 7. Pre-seeded Unclaimed Alumnus - Rohit Sharma
    this.users.push({
      id: 'u-unclaimed-alumni',
      name: 'Rohit Sharma',
      email: 'rohit.sharma@jecrc.ac.in',
      mobile: '+919876500001',
      passwordHash: defaultPasswordHash,
      role: Role.ALUMNI,
      isVerified: false,
      bio: 'Staff Software Engineer at Google | Cloud Infrastructure',
      city: 'Gurugram',
      profilePicUrl: null,
      publicKey: null,
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.alumniDetails.push({
      id: 'ad-unclaimed',
      userId: 'u-unclaimed-alumni',
      branch: 'Computer Science and Engineering',
      batch: '2019',
      passoutYear: 2019,
      currentCompany: 'Google',
      designation: 'Staff Software Engineer',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 8. Pre-seeded Unclaimed Student - Ananya Gupta
    this.users.push({
      id: 'u-unclaimed-student',
      name: 'Ananya Gupta',
      email: 'ananya.gupta@jecrc.ac.in',
      mobile: '+919876500002',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      isVerified: false,
      bio: '3rd Year IT Student | Fullstack Dev & Competitive Coding',
      city: 'Jaipur',
      profilePicUrl: null,
      publicKey: null,
      refreshTokenHash: null,
      hideLastSeen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.studentDetails.push({
      id: 'sd-unclaimed',
      userId: 'u-unclaimed-student',
      branch: 'Information Technology',
      batch: '2026',
      enrollmentNo: 'JECRC/22/IT/042',
      currentYear: 3,
      expectedPassoutYear: 2026,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Posts / Jobs
    this.posts.push({
      id: 'p-job-1',
      userId: 'u-alumni-1',
      type: PostType.JOB,
      title: 'Senior Backend Engineer — Cloud Native Platforms',
      company: 'Google',
      location: 'Bengaluru / Hybrid',
      description: 'Hiring for Google Cloud Engineering team. 3+ years experience with Go/Java and Kubernetes required. JECRC alumni get direct referral priority.',
      attachmentUrl: null,
      reportCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 24),
    });
    this.posts.push({
      id: 'p-job-2',
      userId: 'u-alumni-3',
      type: PostType.INTERNSHIP,
      title: 'Backend Engineering Intern (Summer 2026)',
      company: 'Razorpay',
      location: 'Bengaluru (Onsite)',
      description: '6-month paid internship with PPO opportunity. Work with our core payments team processing billions in volume.',
      attachmentUrl: null,
      reportCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 12),
    });

    // Seed Discussions
    this.discussionThreads.push({
      id: 'd-thread-1',
      userId: 'u-alumni-1',
      title: 'How to transition from Campus Placements to FAANG / Top Tech within 2 years',
      description: 'Many students ask about high-scale system design vs DSA. Here is my roadmap on open-source contributions, distributed caching, and cracking L4/L5 interviews.',
      category: 'Career Guidance',
      groupId: null,
      reportCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 48),
      updatedAt: new Date(Date.now() - 3600000 * 48),
    });
    this.discussionReplies.push({
      id: 'd-reply-1',
      threadId: 'd-thread-1',
      userId: 'u-student-1',
      content: 'This roadmap is invaluable Aarav sir! Could you also share recommendations for distributed systems books?',
      createdAt: new Date(Date.now() - 3600000 * 30),
      updatedAt: new Date(Date.now() - 3600000 * 30),
    });

    // Seed Groups
    this.groups.push({
      id: 'g-batch-2020',
      name: 'JECRC Batch of 2020 Alumni',
      description: 'Official group for JECRC Foundation alumni graduated in 2020.',
      type: GroupType.BATCH,
      batchYear: 2020,
      createdById: 'u-admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.groups.push({
      id: 'g-tech-cloud',
      name: 'Cloud & DevOps Professionals',
      description: 'Alumni and students passionate about AWS, GCP, Kubernetes, and Platform Engineering.',
      type: GroupType.INTEREST,
      batchYear: null,
      createdById: 'u-alumni-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Connections
    this.connections.push({
      id: 'c-1',
      requesterId: 'u-student-1',
      receiverId: 'u-alumni-1',
      status: ConnectionStatus.ACCEPTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.connections.push({
      id: 'c-2',
      requesterId: 'u-student-1',
      receiverId: 'u-alumni-2',
      status: ConnectionStatus.ACCEPTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.connections.push({
      id: 'c-3',
      requesterId: 'u-student-1',
      receiverId: 'u-alumni-3',
      status: ConnectionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generic delegate creator
  makeDelegate(collectionName: keyof InMemoryDb, relationsMap: Record<string, { collection: keyof InMemoryDb; foreignKey: string; single?: boolean }> = {}) {
    const db = this;
    return {
      async findUnique(args: any) {
        return (await this.findFirst(args)) || null;
      },
      async findFirst(args: any = {}) {
        const list = (db[collectionName] as any[]);
        let filtered = list.filter((item) => db.matchesWhere(item, args.where));
        if (args.orderBy) {
          filtered = db.applyOrderBy(filtered, args.orderBy);
        }
        const found = filtered[0];
        if (!found) return null;
        return db.expandRelations(found, args.include || args.select, relationsMap);
      },
      async findMany(args: any = {}) {
        const list = (db[collectionName] as any[]);
        let filtered = list.filter((item) => db.matchesWhere(item, args.where));
        if (args.orderBy) {
          filtered = db.applyOrderBy(filtered, args.orderBy);
        }
        if (args.skip) {
          filtered = filtered.slice(args.skip);
        }
        if (args.take) {
          filtered = filtered.slice(0, args.take);
        }
        return filtered.map((item) => db.expandRelations(item, args.include || args.select, relationsMap));
      },
      async create(args: any) {
        const list = (db[collectionName] as any[]);
        const data = { ...args.data };
        if (!data.id) {
          data.id = `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        data.createdAt = data.createdAt || new Date();
        data.updatedAt = data.updatedAt || new Date();

        // Handle nested create
        for (const [key, relConfig] of Object.entries(relationsMap)) {
          if (data[key]?.create) {
            const nestedData = {
              ...data[key].create,
              id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              [relConfig.foreignKey]: data.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            (db[relConfig.collection] as any[]).push(nestedData);
            delete data[key];
          }
        }

        list.push(data);
        return db.expandRelations(data, args.include, relationsMap);
      },
      async update(args: any) {
        const list = (db[collectionName] as any[]);
        const idx = list.findIndex((item) => db.matchesWhere(item, args.where));
        if (idx === -1) return null;
        const current = list[idx];
        const updated = { ...current, ...args.data, updatedAt: new Date() };
        list[idx] = updated;
        return db.expandRelations(updated, args.include, relationsMap);
      },
      async upsert(args: any) {
        const existing = await this.findFirst({ where: args.where });
        if (existing) {
          return await this.update({ where: args.where, data: args.update, include: args.include });
        } else {
          return await this.create({ data: { ...args.where, ...args.create }, include: args.include });
        }
      },
      async delete(args: any) {
        const list = (db[collectionName] as any[]);
        const idx = list.findIndex((item) => db.matchesWhere(item, args.where));
        if (idx === -1) return null;
        const removed = list.splice(idx, 1)[0];
        return removed;
      },
      async deleteMany(args: any = {}) {
        const list = (db[collectionName] as any[]);
        const before = list.length;
        if (!args.where || Object.keys(args.where).length === 0) {
          db[collectionName] = [] as any;
          return { count: before };
        }
        const remaining = list.filter((item) => !db.matchesWhere(item, args.where));
        db[collectionName] = remaining as any;
        return { count: before - remaining.length };
      },
      async count(args: any = {}) {
        const list = (db[collectionName] as any[]);
        return list.filter((item) => db.matchesWhere(item, args.where)).length;
      },
    };
  }

  private matchesWhere(item: any, where?: any): boolean {
    if (!where) return true;
    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;
      if (key === 'OR' && Array.isArray(val)) {
        const matchesOr = val.some((subWhere) => this.matchesWhere(item, subWhere));
        if (!matchesOr) return false;
        continue;
      }
      if (key === 'AND' && Array.isArray(val)) {
        const matchesAnd = val.every((subWhere) => this.matchesWhere(item, subWhere));
        if (!matchesAnd) return false;
        continue;
      }
      if (key === 'NOT' && typeof val === 'object') {
        if (this.matchesWhere(item, val)) return false;
        continue;
      }
      const itemVal = item[key];
      if (typeof val === 'object' && val !== null) {
        if ('equals' in val && itemVal !== val.equals) return false;
        if ('not' in val && itemVal === val.not) return false;
        if ('contains' in val) {
          const mode = (val as any).mode === 'insensitive';
          const needle = mode ? String((val as any).contains).toLowerCase() : String((val as any).contains);
          const haystack = mode ? String(itemVal || '').toLowerCase() : String(itemVal || '');
          if (!haystack.includes(needle)) return false;
        }
        if ('in' in val && Array.isArray(val.in) && !val.in.includes(itemVal)) return false;
        if ('notIn' in val && Array.isArray(val.notIn) && val.notIn.includes(itemVal)) return false;
        if ('gt' in val && !(itemVal > val.gt)) return false;
        if ('gte' in val && !(itemVal >= val.gte)) return false;
        if ('lt' in val && !(itemVal < val.lt)) return false;
        if ('lte' in val && !(itemVal <= val.lte)) return false;
      } else {
        if (itemVal !== val) return false;
      }
    }
    return true;
  }

  private applyOrderBy(list: any[], orderBy: any) {
    const copy = [...list];
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
    for (const entry of entries) {
      for (const [field, direction] of Object.entries(entry)) {
        const dir = direction === 'desc' ? -1 : 1;
        copy.sort((a, b) => {
          if (a[field] < b[field]) return -1 * dir;
          if (a[field] > b[field]) return 1 * dir;
          return 0;
        });
      }
    }
    return copy;
  }

  private expandRelations(item: any, include: any, relationsMap: Record<string, { collection: keyof InMemoryDb; foreignKey: string; single?: boolean }>) {
    if (!include || !item) return item;
    const result = { ...item };
    for (const [relName, includeVal] of Object.entries(include)) {
      if (!includeVal) continue;
      const relConfig = relationsMap[relName];
      if (relConfig) {
        const relCollection = (this[relConfig.collection] as any[]);
        if (relConfig.single) {
          const related = relCollection.find((r) => r[relConfig.foreignKey] === item.id || r.id === item[relConfig.foreignKey]);
          result[relName] = related || null;
        } else {
          result[relName] = relCollection.filter((r) => r[relConfig.foreignKey] === item.id);
        }
      }
      if (relName === '_count') {
        const countObj: Record<string, number> = {};
        if (typeof includeVal === 'object' && 'select' in (includeVal as any)) {
          for (const countField of Object.keys((includeVal as any).select)) {
            const relConfigForCount = relationsMap[countField];
            if (relConfigForCount) {
              const relCollection = (this[relConfigForCount.collection] as any[]);
              countObj[countField] = relCollection.filter((r) => r[relConfigForCount.foreignKey] === item.id).length;
            } else {
              countObj[countField] = 0;
            }
          }
        }
        result._count = countObj;
      }
    }
    return result;
  }
}
