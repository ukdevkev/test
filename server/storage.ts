import {
  users,
  customers,
  jobs,
  schedulePauses,
  pricingTiers,
  auditLog,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Job,
  type InsertJob,
  type SchedulePause,
  type InsertSchedulePause,
  type PricingTier,
  type InsertPricingTier,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerWithDetails(id: string): Promise<any>;
  getAllCustomers(filters?: any): Promise<any[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Job operations
  getJob(id: string): Promise<Job | undefined>;
  getJobWithDetails(id: string): Promise<any>;
  getAllJobs(filters?: any): Promise<any[]>;
  getTodaysJobs(cleanerId?: string): Promise<any[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  completeJob(id: string, data: any): Promise<Job>;
  skipJob(id: string, reason: string): Promise<Job>;

  // Schedule pause operations
  pauseCustomer(customerId: string, data: InsertSchedulePause): Promise<SchedulePause>;
  resumeCustomer(customerId: string): Promise<void>;
  getActiveSchedulePause(customerId: string): Promise<SchedulePause | undefined>;

  // Pricing operations
  getAllPricingTiers(): Promise<PricingTier[]>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  updatePricingTier(id: string, tier: Partial<InsertPricingTier>): Promise<PricingTier>;

  // Statistics
  getStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerWithDetails(id: string): Promise<any> {
    const result = await db
      .select({
        customer: customers,
        canvasser: users,
        cleaner: users,
      })
      .from(customers)
      .leftJoin(users, eq(customers.canvasserId, users.id))
      .leftJoin(users, eq(customers.assignedCleanerId, users.id))
      .where(eq(customers.id, id));

    return result[0];
  }

  async getAllCustomers(filters?: any): Promise<any[]> {
    let query = db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        postcode: customers.postcode,
        propertyType: customers.propertyType,
        windowsCount: customers.windowsCount,
        status: customers.status,
        createdAt: customers.createdAt,
        canvasserName: users.firstName,
        cleanerName: users.firstName,
      })
      .from(customers)
      .leftJoin(users, eq(customers.canvasserId, users.id))
      .leftJoin(users, eq(customers.assignedCleanerId, users.id));

    if (filters?.status) {
      query = query.where(eq(customers.status, filters.status));
    }

    if (filters?.cleanerId) {
      query = query.where(eq(customers.assignedCleanerId, filters.cleanerId));
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(customers.firstName, `%${filters.search}%`),
          like(customers.lastName, `%${filters.search}%`),
          like(customers.email, `%${filters.search}%`)
        )
      );
    }

    return await query.orderBy(asc(customers.firstName));
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Job operations
  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobWithDetails(id: string): Promise<any> {
    const result = await db
      .select({
        job: jobs,
        customer: customers,
        cleaner: users,
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(users, eq(jobs.cleanerId, users.id))
      .where(eq(jobs.id, id));

    return result[0];
  }

  async getAllJobs(filters?: any): Promise<any[]> {
    let query = db
      .select({
        id: jobs.id,
        jobType: jobs.jobType,
        status: jobs.status,
        scheduledDate: jobs.scheduledDate,
        scheduledTime: jobs.scheduledTime,
        completedAt: jobs.completedAt,
        price: jobs.price,
        paymentMethod: jobs.paymentMethod,
        paymentStatus: jobs.paymentStatus,
        notes: jobs.notes,
        customerName: customers.firstName,
        customerAddress: customers.address,
        cleanerName: users.firstName,
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(users, eq(jobs.cleanerId, users.id));

    if (filters?.date) {
      query = query.where(
        and(
          gte(jobs.scheduledDate, new Date(filters.date)),
          lte(jobs.scheduledDate, new Date(filters.date + "T23:59:59"))
        )
      );
    }

    if (filters?.cleanerId) {
      query = query.where(eq(jobs.cleanerId, filters.cleanerId));
    }

    if (filters?.status) {
      query = query.where(eq(jobs.status, filters.status));
    }

    return await query.orderBy(asc(jobs.scheduledDate));
  }

  async getTodaysJobs(cleanerId?: string): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];
    let query = db
      .select({
        id: jobs.id,
        jobType: jobs.jobType,
        status: jobs.status,
        scheduledDate: jobs.scheduledDate,
        scheduledTime: jobs.scheduledTime,
        price: jobs.price,
        paymentMethod: jobs.paymentMethod,
        paymentStatus: jobs.paymentStatus,
        notes: jobs.notes,
        customer: customers,
        cleanerName: users.firstName,
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(users, eq(jobs.cleanerId, users.id))
      .where(
        and(
          gte(jobs.scheduledDate, new Date(today)),
          lte(jobs.scheduledDate, new Date(today + "T23:59:59"))
        )
      );

    if (cleanerId) {
      query = query.where(eq(jobs.cleanerId, cleanerId));
    }

    return await query.orderBy(asc(jobs.scheduledTime));
  }

  async createJob(jobData: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(jobData).returning();
    return job;
  }

  async updateJob(id: string, jobData: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...jobData, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async completeJob(id: string, data: any): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        paymentMethod: data.paymentMethod,
        paymentStatus: "paid",
        beforePhotoUrl: data.beforePhotoUrl,
        afterPhotoUrl: data.afterPhotoUrl,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async skipJob(id: string, reason: string): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({
        status: "skipped",
        skipReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  // Schedule pause operations
  async pauseCustomer(customerId: string, pauseData: InsertSchedulePause): Promise<SchedulePause> {
    // Create pause record
    const [pause] = await db.insert(schedulePauses).values(pauseData).returning();
    
    // Update customer status
    await db
      .update(customers)
      .set({ status: "paused", updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return pause;
  }

  async resumeCustomer(customerId: string): Promise<void> {
    // Deactivate pause record
    await db
      .update(schedulePauses)
      .set({ isActive: false })
      .where(and(eq(schedulePauses.customerId, customerId), eq(schedulePauses.isActive, true)));

    // Update customer status
    await db
      .update(customers)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  async getActiveSchedulePause(customerId: string): Promise<SchedulePause | undefined> {
    const [pause] = await db
      .select()
      .from(schedulePauses)
      .where(and(eq(schedulePauses.customerId, customerId), eq(schedulePauses.isActive, true)));
    return pause;
  }

  // Pricing operations
  async getAllPricingTiers(): Promise<PricingTier[]> {
    return await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isActive, true))
      .orderBy(asc(pricingTiers.propertyType), asc(pricingTiers.windowCountMin));
  }

  async createPricingTier(tierData: InsertPricingTier): Promise<PricingTier> {
    const [tier] = await db.insert(pricingTiers).values(tierData).returning();
    return tier;
  }

  async updatePricingTier(id: string, tierData: Partial<InsertPricingTier>): Promise<PricingTier> {
    const [tier] = await db
      .update(pricingTiers)
      .set(tierData)
      .where(eq(pricingTiers.id, id))
      .returning();
    return tier;
  }

  // Statistics
  async getStats(): Promise<any> {
    const activeCustomersCount = await db
      .select({ count: customers.id })
      .from(customers)
      .where(eq(customers.status, "active"));

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const completedJobsCount = await db
      .select({ count: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.status, "completed"), gte(jobs.completedAt, thisMonth)));

    return {
      activeCustomers: activeCustomersCount.length,
      completedJobs: completedJobsCount.length,
    };
  }
}

export const storage = new DatabaseStorage();
