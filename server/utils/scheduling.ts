import { storage } from "../storage";

export async function scheduleNextJob(customerId: string, completedJobId: string): Promise<void> {
  try {
    const customer = await storage.getCustomer(customerId);
    const completedJob = await storage.getJob(completedJobId);

    if (!customer || !completedJob || customer.status !== "active") {
      return;
    }

    // Calculate next scheduled date (42 days from completion)
    const nextDate = new Date(completedJob.completedAt!);
    nextDate.setDate(nextDate.getDate() + 42);

    // Create new job
    await storage.createJob({
      customerId: customer.id,
      cleanerId: customer.assignedCleanerId!,
      canvasserId: customer.canvasserId!,
      jobType: "regular",
      scheduledDate: nextDate,
      scheduledTime: completedJob.scheduledTime,
      price: completedJob.price,
      isRecurring: true,
      status: "scheduled",
    });

    console.log(`Scheduled next job for customer ${customer.firstName} ${customer.lastName} on ${nextDate.toISOString()}`);
  } catch (error) {
    console.error("Error scheduling next job:", error);
  }
}

export async function checkAndResumeCustomers(): Promise<void> {
  try {
    // This would be called by a background service to check for customers
    // whose pause period has ended and automatically resume them
    console.log("Checking for customers to auto-resume...");
    
    // Implementation would query for paused customers with pause_end_date <= now
    // and call resumeCustomer for each one
  } catch (error) {
    console.error("Error checking customers for auto-resume:", error);
  }
}
