import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Play, Pause, Edit, Trash2 } from "lucide-react";
import { Customer, User } from "@/types";
import { getAuthToken } from "@/lib/auth";

export default function CustomersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch customers with filters
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  // Fetch cleaners for filter
  const { data: cleaners = [] } = useQuery<User[]>({
    queryKey: ["/api/cleaners"],
  });

  const pauseCustomerMutation = useMutation({
    mutationFn: async ({ customerId, reason }: { customerId: string; reason: string }) => {
      const token = getAuthToken();
      const response = await fetch(`/api/customers/${customerId}/pause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to pause customer");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer paused",
        description: "Customer schedule has been paused",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to pause customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resumeCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const token = getAuthToken();
      const response = await fetch(`/api/customers/${customerId}/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to resume customer");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer resumed",
        description: "Customer schedule has been resumed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resume customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePauseCustomer = (customerId: string) => {
    const reason = prompt("Please enter a reason for pausing this customer:");
    if (reason) {
      pauseCustomerMutation.mutate({ customerId, reason });
    }
  };

  const handleResumeCustomer = (customerId: string) => {
    resumeCustomerMutation.mutate(customerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "prospect":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          <Users className="inline h-6 w-6 mr-2 text-primary" />
          Customer Management
        </h2>
        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-customers"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter 
                  ? "Try adjusting your search or filter criteria."
                  : "Start by adding customers through the canvassing tab."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">
                            {customer.firstName} {customer.lastName}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-muted-foreground">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {customer.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getStatusColor(customer.status)}
                          data-testid={`status-${customer.id}`}
                        >
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {customer.propertyType} ({customer.windowsCount} windows)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {/* This would need to be populated from a join or separate query */}
                          {customer.assignedCleanerId ? "Assigned" : "Unassigned"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {customer.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePauseCustomer(customer.id)}
                              data-testid={`button-pause-${customer.id}`}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {customer.status === "paused" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResumeCustomer(customer.id)}
                              data-testid={`button-resume-${customer.id}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-delete-${customer.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
