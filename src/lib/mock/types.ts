export type ID = string;

export interface User {
  _id: ID;
  email: string;
  fullName: string;
  role: "seeker" | "business" | "admin";
  phone?: string;
  avatar?: string;
  isBlocked: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface SeekerProfile {
  _id: ID;
  userId: ID;
  resumeUrl?: string;
  resumeName?: string;
  headline?: string;
  skills: string[];
  experienceYears: number;
  location?: string;
}

export interface VerificationDoc {
  _id: ID;
  docType: string;
  docUrl: string;
  originalName: string;
  status: "Pending" | "Approved" | "Rejected";
  uploadedAt: string;
}

export interface BusinessProfile {
  _id: ID;
  userId: ID;
  companyName: string;
  industry: string;
  website?: string;
  isPremium: boolean;
  verificationDocuments: VerificationDoc[];
  createdAt: string;
}

export interface Job {
  _id: ID;
  title: string;
  companyId: ID;
  companyName: string;
  category: string;
  urgency: "Low" | "Medium" | "High";
  location: string;
  applicationCount: number;
  status: "Open" | "Closed" | "Draft";
  createdAt: string;
}

export interface ApplicationStatus {
  status: "Applied" | "Reviewed" | "Shortlisted" | "Rejected" | "Hired";
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface Application {
  _id: ID;
  jobId: ID;
  jobTitle: string;
  seekerId: ID;
  seekerName: string;
  resumeUrl: string;
  coverLetter: string;
  status: ApplicationStatus["status"];
  statusHistory: ApplicationStatus[];
  createdAt: string;
}

export interface TicketMessage {
  _id: ID;
  authorId: ID;
  authorName: string;
  authorRole: "admin" | "user";
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  _id: ID;
  subject: string;
  userId: ID;
  userName: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
}

export interface Faq {
  _id: ID;
  question: string;
  answer: string;
  targetRole: "seeker" | "business" | "all";
  order: number;
  isActive: boolean;
}

export interface KnowledgeArticle {
  _id: ID;
  title: string;
  slug: string;
  guideType: string;
  content: string;
  mediaAssets: { type: "image" | "video"; url: string; caption?: string }[];
  isPublished: boolean;
  updatedAt: string;
}

export interface SubscriptionPlan {
  _id: ID;
  name: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  _id: ID;
  userId: ID;
  userName: string;
  planId: ID;
  planName: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  amount: number;
  transactionId: string;
}

export interface Notification {
  _id: ID;
  title: string;
  body: string;
  recipientType: "all" | "seekers" | "businesses" | "specific";
  systemType: "info" | "alert" | "promo" | "system";
  targets: string[];
  sentAt: string;
}

export interface AuditLog {
  _id: ID;
  userId: ID;
  userName: string;
  action: string;
  targetEntity: string;
  targetId: ID;
  ip: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: string;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, string | undefined>;
}

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
