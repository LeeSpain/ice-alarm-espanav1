import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Phone,
  AlertCircle,
  MessageCircle,
  Brain,
  Monitor,
  Headphones,
  Ambulance,
  PhoneCall,
  Heart,
  HelpCircle,
  ChevronDown,
  Shield,
  Clock,
  Check,
  Mic,
  MapPin,
  Activity,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-6");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const children = el.querySelectorAll("[data-reveal]");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function HowItWorksPage() {
  const { t } = useTranslation();
  const { settings: companySettings } = useCompanySettings();
  const revealRef = useScrollReveal();

  const phoneForLink = companySettings.emergency_phone.replace(/\s/g, "");

  return (
    <div className="min-h-screen bg-background" ref={revealRef}>
      <PublicHeader />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div
          className="container mx-auto max-w-3xl text-center opacity-0 translate-y-6 transition-all duration-700 ease-out"
          data-reveal
        >
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            {t("howItWorksPage.hero.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {t("howItWorksPage.hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
            {t("howItWorksPage.hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse-slow">
            <span className="text-sm font-medium">
              {t("howItWorksPage.hero.scrollPrompt")}
            </span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line — hidden on mobile */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        {/* Step 1: The Alert */}
        <TimelineStep
          time={t("howItWorksPage.step1.time")}
          title={t("howItWorksPage.step1.title")}
          icon={AlertCircle}
          iconColor="text-alert-sos"
          iconBg="bg-alert-sos/10"
          side="left"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step1.description")}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Mic className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{t("howItWorksPage.step1.voicePath")}</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{t("howItWorksPage.step1.dataPath")}</p>
            </div>
          </div>
          <InfoNote>{t("howItWorksPage.step1.note")}</InfoNote>
        </TimelineStep>

        {/* Step 2: Isabella Answers */}
        <TimelineStep
          time={t("howItWorksPage.step2.time")}
          title={t("howItWorksPage.step2.title")}
          icon={MessageCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          side="right"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step2.description")}
          </p>
          <blockquote className="border-l-4 border-blue-400 pl-4 py-3 mb-1 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg italic text-foreground">
            {t("howItWorksPage.step2.isabellaQuote")}
          </blockquote>
          {t("howItWorksPage.step2.isabellaQuoteTranslation") && (
            <p className="text-xs text-muted-foreground mb-4 pl-4">
              {t("howItWorksPage.step2.isabellaQuoteTranslation")}
            </p>
          )}
          <ul className="space-y-2 mt-4">
            <DetailItem>{t("howItWorksPage.step2.detail1")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step2.detail2")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step2.detail3")}</DetailItem>
          </ul>
        </TimelineStep>

        {/* Step 3: Smart Questions */}
        <TimelineStep
          time={t("howItWorksPage.step3.time")}
          title={t("howItWorksPage.step3.title")}
          icon={Brain}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
          side="left"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step3.description")}
          </p>
          <ul className="space-y-2 mb-4">
            <DetailItem>{t("howItWorksPage.step3.detail1")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step3.detail2")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step3.detail3")}</DetailItem>
          </ul>
          <InfoNote>{t("howItWorksPage.step3.note")}</InfoNote>
        </TimelineStep>

        {/* Step 4: Dashboard */}
        <TimelineStep
          time={t("howItWorksPage.step4.time")}
          title={t("howItWorksPage.step4.title")}
          icon={Monitor}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          side="right"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step4.description")}
          </p>
          <div className="space-y-2 mb-4">
            <DashboardItem icon={Users}>
              {t("howItWorksPage.step4.detail1")}
            </DashboardItem>
            <DashboardItem icon={MapPin}>
              {t("howItWorksPage.step4.detail2")}
            </DashboardItem>
            <DashboardItem icon={Activity}>
              {t("howItWorksPage.step4.detail3")}
            </DashboardItem>
            <DashboardItem icon={Phone}>
              {t("howItWorksPage.step4.detail4")}
            </DashboardItem>
            <DashboardItem icon={FileText}>
              {t("howItWorksPage.step4.detail5")}
            </DashboardItem>
          </div>
          <InfoNote>{t("howItWorksPage.step4.note")}</InfoNote>
        </TimelineStep>

        {/* Step 5: Human Takes Over */}
        <TimelineStep
          time={t("howItWorksPage.step5.time")}
          title={t("howItWorksPage.step5.title")}
          icon={Headphones}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
          side="left"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step5.description")}
          </p>
          <ul className="space-y-2 mb-4">
            <DetailItem>{t("howItWorksPage.step5.detail1")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step5.detail2")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step5.detail3")}</DetailItem>
          </ul>
          <blockquote className="border-l-4 border-green-400 pl-4 py-3 mb-4 bg-green-50 dark:bg-green-950/30 rounded-r-lg italic text-foreground">
            {t("howItWorksPage.step5.agentQuote")}
          </blockquote>
          <InfoNote>{t("howItWorksPage.step5.note")}</InfoNote>
        </TimelineStep>

        {/* Step 6: Help Is Called */}
        <TimelineStep
          time={t("howItWorksPage.step6.time")}
          title={t("howItWorksPage.step6.title")}
          icon={Ambulance}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
          side="right"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step6.description")}
          </p>
          <ul className="space-y-2 mb-4">
            <DetailItem>{t("howItWorksPage.step6.detail1")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step6.detail2")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step6.detail3")}</DetailItem>
          </ul>
          <blockquote className="border-l-4 border-blue-400 pl-4 py-3 mb-4 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg italic text-foreground">
            {t("howItWorksPage.step6.isabellaQuote")}
          </blockquote>
          <InfoNote>{t("howItWorksPage.step6.note")}</InfoNote>
        </TimelineStep>

        {/* Step 7: Your Phone Rings — EMOTIONAL PEAK */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5">
          <div
            className="container mx-auto max-w-3xl px-4 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out"
            data-reveal
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {t("howItWorksPage.step7.time")}
              </Badge>
            </div>

            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                <PhoneCall className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("howItWorksPage.step7.title")}
            </h2>
            <p className="text-lg text-primary font-medium mb-6">
              {t("howItWorksPage.step7.subtitle")}
            </p>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t("howItWorksPage.step7.description")}
            </p>

            <Card className="text-left max-w-2xl mx-auto border-primary/20 shadow-glow mb-8">
              <CardContent className="p-6">
                <blockquote className="text-foreground leading-relaxed italic">
                  {t("howItWorksPage.step7.agentQuote")}
                </blockquote>
              </CardContent>
            </Card>

            <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-8 text-left">
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                {t("howItWorksPage.step7.emotionalNote")}
              </p>
            </div>

            <ul className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-left max-w-2xl mx-auto">
              <li className="flex items-start gap-2 flex-1 p-3 rounded-lg bg-card border">
                <Check className="h-4 w-4 text-alert-resolved mt-0.5 shrink-0" />
                <span>{t("howItWorksPage.step7.detail1")}</span>
              </li>
              <li className="flex items-start gap-2 flex-1 p-3 rounded-lg bg-card border">
                <Check className="h-4 w-4 text-alert-resolved mt-0.5 shrink-0" />
                <span>{t("howItWorksPage.step7.detail2")}</span>
              </li>
              <li className="flex items-start gap-2 flex-1 p-3 rounded-lg bg-card border">
                <Check className="h-4 w-4 text-alert-resolved mt-0.5 shrink-0" />
                <span>{t("howItWorksPage.step7.detail3")}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Step 8: Resolution */}
        <TimelineStep
          time={t("howItWorksPage.step8.time")}
          title={t("howItWorksPage.step8.title")}
          icon={Heart}
          iconColor="text-pink-500"
          iconBg="bg-pink-500/10"
          side="left"
        >
          <p className="text-muted-foreground mb-4">
            {t("howItWorksPage.step8.description")}
          </p>
          <ul className="space-y-2 mb-4">
            <DetailItem>{t("howItWorksPage.step8.detail1")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step8.detail2")}</DetailItem>
            <DetailItem>{t("howItWorksPage.step8.detail3")}</DetailItem>
          </ul>
          <InfoNote>{t("howItWorksPage.step8.note")}</InfoNote>
        </TimelineStep>
      </div>

      {/* What If FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div
          className="container mx-auto max-w-3xl opacity-0 translate-y-6 transition-all duration-700 ease-out"
          data-reveal
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("howItWorksPage.whatIf.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("howItWorksPage.whatIf.subtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "howItWorksPage.whatIf.q1", a: "howItWorksPage.whatIf.a1" },
              { q: "howItWorksPage.whatIf.q2", a: "howItWorksPage.whatIf.a2" },
              { q: "howItWorksPage.whatIf.q3", a: "howItWorksPage.whatIf.a3" },
              { q: "howItWorksPage.whatIf.q4", a: "howItWorksPage.whatIf.a4" },
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {t(item.q)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {t(item.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div
          className="container mx-auto text-center max-w-2xl opacity-0 translate-y-6 transition-all duration-700 ease-out"
          data-reveal
        >
          <Shield className="h-10 w-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("howItWorksPage.cta.title")}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {t("howItWorksPage.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link to="/join">
                {t("howItWorksPage.cta.primaryButton")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg"
              asChild
            >
              <a href={`tel:${phoneForLink}`}>
                <Phone className="mr-2 h-5 w-5" />
                {t("howItWorksPage.cta.secondaryButton")}
              </a>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-alert-resolved" />
              {t("howItWorksPage.cta.trust1")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-alert-resolved" />
              {t("howItWorksPage.cta.trust2")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-alert-resolved" />
              {t("howItWorksPage.cta.trust3")}
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-sm text-sidebar-foreground/70">
                {t("pendant.footer.description")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {t("pendant.footer.contact")}
              </h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <a
                    href={`tel:${phoneForLink}`}
                    className="hover:text-sidebar-foreground"
                  >
                    {t("common.callNow")}
                  </a>
                </li>
                <li>{companySettings.support_email}</li>
                <li>{t("pendant.footer.whatsappAvailable")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {t("pendant.footer.quickLinks")}
              </h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <Link to="/" className="hover:text-sidebar-foreground">
                    {t("pendant.footer.home")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pendant"
                    className="hover:text-sidebar-foreground"
                  >
                    {t("pendant.footer.pendant")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-sidebar-foreground"
                  >
                    {t("pendant.footer.contact")}
                  </Link>
                </li>
                <li>
                  <Link to="/join" className="hover:text-sidebar-foreground">
                    {t("pendant.footer.joinNow")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {t("pendant.footer.legal")}
              </h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <Link to="/terms" className="hover:text-sidebar-foreground">
                    {t("pendant.footer.termsOfService")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-sidebar-foreground"
                  >
                    {t("pendant.footer.privacyPolicy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-8 text-center text-sm text-sidebar-foreground/60">
            <p>{t("pendant.footer.companyInfo")}</p>
            <p className="mt-1">
              © {new Date().getFullYear()} {companySettings.company_name}.{" "}
              {t("pendant.footer.allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

interface TimelineStepProps {
  time: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  side: "left" | "right";
  children: React.ReactNode;
}

function TimelineStep({
  time,
  title,
  icon: Icon,
  iconColor,
  iconBg,
  side,
  children,
}: TimelineStepProps) {
  return (
    <section className="relative py-12 md:py-16 px-4">
      <div
        className="container mx-auto max-w-5xl opacity-0 translate-y-6 transition-all duration-700 ease-out"
        data-reveal
      >
        <div
          className={`md:grid md:grid-cols-2 md:gap-16 items-start ${
            side === "right" ? "md:direction-rtl" : ""
          }`}
        >
          {/* Content side */}
          <div
            className={`${side === "right" ? "md:col-start-2 md:direction-ltr" : "md:col-start-1"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="outline"
                className="text-xs font-mono px-2 py-0.5"
              >
                <Clock className="h-3 w-3 mr-1" />
                {time}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div
                className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            </div>

            <div className="pl-0">{children}</div>
          </div>

          {/* Empty side for timeline alignment on desktop */}
          <div
            className={`hidden md:block ${side === "right" ? "md:col-start-1 md:row-start-1" : "md:col-start-2"}`}
          />
        </div>
      </div>

      {/* Timeline dot — centered on the vertical line (desktop only) */}
      <div className="hidden md:flex absolute left-1/2 top-12 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm" />
    </section>
  );
}

function DetailItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className="h-4 w-4 text-alert-resolved mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function DashboardItem({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50 mt-4">
      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}
