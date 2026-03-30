import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Use - UNEDP",
  description: "Terms of Use for UN Economic Development Programme",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Terms of Use</h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using this website and our services, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use this website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">2. Use License</h2>
              <p className="text-gray-700">
                Permission is granted to temporarily download one copy of the materials (information or software) on UNEDP's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">3. Disclaimer</h2>
              <p className="text-gray-700">
                The materials on UNEDP's website are provided "as is". UNEDP makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">4. Limitations</h2>
              <p className="text-gray-700">
                In no event shall UNEDP or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UNEDP's website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">5. Accuracy of Materials</h2>
              <p className="text-gray-700">
                The materials appearing on UNEDP's website could include technical, typographical, or photographic errors. UNEDP does not warrant that any of the materials on our website are accurate, complete, or current.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">6. Materials and Content</h2>
              <p className="text-gray-700">
                UNEDP has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by UNEDP of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">7. Modifications</h2>
              <p className="text-gray-700">
                UNEDP may revise these terms of use for our website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">8. Governing Law</h2>
              <p className="text-gray-700">
                These terms and conditions are governed by and construed in accordance with the laws of the United Nations and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
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
