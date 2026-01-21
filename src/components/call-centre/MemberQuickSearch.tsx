import { useState, useEffect } from "react";
import { Search, Phone, MessageSquare, User, Shield, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MemberSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  hasPendant: boolean;
  planType: string;
  status: string;
  address: string;
}

interface MemberQuickSearchProps {
  onSelectMember?: (member: MemberSearchResult) => void;
}

export function MemberQuickSearch({ onSelectMember }: MemberQuickSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);

  useEffect(() => {
    const searchMembers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data: members, error } = await supabase
          .from("members")
          .select(`
            id,
            first_name,
            last_name,
            phone,
            email,
            status,
            address_line_1,
            city,
            subscriptions (
              plan_type,
              has_pendant,
              status
            )
          `)
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,address_line_1.ilike.%${query}%`)
          .limit(10);

        if (error) throw error;

        const formattedResults: MemberSearchResult[] = (members || []).map((m: any) => {
          const activeSubscription = m.subscriptions?.find((s: any) => s.status === 'active');
          return {
            id: m.id,
            firstName: m.first_name,
            lastName: m.last_name,
            phone: m.phone,
            email: m.email,
            status: m.status,
            hasPendant: activeSubscription?.has_pendant || false,
            planType: activeSubscription?.plan_type || 'unknown',
            address: `${m.address_line_1}, ${m.city}`,
          };
        });

        setResults(formattedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchMembers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleCall = (phone: string) => {
    toast({ title: "Initiating call...", description: `Calling ${phone}` });
  };

  const handleSms = (phone: string) => {
    toast({ title: "Opening SMS...", description: `To ${phone}` });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Quick Member Search</h3>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, phone, or address..."
          className="pl-10 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {results.length > 0 && !selectedMember && (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {results.map((member) => (
              <Card 
                key={member.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className="text-xs">
                        {member.planType === 'couple' ? '👫 Couple' : '👤 Single'}
                      </Badge>
                      {member.hasPendant ? (
                        <Badge className="text-xs bg-status-active/10 text-status-active border-status-active/30" variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          Pendant
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-alert-battery/10 text-alert-battery border-alert-battery/30" variant="outline">
                          <Phone className="w-3 h-3 mr-1" />
                          Phone Only
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Selected Member Quick View */}
      {selectedMember && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">{selectedMember.firstName} {selectedMember.lastName}</h4>
                <p className="text-sm text-muted-foreground">{selectedMember.phone}</p>
                <p className="text-sm text-muted-foreground">{selectedMember.address}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                ×
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {selectedMember.planType === 'couple' ? '👫 Couple' : '👤 Single'}
              </Badge>
              {selectedMember.hasPendant ? (
                <Badge className="bg-status-active/10 text-status-active border-status-active/30" variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Has Pendant
                </Badge>
              ) : (
                <Badge className="bg-alert-battery/10 text-alert-battery border-alert-battery/30" variant="outline">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Phone Only
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" onClick={() => handleCall(selectedMember.phone)}>
                <Phone className="w-3 h-3 mr-1" />
                Call
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSms(selectedMember.phone)}>
                <MessageSquare className="w-3 h-3 mr-1" />
                SMS
              </Button>
              <Button size="sm" variant="outline">
                WhatsApp
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onSelectMember?.(selectedMember)}
            >
              <User className="w-3 h-3 mr-1" />
              View Full Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {query.length >= 2 && results.length === 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No members found
        </p>
      )}

      {query.length < 2 && !selectedMember && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Search for a member to view their details
        </p>
      )}
    </div>
  );
}
