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
  jobApplications: any[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Database initialized 100% clean — zero fake or demo users. Only real user data lives here.
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
        if (collectionName === 'users' && data.email) {
          const normEmail = String(data.email).trim().toLowerCase();
          const exists = (db.users as any[]).find(
            (u) => u.email && String(u.email).trim().toLowerCase() === normEmail,
          );
          if (exists) {
            throw new Error(`Unique constraint failed on the constraint: 'users_email_key'. User with email '${data.email}' already exists.`);
          }
        }
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
      async updateMany(args: any) {
        const list = (db[collectionName] as any[]);
        let count = 0;
        list.forEach((item, idx) => {
          if (db.matchesWhere(item, args.where)) {
            list[idx] = { ...item, ...args.data, updatedAt: new Date() };
            count++;
          }
        });
        return { count };
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
      if (key === 'email' && typeof val === 'string' && typeof itemVal === 'string') {
        if (itemVal.trim().toLowerCase() !== val.trim().toLowerCase()) return false;
        continue;
      }
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
