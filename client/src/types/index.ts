export interface User {
  id: string;
  username: string;
  email?: string;
  role: "admin" | "canvasser" | "cleaner";
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  postcode?: string;
  propertyType: "house" | "flat" | "commercial";
  windowsCount: number;
  specialInstructions?: string;
  canvasserId?: string;
  assignedCleanerId?: string;
  status: "prospect" | "active" | "paused" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  customerId: string;
  cleanerId?: string;
  canvasserId?: string;
  jobType: "initial" | "regular" | "one_off";
  status: "scheduled" | "completed" | "cancelled" | "skipped";
  scheduledDate: string;
  scheduledTime?: string;
  completedAt?: string;
  price: string;
  paymentMethod?: "cash" | "bank_transfer" | "card";
  paymentStatus: "pending" | "paid" | "overdue";
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  notes?: string;
  skipReason?: string;
  isRecurring: boolean;
  nextScheduledDate?: string;
  customer?: Customer;
  cleanerName?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  propertyType: "house" | "flat" | "commercial";
  windowCountMin: number;
  windowCountMax?: number;
  basePrice: string;
  perWindowPrice?: string;
  isActive: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  postcode?: string;
  propertyType: "house" | "flat" | "commercial";
  windowsCount: number;
  specialInstructions?: string;
  assignedCleanerId?: string;
}

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  role: "admin" | "canvasser" | "cleaner";
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface JobCompletionData {
  paymentMethod: "cash" | "bank_transfer" | "card";
  notes?: string;
  beforePhoto?: File;
  afterPhoto?: File;
}
