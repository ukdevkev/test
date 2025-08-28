import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Camera, X } from "lucide-react";
import { Job } from "@/types";
import { getAuthToken } from "@/lib/auth";

const completionSchema = z.object({
  paymentMethod: z.enum(["cash", "bank_transfer", "card"], {
    required_error: "Please select a payment method",
  }),
  notes: z.string().optional(),
});

type CompletionFormData = z.infer<typeof completionSchema>;

interface JobCompletionModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobCompletionModal({ job, isOpen, onClose }: JobCompletionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);

  const form = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      notes: "",
    },
  });

  const completeJobMutation = useMutation({
    mutationFn: async (data: CompletionFormData) => {
      const token = getAuthToken();
      const formData = new FormData();
      
      formData.append("paymentMethod", data.paymentMethod);
      if (data.notes) formData.append("notes", data.notes);
      if (beforePhoto) formData.append("beforePhoto", beforePhoto);
      if (afterPhoto) formData.append("afterPhoto", afterPhoto);

      const response = await fetch(`/api/jobs/${job.id}/complete`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to complete job");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job completed successfully",
        description: "Next appointment has been automatically scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompletionFormData) => {
    completeJobMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "before") {
        setBeforePhoto(file);
      } else {
        setAfterPhoto(file);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">
              Customer: {job.customer?.firstName} {job.customer?.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{job.customer?.address}</p>
            <p className="text-sm text-muted-foreground">Price: £{job.price}</p>
          </div>

          {/* Photo Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="beforePhoto">Before Photo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="beforePhoto"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "before")}
                  data-testid="input-before-photo"
                />
                <label htmlFor="beforePhoto" className="cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                  <span className="text-sm text-muted-foreground block">
                    {beforePhoto ? beforePhoto.name : "Click to upload before photo"}
                  </span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="afterPhoto">After Photo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="afterPhoto"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "after")}
                  data-testid="input-after-photo"
                />
                <label htmlFor="afterPhoto" className="cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                  <span className="text-sm text-muted-foreground block">
                    {afterPhoto ? afterPhoto.name : "Click to upload after photo"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label>Payment Method</Label>
            <RadioGroup
              onValueChange={(value) => 
                form.setValue("paymentMethod", value as "cash" | "bank_transfer" | "card")
              }
              className="grid grid-cols-3 gap-3 mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="cash" id="cash" data-testid="radio-cash" />
                <Label htmlFor="cash" className="font-medium cursor-pointer">Cash</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" data-testid="radio-bank-transfer" />
                <Label htmlFor="bank_transfer" className="font-medium cursor-pointer">Bank Transfer</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="card" id="card" data-testid="radio-card" />
                <Label htmlFor="card" className="font-medium cursor-pointer">Card</Label>
              </div>
            </RadioGroup>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Job Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about the job completion..."
              data-testid="input-job-notes"
              {...form.register("notes")}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={completeJobMutation.isPending}
              data-testid="button-complete-job"
            >
              {completeJobMutation.isPending ? "Completing..." : "Complete Job"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-completion"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
