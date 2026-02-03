import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import i18n from "@/i18n";

interface Filters {
  status?: string;
  pipeline?: string;
  source?: string;
}

interface NewLead {
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  website_url?: string | null;
  phone?: string | null;
  location?: string | null;
  category?: string | null;
  pipeline_type: "sales" | "partner";
  source: string;
  notes?: string | null;
}

export function useOutreachRawLeads(filters?: Filters) {
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["outreach-raw-leads", filters],
    queryFn: async () => {
      let query = supabase
        .from("outreach_raw_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.pipeline && filters.pipeline !== "all") {
        query = query.eq("pipeline_type", filters.pipeline);
      }
      if (filters?.source && filters.source !== "all") {
        query = query.eq("source", filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (lead: NewLead) => {
      const { data, error } = await supabase
        .from("outreach_raw_leads")
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-raw-leads"] });
      toast({
        title: i18n.t("common.success"),
        description: i18n.t("outreach.leads.addLead"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkAddLeadsMutation = useMutation({
    mutationFn: async (leads: NewLead[]) => {
      const { data, error } = await supabase
        .from("outreach_raw_leads")
        .insert(leads)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-raw-leads"] });
    },
    onError: (error) => {
      toast({
        title: i18n.t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const qualifyLeadsMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      // Get lead details
      const { data: rawLeads, error: fetchError } = await supabase
        .from("outreach_raw_leads")
        .select("*")
        .in("id", leadIds);
      
      if (fetchError) throw fetchError;
      if (!rawLeads || rawLeads.length === 0) return;

      // Create CRM leads
      const crmLeads = rawLeads.map(lead => ({
        raw_lead_id: lead.id,
        pipeline_type: lead.pipeline_type,
        company_name: lead.company_name,
        contact_name: lead.contact_name,
        email: lead.email,
        website_url: lead.website_url,
        phone: lead.phone,
        location: lead.location,
        category: lead.category,
        source: lead.source,
        ai_score: lead.ai_score,
        status: "new" as const,
      }));

      const { error: insertError } = await supabase
        .from("outreach_crm_leads")
        .insert(crmLeads);
      
      if (insertError) throw insertError;

      // Update raw leads status
      const { error: updateError } = await supabase
        .from("outreach_raw_leads")
        .update({ status: "qualified" })
        .in("id", leadIds);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-raw-leads"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-crm-leads"] });
      toast({
        title: i18n.t("common.success"),
        description: i18n.t("outreach.leads.moveQualified"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectLeadsMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const { error } = await supabase
        .from("outreach_raw_leads")
        .update({ status: "rejected" })
        .in("id", leadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-raw-leads"] });
      toast({
        title: i18n.t("common.success"),
        description: i18n.t("outreach.leads.rejectLead"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    leads,
    isLoading,
    addLead: addLeadMutation.mutateAsync,
    isAdding: addLeadMutation.isPending,
    bulkAddLeads: bulkAddLeadsMutation.mutateAsync,
    qualifyLeads: qualifyLeadsMutation.mutateAsync,
    isQualifying: qualifyLeadsMutation.isPending,
    rejectLeads: rejectLeadsMutation.mutateAsync,
  };
}
