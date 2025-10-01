import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                LegalAI Pro (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Personal Information</h3>
              <p className="text-muted-foreground mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials (username and password)</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Professional information (law firm, practice area, bar admission)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Usage Information</h3>
              <p className="text-muted-foreground mb-2">We automatically collect certain information about your device and how you interact with our service:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Log data (IP address, browser type, operating system)</li>
                <li>Usage data (features accessed, time spent, search queries)</li>
                <li>Device information (device type, unique device identifiers)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Documents and Content</h3>
              <p className="text-muted-foreground">
                We collect and process legal documents and other content you upload to use our AI-powered analysis tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and manage your subscriptions</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Processing and AI</h2>
              <p className="text-muted-foreground">
                Your uploaded documents are processed using AI technologies to provide features such as summarization, citation analysis, and predictive analytics. We implement strict security measures to protect your documents during processing. We do not use your documents to train our AI models without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-2">We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and associated data at any time, subject to certain legal and operational limitations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your Rights and Choices</h2>
              <p className="text-muted-foreground mb-2">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Legal Disclaimer</h2>
              <p className="text-muted-foreground">
                <strong>Disclaimer:</strong> This platform provides AI-assisted access to U.S. legal information, including case law, statutes, and regulations. It is designed as a research and productivity tool for licensed professionals. The platform does not provide legal advice, predict case outcomes with certainty, or replace professional judgment. Use of this platform does not create an attorney–client relationship. Users remain fully responsible for reviewing all information and applying their independent legal expertise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our privacy practices, please contact us through our support page or email us at privacy@legalai.pro.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
