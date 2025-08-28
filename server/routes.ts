import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { authenticateToken, requireRole, generateToken, type AuthenticatedRequest } from "./middleware/auth";
import { calculatePrice, getPricingTiers } from "./utils/pricing";
import { scheduleNextJob } from "./utils/scheduling";
import { loginSchema, insertCustomerSchema, insertUserSchema } from "@shared/schema";

// Multer configuration for file uploads
const uploadDir = path.join(process.cwd(), "uploads/jobs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // Basic security check for file access
    const filePath = path.join(uploadDir, req.path);
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const tiers = await storage.getAllPricingTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      res.status(500).json({ message: "Failed to fetch pricing tiers" });
    }
  });

  app.post("/api/pricing/calculate", (req, res) => {
    try {
      const { propertyType, windowCount } = req.body;
      const price = calculatePrice(propertyType, parseInt(windowCount));
      const tiers = getPricingTiers(propertyType);
      
      res.json({ price, tiers });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(400).json({ message: "Invalid pricing data" });
    }
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        cleanerId: req.query.cleanerId as string,
        search: req.query.search as string,
      };

      const customers = await storage.getAllCustomers(filters);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      customerData.canvasserId = req.user!.id;
      customerData.status = "active";

      const customer = await storage.createCustomer(customerData);

      // Calculate price and create initial job
      const price = calculatePrice(customer.propertyType, customer.windowsCount);
      const scheduledDate = new Date();
      scheduledDate.setHours(10, 0, 0, 0); // Default to 10:00 AM

      await storage.createJob({
        customerId: customer.id,
        cleanerId: customer.assignedCleanerId!,
        canvasserId: customer.canvasserId!,
        jobType: "initial",
        scheduledDate,
        scheduledTime: "10:00",
        price: price.toString(),
        isRecurring: true,
        status: "scheduled",
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.post("/api/customers/:id/pause", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { reason, pauseEndDate } = req.body;

      const pauseData = {
        customerId: id,
        pauseStartDate: new Date(),
        pauseEndDate: pauseEndDate ? new Date(pauseEndDate) : undefined,
        reason,
        createdByUserId: req.user!.id,
        isActive: true,
      };

      const pause = await storage.pauseCustomer(id, pauseData);
      res.json(pause);
    } catch (error) {
      console.error("Error pausing customer:", error);
      res.status(500).json({ message: "Failed to pause customer" });
    }
  });

  app.post("/api/customers/:id/resume", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.resumeCustomer(id);
      
      // Schedule next job based on last completed job + 42 days
      const customer = await storage.getCustomer(id);
      if (customer && customer.assignedCleanerId) {
        const price = calculatePrice(customer.propertyType, customer.windowsCount);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 42);

        await storage.createJob({
          customerId: customer.id,
          cleanerId: customer.assignedCleanerId,
          canvasserId: customer.canvasserId!,
          jobType: "regular",
          scheduledDate: nextDate,
          scheduledTime: "10:00",
          price: price.toString(),
          isRecurring: true,
          status: "scheduled",
        });
      }

      res.json({ message: "Customer resumed successfully" });
    } catch (error) {
      console.error("Error resuming customer:", error);
      res.status(500).json({ message: "Failed to resume customer" });
    }
  });

  // Job routes
  app.get("/api/jobs", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filters = {
        date: req.query.date as string,
        cleanerId: req.query.cleanerId as string,
        status: req.query.status as string,
      };

      const jobs = await storage.getAllJobs(filters);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/today", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cleanerId = req.query.cleanerId as string;
      const jobs = await storage.getTodaysJobs(cleanerId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching today's jobs:", error);
      res.status(500).json({ message: "Failed to fetch today's jobs" });
    }
  });

  app.put("/api/jobs/:id/complete", 
    authenticateToken, 
    upload.fields([{ name: "beforePhoto" }, { name: "afterPhoto" }]), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { paymentMethod, notes } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const completionData = {
          paymentMethod,
          notes,
          beforePhotoUrl: files.beforePhoto?.[0]?.filename,
          afterPhotoUrl: files.afterPhoto?.[0]?.filename,
        };

        const job = await storage.completeJob(id, completionData);
        
        // Schedule next job automatically
        await scheduleNextJob(job.customerId, job.id);

        res.json(job);
      } catch (error) {
        console.error("Error completing job:", error);
        res.status(500).json({ message: "Failed to complete job" });
      }
    }
  );

  app.put("/api/jobs/:id/skip", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const job = await storage.skipJob(id, reason);
      res.json(job);
    } catch (error) {
      console.error("Error skipping job:", error);
      res.status(500).json({ message: "Failed to skip job" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      
      // Create user data without password field
      const { password, ...userDataWithoutPassword } = userData;
      const userToCreate = {
        ...userDataWithoutPassword,
        passwordHash,
      };

      const user = await storage.createUser(userToCreate as any);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/admin/stats", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Cleaner routes
  app.get("/api/cleaners", authenticateToken, async (req, res) => {
    try {
      const cleaners = await storage.getUsersByRole("cleaner");
      res.json(cleaners);
    } catch (error) {
      console.error("Error fetching cleaners:", error);
      res.status(500).json({ message: "Failed to fetch cleaners" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
