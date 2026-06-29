import { db } from "./db";
import type {
  Application,
  BusinessProfile,
  Faq,
  Job,
  KnowledgeArticle,
  Notification,
  Page,
  QueryParams,
  Subscription,
  SubscriptionPlan,
  SupportTicket,
  TicketMessage,
  User,
  VerificationDoc,
} from "./types";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function paginate<T extends Record<string, any>>(
  rows: T[],
  params: QueryParams,
  searchFields: (keyof T)[],
): Page<T> {
  const { page = 1, pageSize = 10, search, sortBy, sortDir = "asc", filters = {} } = params;
  let out = rows.slice();
  if (search?.trim()) {
    const q = search.toLowerCase();
    out = out.filter((r) => searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q)));
  }
  for (const [k, v] of Object.entries(filters)) {
    if (v == null || v === "" || v === "all") continue;
    out = out.filter((r) => String(r[k as keyof T] ?? "") === v);
  }
  if (sortBy) {
    out.sort((a, b) => {
      const av = a[sortBy as keyof T];
      const bv = b[sortBy as keyof T];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }
  const total = out.length;
  const start = (page - 1) * pageSize;
  return { data: out.slice(start, start + pageSize), total, page, pageSize };
}

export const api = {
  async login(email: string, password: string) {
    await delay(400);
    if (!email || password.length < 4) throw new Error("Invalid credentials");
    return { sessionId: "sess_" + Math.random().toString(36).slice(2, 10), email };
  },
  async verifyOtp(sessionId: string, otp: string) {
    await delay(400);
    if (sessionId.length < 5) throw new Error("Session expired");
    if (otp !== "123456" && !/^\d{6}$/.test(otp)) throw new Error("Invalid OTP");
    if (otp !== "123456") throw new Error("Incorrect OTP. Hint: 123456");
    return { token: "tok_" + Math.random().toString(36).slice(2), user: { name: "Admin User", email: "admin@rozgo.com", role: "admin" as const } };
  },

  async stats() {
    await delay();
    return {
      activeCandidates: db.users.filter((u) => u.role === "seeker" && !u.isBlocked).length,
      premiumEnterprises: db.businessProfiles.filter((b) => b.isPremium).length,
      openJobs: db.jobs.filter((j) => j.status === "Open").length,
      openTickets: db.tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length,
      activeSubscriptions: db.subscriptions.filter((s) => s.status === "active").length,
      pendingVerifications: db.businessProfiles.reduce((n, b) => n + b.verificationDocuments.filter((d) => d.status === "Pending").length, 0),
    };
  },
  async chartTrends() {
    await delay();
    return Array.from({ length: 12 }, (_, i) => ({
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
      candidates: 40 + ((i * 17) % 60),
      jobs: 20 + ((i * 11) % 40),
      hires: 5 + ((i * 5) % 20),
    }));
  },

  async listUsers(p: QueryParams) { await delay(); return paginate(db.users, p, ["email","fullName","phone"]); },
  async toggleUserBlock(userId: string) {
    await delay();
    const u = db.users.find((x) => x._id === userId);
    if (!u) throw new Error("Not found");
    u.isBlocked = !u.isBlocked;
    return u;
  },
  async toggleUserVerified(userId: string) {
    await delay();
    const u = db.users.find((x) => x._id === userId);
    if (!u) throw new Error("Not found");
    u.isVerified = !u.isVerified;
    return u;
  },
  async getSeekerProfile(userId: string) {
    await delay();
    return db.seekerProfiles.find((s) => s.userId === userId) ?? null;
  },

  async listBusinesses(p: QueryParams) {
    await delay();
    const rows = db.businessProfiles.map((b) => {
      const u = db.users.find((x) => x._id === b.userId)!;
      const pending = b.verificationDocuments.filter((d) => d.status === "Pending").length;
      return { ...b, ownerName: u.fullName, ownerEmail: u.email, pendingDocs: pending };
    });
    return paginate(rows, p, ["companyName","industry","ownerName","ownerEmail"]);
  },
  async getBusiness(id: string): Promise<(BusinessProfile & { ownerName: string; ownerEmail: string }) | null> {
    await delay();
    const b = db.businessProfiles.find((x) => x._id === id);
    if (!b) return null;
    const u = db.users.find((x) => x._id === b.userId)!;
    return { ...b, ownerName: u.fullName, ownerEmail: u.email };
  },
  async setDocStatus(businessId: string, docId: string, status: VerificationDoc["status"]) {
    await delay();
    const b = db.businessProfiles.find((x) => x._id === businessId);
    const d = b?.verificationDocuments.find((x) => x._id === docId);
    if (!d) throw new Error("Not found");
    d.status = status;
    return d;
  },

  async listJobs(p: QueryParams) { await delay(); return paginate(db.jobs, p, ["title","companyName","category","location"]); },
  async listApplications(p: QueryParams & { jobId?: string }) {
    await delay();
    let rows: Application[] = db.applications;
    if (p.jobId) rows = rows.filter((a) => a.jobId === p.jobId);
    return paginate(rows, p, ["jobTitle","seekerName"]);
  },
  async getApplication(id: string) { await delay(); return db.applications.find((a) => a._id === id) ?? null; },

  async listTickets(p: QueryParams) { await delay(); return paginate(db.tickets, p, ["subject","userName","category"]); },
  async getTicket(id: string) { await delay(); return db.tickets.find((t) => t._id === id) ?? null; },
  async replyTicket(id: string, body: string) {
    await delay();
    const t = db.tickets.find((x) => x._id === id);
    if (!t) throw new Error("Not found");
    const msg: TicketMessage = {
      _id: "msg_" + Math.random().toString(36).slice(2, 8),
      authorId: "admin",
      authorName: "Admin",
      authorRole: "admin",
      body,
      createdAt: new Date().toISOString(),
    };
    t.messages.push(msg);
    return msg;
  },
  async updateTicket(id: string, patch: Partial<Pick<SupportTicket, "status" | "priority" | "assignedTo">>) {
    await delay();
    const t = db.tickets.find((x) => x._id === id);
    if (!t) throw new Error("Not found");
    Object.assign(t, patch);
    return t;
  },

  async listFaqs(p: QueryParams) { await delay(); return paginate(db.faqs, p, ["question","answer"]); },
  async saveFaq(input: Partial<Faq> & { _id?: string }) {
    await delay();
    if (input._id) {
      const f = db.faqs.find((x) => x._id === input._id);
      if (!f) throw new Error("Not found");
      Object.assign(f, input);
      return f;
    }
    const f: Faq = {
      _id: "faq_" + Math.random().toString(36).slice(2, 8),
      question: input.question ?? "",
      answer: input.answer ?? "",
      targetRole: input.targetRole ?? "all",
      order: input.order ?? db.faqs.length + 1,
      isActive: input.isActive ?? true,
    };
    db.faqs.push(f);
    return f;
  },
  async deleteFaq(id: string) {
    await delay();
    const i = db.faqs.findIndex((x) => x._id === id);
    if (i >= 0) db.faqs.splice(i, 1);
    return true;
  },

  async listKb(p: QueryParams) { await delay(); return paginate(db.kb, p, ["title","slug","guideType"]); },
  async saveKb(input: Partial<KnowledgeArticle> & { _id?: string }) {
    await delay();
    if (input._id) {
      const a = db.kb.find((x) => x._id === input._id);
      if (!a) throw new Error("Not found");
      Object.assign(a, input, { updatedAt: new Date().toISOString() });
      return a;
    }
    const a: KnowledgeArticle = {
      _id: "kb_" + Math.random().toString(36).slice(2, 8),
      title: input.title ?? "",
      slug: input.slug ?? "",
      guideType: input.guideType ?? "Onboarding",
      content: input.content ?? "",
      mediaAssets: input.mediaAssets ?? [],
      isPublished: input.isPublished ?? false,
      updatedAt: new Date().toISOString(),
    };
    db.kb.push(a);
    return a;
  },
  async deleteKb(id: string) {
    await delay();
    const i = db.kb.findIndex((x) => x._id === id);
    if (i >= 0) db.kb.splice(i, 1);
    return true;
  },

  async listPlans(p: QueryParams) { await delay(); return paginate(db.plans, p, ["name"]); },
  async savePlan(input: Partial<SubscriptionPlan> & { _id?: string }) {
    await delay();
    if (input._id) {
      const p = db.plans.find((x) => x._id === input._id);
      if (!p) throw new Error("Not found");
      Object.assign(p, input);
      return p;
    }
    const plan: SubscriptionPlan = {
      _id: "pln_" + Math.random().toString(36).slice(2, 8),
      name: input.name ?? "Untitled",
      price: input.price ?? 0,
      currency: input.currency ?? "INR",
      billingCycle: input.billingCycle ?? "monthly",
      features: input.features ?? [],
      isActive: input.isActive ?? true,
    };
    db.plans.push(plan);
    return plan;
  },
  async listSubscriptions(p: QueryParams) { await delay(); return paginate(db.subscriptions, p, ["userName","planName","transactionId"]); },

  async listNotifications(p: QueryParams) { await delay(); return paginate(db.notifications, p, ["title","body"]); },
  async sendNotification(input: Omit<Notification, "_id" | "sentAt">) {
    await delay();
    const n: Notification = {
      _id: "ntf_" + Math.random().toString(36).slice(2, 8),
      sentAt: new Date().toISOString(),
      ...input,
    };
    db.notifications.unshift(n);
    return n;
  },

  async listAudit(p: QueryParams) { await delay(); return paginate(db.audit, p, ["action","targetEntity","userName","ip"]); },
};

export type Api = typeof api;
