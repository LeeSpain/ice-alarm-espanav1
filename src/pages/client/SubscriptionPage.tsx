import { useMemberSubscription, useMemberPayments } from "@/hooks/useMemberProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  CreditCard, 
  Calendar, 
  Download, 
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Smartphone
} from "lucide-react";
import { format } from "date-fns";

export default function SubscriptionPage() {
  const { data: subscription, isLoading: subLoading } = useMemberSubscription();
  const { data: payments, isLoading: paymentsLoading } = useMemberPayments();

  const isLoading = subLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription & Billing</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground">
              Please contact support for subscription information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planLabel = subscription.plan_type === "single" ? "Single Person" : "Couple";
  const billingLabel = subscription.billing_frequency === "monthly" ? "Monthly" : "Annual";
  const statusColor = subscription.status === "active" 
    ? "bg-alert-resolved text-alert-resolved-foreground" 
    : "bg-muted";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription & Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and payments</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <Badge className={statusColor}>
              {subscription.status === "active" ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                subscription.status
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Plan Type</p>
              <p className="text-xl font-semibold">{planLabel}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Billing</p>
              <p className="text-xl font-semibold">{billingLabel}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Service Type</p>
              <div className="flex items-center gap-2 mt-1">
                {subscription.has_pendant ? (
                  <>
                    <Smartphone className="h-5 w-5 text-alert-resolved" />
                    <span className="font-semibold">Pendant + Membership</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 text-alert-battery" />
                    <span className="font-semibold">Phone Only</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-semibold">
                €{subscription.amount.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{subscription.billing_frequency === "monthly" ? "mo" : "yr"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {format(new Date(subscription.start_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Next Renewal</p>
                <p className="font-medium text-primary">
                  {format(new Date(subscription.renewal_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upgrade Options</CardTitle>
          <CardDescription>
            Save money by switching to annual billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.billing_frequency === "monthly" && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Switch to Annual</h4>
                  <p className="text-sm text-muted-foreground">
                    Save €{subscription.plan_type === "single" ? "54.99" : "76.99"} per year!
                  </p>
                </div>
                <Button>
                  Upgrade
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            To change between Single and Couple plans, please contact our support team.
          </p>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">Visa ending in ****4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
            </div>
            <Button variant="outline">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_type.replace("_", " ")}
                    </TableCell>
                    <TableCell>€{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === "completed" ? "default" : "secondary"}
                        className={payment.status === "completed" ? "bg-alert-resolved" : ""}
                      >
                        {payment.status === "completed" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : payment.status === "pending" ? (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            {payment.status}
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.invoice_number && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No payment history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
