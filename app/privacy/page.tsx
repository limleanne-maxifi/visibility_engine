import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Maxifi Digital',
  description: 'How Maxifi Digital collects, uses, and protects your personal data.',
};

const EFFECTIVE_DATE = '19 May 2025';
const CONTACT_EMAIL  = 'hello@maxifidigital.com';
const COMPANY_NAME   = 'Maxifi Digital';
const COMPANY_ENTITY = 'Maxifi Digital';
const COMPANY_COUNTRY = 'Singapore';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#6B5DD3] hover:underline">
            ← Back
          </Link>
          <span className="text-xs text-gray-400">Effective {EFFECTIVE_DATE}</span>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-6 py-12">

        <p className="text-xs font-semibold text-[#6B5DD3] tracking-widest uppercase mb-3">
          {COMPANY_NAME}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: {EFFECTIVE_DATE}</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed space-y-10">

          {/* 1 — Who we are */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              {COMPANY_ENTITY} ("<strong>{COMPANY_NAME}</strong>", "we", "us", "our") is a sole
              proprietorship registered in {COMPANY_COUNTRY} and operates the AI Visibility Snapshot
              tool at this website. We are the data controller for the personal data described in
              this policy.
            </p>
            <p className="mt-3">
              Questions about this policy or your data: <a href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#6B5DD3] underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

          {/* 2 — Data we collect */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Data we collect and why</h2>
            <p className="mb-4">
              When you complete the AI Visibility Snapshot form we collect the following categories
              of personal and business data:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Data</th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Purpose</th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Legal basis</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">First name, email address</td>
                    <td className="px-4 py-2 border border-gray-200">Deliver your personalised snapshot report and follow-up emails</td>
                    <td className="px-4 py-2 border border-gray-200">Contract performance; consent (PDPA s.14; GDPR Art.6(1)(b),(a))</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Website URL, company name</td>
                    <td className="px-4 py-2 border border-gray-200">Personalise the AI-generated visibility plan</td>
                    <td className="px-4 py-2 border border-gray-200">Contract performance (PDPA s.14; GDPR Art.6(1)(b))</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Occupation, industry, AI awareness answers, platform selections, challenges, goals</td>
                    <td className="px-4 py-2 border border-gray-200">Generate an accurate, relevant plan via the Claude AI model</td>
                    <td className="px-4 py-2 border border-gray-200">Contract performance (PDPA s.14; GDPR Art.6(1)(b))</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Competitors, positioning, target queries (optional)</td>
                    <td className="px-4 py-2 border border-gray-200">Improve the specificity of your plan</td>
                    <td className="px-4 py-2 border border-gray-200">Legitimate interests (PDPA s.14; GDPR Art.6(1)(f))</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">UTM parameters (source, medium, campaign)</td>
                    <td className="px-4 py-2 border border-gray-200">Understand which channels drive submissions (aggregate analytics)</td>
                    <td className="px-4 py-2 border border-gray-200">Legitimate interests (PDPA s.14; GDPR Art.6(1)(f))</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">AI-generated plan content</td>
                    <td className="px-4 py-2 border border-gray-200">Display your results page and re-send your report</td>
                    <td className="px-4 py-2 border border-gray-200">Contract performance (PDPA s.14; GDPR Art.6(1)(b))</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              We do not collect payment card data, government ID, health data, or any other
              special-category personal data.
            </p>
          </section>

          {/* 3 — Third-party processors */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Third-party processors</h2>
            <p className="mb-4">
              We share your data with the following sub-processors solely to deliver the service.
              Each is bound by a data processing agreement and provides adequate safeguards for
              international transfers.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Processor</th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Location</th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-2 border border-gray-200">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Anthropic, PBC</td>
                    <td className="px-4 py-2 border border-gray-200">United States</td>
                    <td className="px-4 py-2 border border-gray-200">AI plan generation (your form answers are sent to Claude)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Supabase, Inc.</td>
                    <td className="px-4 py-2 border border-gray-200">United States</td>
                    <td className="px-4 py-2 border border-gray-200">Database storage of your submission and generated plan</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border border-gray-200">Resend, Inc.</td>
                    <td className="px-4 py-2 border border-gray-200">United States</td>
                    <td className="px-4 py-2 border border-gray-200">Transactional email delivery (your snapshot report email)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 border border-gray-200">Netlify, Inc.</td>
                    <td className="px-4 py-2 border border-gray-200">United States</td>
                    <td className="px-4 py-2 border border-gray-200">Website hosting and serverless function execution</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              International transfers from the EEA/UK to the United States are made under the
              EU–US Data Privacy Framework or Standard Contractual Clauses (SCCs) as applicable.
              Transfers from Singapore are made in accordance with the PDPA's cross-border transfer
              obligations (PDPA s.26) under contractual arrangements that provide a comparable
              standard of protection.
            </p>
          </section>

          {/* 4 — Retention */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. How long we keep your data</h2>
            <p>
              We retain your submission and generated plan for <strong>24 months</strong> from the
              date of submission. After that period, records are deleted from our database.
              You may request earlier deletion at any time — see Section 6.
            </p>
            <p className="mt-3">
              Email delivery logs held by Resend are retained in accordance with Resend's own
              retention policy (typically 30 days for delivery events).
            </p>
          </section>

          {/* 5 — Cookies */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies and tracking</h2>
            <p>
              This site does not use advertising cookies or third-party analytics cookies.
              We read UTM query parameters from the URL on page load and store them alongside your
              submission so we can understand which channels generate interest in our service.
              No data is sent to Google Analytics, Meta Pixel, or similar advertising platforms.
            </p>
          </section>

          {/* 6 — Your rights */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Your rights</h2>

            <p className="mb-3 font-medium text-gray-800">Under the Singapore PDPA you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-5">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request correction of inaccurate or incomplete data.</li>
              <li><strong>Withdrawal of consent</strong> — withdraw consent at any time where processing is based on consent; this will not affect the lawfulness of prior processing.</li>
              <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format (where technically feasible).</li>
            </ul>

            <p className="mb-3 font-medium text-gray-800">Under the EU/UK GDPR you additionally have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-5">
              <li><strong>Erasure ("right to be forgotten")</strong> — request deletion of your personal data where there is no overriding legitimate reason to retain it.</li>
              <li><strong>Restriction</strong> — request that we limit processing while a dispute is resolved.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
              <li><strong>Lodge a complaint</strong> — with your national supervisory authority (e.g. the ICO in the UK, or your local EU DPA).</li>
            </ul>

            <p>
              To exercise any right, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#6B5DD3] underline">{CONTACT_EMAIL}</a>.
              We will respond within <strong>30 days</strong> (PDPA) / <strong>one calendar month</strong> (GDPR).
              We may ask you to verify your identity before processing a request.
            </p>
          </section>

          {/* 7 — Security */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Security</h2>
            <p>
              Data in transit is encrypted via TLS. Data at rest is encrypted by Supabase using
              AES-256. Access to the database is restricted to authenticated API calls using
              server-side credentials that are not exposed to the browser. We do not store payment
              data.
            </p>
          </section>

          {/* 8 — Children */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Children</h2>
            <p>
              This service is directed at business professionals and is not intended for
              individuals under 18 years of age. We do not knowingly collect data from minors.
              If you believe a minor has submitted data, contact us and we will delete it promptly.
            </p>
          </section>

          {/* 9 — Changes */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy when our practices change or when required by law. Material
              changes will be notified by updating the "Last updated" date at the top of this page.
              Continued use of the service after a change constitutes acceptance of the revised policy.
            </p>
          </section>

          {/* 10 — Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>
              For any privacy-related enquiries, data subject requests, or complaints:
            </p>
            <address className="not-italic mt-3 text-gray-600 space-y-1">
              <p><strong>{COMPANY_ENTITY}</strong></p>
              <p>Singapore</p>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#6B5DD3] underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </address>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} {COMPANY_ENTITY}</span>
          <Link href="/" className="hover:text-gray-600">← Back to Snapshot tool</Link>
        </div>
      </footer>

    </div>
  );
}
