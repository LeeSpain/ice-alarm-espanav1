import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStaffMember } from "@/hooks/useStaffMembers";
import { StaffDetailHeader } from "@/components/admin/staff/StaffDetailHeader";
import { StaffOverviewTab } from "@/components/admin/staff/StaffOverviewTab";
import { StaffDocumentsTab } from "@/components/admin/staff/StaffDocumentsTab";
import { StaffActivityTab } from "@/components/admin/staff/StaffActivityTab";
import { StaffFormPanel } from "@/components/admin/staff/StaffFormPanel";

export default function StaffDetailPage() {
  const { staffId = "" } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { data: staff, isLoading } = useStaffMember(staffId);
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button variant="link" onClick={() => navigate("/admin/staff")}>
          Back to Staff
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaffDetailHeader staff={staff} onEdit={() => setEditOpen(true)} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <StaffOverviewTab staff={staff} />
        </TabsContent>

        <TabsContent value="documents">
          <StaffDocumentsTab staffId={staff.id} />
        </TabsContent>

        <TabsContent value="activity">
          <StaffActivityTab staffId={staff.id} />
        </TabsContent>
      </Tabs>

      <StaffFormPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        staffMember={staff}
      />
    </div>
  );
}
