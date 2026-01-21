import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Search, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  MessageSquare,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_language: string;
  enquiry_type: string;
  message: string | null;
  source: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  converted_member_id: string | null;
  created_at: string;
  contacted_at: string | null;
  converted_at: string | null;
  assigned_staff?: {
    first_name: string;
    last_name: string;
  };
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const { staffRole } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchLeads();
    fetchStaff();

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus, filterType]);

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase
      .from('leads')
      .select(`
        *,
        assigned_staff:staff!leads_assigned_to_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }
    if (filterType !== 'all') {
      query = query.eq('enquiry_type', filterType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching leads:', error);
      toast.error("Failed to load leads");
    } else {
      setLeads(data as Lead[] || []);
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('is_active', true);
    setStaff(data || []);
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'contacted') {
      updateData.contacted_at = new Date().toISOString();
    }
    if (status === 'converted') {
      updateData.converted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    if (error) {
      toast.error("Failed to update lead status");
    } else {
      toast.success(`Lead marked as ${status}`);
      fetchLeads();
    }
  };

  const assignLead = async (leadId: string, staffId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: staffId })
      .eq('id', leadId);

    if (error) {
      toast.error("Failed to assign lead");
    } else {
      toast.success("Lead assigned successfully");
      fetchLeads();
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    
    const { error } = await supabase
      .from('leads')
      .update({ notes })
      .eq('id', selectedLead.id);

    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      fetchLeads();
    }
  };

  const convertToMember = (lead: Lead) => {
    // Navigate to add member wizard with pre-filled data
    navigate('/admin/members/new', { 
      state: { 
        leadData: {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          preferred_language: lead.preferred_language
        },
        leadId: lead.id
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">New</Badge>;
      case 'contacted':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Contacted</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">Qualified</Badge>;
      case 'converted':
        return <Badge className="bg-status-active/20 text-status-active border-status-active/30">Converted</Badge>;
      case 'lost':
        return <Badge variant="secondary">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEnquiryTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      pricing: 'Pricing',
      demo: 'Demo Request',
      partnership: 'Partnership',
      support: 'Support'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      lead.first_name.toLowerCase().includes(search) ||
      lead.last_name.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search) ||
      lead.phone.includes(search)
    );
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage contact form submissions and prospective members
          </p>
        </div>
        <Button onClick={fetchLeads} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.new > 0 ? "border-blue-500/50 bg-blue-500/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-xs text-muted-foreground">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.contacted}</p>
                <p className="text-xs text-muted-foreground">Contacted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-active/20">
                <CheckCircle className="h-5 w-5 text-status-active" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="demo">Demo Request</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedLead(lead);
                      setNotes(lead.notes || "");
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {lead.preferred_language === 'es' ? '🇪🇸 Spanish' : '🇬🇧 English'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <a 
                          href={`mailto:${lead.email}`} 
                          className="text-sm hover:text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="text-sm hover:text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{getEnquiryTypeBadge(lead.enquiry_type)}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      {lead.assigned_staff ? (
                        <span className="text-sm">
                          {lead.assigned_staff.first_name} {lead.assigned_staff.last_name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(lead.created_at), 'dd MMM yyyy')}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(lead.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'contacted')}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'qualified')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Qualified
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => convertToMember(lead)}
                            className="text-status-active"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convert to Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateLeadStatus(lead.id, 'lost')}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Review and manage this lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedLead.first_name} {selectedLead.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline flex items-center gap-1">
                    {selectedLead.email}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline flex items-center gap-1">
                    {selectedLead.phone}
                    <Phone className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Enquiry Type</Label>
                  <div className="mt-1">{getEnquiryTypeBadge(selectedLead.enquiry_type)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Language</Label>
                  <p>{selectedLead.preferred_language === 'es' ? '🇪🇸 Spanish' : '🇬🇧 English'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p>{format(new Date(selectedLead.created_at), 'dd MMM yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <p className="capitalize">{selectedLead.source?.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Assign */}
              <div>
                <Label className="text-xs text-muted-foreground">Assign To</Label>
                <Select 
                  value={selectedLead.assigned_to || ""} 
                  onValueChange={(value) => assignLead(selectedLead.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={saveNotes}
                >
                  Save Notes
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    convertToMember(selectedLead);
                    setDetailOpen(false);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convert to Member
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    updateLeadStatus(selectedLead.id, 'contacted');
                    setDetailOpen(false);
                  }}
                >
                  Mark Contacted
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}