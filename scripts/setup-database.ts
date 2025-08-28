import { db } from "../server/db";
import { 
  users, 
  customers, 
  jobs, 
  schedulePauses, 
  pricingTiers, 
  auditLog 
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  console.log("🔧 Setting up database schema...");

  try {
    // Create sessions table for authentication (required for production)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);

    await db.execute(sql`
      ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `);

    console.log("✅ Sessions table created");

    // Create default pricing tiers
    const existingTiers = await db.select().from(pricingTiers).limit(1);
    
    if (existingTiers.length === 0) {
      console.log("📊 Creating default pricing tiers...");
      
      // House pricing tiers
      await db.insert(pricingTiers).values([
        {
          name: "House - Small",
          propertyType: "house",
          windowCountMin: 1,
          windowCountMax: 10,
          basePrice: "15.00",
          perWindowPrice: "0.00",
          isActive: true,
        },
        {
          name: "House - Medium",
          propertyType: "house",
          windowCountMin: 11,
          windowCountMax: 20,
          basePrice: "25.00",
          perWindowPrice: "0.00",
          isActive: true,
        },
        {
          name: "House - Large",
          propertyType: "house",
          windowCountMin: 21,
          windowCountMax: null,
          basePrice: "35.00",
          perWindowPrice: "1.50",
          isActive: true,
        },
        // Flat pricing tiers
        {
          name: "Flat - Small",
          propertyType: "flat",
          windowCountMin: 1,
          windowCountMax: 6,
          basePrice: "12.00",
          perWindowPrice: "0.00",
          isActive: true,
        },
        {
          name: "Flat - Large",
          propertyType: "flat",
          windowCountMin: 7,
          windowCountMax: null,
          basePrice: "18.00",
          perWindowPrice: "1.00",
          isActive: true,
        },
        // Commercial pricing tiers
        {
          name: "Commercial - Small",
          propertyType: "commercial",
          windowCountMin: 1,
          windowCountMax: 20,
          basePrice: "50.00",
          perWindowPrice: "0.00",
          isActive: true,
        },
        {
          name: "Commercial - Large",
          propertyType: "commercial",
          windowCountMin: 21,
          windowCountMax: null,
          basePrice: "80.00",
          perWindowPrice: "2.00",
          isActive: true,
        },
      ]);

      console.log("✅ Default pricing tiers created");
    } else {
      console.log("ℹ️  Pricing tiers already exist, skipping...");
    }

    console.log("🎉 Database setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Run 'npm run seed-data' to add demo data");
    console.log("2. Start the application with 'npm run dev'");
    console.log("3. Login with demo accounts:");
    console.log("   - Admin: admin/admin123");
    console.log("   - Canvasser: canvasser/canvasser123");
    console.log("   - Cleaner: cleaner/cleaner123");

  } catch (error) {
    console.error("❌ Error setting up database:", error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to setup database:", error);
      process.exit(1);
    });
}

export { setupDatabase };
