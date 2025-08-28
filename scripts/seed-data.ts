import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, customers, jobs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedData() {
  console.log("🌱 Seeding database with demo data...");

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length > 0) {
      console.log("ℹ️  Users already exist, skipping user creation...");
    } else {
      console.log("👥 Creating demo users...");
      
      // Hash passwords
      const adminPassword = await bcrypt.hash("admin123", 10);
      const canvasserPassword = await bcrypt.hash("canvasser123", 10);
      const cleanerPassword = await bcrypt.hash("cleaner123", 10);

      // Create demo users
      const createdUsers = await db.insert(users).values([
        {
          username: "admin",
          email: "admin@cleanpro.com",
          passwordHash: adminPassword,
          role: "admin",
          firstName: "System",
          lastName: "Administrator",
          phone: "07700 900123",
          isActive: true,
        },
        {
          username: "canvasser",
          email: "canvasser@cleanpro.com",
          passwordHash: canvasserPassword,
          role: "canvasser",
          firstName: "John",
          lastName: "Canvasser",
          phone: "07700 900124",
          isActive: true,
        },
        {
          username: "cleaner",
          email: "mike@cleanpro.com",
          passwordHash: cleanerPassword,
          role: "cleaner",
          firstName: "Mike",
          lastName: "Johnson",
          phone: "07700 900125",
          isActive: true,
        },
        {
          username: "cleaner2",
          email: "sarah@cleanpro.com",
          passwordHash: cleanerPassword,
          role: "cleaner",
          firstName: "Sarah",
          lastName: "Wilson",
          phone: "07700 900126",
          isActive: true,
        },
        {
          username: "cleaner3",
          email: "david@cleanpro.com",
          passwordHash: cleanerPassword,
          role: "cleaner",
          firstName: "David",
          lastName: "Brown",
          phone: "07700 900127",
          isActive: true,
        },
      ]).returning();

      console.log("✅ Demo users created");

      // Get user IDs for relationships
      const adminUser = createdUsers.find(u => u.username === "admin")!;
      const canvasserUser = createdUsers.find(u => u.username === "canvasser")!;
      const cleanerUser = createdUsers.find(u => u.username === "cleaner")!;
      const cleanerUser2 = createdUsers.find(u => u.username === "cleaner2")!;

      console.log("🏠 Creating demo customers...");

      // Create demo customers
      const createdCustomers = await db.insert(customers).values([
        {
          firstName: "Margaret",
          lastName: "Johnson",
          email: "margaret.johnson@email.com",
          phone: "07123 456789",
          address: "15 Oak Street, London, SW1A 1AA",
          postcode: "SW1A 1AA",
          propertyType: "house",
          windowsCount: 12,
          specialInstructions: "Front door code: 1234. Please use side gate for garden access.",
          canvasserId: canvasserUser.id,
          assignedCleanerId: cleanerUser.id,
          status: "active",
        },
        {
          firstName: "Robert",
          lastName: "Thompson",
          email: "r.thompson@email.com",
          phone: "07234 567890",
          address: "22 Elm Avenue, London, SW2B 2BB",
          postcode: "SW2B 2BB",
          propertyType: "flat",
          windowsCount: 8,
          specialInstructions: "Apartment 3B. Buzzer number 23.",
          canvasserId: canvasserUser.id,
          assignedCleanerId: cleanerUser.id,
          status: "active",
        },
        {
          firstName: "Emma",
          lastName: "Davis",
          email: "emma.davis@email.com",
          phone: "07345 678901",
          address: "45 High Street, London, SW3C 3CC",
          postcode: "SW3C 3CC",
          propertyType: "house",
          windowsCount: 18,
          specialInstructions: "Key under the plant pot by the front door.",
          canvasserId: canvasserUser.id,
          assignedCleanerId: cleanerUser2.id,
          status: "active",
        },
        {
          firstName: "James",
          lastName: "Wilson",
          email: "james.wilson@email.com",
          phone: "07456 789012",
          address: "78 Victoria Road, London, SW4D 4DD",
          postcode: "SW4D 4DD",
          propertyType: "commercial",
          windowsCount: 25,
          specialInstructions: "Business hours: 9am-5pm. Contact manager before cleaning.",
          canvasserId: canvasserUser.id,
          assignedCleanerId: cleanerUser.id,
          status: "active",
        },
        {
          firstName: "Sophie",
          lastName: "Miller",
          email: "sophie.miller@email.com",
          phone: "07567 890123",
          address: "32 Church Lane, London, SW5E 5EE",
          postcode: "SW5E 5EE",
          propertyType: "flat",
          windowsCount: 5,
          specialInstructions: "Ground floor flat. Ring doorbell twice.",
          canvasserId: canvasserUser.id,
          assignedCleanerId: cleanerUser2.id,
          status: "paused",
        },
      ]).returning();

      console.log("✅ Demo customers created");

      console.log("📅 Creating demo jobs...");

      // Create demo jobs (some scheduled for today, some completed)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await db.insert(jobs).values([
        // Today's scheduled job
        {
          customerId: createdCustomers[0].id, // Margaret Johnson
          cleanerId: cleanerUser.id,
          canvasserId: canvasserUser.id,
          jobType: "regular",
          status: "scheduled",
          scheduledDate: today,
          scheduledTime: "10:30",
          price: "25.00",
          paymentStatus: "pending",
          isRecurring: true,
        },
        // Yesterday's completed job
        {
          customerId: createdCustomers[1].id, // Robert Thompson
          cleanerId: cleanerUser.id,
          canvasserId: canvasserUser.id,
          jobType: "regular",
          status: "completed",
          scheduledDate: yesterday,
          scheduledTime: "09:00",
          completedAt: yesterday,
          price: "12.00",
          paymentMethod: "cash",
          paymentStatus: "paid",
          notes: "Windows cleaned successfully. Customer very satisfied.",
          isRecurring: true,
        },
        // Tomorrow's scheduled job
        {
          customerId: createdCustomers[2].id, // Emma Davis
          cleanerId: cleanerUser2.id,
          canvasserId: canvasserUser.id,
          jobType: "regular",
          status: "scheduled",
          scheduledDate: tomorrow,
          scheduledTime: "14:00",
          price: "35.00",
          paymentStatus: "pending",
          isRecurring: true,
        },
        // Today's another scheduled job
        {
          customerId: createdCustomers[3].id, // James Wilson (commercial)
          cleanerId: cleanerUser.id,
          canvasserId: canvasserUser.id,
          jobType: "regular",
          status: "scheduled",
          scheduledDate: today,
          scheduledTime: "13:30",
          price: "80.00",
          paymentStatus: "pending",
          isRecurring: true,
        },
      ]);

      console.log("✅ Demo jobs created");
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n🚀 You can now start the application and login with:");
    console.log("👨‍💼 Admin: admin / admin123");
    console.log("🚪 Canvasser: canvasser / canvasser123");
    console.log("🧽 Cleaner: cleaner / cleaner123");
    console.log("\n📊 Demo data includes:");
    console.log("- 5 demo customers with different property types");
    console.log("- Sample jobs for today and other dates");
    console.log("- Complete pricing tier configuration");
    console.log("- Multiple cleaner accounts for assignment");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed database:", error);
      process.exit(1);
    });
}

export { seedData };
