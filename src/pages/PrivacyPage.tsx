import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" asChild>
              <Link to="/login">{t("common.signIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          {/* Document Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t("legal.privacy.title")}</h1>
                <p className="text-muted-foreground">{t("legal.privacy.company")}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.lastUpdated")}
            </p>
          </div>

          {/* Privacy Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                ICE Alarm España S.L. ("We", "Us", "Our") is committed to protecting and respecting Your privacy. This Privacy Policy explains how We collect, use, disclose, and safeguard Your information when You use Our emergency alarm services.
              </p>
              <p className="text-muted-foreground mb-4">
                We are the data controller for the purposes of applicable data protection legislation, including the EU General Data Protection Regulation (GDPR) and Spain's Organic Law 3/2018 on the Protection of Personal Data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Data Controller</h2>
              <p className="text-muted-foreground mb-4">
                <strong>ICE Alarm España S.L.</strong><br />
                3 Rambla de Amoros<br />
                Mojacar 04638<br />
                Almeria, Spain<br />
                CIF: B24731531<br />
                Email: info@icealarm.es<br />
                Phone: +34 950 473 199
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information that You provide directly to Us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li><strong>Personal identification information:</strong> Name, date of birth, NIE/DNI, address, telephone number, email address</li>
                <li><strong>Health and medical information:</strong> Medical conditions, medications, allergies, blood type, doctor information, hospital preferences</li>
                <li><strong>Emergency contact information:</strong> Names, relationships, and contact details of Your designated emergency responders</li>
                <li><strong>Location data:</strong> GPS location from Your pendant device when an emergency alert is triggered</li>
                <li><strong>Payment information:</strong> Bank details or payment card information for processing subscription payments</li>
                <li><strong>Communication records:</strong> Records of calls, messages, and correspondence with Our monitoring centre</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information We collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Provide Our emergency monitoring and response services</li>
                <li>Contact You and Your emergency responders in case of an emergency</li>
                <li>Provide relevant medical information to emergency services when required</li>
                <li>Process Your payments and manage Your account</li>
                <li>Communicate with You about Your service and any updates</li>
                <li>Improve Our services and develop new features</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Legal Basis for Processing</h2>
              <p className="text-muted-foreground mb-4">
                We process Your personal data on the following legal bases:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li><strong>Contract:</strong> Processing necessary for the performance of Our contract with You to provide emergency monitoring services</li>
                <li><strong>Vital interests:</strong> Processing necessary to protect Your life or health in an emergency situation</li>
                <li><strong>Legitimate interests:</strong> Processing necessary for Our legitimate business interests, such as improving Our services</li>
                <li><strong>Legal obligation:</strong> Processing necessary to comply with legal requirements</li>
                <li><strong>Consent:</strong> Where You have given specific consent for certain processing activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Special Category Data</h2>
              <p className="text-muted-foreground mb-4">
                We collect health and medical information, which is considered special category data under GDPR. We process this data based on:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Your explicit consent</li>
                <li>The vital interests of You or another person where You are incapable of giving consent</li>
                <li>The necessity for reasons of substantial public interest (provision of health and social care)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We may share Your information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li><strong>Emergency services:</strong> Police, ambulance, fire services when responding to an emergency</li>
                <li><strong>Your emergency contacts:</strong> The people You have designated as emergency responders</li>
                <li><strong>Healthcare providers:</strong> When necessary to provide emergency medical care</li>
                <li><strong>Service providers:</strong> Third parties who help Us operate Our business (e.g., payment processors, telecommunications providers)</li>
                <li><strong>Legal authorities:</strong> When required by law or to protect Our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain Your personal data for as long as You are a subscriber to Our services and for a period of 6 years after You cease to be a subscriber, in accordance with Spanish commercial law requirements.
              </p>
              <p className="text-muted-foreground mb-4">
                Records of emergency incidents may be retained for longer periods where required for legal, regulatory, or insurance purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Under GDPR, You have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li><strong>Right of access:</strong> You can request a copy of the personal data We hold about You</li>
                <li><strong>Right to rectification:</strong> You can ask Us to correct inaccurate or incomplete data</li>
                <li><strong>Right to erasure:</strong> You can ask Us to delete Your data in certain circumstances</li>
                <li><strong>Right to restrict processing:</strong> You can ask Us to limit how We use Your data</li>
                <li><strong>Right to data portability:</strong> You can ask for Your data in a machine-readable format</li>
                <li><strong>Right to object:</strong> You can object to certain types of processing</li>
                <li><strong>Right to withdraw consent:</strong> Where processing is based on consent, You can withdraw it at any time</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                To exercise any of these rights, please contact Us at info@icealarm.es or write to Us at the address above.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect Your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, access controls, and secure data storage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. International Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your personal data is primarily stored and processed within the European Economic Area (EEA). If We transfer Your data outside the EEA, We will ensure appropriate safeguards are in place in accordance with GDPR requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Our website uses cookies to improve Your experience. For more information about how We use cookies, please see Our Cookie Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">13. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify You of any significant changes by posting the new policy on Our website and, where appropriate, by email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">14. Complaints</h2>
              <p className="text-muted-foreground mb-4">
                If You have any concerns about how We handle Your personal data, please contact Us first. You also have the right to lodge a complaint with the Spanish Data Protection Agency (Agencia Española de Protección de Datos - AEPD):
              </p>
              <p className="text-muted-foreground mb-4">
                Website: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a><br />
                Phone: 901 100 099
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If You have any questions about this Privacy Policy, please contact Us at:
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>ICE Alarm España S.L.</strong><br />
                3 Rambla de Amoros<br />
                Mojacar 04638<br />
                Almeria, Spain<br />
                <br />
                Phone: +34 950 473 199<br />
                Email: info@icealarm.es<br />
                CIF: B24731531
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto text-center text-sm text-sidebar-foreground/60">
          <p>© {new Date().getFullYear()} ICE Alarm España. {t("landing.allRightsReserved")}</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-sidebar-foreground">{t("legal.footer.termsOfService")}</Link>
            <Link to="/privacy" className="hover:text-sidebar-foreground">{t("legal.footer.privacyPolicy")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
