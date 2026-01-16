import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to klodchain. This Privacy Policy explains how we collect, use, and protect 
              your information when you use our blockchain simulator platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">
              klodchain is an educational blockchain simulator. We collect minimal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Usage data and analytics (page views, interactions)</li>
              <li>Technical information (browser type, device type)</li>
              <li>Simulated blockchain data (blocks, transactions) - this is not real cryptocurrency</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide and maintain the simulator service</li>
              <li>Improve user experience and platform performance</li>
              <li>Analyze usage patterns for educational purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage</h2>
            <p className="text-muted-foreground">
              All simulation data is stored securely using Supabase infrastructure. 
              This data represents simulated blockchain activity and has no real monetary value.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
            <p className="text-muted-foreground">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Supabase - Database and real-time functionality</li>
              <li>Vercel - Hosting and deployment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground">
              We may use essential cookies to ensure the proper functioning of our platform. 
              These cookies do not track personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground">
              As klodchain does not collect personal identifying information, there is no 
              personal data to access, modify, or delete. The simulation data is publicly 
              visible as part of the educational experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about this Privacy Policy, please visit our GitHub repository.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
