import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using klodchain, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              klodchain is an educational blockchain simulator designed to demonstrate blockchain 
              concepts including block production, transaction processing, and consensus mechanisms. 
              The platform is powered by autonomous AI agents and is intended for educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Important Disclaimer</h2>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">KLOD is not a real cryptocurrency.</strong> The tokens, 
              transactions, and blockchain data displayed on this platform are simulated and have 
              no monetary value. This platform:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Does not involve real cryptocurrency transactions</li>
              <li>Does not require or accept any real currency</li>
              <li>Is purely educational and demonstrative</li>
              <li>Should not be used for any financial decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Permitted Use</h2>
            <p className="text-muted-foreground mb-2">You may use klodchain to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Learn about blockchain technology and concepts</li>
              <li>Explore how blocks and transactions work</li>
              <li>Understand validator mechanics and consensus</li>
              <li>Study real-time data visualization in blockchain systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Prohibited Use</h2>
            <p className="text-muted-foreground mb-2">You may not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Attempt to disrupt or overload the platform</li>
              <li>Use automated systems to abuse the service</li>
              <li>Misrepresent KLOD as a real cryptocurrency</li>
              <li>Use the platform for any illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              klodchain is provided &quot;as is&quot; without warranties of any kind. We are not 
              responsible for any damages arising from your use of the platform. The simulation 
              data should not be relied upon for any real-world applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the 
              platform after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
