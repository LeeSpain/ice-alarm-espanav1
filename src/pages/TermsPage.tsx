import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
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
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t("legal.terms.title")}</h1>
                <p className="text-muted-foreground">{t("legal.terms.company")}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.lastUpdated")}
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Definitions</h2>
              <p className="text-muted-foreground mb-4">
                In these Terms and Conditions, "We", "Us", and "Our" refers to ICE Alarm España S.L., a Spanish limited company with CIF B24731531, having its registered office at 3 Rambla de Amoros, Mojacar 04638, Almeria, Spain.
              </p>
              <p className="text-muted-foreground mb-4">
                "You" and "Your" refers to the person or persons named on the Application/Order Form who agree to be bound by these Terms and Conditions.
              </p>
              <p className="text-muted-foreground mb-4">
                "Equipment" means the alarm unit and/or pendant supplied by Us to You.
              </p>
              <p className="text-muted-foreground mb-4">
                "Emergency Responder" means a person (next of kin, key holder or other) who You designate and whose details You provide to Us, whom We contact in the event of an emergency.
              </p>
              <p className="text-muted-foreground mb-4">
                "Service/s" means the services provided by Us to You detailed in the Schedule of Terms below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Making a Contract with Us</h2>
              <p className="text-muted-foreground mb-4">
                These Terms and Conditions form a contract between You and Us. Please read them carefully to ensure that You understand the services that are and are not covered under the contract.
              </p>
              <p className="text-muted-foreground mb-4">
                The contract is binding when Your Order has been received by ICE Alarm España S.L. Payment is required in advance unless You have agreed with Us to pay monthly by Direct Debit or standing order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Services</h2>
              <p className="text-muted-foreground mb-4">
                We provide the Equipment and associated support services as described on the company web site, marketing materials, application forms and other collateral and which have been agreed at the time the contract between Us and You was created.
              </p>
              <p className="text-muted-foreground mb-4">
                If You want the Pendant equipment, the price will include a GPS pendant that operates whilst You are out and about and an alarm device installed and maintained by Us in Your home.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Our Commitment to You</h2>
              <p className="text-muted-foreground mb-4">
                We will use reasonable endeavours to ensure that the service is available 24 hours per day, 365 days per year, but this is subject to all relevant telecommunications network services being available.
              </p>
              <p className="text-muted-foreground mb-4">
                We can accept no responsibility for any failure of the service due to telecommunications network failures or similar failures.
              </p>
              <p className="text-muted-foreground mb-4">
                We will use reasonable endeavours to respond immediately to emergency calls by attempting to contact You by phone and any Emergency Responders or emergency services as You have instructed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Your Responsibilities</h2>
              <p className="text-muted-foreground mb-4">
                You must provide Us with full and accurate information about You, Your medical history and Your Emergency Responders.
              </p>
              <p className="text-muted-foreground mb-4">
                You must make sure that the Equipment is always working and report any faults to Us as soon as possible.
              </p>
              <p className="text-muted-foreground mb-4">
                You must make sure Your Emergency Responders know how to enter Your home and have the necessary keys to do so.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Equipment</h2>
              <p className="text-muted-foreground mb-4">
                The Equipment is provided to You to enable Us to provide the Services. You can opt to purchase (where available) or rent the Equipment.
              </p>
              <p className="text-muted-foreground mb-4">
                If purchased, the Equipment shall be Your property and We shall not be required to replace it in the event of loss, damage or upon malfunction after expiry of the guarantee period.
              </p>
              <p className="text-muted-foreground mb-4">
                If rented, the Equipment remains the property of ICE Alarm and must be returned to Us when You no longer need the Services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Payment</h2>
              <p className="text-muted-foreground mb-4">
                Payment for the Services is by an advance annual payment, quarterly or monthly. Payments may be made by bank transfer, standing order, or by credit or debit card.
              </p>
              <p className="text-muted-foreground mb-4">
                The prices for the Services are as shown on our website or as agreed with You at the time of order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Cancellation</h2>
              <p className="text-muted-foreground mb-4">
                You may cancel the contract at any time by giving Us one month's notice in writing.
              </p>
              <p className="text-muted-foreground mb-4">
                We may cancel the contract by giving You one month's notice in writing.
              </p>
              <p className="text-muted-foreground mb-4">
                If You have paid in advance for a period that extends beyond the cancellation date, We will refund You pro rata for the unused period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                We shall not be liable for any loss or damage suffered by You arising from Our failure to provide the Services where such failure is due to circumstances beyond Our reasonable control.
              </p>
              <p className="text-muted-foreground mb-4">
                Our liability under this contract shall not exceed the total amount paid by You for the Services during the 12-month period immediately preceding the event giving rise to the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                This contract shall be governed by and construed in accordance with Spanish law. Any dispute arising under this contract shall be subject to the exclusive jurisdiction of the Spanish courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
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
