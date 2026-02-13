import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { StaffForm } from "@/components/admin/staff/StaffForm";

export default function StaffPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("staff")
        .update({ is_active: isActive })
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success("Staff member status updated");
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-500 text-white">{t("adminStaff.roles.superAdmin", "Super Admin")}</Badge>;
      case "admin":
        return <Badge className="bg-primary text-primary-foreground">{t("adminStaff.roles.admin", "Admin")}</Badge>;
      case "call_centre_supervisor":
        return <Badge className="bg-amber-500 text-white">{t("adminStaff.roles.supervisor", "Supervisor")}</Badge>;
      case "call_centre":
        return <Badge variant="secondary">{t("adminStaff.roles.callCentre", "Call Centre")}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminStaff.title", "Staff Management")}</h1>
          <p className="text-muted-foreground">
            {t("adminStaff.subtitle", "Manage staff accounts and permissions.")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("adminStaff.addStaff", "Add Staff Member")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("adminStaff.addStaff", "Add Staff Member")}</DialogTitle>
              <DialogDescription>
                {t("adminStaff.addStaffDesc", "Create a new staff account. They will receive login credentials via email.")}
              </DialogDescription>
            </DialogHeader>
            <StaffForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("adminStaff.totalStaff", "Total Staff")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.active", "Active")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-alert-resolved">
              {staff?.filter((s: any) => s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.inactive", "Inactive")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {staff?.filter((s: any) => !s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name", "Name")}</TableHead>
                <TableHead>{t("common.email", "Email")}</TableHead>
                <TableHead>{t("adminStaff.role", "Role")}</TableHead>
                <TableHead>{t("adminStaff.lastLogin", "Last Login")}</TableHead>
                <TableHead>{t("common.status", "Status")}</TableHead>
                <TableHead className="w-[70px]">{t("common.actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {t("adminStaff.loading", "Loading staff...")}
                  </TableCell>
                </TableRow>
              ) : staff && staff.length > 0 ? (
                staff.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        {member.first_name} {member.last_name}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {member.last_login_at 
                        ? format(new Date(member.last_login_at), "dd MMM yyyy, HH:mm")
                        : <span className="text-muted-foreground">{t("adminStaff.never", "Never")}</span>
                      }
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge className="bg-alert-resolved text-alert-resolved-foreground">{t("common.active", "Active")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("common.inactive", "Inactive")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("adminStaff.viewActivity", "View Activity")}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("common.edit", "Edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {member.is_active ? (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleToggleStatus(member.id, false)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              {t("adminStaff.deactivate", "Deactivate")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(member.id, true)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              {t("adminStaff.activate", "Activate")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("adminStaff.noStaff", "No staff members found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
