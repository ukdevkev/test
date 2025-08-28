import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { SprayCan, DoorOpen, Calendar, Users, Settings, LogOut } from "lucide-react";
import CanvassingTab from "@/components/canvassing-tab";
import JobsTab from "@/components/jobs-tab";
import CustomersTab from "@/components/customers-tab";
import AdminTab from "@/components/admin-tab";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("canvassing");

  const handleLogout = () => {
    logout();
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <SprayCan className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">CleanPro Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground capitalize">
                {user?.role} - {getDisplayName()}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="canvassing" data-testid="tab-canvassing">
              <DoorOpen className="h-4 w-4 mr-2" />
              Canvassing
            </TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Calendar className="h-4 w-4 mr-2" />
              Jobs Today
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="canvassing" className="space-y-6">
            <CanvassingTab />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <JobsTab />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomersTab />
          </TabsContent>

          {user?.role === "admin" && (
            <TabsContent value="admin" className="space-y-6">
              <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
