export default function PrivacyContent() {
  return (
    <>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Who We Are</h2>
        <p className="text-muted-foreground mb-4">
          <strong>ICE Alarm España</strong> ("we", "us", "our") operates the personal emergency response service available at icealarm.es.
        </p>
        <p className="text-muted-foreground mb-4">
          <strong>Data Controller:</strong><br />
          ICE Alarm España<br />
          Email: info@icealarm.es
        </p>
        <p className="text-muted-foreground mb-4">
          For any privacy-related questions, contact us at: privacy@icealarm.es
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. What This Policy Covers</h2>
        <p className="text-muted-foreground mb-2">This Privacy Policy explains:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>What personal data we collect</li>
          <li>Why we collect it</li>
          <li>How we use it</li>
          <li>Who we share it with</li>
          <li>Your rights under EU General Data Protection Regulation (GDPR) and Spanish Organic Law 3/2018 (LOPD-GDD)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Data We Collect</h2>

        <h3 className="text-lg font-medium mb-3">3.1 Information You Provide</h3>

        <p className="text-muted-foreground font-medium mb-1">Account Information:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Home address</li>
          <li>Date of birth</li>
          <li>Preferred language</li>
        </ul>

        <p className="text-muted-foreground font-medium mb-1">Health &amp; Medical Information (Special Category Data):</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Medical conditions</li>
          <li>Current medications</li>
          <li>Allergies</li>
          <li>Blood type</li>
          <li>Doctor's name and contact details</li>
          <li>Hospital preference</li>
          <li>Mobility limitations or special needs</li>
        </ul>

        <p className="text-muted-foreground font-medium mb-1">Emergency Contacts:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Names, phone numbers, and email addresses of people you designate</li>
          <li>Their relationship to you</li>
          <li>Language preferences</li>
        </ul>

        <p className="text-muted-foreground font-medium mb-1">Payment Information:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Billing address</li>
          <li>Payment card details (processed securely by Stripe, Inc.)</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">3.2 Information Collected Automatically</h3>

        <p className="text-muted-foreground font-medium mb-1">Device Information:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Your GPS pendant's unique identifier (IMEI)</li>
          <li>Battery status</li>
          <li>Online/offline status</li>
          <li>Location data when alerts are triggered</li>
        </ul>

        <p className="text-muted-foreground font-medium mb-1">Usage Data:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-3 space-y-1">
          <li>Pages visited on our website</li>
          <li>Time and date of access</li>
          <li>Browser type and device information</li>
        </ul>

        <p className="text-muted-foreground font-medium mb-1">Communication Records:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Voice call recordings (with your consent)</li>
          <li>SMS and WhatsApp message logs</li>
          <li>Chat transcripts with our AI assistant</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">3.3 Information from Third Parties</h3>
        <p className="text-muted-foreground mb-4">
          <strong>Device Monitoring Partner (MonitorLinq B.V.):</strong> We receive real-time device status updates including location, battery level, SOS alerts, and fall detection events from your GPS pendant via our technology partner MonitorLinq B.V. (Netherlands).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Why We Collect Your Data (Legal Basis)</h2>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left font-semibold">Purpose</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Legal Basis (GDPR Article 6)</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border border-border px-4 py-2">Provide emergency response services</td><td className="border border-border px-4 py-2">Performance of contract</td></tr>
              <tr><td className="border border-border px-4 py-2">Process your subscription payments</td><td className="border border-border px-4 py-2">Performance of contract</td></tr>
              <tr><td className="border border-border px-4 py-2">Contact you about your account</td><td className="border border-border px-4 py-2">Performance of contract</td></tr>
              <tr><td className="border border-border px-4 py-2">Respond to SOS alerts and emergencies</td><td className="border border-border px-4 py-2">Legitimate interest (protecting vital interests)</td></tr>
              <tr><td className="border border-border px-4 py-2">Store medical information for emergencies</td><td className="border border-border px-4 py-2">Explicit consent (Article 9)</td></tr>
              <tr><td className="border border-border px-4 py-2">Record calls for quality and training</td><td className="border border-border px-4 py-2">Legitimate interest + consent</td></tr>
              <tr><td className="border border-border px-4 py-2">Improve our services</td><td className="border border-border px-4 py-2">Legitimate interest</td></tr>
              <tr><td className="border border-border px-4 py-2">Comply with legal obligations</td><td className="border border-border px-4 py-2">Legal obligation</td></tr>
              <tr><td className="border border-border px-4 py-2">Send service updates</td><td className="border border-border px-4 py-2">Performance of contract</td></tr>
              <tr><td className="border border-border px-4 py-2">Send marketing communications</td><td className="border border-border px-4 py-2">Consent (opt-in only)</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mb-4">
          <strong>Special Category Data (Health Information):</strong> We process your medical information ONLY because you have given us explicit consent during registration, AND because this information may be vital for protecting your life in an emergency situation (GDPR Article 9(2)(a) and (c)).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. How We Use Your Data</h2>

        <h3 className="text-lg font-medium mb-3">5.1 Emergency Response</h3>
        <p className="text-muted-foreground mb-2">When your pendant detects an emergency (SOS button, fall detection, device offline), we:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Receive the alert from our monitoring partner</li>
          <li>Access your profile to identify you</li>
          <li>Review your medical information and emergency contacts</li>
          <li>Contact you by phone to assess the situation</li>
          <li>Contact emergency services (112) if required</li>
          <li>Notify your designated emergency contacts</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">5.2 AI-Assisted Services</h3>
        <p className="text-muted-foreground mb-2">Our AI assistant "Isabella" may:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Answer your phone calls</li>
          <li>Respond to chat messages</li>
          <li>Make courtesy check-in calls</li>
          <li>Handle initial emergency triage</li>
        </ul>
        <p className="text-muted-foreground mb-4">
          When speaking with Isabella, your conversation is processed using artificial intelligence. Human operators can take over at any time and will always handle genuine emergencies.
        </p>

        <h3 className="text-lg font-medium mb-3">5.3 Service Administration</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Process monthly subscription payments</li>
          <li>Send service-related communications</li>
          <li>Provide customer support</li>
          <li>Schedule courtesy welfare calls</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Who We Share Your Data With</h2>
        <p className="text-muted-foreground mb-4">
          We share your data ONLY with the following categories of recipients, and ONLY when necessary:
        </p>

        <h3 className="text-lg font-medium mb-3">6.1 Service Providers (Data Processors)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left font-semibold">Provider</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Purpose</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Location</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Safeguards</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border border-border px-4 py-2 font-medium">Supabase, Inc.</td><td className="border border-border px-4 py-2">Database hosting</td><td className="border border-border px-4 py-2">EU (Stockholm, Sweden)</td><td className="border border-border px-4 py-2">EU data center, DPA in place</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">MonitorLinq B.V.</td><td className="border border-border px-4 py-2">Device monitoring &amp; GPS tracking</td><td className="border border-border px-4 py-2">Netherlands (EU)</td><td className="border border-border px-4 py-2">ISO 27001, NEN 7510 certified</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">Stripe, Inc.</td><td className="border border-border px-4 py-2">Payment processing</td><td className="border border-border px-4 py-2">EU/US</td><td className="border border-border px-4 py-2">EU-US Data Privacy Framework, PCI-DSS compliant</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">Twilio, Inc.</td><td className="border border-border px-4 py-2">Voice calls &amp; SMS</td><td className="border border-border px-4 py-2">EU/US</td><td className="border border-border px-4 py-2">Standard Contractual Clauses</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">OpenAI, LLC</td><td className="border border-border px-4 py-2">AI assistant functionality</td><td className="border border-border px-4 py-2">US</td><td className="border border-border px-4 py-2">Standard Contractual Clauses</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">Google (Gmail)</td><td className="border border-border px-4 py-2">Email delivery</td><td className="border border-border px-4 py-2">EU/US</td><td className="border border-border px-4 py-2">Standard Contractual Clauses</td></tr>
              <tr><td className="border border-border px-4 py-2 font-medium">Vercel, Inc.</td><td className="border border-border px-4 py-2">Website hosting</td><td className="border border-border px-4 py-2">EU</td><td className="border border-border px-4 py-2">EU data center</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium mb-3">6.2 Emergency Services</h3>
        <p className="text-muted-foreground mb-2">In an emergency, we may share your name, location, and relevant medical information with:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Spanish emergency services (112)</li>
          <li>Local police, fire, or ambulance services</li>
          <li>Hospital emergency departments</li>
        </ul>
        <p className="text-muted-foreground mb-4">This sharing is based on protecting your vital interests (GDPR Article 6(1)(d)).</p>

        <h3 className="text-lg font-medium mb-3">6.3 Your Emergency Contacts</h3>
        <p className="text-muted-foreground mb-2">People you designate as emergency contacts will receive:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Notification when an alert is triggered</li>
          <li>Your location at the time of alert</li>
          <li>Status updates during an incident</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">6.4 Legal Requirements</h3>
        <p className="text-muted-foreground mb-2">We may disclose your data if required by:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Court order or legal process</li>
          <li>Spanish law enforcement with valid legal basis</li>
          <li>Regulatory authorities</li>
        </ul>

        <h3 className="text-lg font-medium mb-3">6.5 We Do NOT</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Sell your personal data</li>
          <li>Share your data for third-party marketing</li>
          <li>Use your medical data for any purpose other than emergency response</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. International Data Transfers</h2>
        <p className="text-muted-foreground mb-2">
          Some of our service providers are located outside the European Economic Area (EEA). When we transfer your data outside the EEA, we ensure protection through:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li><strong>EU-US Data Privacy Framework</strong> (for certified US companies)</li>
          <li><strong>Standard Contractual Clauses</strong> approved by the European Commission</li>
          <li><strong>Adequacy decisions</strong> where applicable</li>
        </ul>
        <p className="text-muted-foreground mb-4">You can request copies of the relevant safeguards by contacting us.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left font-semibold">Data Type</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Retention Period</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border border-border px-4 py-2">Account information</td><td className="border border-border px-4 py-2">Duration of membership + 5 years</td></tr>
              <tr><td className="border border-border px-4 py-2">Medical information</td><td className="border border-border px-4 py-2">Duration of membership + 5 years</td></tr>
              <tr><td className="border border-border px-4 py-2">Emergency contact details</td><td className="border border-border px-4 py-2">Duration of membership + 1 year</td></tr>
              <tr><td className="border border-border px-4 py-2">Alert and incident records</td><td className="border border-border px-4 py-2">7 years (legal requirement)</td></tr>
              <tr><td className="border border-border px-4 py-2">Call recordings</td><td className="border border-border px-4 py-2">2 years</td></tr>
              <tr><td className="border border-border px-4 py-2">Payment records</td><td className="border border-border px-4 py-2">10 years (Spanish tax law)</td></tr>
              <tr><td className="border border-border px-4 py-2">Chat/message logs</td><td className="border border-border px-4 py-2">2 years</td></tr>
              <tr><td className="border border-border px-4 py-2">Website analytics</td><td className="border border-border px-4 py-2">26 months</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mb-4">After these periods, data is securely deleted or anonymized.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Your Rights</h2>
        <p className="text-muted-foreground mb-4">Under GDPR and Spanish law, you have the right to:</p>

        <h3 className="text-lg font-medium mb-2">9.1 Access</h3>
        <p className="text-muted-foreground mb-4">Request a copy of all personal data we hold about you. We will respond within 30 days.</p>

        <h3 className="text-lg font-medium mb-2">9.2 Rectification</h3>
        <p className="text-muted-foreground mb-4">Correct any inaccurate or incomplete data. You can update most information directly in your member dashboard.</p>

        <h3 className="text-lg font-medium mb-2">9.3 Erasure ("Right to be Forgotten")</h3>
        <p className="text-muted-foreground mb-4">Request deletion of your data. Note: We may need to retain some data for legal compliance. You can request deletion through your member dashboard or by contacting us.</p>

        <h3 className="text-lg font-medium mb-2">9.4 Restriction</h3>
        <p className="text-muted-foreground mb-4">Request that we limit how we use your data while a complaint is being resolved.</p>

        <h3 className="text-lg font-medium mb-2">9.5 Data Portability</h3>
        <p className="text-muted-foreground mb-4">Receive your data in a structured, machine-readable format.</p>

        <h3 className="text-lg font-medium mb-2">9.6 Object</h3>
        <p className="text-muted-foreground mb-4">Object to processing based on legitimate interests. For direct marketing, you can opt out at any time.</p>

        <h3 className="text-lg font-medium mb-2">9.7 Withdraw Consent</h3>
        <p className="text-muted-foreground mb-4">Where we rely on your consent, you can withdraw it at any time. This does not affect the lawfulness of processing before withdrawal.</p>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <p className="font-bold text-destructive">
            Important: If you withdraw consent for medical data processing or request deletion, we may no longer be able to provide effective emergency response services. In such cases, we may need to terminate your membership for your own safety.
          </p>
        </div>

        <h3 className="text-lg font-medium mb-2">9.8 How to Exercise Your Rights</h3>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li><strong>Online:</strong> Through your member dashboard at icealarm.es/dashboard</li>
          <li><strong>Email:</strong> privacy@icealarm.es</li>
        </ul>
        <p className="text-muted-foreground mb-4">We will respond within 30 days. We may need to verify your identity before processing requests.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Data Security</h2>
        <p className="text-muted-foreground mb-2">We implement appropriate technical and organizational measures including:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Encryption of data in transit (TLS 1.3)</li>
          <li>Encryption of data at rest</li>
          <li>Access controls and authentication</li>
          <li>Regular security assessments</li>
          <li>Staff training on data protection</li>
          <li>Incident response procedures</li>
        </ul>
        <p className="text-muted-foreground mb-4">Our database is hosted in a Tier 3 certified data center in the European Union.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Children's Privacy</h2>
        <p className="text-muted-foreground mb-4">
          Our services are not directed at children under 16. We do not knowingly collect personal data from children under 16 without parental consent. If you believe we have collected such data, please contact us immediately.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. Automated Decision-Making</h2>
        <p className="text-muted-foreground mb-2">Our AI assistant may process your data to:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Triage emergency calls</li>
          <li>Determine appropriate responses</li>
          <li>Route calls to human operators</li>
        </ul>
        <p className="text-muted-foreground mb-4">
          You have the right to request human intervention in any automated decision that significantly affects you. During any emergency, human operators are always available to take over.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">13. Cookies</h2>
        <p className="text-muted-foreground mb-2">Our website uses cookies for:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li><strong>Essential cookies:</strong> Required for the website to function</li>
          <li><strong>Analytics cookies:</strong> To understand how visitors use our site (only with consent)</li>
        </ul>
        <p className="text-muted-foreground mb-4">You can manage cookie preferences through our cookie banner or your browser settings.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">14. Changes to This Policy</h2>
        <p className="text-muted-foreground mb-2">We may update this Privacy Policy from time to time. We will notify you of significant changes by:</p>
        <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
          <li>Email notification</li>
          <li>Notice on our website</li>
          <li>Notice in your member dashboard</li>
        </ul>
        <p className="text-muted-foreground mb-4">The "Last Updated" date at the top indicates when the policy was last revised.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">15. Complaints</h2>
        <p className="text-muted-foreground mb-4">
          If you are not satisfied with how we handle your data, you have the right to lodge a complaint with:
        </p>
        <p className="text-muted-foreground mb-4">
          <strong>Agencia Española de Protección de Datos (AEPD)</strong><br />
          C/ Jorge Juan, 6<br />
          28001 Madrid<br />
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a><br />
          Tel: 900 293 183
        </p>
        <p className="text-muted-foreground mb-4">You also have the right to seek judicial remedy.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">16. Contact Us</h2>
        <p className="text-muted-foreground mb-4">
          <strong>For any privacy-related questions:</strong>
        </p>
        <p className="text-muted-foreground mb-4">
          ICE Alarm España<br />
          Email: privacy@icealarm.es<br />
          General enquiries: info@icealarm.es
        </p>
      </section>

      <p className="text-sm text-muted-foreground italic">
        This Privacy Policy is governed by Spanish law and the General Data Protection Regulation (EU) 2016/679.
      </p>
    </>
  );
}
