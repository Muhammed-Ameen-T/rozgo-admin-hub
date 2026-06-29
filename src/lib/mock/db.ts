import type {
  Application,
  AuditLog,
  BusinessProfile,
  Faq,
  Job,
  KnowledgeArticle,
  Notification,
  SeekerProfile,
  Subscription,
  SubscriptionPlan,
  SupportTicket,
  User,
} from "./types";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const id = (p: string, n: number) => `${p}_${String(n).padStart(4, "0")}`;

const first = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Diya", "Anaya", "Sara", "Kabir", "Riya", "Aryan", "Mira", "Zara", "Noah", "Liam", "Emma", "Olivia"];
const last = ["Sharma", "Verma", "Iyer", "Khan", "Patel", "Singh", "Kumar", "Das", "Roy", "Mehta", "Smith", "Jones", "Garcia", "Brown"];
const companies = ["Acme Corp", "NorthPeak Labs", "OrbitWave", "Lumen AI", "Verdant Foods", "BluePine Holdings", "Echo Logistics", "Quantum Bay", "Forge & Fern", "Atlas Hire"];
const industries = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Logistics"];
const cats = ["Engineering", "Design", "Sales", "Marketing", "Operations", "Support", "Finance", "HR"];
const cities = ["Mumbai", "Bengaluru", "Delhi", "Pune", "Hyderabad", "Chennai", "Remote"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

const users: User[] = Array.from({ length: 60 }, (_, i) => ({
  _id: id("usr", i + 1),
  email: `${first[i % first.length].toLowerCase()}.${last[i % last.length].toLowerCase()}${i}@example.com`,
  fullName: `${pick(first, i)} ${pick(last, i + 3)}`,
  role: i % 5 === 0 ? "business" : "seeker",
  phone: `+91 9${String(800000000 + i * 1234).slice(0, 9)}`,
  isBlocked: i % 17 === 0,
  isVerified: i % 3 !== 0,
  createdAt: daysAgo(i * 2),
}));

const seekerProfiles: SeekerProfile[] = users
  .filter((u) => u.role === "seeker")
  .map((u, i) => ({
    _id: id("skr", i + 1),
    userId: u._id,
    resumeUrl: `https://files.example.com/resumes/${u._id}.pdf`,
    resumeName: `${u.fullName.replace(" ", "_")}_Resume.pdf`,
    headline: pick(["Senior Developer", "Product Designer", "Sales Lead", "Marketing Manager", "Data Analyst"], i),
    skills: ["TypeScript", "React", "Node.js", "SQL", "Figma"].slice(0, (i % 4) + 2),
    experienceYears: (i % 12) + 1,
    location: pick(cities, i),
  }));

const businessProfiles: BusinessProfile[] = users
  .filter((u) => u.role === "business")
  .map((u, i) => ({
    _id: id("biz", i + 1),
    userId: u._id,
    companyName: pick(companies, i),
    industry: pick(industries, i),
    website: `https://${pick(companies, i).toLowerCase().replace(/[^a-z]/g, "")}.com`,
    isPremium: i % 2 === 0,
    verificationDocuments: [
      { _id: id("doc", i * 3 + 1), docType: "GST Certificate", docUrl: "https://files.example.com/gst.pdf", originalName: "gst_certificate.pdf", status: "Pending", uploadedAt: daysAgo(i) },
      { _id: id("doc", i * 3 + 2), docType: "Company PAN", docUrl: "https://files.example.com/pan.pdf", originalName: "company_pan.pdf", status: i % 2 ? "Approved" : "Pending", uploadedAt: daysAgo(i + 1) },
      { _id: id("doc", i * 3 + 3), docType: "Incorporation", docUrl: "https://files.example.com/inc.pdf", originalName: "incorporation_doc.pdf", status: i % 3 === 0 ? "Rejected" : "Pending", uploadedAt: daysAgo(i + 2) },
    ],
    createdAt: u.createdAt,
  }));

const jobs: Job[] = Array.from({ length: 45 }, (_, i) => {
  const biz = businessProfiles[i % businessProfiles.length];
  return {
    _id: id("job", i + 1),
    title: `${pick(["Senior", "Lead", "Junior", "Principal", "Staff"], i)} ${pick(cats, i)} Specialist`,
    companyId: biz._id,
    companyName: biz.companyName,
    category: pick(cats, i),
    urgency: pick<Job["urgency"]>(["Low", "Medium", "High"], i),
    location: pick(cities, i),
    applicationCount: (i * 7) % 80,
    status: pick<Job["status"]>(["Open", "Open", "Open", "Closed", "Draft"], i),
    createdAt: daysAgo(i),
  };
});

const applications: Application[] = Array.from({ length: 80 }, (_, i) => {
  const job = jobs[i % jobs.length];
  const seeker = seekerProfiles[i % seekerProfiles.length];
  const seekerUser = users.find((u) => u._id === seeker.userId)!;
  const status = pick<Application["status"]>(["Applied", "Reviewed", "Shortlisted", "Rejected", "Hired"], i);
  return {
    _id: id("app", i + 1),
    jobId: job._id,
    jobTitle: job.title,
    seekerId: seeker.userId,
    seekerName: seekerUser.fullName,
    resumeUrl: seeker.resumeUrl!,
    coverLetter: "I am excited to apply for this role and bring proven experience that aligns with the requirements outlined in the posting.",
    status,
    statusHistory: [
      { status: "Applied", changedAt: daysAgo(i + 10), changedBy: seekerUser.fullName },
      { status: "Reviewed", changedAt: daysAgo(i + 7), changedBy: "Admin" },
      ...(status !== "Applied" && status !== "Reviewed" ? [{ status, changedAt: daysAgo(i + 1), changedBy: "Admin", note: "Updated by hiring panel" }] : []),
    ],
    createdAt: daysAgo(i + 10),
  };
});

const tickets: SupportTicket[] = Array.from({ length: 32 }, (_, i) => {
  const u = users[i % users.length];
  return {
    _id: id("tkt", i + 1),
    subject: pick(["Cannot upload resume", "Payment failed", "Account locked", "Job posting issue", "Verification stuck", "Feature request"], i),
    userId: u._id,
    userName: u.fullName,
    category: pick(["Billing", "Technical", "Account", "Other"], i),
    priority: pick<SupportTicket["priority"]>(["Low", "Medium", "High", "Critical"], i),
    status: pick<SupportTicket["status"]>(["Open", "In Progress", "Resolved", "Closed"], i),
    assignedTo: i % 3 === 0 ? "Admin User" : undefined,
    messages: [
      { _id: id("msg", i * 2 + 1), authorId: u._id, authorName: u.fullName, authorRole: "user", body: "I am facing an issue with my account. Please look into this at the earliest.", createdAt: daysAgo(i + 3) },
      { _id: id("msg", i * 2 + 2), authorId: "admin", authorName: "Admin", authorRole: "admin", body: "Thanks for reaching out. We are looking into the matter and will respond shortly.", createdAt: daysAgo(i + 2) },
    ],
    createdAt: daysAgo(i + 3),
  };
});

const faqs: Faq[] = Array.from({ length: 14 }, (_, i) => ({
  _id: id("faq", i + 1),
  question: pick([
    "How do I create an account?",
    "How is verification done?",
    "Can I post unlimited jobs?",
    "How do I cancel a subscription?",
    "How do I reset my password?",
    "What documents are required?",
  ], i),
  answer: "Follow the steps in the relevant section. Our support team is available 24x7 for any additional help required.",
  targetRole: pick<Faq["targetRole"]>(["seeker", "business", "all"], i),
  order: i + 1,
  isActive: i % 7 !== 0,
}));

const kb: KnowledgeArticle[] = Array.from({ length: 12 }, (_, i) => ({
  _id: id("kb", i + 1),
  title: pick(["Getting Started Guide", "Posting Your First Job", "Hiring Best Practices", "Account Security 101", "Subscription Tiers Explained"], i),
  slug: `guide-${i + 1}`,
  guideType: pick(["Onboarding", "Hiring", "Security", "Billing"], i),
  content: "<h2>Overview</h2><p>This guide walks you through the essential steps. Each section can be expanded.</p>",
  mediaAssets: i % 2 === 0 ? [{ type: "image", url: "https://files.example.com/cover.png", caption: "Cover" }] : [],
  isPublished: i % 4 !== 0,
  updatedAt: daysAgo(i),
}));

const plans: SubscriptionPlan[] = [
  { _id: id("pln", 1), name: "Starter", price: 0, currency: "INR", billingCycle: "monthly", features: ["3 job posts", "Basic support"], isActive: true },
  { _id: id("pln", 2), name: "Growth", price: 2999, currency: "INR", billingCycle: "monthly", features: ["20 job posts", "Verified badge", "Priority support"], isActive: true },
  { _id: id("pln", 3), name: "Enterprise", price: 24999, currency: "INR", billingCycle: "monthly", features: ["Unlimited", "Dedicated CSM", "API access"], isActive: true },
  { _id: id("pln", 4), name: "Growth Yearly", price: 29990, currency: "INR", billingCycle: "yearly", features: ["20 job posts", "Verified badge", "Priority support"], isActive: true },
];

const subscriptions: Subscription[] = Array.from({ length: 24 }, (_, i) => {
  const u = users.filter((x) => x.role === "business")[i % businessProfiles.length];
  const p = plans[(i % 3) + 1];
  return {
    _id: id("sub", i + 1),
    userId: u._id,
    userName: u.fullName,
    planId: p._id,
    planName: p.name,
    startDate: daysAgo(i * 5 + 30),
    endDate: daysAgo(i * 5 - 30),
    status: pick<Subscription["status"]>(["active", "active", "expired", "cancelled"], i),
    amount: p.price,
    transactionId: `txn_${1000 + i}`,
  };
});

const notifications: Notification[] = Array.from({ length: 18 }, (_, i) => ({
  _id: id("ntf", i + 1),
  title: pick(["Platform Maintenance", "New Feature Launch", "Policy Update", "Holiday Hours", "Security Alert"], i),
  body: "Please review the details inside your dashboard. Reach out to support if you have any questions.",
  recipientType: pick<Notification["recipientType"]>(["all", "seekers", "businesses", "specific"], i),
  systemType: pick<Notification["systemType"]>(["info", "alert", "promo", "system"], i),
  targets: [],
  sentAt: daysAgo(i),
}));

const audit: AuditLog[] = Array.from({ length: 120 }, (_, i) => {
  const u = users[i % users.length];
  return {
    _id: id("log", i + 1),
    userId: "admin",
    userName: "Admin User",
    action: pick(["USER_BLOCKED", "USER_VERIFIED", "DOC_APPROVED", "DOC_REJECTED", "TICKET_REPLIED", "PLAN_UPDATED", "NOTIFICATION_SENT"], i),
    targetEntity: pick(["User", "Business", "Job", "Ticket", "Plan", "Notification"], i),
    targetId: u._id,
    ip: `10.0.${i % 255}.${(i * 7) % 255}`,
    oldValue: { status: "Pending" },
    newValue: { status: "Approved" },
    createdAt: daysAgo(i / 4),
  };
});

export const db = {
  users,
  seekerProfiles,
  businessProfiles,
  jobs,
  applications,
  tickets,
  faqs,
  kb,
  plans,
  subscriptions,
  notifications,
  audit,
};
