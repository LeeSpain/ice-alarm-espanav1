import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Inbox, RefreshCw, ExternalLink, Clock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOutreachInbox, type InboundEmail } from "@/hooks/useInboundEmails";
import { format } from "date-fns";

export function OutreachInboxTab() {
  const { t } = useTranslation();
  const { data: emails, isLoading, refetch, isRefetching } = useOutreachInbox();
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("outreach.inbox.title", "Email Inbox")}</CardTitle>
              <CardDescription>{t("outreach.inbox.subtitle", "Replies and correspondence from outreach campaigns")}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {t("common.refresh", "Refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !emails || emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t("outreach.inbox.noThreads", "No replies yet")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("outreach.inbox.subtitle", "Replies to your outreach emails will appear here")}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">{email.from_email}</span>
                        {email.is_reply && (
                          <Badge variant="secondary" className="text-xs">
                            Reply
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mt-1 truncate">{email.subject || "(No subject)"}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {email.body_snippet || "No preview available"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(email.received_at), "MMM d, HH:mm")}
                      </span>
                      {email.linked_entity_id && (
                        <Badge variant="outline" className="text-xs">
                          Linked
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedEmail?.subject || "(No subject)"}
            </DialogTitle>
            <DialogDescription>
              From: {selectedEmail?.from_email} • {selectedEmail && format(new Date(selectedEmail.received_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedEmail?.is_reply && selectedEmail?.linked_entity_id && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  This is a reply to an outreach email. Lead ID: {selectedEmail.linked_entity_id}
                </p>
              </div>
            )}

            <div className="border rounded-lg p-4 bg-background">
              {selectedEmail?.body_html ? (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p className="whitespace-pre-wrap">{selectedEmail?.body_snippet || "No content"}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
