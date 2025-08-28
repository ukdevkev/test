import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "canvasser", "cleaner"]);
export const customerStatusEnum = pgEnum("customer_status", ["prospect", "active", "paused", "cancelled"]);
export const jobStatusEnum = pgEnum("job_status", ["scheduled", "completed", "cancelled", "skipped"]);
export const jobTypeEnum = pgEnum("job_type", ["initial", "regular", "one_off"]);
export const propertyTypeEnum = pgEnum("property_type", ["house", "flat", "commercial"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "card"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  postcode: varchar("postcode", { length: 10 }),
  propertyType: propertyTypeEnum("property_type").notNull(),
  windowsCount: integer("windows_count").notNull(),
  specialInstructions: text("special_instructions"),
  canvasserId: varchar("canvasser_id").references(() => users.id),
  assignedCleanerId: varchar("assigned_cleaner_id").references(() => users.id),
  status: customerStatusEnum("status").default("prospect"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  cleanerId: varchar("cleaner_id").references(() => users.id),
  canvasserId: varchar("canvasser_id").references(() => users.id),
  jobType: jobTypeEnum("job_type").notNull(),
  status: jobStatusEnum("status").default("scheduled"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 5 }),
  completedAt: timestamp("completed_at"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  notes: text("notes"),
  skipReason: text("skip_reason"),
  isRecurring: boolean("is_recurring").default(true),
  nextScheduledDate: timestamp("next_scheduled_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule pauses table
export const schedulePauses = pgTable("schedule_pauses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  pauseStartDate: timestamp("pause_start_date").notNull(),
  pauseEndDate: timestamp("pause_end_date"),
  reason: text("reason"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing tiers table
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  windowCountMin: integer("window_count_min").notNull(),
  windowCountMax: integer("window_count_max"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  perWindowPrice: decimal("per_window_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("table_name", { length: 50 }).notNull(),
  recordId: varchar("record_id"),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customersAsCanvasser: many(customers, { relationName: "canvasser" }),
  customersAsCleaner: many(customers, { relationName: "cleaner" }),
  jobsAsCleaner: many(jobs, { relationName: "cleaner" }),
  jobsAsCanvasser: many(jobs, { relationName: "canvasser" }),
  schedulePauses: many(schedulePauses),
  auditLogs: many(auditLog),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  canvasser: one(users, {
    fields: [customers.canvasserId],
    references: [users.id],
    relationName: "canvasser",
  }),
  assignedCleaner: one(users, {
    fields: [customers.assignedCleanerId],
    references: [users.id],
    relationName: "cleaner",
  }),
  jobs: many(jobs),
  schedulePauses: many(schedulePauses),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  cleaner: one(users, {
    fields: [jobs.cleanerId],
    references: [users.id],
    relationName: "cleaner",
  }),
  canvasser: one(users, {
    fields: [jobs.canvasserId],
    references: [users.id],
    relationName: "canvasser",
  }),
}));

export const schedulePausesRelations = relations(schedulePauses, ({ one }) => ({
  customer: one(customers, {
    fields: [schedulePauses.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [schedulePauses.createdByUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchedulePauseSchema = createInsertSchema(schedulePauses).omit({
  id: true,
  createdAt: true,
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type SchedulePause = typeof schedulePauses.$inferSelect;
export type InsertSchedulePause = z.infer<typeof insertSchedulePauseSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
