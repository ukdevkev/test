import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import PricingCalculator from "./pricing-calculator";
import { CreateCustomerData, User } from "@/types";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().optional(),
  propertyType: z.enum(["house", "flat", "commercial"]),
  windowsCount: z.number().min(1, "Window count must be at least 1"),
  specialInstructions: z.string().optional(),
  assignedCleanerId: z.string().min(1, "Please assign a cleaner"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CanvassingTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedPrice, setCalculatedPrice] = useState<number>(15);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      propertyType: "house",
      windowsCount: 10,
      specialInstructions: "",
      assignedCleanerId: "",
    },
  });

  // Fetch cleaners for assignment
  const { data: cleaners = [] } = useQuery<User[]>({
    queryKey: ["/api/cleaners"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      const token = getAuthToken();
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create customer");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer created successfully",
        description: "Initial job has been scheduled automatically",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    const customerData: CreateCustomerData = {
      ...data,
      email: data.email || undefined,
      postcode: data.postcode || undefined,
      specialInstructions: data.specialInstructions || undefined,
    };
    createCustomerMutation.mutate(customerData);
  };

  const handlePriceChange = (price: number, propertyType: string, windowCount: number) => {
    setCalculatedPrice(price);
    form.setValue("propertyType", propertyType as "house" | "flat" | "commercial");
    form.setValue("windowsCount", windowCount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Pricing Calculator */}
      <PricingCalculator onPriceChange={handlePriceChange} />

      {/* Customer Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-primary" />
            New Customer Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  data-testid="input-first-name"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  data-testid="input-last-name"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.smith@email.com"
                data-testid="input-email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07123 456789"
                data-testid="input-phone"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                placeholder="123 High Street, London, SW1A 1AA"
                data-testid="input-address"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="assignedCleanerId">Assign Cleaner</Label>
              <Select onValueChange={(value) => form.setValue("assignedCleanerId", value)}>
                <SelectTrigger data-testid="select-cleaner">
                  <SelectValue placeholder="Select Cleaner..." />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.firstName} {cleaner.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.assignedCleanerId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.assignedCleanerId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                rows={2}
                placeholder="Access code, gate key location, etc."
                data-testid="input-special-instructions"
                {...form.register("specialInstructions")}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createCustomerMutation.isPending}
              data-testid="button-create-customer"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {createCustomerMutation.isPending
                ? "Creating..."
                : "Create Customer & Schedule Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
