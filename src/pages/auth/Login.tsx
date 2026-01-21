import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Logo } from "@/components/ui/logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { t } = useTranslation();
  const { refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const loginSchema = z.object({
    email: z.string().email(t("validation.invalidEmail")),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Check if user is staff first - redirect them to staff login
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, role, is_active")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (staffData && staffData.is_active) {
          await refreshAuth();
          toast.success(t("auth.loginTitle"));
          // Redirect staff to appropriate dashboard
          if (staffData.role === "call_centre") {
            navigate("/call-centre");
          } else {
            navigate("/admin");
          }
          return;
        }

        // Check if user is a member
        const { data: memberData } = await supabase
          .from("members")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (memberData) {
          await refreshAuth();
          toast.success(t("auth.loginTitle"));
          navigate(from);
        } else {
          toast.info(t("auth.registerSubtitle"));
          navigate("/complete-registration");
        }
      }
    } catch (error) {
      toast.error(t("errors.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-block">
            <Logo size="md" />
          </Link>
          <LanguageSelector />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.memberLogin")}</CardTitle>
            <CardDescription>
              {t("auth.memberLoginDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.email")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.password")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth.signingIn")}
                    </>
                  ) : (
                    t("common.signIn")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link to="/join" className="text-primary hover:underline font-medium">
                  {t("common.joinNow")}
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("auth.backToHome")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("auth.staffMember")}{" "}
          <Link to="/staff/login" className="text-primary hover:underline">
            {t("auth.loginHere")}
          </Link>
        </p>
      </div>
    </div>
  );
}
