import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using LegalAI Pro, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                LegalAI Pro provides AI-powered legal research and document analysis tools. Our service includes but is not limited to document summarization, citation mapping, predictive analytics, and PDF management tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground mb-2">
                To access certain features of our service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept all responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the service for any illegal purpose or in violation of any laws</li>
                <li>Violate or infringe other people&apos;s intellectual property, privacy, or other rights</li>
                <li>Share false or misleading information through the service</li>
                <li>Interfere with the security or integrity of the service</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Use automated means to access the service without our permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of LegalAI Pro are owned by us and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any documents you upload, but grant us a license to process them to provide our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Subscription and Payment</h2>
              <p className="text-muted-foreground">
                Certain features require a paid subscription. You agree to pay all fees associated with your subscription. Fees are non-refundable except as required by law or as explicitly stated in our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Legal Information Disclaimer</h2>
              <p className="text-muted-foreground">
                <strong>Disclaimer:</strong> This platform provides AI-assisted access to U.S. legal information, including case law, statutes, and regulations. It is designed as a research and productivity tool for licensed professionals. The platform does not provide legal advice, predict case outcomes with certainty, or replace professional judgment. Use of this platform does not create an attorney–client relationship. Users remain fully responsible for reviewing all information and applying their independent legal expertise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                LegalAI Pro is provided &quot;as is&quot; without warranties of any kind. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, LegalAI Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms of Service or for any other reason we deem appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through our support page.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
