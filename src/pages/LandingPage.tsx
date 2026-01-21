import { ArrowRight, Phone, Shield, Clock, Heart, Users, Check, Star, ShieldCheck, MapPin, Zap, Radio, Battery, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useWebsiteImage } from "@/hooks/useWebsiteImage";
import { getDefaultAsset } from "@/config/websiteImages";

export default function LandingPage() {
  const { t } = useTranslation();
  const { imageUrl: heroImage } = useWebsiteImage("homepage_hero", getDefaultAsset("homepage_hero"));
  const { imageUrl: pendantPromoImage } = useWebsiteImage("homepage_pendant_promo", getDefaultAsset("homepage_pendant_promo"));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              {t("navigation.features")}
            </a>
            <Link to="/pendant" className="text-sm font-medium hover:text-primary transition-colors">
              Pendant
            </Link>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              {t("navigation.pricing")}
            </a>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              {t("navigation.contact")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" asChild>
              <Link to="/login">{t("common.signIn")}</Link>
            </Button>
            <Button asChild>
              <Link to="/join">{t("common.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30 -z-10" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-resolved opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-resolved"></span>
                </span>
                <span className="text-sm font-medium text-primary">{t("landing.emergencyResponse")}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                {t("landing.heroTitle")}
                <span className="text-gradient block mt-2">{t("landing.heroTitleHighlight")}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                {t("landing.heroDescription")}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                  <Link to="/join">
                    {t("landing.startProtection")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg group">
                  <Phone className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  +34 900 123 456
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">{t("landing.noContracts")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">{t("landing.cancelAnytime")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">{t("landing.englishSpanish")}</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 aspect-[4/3] bg-muted">
                <img 
                  src={heroImage} 
                  alt="Happy multigenerational family enjoying peace of mind with ICE Alarm protection" 
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl p-4 border animate-fade-up hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-alert-resolved/20 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-alert-resolved" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10,000+</p>
                    <p className="text-sm text-muted-foreground">{t("landing.familiesProtected")}</p>
                  </div>
                </div>
              </div>

              {/* Floating response time card */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-xl p-4 border animate-fade-up hidden md:block" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">&lt;30 sec</p>
                    <p className="text-sm text-muted-foreground">{t("landing.responseTime")}</p>
                  </div>
                </div>
              </div>

              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-primary/10" />
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full border border-primary/5" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("landing.whyChoose")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.whyChooseDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t("landing.feature24_7")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("landing.feature24_7Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t("landing.featureBilingual")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("landing.featureBilingualDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t("landing.featureGps")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("landing.featureGpsDesc")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t("landing.featureMedical")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("landing.featureMedicalDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("landing.simplePricing")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.pricingDesc")}
              <span className="block mt-2 text-sm">{t("landing.pricesIncludeIva")}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Single Membership */}
            <Card className="relative">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">{t("landing.singleMembership")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("landing.forOnePerson")}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold">€27.49</span>
                  <span className="text-muted-foreground">{t("landing.perMonth")}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("common.or")} €274.89{t("landing.perYear")} <span className="text-alert-resolved">({t("landing.saveTwoMonths")})</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.emergencyMonitoring")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.bilingualSupport")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.worksAnywhere")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.phoneOrPendant")}
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/join">{t("common.getStarted")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Couple Membership */}
            <Card className="relative border-primary shadow-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  {t("landing.mostPopular")}
                </span>
              </div>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">{t("landing.coupleMembership")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("landing.forTwoPeople")}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold">€38.49</span>
                  <span className="text-muted-foreground">{t("landing.perMonth")}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("common.or")} €384.89{t("landing.perYear")} <span className="text-alert-resolved">({t("landing.saveTwoMonths")})</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.emergencyMonitoring")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.bilingualSupport")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.worksAnywhere")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.bothProtected")}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    {t("landing.sharePendant")}
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/join">{t("common.getStarted")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ICE Alarm GPS Pendant - Premium Section */}
          <div className="mt-12 max-w-4xl mx-auto relative">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                {t('landing.pricing.pendant.recommended', 'Highly Recommended')}
              </span>
            </div>
            
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-5 gap-0">
                  {/* Product Image */}
                  <div className="md:col-span-2 bg-gradient-to-br from-muted/50 to-muted p-8 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75"></div>
                      <img 
                        src={pendantPromoImage} 
                        alt="ICE Alarm GPS Pendant" 
                        className="relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="md:col-span-3 p-8 flex flex-col justify-center">
                    <div className="mb-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        ICE Alarm GPS Pendant
                      </h3>
                      <p className="text-muted-foreground">
                        {t('landing.pricing.pendant.subtitle', 'Your personal safety companion - worn as a pendant or wristband')}
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl md:text-4xl font-bold text-primary">€151.25</span>
                        <span className="text-sm text-muted-foreground">{t('landing.inclIva', '(incl. 21% IVA)')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">+ €14.99 {t('landing.shipping', 'shipping & handling')}</p>
                    </div>
                    
                    {/* Feature Badges */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.sosButton', 'One-touch SOS')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.gpsTracking', 'GPS Tracking')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.fallDetection', 'Fall Detection')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <Radio className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.twoWayAudio', '2-Way Audio')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <Battery className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.longBattery', '7-Day Battery')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{t('landing.waterproof', 'Waterproof')}</span>
                      </div>
                    </div>
                    
                    {/* CTA */}
                    <Link to="/pendant">
                      <Button variant="outline" className="w-full md:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                        {t('landing.learnMore', 'Learn More About Our Pendant')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-current" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl font-medium mb-6">
            "{t("landing.testimonialQuote")}"
          </blockquote>
          <cite className="text-primary-foreground/80">
            — {t("landing.testimonialAuthor")}, {t("landing.testimonialLocation")}
          </cite>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">{t("landing.readyToJoin")}</h2>
          <p className="text-muted-foreground mb-8">
            {t("landing.readyToJoinDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link to="/join">
                {t("landing.startProtection")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            {t("landing.haveQuestions")} {t("landing.callUsAnytime")} <strong>+34 900 123 456</strong>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-sm text-sidebar-foreground/70">
                {t("landing.heroDescription")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t("navigation.contact")}</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>+34 900 123 456</li>
                <li>info@icealarm.es</li>
                <li>Calle Principal 1, Albox</li>
                <li>04800 Almería, Spain</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><a href="#features" className="hover:text-sidebar-foreground transition-colors">{t("navigation.features")}</a></li>
                <li><a href="#pricing" className="hover:text-sidebar-foreground transition-colors">{t("navigation.pricing")}</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">{t("support.faq")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">{t("landing.termsOfService")}</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">{t("landing.privacyPolicy")}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-8 text-center text-sm text-sidebar-foreground/60">
            <p>© {new Date().getFullYear()} ICE Alarm España. {t("landing.allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
