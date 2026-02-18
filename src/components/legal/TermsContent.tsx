export default function TermsContent() {
  return (
    <>
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
        <p className="font-bold text-destructive mb-2">
          IMPORTANT: PLEASE READ THESE TERMS CAREFULLY BEFORE USING OUR SERVICES.
        </p>
        <p className="font-bold text-destructive">
          THIS IS A PERSONAL EMERGENCY RESPONSE SERVICE, NOT A SUBSTITUTE FOR EMERGENCY SERVICES (112). IN A LIFE-THREATENING EMERGENCY, ALWAYS CALL 112 DIRECTLY IF POSSIBLE.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
        <p className="text-muted-foreground mb-4">
          By creating an account, subscribing to our services, or using any ICE Alarm España service, you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and any additional terms that apply to specific services.
        </p>
        <p className="text-muted-foreground mb-4">
          If you do not agree to these Terms, do not use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Who We Are</h2>
        <p className="text-muted-foreground mb-4">
          <strong>ICE Alarm España</strong> ("we", "us", "our", "ICE Alarm") provides personal emergency response services including GPS pendant monitoring, emergency alert handling, and related support services.
        </p>
        <p className="text-muted-foreground mb-4">
          Contact: info@icealarm.es
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Description of Services</h2>
        <h3 className="text-lg font-medium mb-3">3.1 What We Provide</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>GPS pendant devices for emergency alerts</li>
          <li>24/7 monitoring of device alerts (SOS button, fall detection, device offline)</li>
          <li>Response to alerts via phone call to assess the situation</li>
          <li>Coordination with emergency services (112) when required</li>
          <li>Notification of your designated emergency contacts</li>
          <li>AI-assisted call handling and customer support</li>
          <li>Courtesy welfare check calls (where subscribed)</li>
          <li>Member dashboard for account management</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">3.2 What We Do NOT Provide</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Direct medical care or medical advice</li>
          <li>Emergency medical services</li>
          <li>Ambulance or paramedic services</li>
          <li>Guaranteed response times</li>
          <li>A substitute for calling 112 in emergencies</li>
          <li>A replacement for proper medical monitoring or care facilities</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Important Limitations and Disclaimers</h2>

        <h3 className="text-lg font-medium mb-3">4.1 Not a Replacement for Emergency Services</h3>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive">ICE ALARM IS A SUPPLEMENTARY SERVICE. WE ARE NOT EMERGENCY SERVICES.</p>
        </div>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>If you are able to call 112 directly in an emergency, you should do so</li>
          <li>Our service depends on technology that can fail</li>
          <li>There may be delays in our response</li>
          <li>We cannot guarantee that help will arrive in time in any situation</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">4.2 Technology Limitations</h3>
        <p className="text-muted-foreground mb-2">Our service depends on technology that is subject to limitations:</p>
        <p className="text-muted-foreground font-medium mb-1">GPS Pendant:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Requires battery charge (if battery dies, no alerts can be sent)</li>
          <li>Requires mobile network coverage (may not work in remote areas or buildings with poor signal)</li>
          <li>GPS accuracy varies (typically 5-50 meters, may be less accurate indoors)</li>
          <li>Fall detection is not 100% accurate (may miss some falls or trigger false alerts)</li>
          <li>Device must be worn to be effective</li>
        </ul>
        <p className="text-muted-foreground font-medium mb-1">Our Systems:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Internet and phone networks can experience outages</li>
          <li>Software systems can have bugs or failures</li>
          <li>AI assistant may misunderstand or make errors</li>
        </ul>
        <p className="text-muted-foreground font-medium mb-1">Third-Party Dependencies:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>We rely on mobile network operators</li>
          <li>We rely on device monitoring partners</li>
          <li>We rely on emergency services to respond once notified</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">4.3 Response Time</h3>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive">WE DO NOT GUARANTEE ANY SPECIFIC RESPONSE TIME.</p>
        </div>
        <p className="text-muted-foreground mb-4">
          While we strive to respond to alerts as quickly as possible, response times depend on volume of simultaneous alerts, availability of operators, accuracy of information provided, response time of emergency services (112), and traffic, weather, and other factors beyond our control.
        </p>

        <h3 className="text-lg font-medium mb-3">4.4 No Medical Advice</h3>
        <p className="text-muted-foreground mb-4">
          Our staff and AI assistant provide emergency coordination, NOT medical advice. Any information provided is general in nature and should not be relied upon as medical advice. Always consult qualified medical professionals for health decisions.
        </p>

        <h3 className="text-lg font-medium mb-3">4.5 AI Assistant Limitations</h3>
        <p className="text-muted-foreground mb-2">Our AI assistant "Isabella":</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Is an artificial intelligence, not a human</li>
          <li>May misunderstand what you say</li>
          <li>May provide incorrect or inappropriate responses</li>
          <li>Will transfer to human operators when uncertain or upon request</li>
          <li>Should not be relied upon for critical medical decisions</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Eligibility</h2>
        <p className="text-muted-foreground mb-2">To use our services, you must:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Be at least 18 years old, OR have a parent/guardian agree on your behalf</li>
          <li>Provide accurate and complete information</li>
          <li>Have a valid payment method</li>
          <li>Be located in an area with mobile network coverage</li>
          <li>Be capable of wearing and using the GPS pendant (or have a caregiver who can assist)</li>
        </ul>
        <p className="text-muted-foreground mb-4">We reserve the right to refuse service to anyone for any reason.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Your Account</h2>
        <h3 className="text-lg font-medium mb-3">6.1 Account Creation</h3>
        <p className="text-muted-foreground mb-4">
          You must provide accurate, current, and complete information during registration. You agree to update this information to keep it accurate.
        </p>
        <h3 className="text-lg font-medium mb-3">6.2 Account Security</h3>
        <p className="text-muted-foreground mb-2">You are responsible for:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">6.3 Accuracy of Information</h3>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive">
            CRITICAL: The accuracy of your personal information, medical details, and emergency contacts directly affects our ability to help you in an emergency. You are responsible for keeping this information current and accurate.
          </p>
        </div>
        <p className="text-muted-foreground mb-4">
          If we contact your emergency contacts or provide your medical information to emergency services based on what you have provided, you agree that we are not liable for any consequences of inaccurate information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Devices and Equipment</h2>
        <h3 className="text-lg font-medium mb-3">7.1 GPS Pendant</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>The device remains our property unless otherwise specified</li>
          <li>You must use the device in accordance with provided instructions</li>
          <li>You are responsible for reasonable care of the device</li>
          <li>You must return the device if you cancel your subscription (where applicable)</li>
          <li>Lost or damaged devices may incur replacement charges</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">7.2 Your Responsibilities</h3>
        <p className="text-muted-foreground mb-2">You agree to:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Keep the device charged</li>
          <li>Wear the device as intended</li>
          <li>Test the device periodically as instructed</li>
          <li>Notify us of any device malfunctions</li>
          <li>Not attempt to modify, repair, or tamper with the device</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">7.3 Device Connectivity</h3>
        <p className="text-muted-foreground mb-2">The device requires mobile network coverage, battery charge, and the SIM card to remain active (managed by our partner).</p>
        <p className="text-muted-foreground mb-2">We are not responsible for service failures caused by:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Poor or no mobile network coverage in your area</li>
          <li>Interference from buildings, terrain, or weather</li>
          <li>Mobile network outages</li>
          <li>Depleted device battery</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Subscription and Payment</h2>
        <h3 className="text-lg font-medium mb-3">8.1 Subscription Plans</h3>
        <p className="text-muted-foreground mb-4">
          Details of available subscription plans, including pricing, are displayed on our website and during registration. Prices include applicable VAT.
        </p>
        <h3 className="text-lg font-medium mb-3">8.2 Payment</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Payment is processed securely by Stripe</li>
          <li>Subscriptions are billed monthly or annually as selected</li>
          <li>You authorize us to charge your payment method automatically</li>
          <li>Failed payments may result in service suspension</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">8.3 Price Changes</h3>
        <p className="text-muted-foreground mb-4">
          We may change subscription prices with 30 days notice. If you do not agree to a price change, you may cancel before it takes effect.
        </p>
        <h3 className="text-lg font-medium mb-3">8.4 Refunds</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Registration fees are non-refundable</li>
          <li>If you cancel within 14 days of signup (cooling-off period), you are entitled to a refund of subscription fees minus any services already used</li>
          <li>After 14 days, subscription fees are non-refundable for the current billing period</li>
          <li>Device deposits are refundable upon return of the device in good condition</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">8.5 Non-Payment</h3>
        <p className="text-muted-foreground mb-2">If payment fails:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>We will notify you and attempt to charge again</li>
          <li>After 7 days of failed payment, service may be suspended</li>
          <li>After 30 days, your account may be terminated</li>
          <li>Outstanding amounts may be sent to collections</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Cancellation and Termination</h2>
        <h3 className="text-lg font-medium mb-3">9.1 Your Right to Cancel</h3>
        <p className="text-muted-foreground mb-2">You may cancel your subscription at any time through:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Your member dashboard</li>
          <li>Emailing info@icealarm.es</li>
          <li>Calling our customer service</li>
        </ul>
        <p className="text-muted-foreground mb-4">Cancellation takes effect at the end of your current billing period.</p>
        <h3 className="text-lg font-medium mb-3">9.2 Cooling-Off Period</h3>
        <p className="text-muted-foreground mb-4">
          Under EU consumer law, you have 14 days from signup to cancel for a full refund. To exercise this right, contact us clearly stating your wish to cancel.
        </p>
        <h3 className="text-lg font-medium mb-3">9.3 Our Right to Terminate</h3>
        <p className="text-muted-foreground mb-2">We may suspend or terminate your account if:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>You breach these Terms</li>
          <li>Your payment method fails repeatedly</li>
          <li>You provide false information</li>
          <li>You misuse the service or devices</li>
          <li>You abuse our staff or AI systems</li>
          <li>Continued service poses a risk to you or others</li>
        </ul>
        <p className="text-muted-foreground mb-4">We will provide reasonable notice except in cases of serious breach.</p>
        <h3 className="text-lg font-medium mb-3">9.4 Effect of Termination</h3>
        <p className="text-muted-foreground mb-2">Upon termination:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Your access to services will cease</li>
          <li>Alert monitoring will stop</li>
          <li>You must return any devices (if applicable)</li>
          <li>We will retain your data as described in our Privacy Policy</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Limitation of Liability</h2>
        <h3 className="text-lg font-medium mb-3">10.1 To the Maximum Extent Permitted by Law</h3>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive mb-2">WE SHALL NOT BE LIABLE FOR:</p>
          <p className="text-muted-foreground mb-2">
            (a) <strong>Death or personal injury</strong> except where caused directly by our gross negligence or willful misconduct
          </p>
          <p className="text-muted-foreground mb-2">
            (b) <strong>Any indirect, incidental, special, consequential, or punitive damages</strong> including but not limited to loss of profits, data, use, goodwill, or other intangible losses
          </p>
          <p className="text-muted-foreground mb-1">(c) <strong>Damages arising from:</strong></p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Technology failures (networks, devices, software)</li>
            <li>Delays in response to alerts</li>
            <li>Actions or failures of emergency services (112, police, ambulance)</li>
            <li>Inaccurate information provided by you</li>
            <li>Your failure to maintain device charge or wear the device</li>
            <li>Circumstances beyond our reasonable control (force majeure)</li>
            <li>Actions of third parties including our technology partners</li>
            <li>AI assistant errors or misunderstandings</li>
          </ul>
        </div>

        <h3 className="text-lg font-medium mb-3">10.2 Maximum Liability</h3>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive">
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR OUR SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT YOU HAVE PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </div>

        <h3 className="text-lg font-medium mb-3">10.3 Essential Purpose</h3>
        <p className="text-muted-foreground mb-2">You acknowledge that:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Our service is designed to provide additional support, not guaranteed protection</li>
          <li>No emergency response system can guarantee safety</li>
          <li>Multiple factors beyond our control affect emergency outcomes</li>
          <li>The limitations above are an essential part of our agreement and reflected in our pricing</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">10.4 Statutory Rights</h3>
        <p className="text-muted-foreground mb-2">Nothing in these Terms limits or excludes:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Liability for death or personal injury caused by gross negligence</li>
          <li>Liability for fraud or fraudulent misrepresentation</li>
          <li>Any liability that cannot be limited or excluded under Spanish law</li>
          <li>Your statutory rights as a consumer</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Indemnification</h2>
        <p className="text-muted-foreground mb-2">
          You agree to indemnify and hold harmless ICE Alarm España, its officers, directors, employees, and partners from any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Your breach of these Terms</li>
          <li>Your misuse of the service or devices</li>
          <li>Inaccurate information you provide</li>
          <li>Your violation of any law or third-party rights</li>
          <li>Claims by your emergency contacts or family members</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. Intellectual Property</h2>
        <p className="text-muted-foreground mb-2">
          All content, software, trademarks, and materials on our website and in our apps remain our property or that of our licensors. You may not:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Copy, modify, or distribute our materials</li>
          <li>Reverse engineer our software</li>
          <li>Use our trademarks without permission</li>
          <li>Scrape or harvest data from our systems</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">13. Privacy</h2>
        <p className="text-muted-foreground mb-2">
          Your privacy is important to us. Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> which explains how we collect, use, and protect your personal data.
        </p>
        <p className="text-muted-foreground mb-2">By using our services, you consent to:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Processing of your personal and medical data as described in our Privacy Policy</li>
          <li>Recording of phone calls for quality and training purposes</li>
          <li>Sharing of your information with emergency services when necessary</li>
          <li>Receiving communications about your service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">14. Communications</h2>
        <h3 className="text-lg font-medium mb-3">14.1 From Us to You</h3>
        <p className="text-muted-foreground mb-2">You agree to receive communications from us via:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Email</li>
          <li>SMS</li>
          <li>Phone calls (including from our AI assistant)</li>
          <li>WhatsApp</li>
          <li>Push notifications (if you use our app)</li>
          <li>Post</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">14.2 Emergency Communications</h3>
        <p className="text-muted-foreground mb-2">You agree that we may contact:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>You at any phone numbers you provide</li>
          <li>Your emergency contacts when an alert is triggered</li>
          <li>Emergency services on your behalf</li>
        </ul>
        <h3 className="text-lg font-medium mb-3">14.3 Marketing</h3>
        <p className="text-muted-foreground mb-4">
          We will only send marketing communications with your consent. You can opt out at any time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">15. Modifications to Service</h2>
        <p className="text-muted-foreground mb-4">
          We may modify, suspend, or discontinue any aspect of our services at any time. We will provide reasonable notice of significant changes. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">16. Modifications to Terms</h2>
        <p className="text-muted-foreground mb-2">We may update these Terms from time to time. We will notify you of material changes by:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Email</li>
          <li>Notice on our website</li>
          <li>Notice in your dashboard</li>
        </ul>
        <p className="text-muted-foreground mb-4">
          If you do not agree to updated Terms, you must stop using our services and cancel your subscription.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">17. Dispute Resolution</h2>
        <h3 className="text-lg font-medium mb-3">17.1 Informal Resolution</h3>
        <p className="text-muted-foreground mb-4">
          Before initiating formal proceedings, you agree to contact us at info@icealarm.es to attempt to resolve any dispute informally.
        </p>
        <h3 className="text-lg font-medium mb-3">17.2 Governing Law</h3>
        <p className="text-muted-foreground mb-4">These Terms are governed by the laws of Spain.</p>
        <h3 className="text-lg font-medium mb-3">17.3 Jurisdiction</h3>
        <p className="text-muted-foreground mb-4">
          Any disputes shall be submitted to the courts of Almería, Spain, unless you are a consumer, in which case you may also bring proceedings in your place of residence.
        </p>
        <h3 className="text-lg font-medium mb-3">17.4 Consumer Rights</h3>
        <p className="text-muted-foreground mb-4">
          If you are a consumer in the EU, you have the right to access the Online Dispute Resolution platform at:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">18. General Provisions</h2>
        <h3 className="text-lg font-medium mb-3">18.1 Entire Agreement</h3>
        <p className="text-muted-foreground mb-4">
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and ICE Alarm España.
        </p>
        <h3 className="text-lg font-medium mb-3">18.2 Severability</h3>
        <p className="text-muted-foreground mb-4">
          If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.
        </p>
        <h3 className="text-lg font-medium mb-3">18.3 No Waiver</h3>
        <p className="text-muted-foreground mb-4">
          Our failure to enforce any right or provision does not constitute a waiver of that right.
        </p>
        <h3 className="text-lg font-medium mb-3">18.4 Assignment</h3>
        <p className="text-muted-foreground mb-4">
          You may not assign your rights under these Terms. We may assign our rights to any successor or affiliate.
        </p>
        <h3 className="text-lg font-medium mb-3">18.5 Force Majeure</h3>
        <p className="text-muted-foreground mb-4">
          We are not liable for failures caused by circumstances beyond our reasonable control, including natural disasters, wars, pandemics, network failures, or government actions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">19. Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          <strong>ICE Alarm España</strong><br />
          <br />
          General enquiries: info@icealarm.es<br />
          Support: support@icealarm.es<br />
          Privacy: privacy@icealarm.es
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">20. Acknowledgment</h2>
        <div className="bg-muted/50 border rounded-lg p-4">
          <p className="font-bold mb-3">BY USING OUR SERVICES, YOU ACKNOWLEDGE THAT:</p>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-1">
            <li>You have read and understood these Terms</li>
            <li>You understand this is a supplementary service, not a guarantee of safety</li>
            <li>You understand the technology limitations described above</li>
            <li>You accept the limitations of liability described above</li>
            <li>You will maintain accurate personal, medical, and emergency contact information</li>
            <li>You will properly maintain and wear your GPS device</li>
            <li>You will call 112 directly whenever possible in a life-threatening emergency</li>
          </ol>
        </div>
      </section>

      <p className="text-sm text-muted-foreground italic">
        These Terms of Service are effective as of the date last updated above.
      </p>
      <p className="text-sm text-muted-foreground italic">
        ICE Alarm España — Keeping You Connected, Keeping You Safe
      </p>
    </>
  );
}
