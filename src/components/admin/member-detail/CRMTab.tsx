import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Tag, Users, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CourtesyCallsCard } from "./CourtesyCallsCard";
interface CRMProfile {
  member_id: string;
  stage: string | null;
  status: string | null;
  referral_source: string | null;
  industry: string | null;
  department: string | null;
  tags: string[];
  groups: string[];
  updated_at: string;
  assigned_to_staff_id: string | null;
}

interface ImportRow {
  id: string;
  batch_id: string;
  row_index: number;
  raw: unknown;
  import_status: string;
  created_at: string;
}

interface ImportBatch {
  id: string;
  filename: string;
  source: string;
  created_at: string;
}

interface CRMTabProps {
  memberId: string;
}

export function CRMTab({ memberId }: CRMTabProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CRMProfile | null>(null);
  const [importRow, setImportRow] = useState<ImportRow | null>(null);
  const [importBatch, setImportBatch] = useState<ImportBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCRMData();
  }, [memberId]);

  const fetchCRMData = async () => {
    try {
      // Fetch CRM profile
      const { data: profileData, error: profileError } = await supabase
        .from("crm_profiles")
        .select("*")
        .eq("member_id", memberId)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") throw profileError;
      setProfile(profileData);

      // Fetch import row
      const { data: rowData, error: rowError } = await supabase
        .from("crm_import_rows")
        .select("*")
        .eq("imported_member_id", memberId)
        .maybeSingle();

      if (rowError && rowError.code !== "PGRST116") throw rowError;
      setImportRow(rowData);

      // Fetch batch info if we have an import row
      if (rowData?.batch_id) {
        const { data: batchData, error: batchError } = await supabase
          .from("crm_import_batches")
          .select("id, filename, source, created_at")
          .eq("id", rowData.batch_id)
          .maybeSingle();

        if (batchError && batchError.code !== "PGRST116") throw batchError;
        setImportBatch(batchData);
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile && !importRow) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No CRM data available for this member</p>
          <p className="text-sm text-muted-foreground mt-2">
            This member was not imported from CRM or has no CRM profile attached.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Courtesy Calls Card */}
      <CourtesyCallsCard memberId={memberId} />

      {/* CRM Profile */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              CRM Profile
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(profile.updated_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stage</p>
                <p className="font-medium">
                  {profile.stage ? <Badge variant="secondary">{profile.stage}</Badge> : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {profile.status ? <Badge variant="outline">{profile.status}</Badge> : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referral Source</p>
                <p className="font-medium">{profile.referral_source || "-"}</p>
              </div>
              {profile.industry && (
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{profile.industry}</p>
                </div>
              )}
              {profile.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.department}</p>
                </div>
              )}
            </div>

            {profile.tags && profile.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profile.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {profile.groups && profile.groups.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Groups
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.groups.map((group, i) => (
                    <Badge key={i} variant="secondary">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Information */}
      {importRow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Information
            </CardTitle>
            <CardDescription>
              This member was imported from a CRM export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importBatch && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{importBatch.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      Source: {importBatch.source} · Imported:{" "}
                      {new Date(importBatch.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/crm-import/batches")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Batch
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Row Index</p>
                <p className="font-medium">{importRow.row_index + 1}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Import Status</p>
                <Badge
                  variant={importRow.import_status === "imported" ? "default" : "destructive"}
                >
                  {importRow.import_status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Raw Import Data (Admin Only)</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-48 text-xs">
                {JSON.stringify(importRow.raw, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
