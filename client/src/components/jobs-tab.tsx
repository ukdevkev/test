import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Clock, Check, Forward, Filter } from "lucide-react";
import JobCompletionModal from "./job-completion-modal";
import { Job, User as UserType } from "@/types";
import { format } from "date-fns";

export default function JobsTab() {
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch today's jobs
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/today", ...(selectedCleanerId ? [selectedCleanerId] : [])],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCleanerId) {
        params.append("cleanerId", selectedCleanerId);
      }
      
      const response = await fetch(`/api/jobs/today?${params}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  // Fetch cleaners for filter
  const { data: cleaners = [] } = useQuery<UserType[]>({
    queryKey: ["/api/cleaners"],
  });

  const handleCompleteJob = (job: Job) => {
    setSelectedJob(job);
    setShowCompletionModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "skipped":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          <Calendar className="inline h-6 w-6 mr-2 text-primary" />
          Today's Jobs
        </h2>
        <div className="flex space-x-2">
          <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
            <SelectTrigger className="w-48" data-testid="select-cleaner-filter">
              <SelectValue placeholder="All Cleaners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cleaners</SelectItem>
              {cleaners.map((cleaner) => (
                <SelectItem key={cleaner.id} value={cleaner.id}>
                  {cleaner.firstName} {cleaner.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No jobs scheduled</h3>
              <p className="text-muted-foreground">There are no jobs scheduled for today.</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} data-testid={`card-job-${job.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {job.customer?.firstName} {job.customer?.lastName}
                      </h3>
                      <Badge className={getStatusColor(job.status)} data-testid={`status-${job.id}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {job.scheduledTime || "Not set"}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{job.customer?.address}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {job.cleanerName || "Unassigned"}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <div>
                        <strong>Property:</strong> {job.customer?.propertyType} ({job.customer?.windowsCount} windows)
                      </div>
                      <div>
                        <strong>Price:</strong> £{job.price}
                      </div>
                      {job.customer?.specialInstructions && (
                        <div>
                          <strong>Instructions:</strong> {job.customer.specialInstructions}
                        </div>
                      )}
                      {job.paymentMethod && job.status === "completed" && (
                        <div>
                          <strong>Payment:</strong> {job.paymentMethod} - {job.paymentStatus}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {job.status === "scheduled" && (
                      <>
                        <Button
                          onClick={() => handleCompleteJob(job)}
                          data-testid={`button-complete-${job.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                        <Button
                          variant="secondary"
                          data-testid={`button-skip-${job.id}`}
                        >
                          <Forward className="h-4 w-4 mr-1" />
                          Skip
                        </Button>
                      </>
                    )}
                    {job.status === "completed" && (
                      <Button variant="secondary" disabled>
                        <Check className="h-4 w-4 mr-1" />
                        Completed
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showCompletionModal && selectedJob && (
        <JobCompletionModal
          job={selectedJob}
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </>
  );
}
