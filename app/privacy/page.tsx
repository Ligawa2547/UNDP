import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - UNEDP",
  description: "Privacy policy for UN Economic Development Programme",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p className="text-gray-700">
                The UN Economic Development Programme (UNEDP) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information when you visit our website and use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
              <p className="text-gray-700">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Information about your employment and education</li>
                <li>Technical information about your device and browsing activity</li>
                <li>Information provided through forms and applications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
              <p className="text-gray-700">Your information is used to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Process employment applications and contracts</li>
                <li>Communicate with you about our services</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">4. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">5. Your Rights</h2>
              <p className="text-gray-700">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of certain communications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">6. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@unedp.org
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">7. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the effective date.
              </p>
            </section>

            <div className="pt-8 border-t border-gray-200 mt-8 text-sm text-gray-600">
              <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
